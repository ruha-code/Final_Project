import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, CalendarClock, LogOut, MessageSquare, Settings, Users, X, LayoutDashboard, CalendarDays, Stethoscope, UserRound, Building2, CalendarRange, UserPlus, HeartPulse, UserCircle, Calendar, MessageCircle, ShieldCheck, FileText, BarChart3, Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { formatAppointmentDateTime } from "../utils/dateTime";
import ChatBot from "../components/ChatBot";

const TOAST_LIFETIME_MS = 5000;
const TOAST_EXIT_MS = 220;

const NOTIFICATION_TOAST_META = {
  MESSAGE: {
    icon: MessageSquare,
    iconClass: "bg-teal-50 text-teal-600",
    actionLabel: "Open messages",
  },
  APPOINTMENT: {
    icon: CalendarClock,
    iconClass: "bg-amber-50 text-amber-600",
    actionLabel: "Open appointments",
  },
  CALENDAR: {
    icon: CalendarClock,
    iconClass: "bg-sky-50 text-sky-600",
    actionLabel: "Open calendar",
  },
};

function stripDoctorPrefix(name) {
  return (name || "").replace(/^dr\.?\s+/i, "").trim();
}

function formatNotificationMessage(notification) {
  if (notification?.notification_type !== "APPOINTMENT" || !notification.created_at) {
    return notification?.message || "";
  }

  const dateTime = formatAppointmentDateTime(notification.created_at);
  const patientMatch = notification.message?.match(/^(.+?) at /);
  const doctorMatch = notification.message?.match(/^With Dr\. (.+?) on /);

  if (doctorMatch) {
    return `With Dr. ${stripDoctorPrefix(doctorMatch[1])} on ${dateTime.date}, ${dateTime.time}.`;
  }

  if (patientMatch) {
    return `${patientMatch[1]} at ${dateTime.date}, ${dateTime.time}.`;
  }

  return notification.message
    ?.replace(/\b\d{1,2} [A-Za-z]{3}, \d{2}:\d{2} UTC\b/, `${dateTime.date}, ${dateTime.time}`)
    || "";
}

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAdmin, isDoctor, isPatient } = useAuth();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [entitySearchResults, setEntitySearchResults] = useState([]);
  const [entitySearchLoading, setEntitySearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState([]);

  const dropdownRef = useRef();
  const notificationsWsRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);
  const notificationSnapshotRef = useRef(new Set());
  const toastsTimerRef = useRef({});
  const toastRemovalTimersRef = useRef({});
  const hasFetchedNotificationsRef = useRef(false);
  const currentPathRef = useRef(location.pathname);
  const audioContextRef = useRef(null);

  const playToastSound = useCallback(() => {
    if (typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;
      const startAt = audioContext.currentTime;
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.0001, startAt);
      masterGain.gain.exponentialRampToValueAtTime(0.035, startAt + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.35);
      masterGain.connect(audioContext.destination);

      const firstTone = audioContext.createOscillator();
      firstTone.type = "sine";
      firstTone.frequency.setValueAtTime(740, startAt);
      firstTone.connect(masterGain);
      firstTone.start(startAt);
      firstTone.stop(startAt + 0.16);

      const secondTone = audioContext.createOscillator();
      secondTone.type = "sine";
      secondTone.frequency.setValueAtTime(988, startAt + 0.12);
      secondTone.connect(masterGain);
      secondTone.start(startAt + 0.12);
      secondTone.stop(startAt + 0.3);
    } catch (err) {
      console.error("Failed to play notification sound:", err);
    }
  }, []);

  const dismissToast = useCallback((notificationKey) => {
    if (toastsTimerRef.current[notificationKey]) {
      clearTimeout(toastsTimerRef.current[notificationKey]);
      delete toastsTimerRef.current[notificationKey];
    }

    setToastNotifications((prev) =>
      prev.map((item) =>
        item.key === notificationKey ? { ...item, phase: "leaving" } : item,
      ),
    );

    if (toastRemovalTimersRef.current[notificationKey]) {
      clearTimeout(toastRemovalTimersRef.current[notificationKey]);
    }

    toastRemovalTimersRef.current[notificationKey] = setTimeout(() => {
      setToastNotifications((prev) => prev.filter((item) => item.key !== notificationKey));
      delete toastRemovalTimersRef.current[notificationKey];
    }, TOAST_EXIT_MS);
  }, []);

  const enqueueToast = useCallback((notification) => {
    setToastNotifications((prev) => {
      const existing = prev.find((item) => item.key === notification.key);
      if (existing) {
        return prev.map((item) =>
          item.key === notification.key ? { ...item, phase: "entering" } : item,
        );
      }
      return [...prev, { ...notification, phase: "entering" }].slice(-3);
    });

    if (toastsTimerRef.current[notification.key]) {
      clearTimeout(toastsTimerRef.current[notification.key]);
    }

    if (toastRemovalTimersRef.current[notification.key]) {
      clearTimeout(toastRemovalTimersRef.current[notification.key]);
      delete toastRemovalTimersRef.current[notification.key];
    }

    toastsTimerRef.current[notification.key] = setTimeout(() => {
      dismissToast(notification.key);
    }, TOAST_LIFETIME_MS);

    playToastSound();
  }, [dismissToast, playToastSound]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    currentPathRef.current = location.pathname;
    setSearch("");
    setSearchOpen(false);
    setSidebarOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => () => {
    Object.values(toastsTimerRef.current).forEach((timerId) => clearTimeout(timerId));
    Object.values(toastRemovalTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    toastsTimerRef.current = {};
    toastRemovalTimersRef.current = {};
  }, []);

  // Close sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const menuItem = (path, name, Icon) => {
    const isActive = location.pathname.startsWith(path);

    return (
      <li
        key={path}
        onClick={() => navigate(path)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-sm transition ${
          isActive
            ? "bg-teal-500 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {Icon && <Icon size={18} />}
        <span>{name}</span>
      </li>
    );
  };

  const getTitle = () => {
    const path = location.pathname;

    if (path.includes("admin/analytics")) return "Analytics";
    if (path.includes("admin/audit-logs")) return "Audit Logs";
    if (path.includes("admin/users")) return "User Management";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("appointments")) return "Appointments";
    if (/^\/patients\/\d+/.test(path)) return "Clinical Workspace";
    if (path.includes("patients")) return "Patients";
    if (path.includes("doctors")) return "Doctors";
    if (path.includes("departments")) return "Departments";
    if (path.includes("schedule")) return "My Schedule";
    if (path.includes("my-patients")) return "My Patients";
    if (path.includes("/doctor/profile")) return "My Profile";
    if (path.includes("/patient/health")) return "My Health";
    if (path.includes("/patient/profile")) return "My Profile";
    if (path.includes("/admin/profile")) return "My Profile";
    if (path.includes("calendar")) return "Calendar";
    if (path.includes("messages")) return "Messages";
    if (path.includes("settings/notifications")) return "Notifications";

    return "Dashboard";
  };

  const getSubtitle = () => {
    const path = location.pathname;

    if (path.includes("admin/analytics")) return "Clinic performance & demand overview";
    if (path.includes("admin/audit-logs")) return "View activity logs for security";
    if (path.includes("admin/users")) return "Manage system users";
    if (path.includes("dashboard")) {
      if (isAdmin()) return "Admin dashboard overview";
      if (isDoctor()) return "Doctor dashboard overview";
      if (isPatient()) return "Patient dashboard overview";
      return "Patient dashboard overview";
    }
    if (path.includes("appointments")) return "Manage appointments";
    if (/^\/patients\/\d+/.test(path)) return "Review patient context, record vitals and document the encounter";
    if (path.includes("patients")) return "Patient data & profiles";
    if (path.includes("schedule")) return "Manage your weekly availability";
    if (path.includes("my-patients")) return "View your assigned patients";
    if (path.includes("/doctor/profile")) return "Edit your doctor profile";
    if (path.includes("/patient/health")) return "Read-only vitals, care summary and visit history";
    if (path.includes("/patient/profile")) return "Edit your patient profile";
    if (path.includes("/admin/profile")) return "Edit your admin profile";
    if (path.includes("settings/notifications")) return "Control alerts and reminder timing";

    return "Manage your system";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: "Administrator",
      DOCTOR: "Doctor",
      PATIENT: "Patient",
    };
    return labels[role] || role;
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setNotificationsLoading(true);
      const data = await api.get("/notifications");
      const items = Array.isArray(data?.items) ? data.items : [];
      const unreadNotificationKeys = new Set(
        items
          .filter((item) => !item.is_read)
          .map((item) => item.key),
      );

      if (hasFetchedNotificationsRef.current) {
        items
          .filter((item) => !item.is_read)
          .forEach((item) => {
            if (!notificationSnapshotRef.current.has(item.key)) {
              enqueueToast(item);
            }
          });
      }

      notificationSnapshotRef.current = unreadNotificationKeys;
      hasFetchedNotificationsRef.current = true;
      setNotifications(items);
      setNotificationUnreadCount(data?.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  }, [enqueueToast, user]);

  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return undefined;
    void fetchNotifications();
    const intervalId = setInterval(() => {
      void fetchNotificationsRef.current();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!user) return undefined;

    let isUnmounted = false;

    const connect = () => {
      const token = api.getToken();
      if (!token || isUnmounted) return;

      const ws = new WebSocket(
        api.getWebSocketUrl("/notifications/ws", { token }),
      );
      notificationsWsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.event === "notifications_refresh") {
            void fetchNotificationsRef.current();
          }
        } catch (err) {
          console.error("Failed to parse notifications WS payload:", err);
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        wsReconnectTimerRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (wsReconnectTimerRef.current) {
        clearTimeout(wsReconnectTimerRef.current);
      }
      if (notificationsWsRef.current) {
        notificationsWsRef.current.close();
      }
      notificationsWsRef.current = null;
    };
  }, [user]);

  const markNotificationReadAndOpen = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.put(`/notifications/${encodeURIComponent(notification.key)}/read`);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setNotifications((prev) =>
        prev.map((item) =>
          item.key === notification.key ? { ...item, is_read: true } : item,
        ),
      );
      notificationSnapshotRef.current.delete(notification.key);
      setNotificationUnreadCount((current) => Math.max(0, current - (notification.is_read ? 0 : 1)));
      dismissToast(notification.key);
      setOpen(null);
      navigate(notification.route);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      notificationSnapshotRef.current = new Set();
      setNotificationUnreadCount(0);
      setToastNotifications((prev) => prev.map((item) => ({ ...item, phase: "leaving" })));
      Object.values(toastsTimerRef.current).forEach((timerId) => clearTimeout(timerId));
      toastsTimerRef.current = {};

      Object.keys(toastRemovalTimersRef.current).forEach((key) => {
        clearTimeout(toastRemovalTimersRef.current[key]);
      });

      toastNotifications.forEach((item) => {
        toastRemovalTimersRef.current[item.key] = setTimeout(() => {
          setToastNotifications((prev) => prev.filter((toast) => toast.key !== item.key));
          delete toastRemovalTimersRef.current[item.key];
        }, TOAST_EXIT_MS);
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const searchableItems = useMemo(() => {
    const role = user?.role;
    if (!role) return [];

    const dynamicProfilePath =
      role === "ADMIN"
        ? "/admin/profile"
        : role === "DOCTOR"
          ? "/doctor/profile"
          : "/patient/profile";

    const entries = [
      { label: "Dashboard", description: "Overview page", path: "/dashboard", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
      { label: "Appointments", description: "Manage appointments", path: "/appointments", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
      { label: "Messages", description: "Chat with users", path: "/messages", roles: ["DOCTOR", "PATIENT"] },
      { label: "My Profile", description: "Update account profile", path: dynamicProfilePath, roles: ["ADMIN", "DOCTOR", "PATIENT"] },
      { label: "My Health", description: "Read-only health record", path: "/patient/health", roles: ["PATIENT"] },
      { label: "Doctors", description: "Browse doctors", path: "/doctors", roles: ["ADMIN", "PATIENT"] },
      { label: "Patients", description: "Patient records", path: "/patients", roles: ["ADMIN"] },
      { label: "My Patients", description: "Doctor patient list", path: "/my-patients", roles: ["DOCTOR"] },
      { label: "My Schedule", description: "Doctor weekly schedule", path: "/schedule", roles: ["DOCTOR"] },
      { label: "Departments", description: "Department management", path: "/departments", roles: ["ADMIN"] },
      { label: "Calendar", description: "Clinic events and schedule", path: "/calendar", roles: ["ADMIN", "DOCTOR"] },
      { label: "User Management", description: "Admin users", path: "/admin/users", roles: ["ADMIN"] },
      { label: "Audit Logs", description: "System audit trail", path: "/admin/audit-logs", roles: ["ADMIN"] },
      { label: "Analytics", description: "Clinic analytics", path: "/admin/analytics", roles: ["ADMIN"] },
      { label: "Notification Settings", description: "Mute types and reminder timing", path: "/settings/notifications", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
    ];

    return entries.filter((entry) => entry.roles.includes(role));
  }, [user?.role]);

  useEffect(() => {
    const query = search.trim();
    if (!user || query.length < 2) {
      setEntitySearchResults([]);
      setEntitySearchLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setEntitySearchLoading(true);
        const payload = await api.get(`/search?q=${encodeURIComponent(query)}&limit=5`);
        if (cancelled) return;
        setEntitySearchResults(Array.isArray(payload?.results) ? payload.results : []);
      } catch (err) {
        if (cancelled) return;
        console.error("Search failed:", err);
        setEntitySearchResults([]);
      } finally {
        if (!cancelled) {
          setEntitySearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, user]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    const localResults = searchableItems
      .filter((item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.path.toLowerCase().includes(query),
      )
      .map((item) => ({
        key: `page-${item.path}`,
        title: item.label,
        subtitle: item.description,
        route: item.path,
        resultType: "PAGE",
      }));

    const entityResults = entitySearchResults.map((item) => ({
      key: `${item.entity_type}-${item.entity_id}`,
      title: item.title,
      subtitle: item.subtitle,
      route: item.route,
      resultType: item.entity_type,
    }));

    const merged = [...localResults, ...entityResults];
    const unique = [];
    const seen = new Set();

    merged.forEach((item) => {
      const dedupeKey = `${item.resultType}-${item.route}-${item.title}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      unique.push(item);
    });

    return unique.slice(0, 10);
  }, [search, searchableItems, entitySearchResults]);

  const openSearchResult = (route) => {
    setSearch("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    navigate(route);
  };

  // Sidebar content extracted for reuse
  const SidebarContent = () => (
    <>
      <div>
        <div className="mb-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-teal-600">Medlink</h2>
        </div>

        <ul className="space-y-2">
          {menuItem("/dashboard", "Dashboard", LayoutDashboard)}
          {menuItem("/appointments", "Appointments", CalendarDays)}
          {isAdmin() && menuItem("/patients", "Patients", UserRound)}
          {(isAdmin() || isPatient()) && menuItem("/doctors", "Doctors", Stethoscope)}
          {isAdmin() && menuItem("/departments", "Departments", Building2)}
          {isDoctor() && menuItem("/schedule", "My Schedule", CalendarRange)}
          {isDoctor() && menuItem("/my-patients", "My Patients", UserPlus)}
          {isDoctor() && menuItem("/doctor/profile", "My Profile", UserCircle)}
          {isPatient() && menuItem("/patient/health", "My Health", HeartPulse)}
          {isPatient() && menuItem("/patient/profile", "My Profile", UserCircle)}
          {(isAdmin() || isDoctor()) && menuItem("/calendar", "Calendar", Calendar)}
          {(isDoctor() || isPatient()) && menuItem("/messages", "Messages", MessageCircle)}
          {isAdmin() && (
            <>
              {menuItem("/admin/users", "Users", ShieldCheck)}
              {menuItem("/admin/audit-logs", "Audit Logs", FileText)}
              {menuItem("/admin/analytics", "Analytics", BarChart3)}
            </>
          )}
        </ul>
      </div>

      {isAdmin() && (
        <div className="bg-teal-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-3">System Admin</p>
          <div className="flex items-center gap-2 text-xs text-teal-600">
            <Users size={14} />
            <span>Full access enabled</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7]">

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white flex flex-col px-6 py-7 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <SidebarContent />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 bg-white border-r flex-col justify-between px-6 py-7 shrink-0">
        <SidebarContent />
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* NAVBAR */}
        <div className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center relative z-50">

          {/* LEFT — hamburger on mobile + title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 shrink-0"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-700 truncate">
                {getTitle()}
              </h1>
              <p className="text-xs text-gray-400 truncate hidden sm:block">{getSubtitle()}</p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 md:gap-4 relative shrink-0" ref={dropdownRef}>

            {/* DESKTOP SEARCH */}
            <div className="relative hidden md:block w-44 lg:w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    return;
                  }
                  if (e.key === "Enter" && searchResults[0]) {
                    openSearchResult(searchResults[0].route);
                  }
                }}
                placeholder="Search pages, doctors, patients..."
                className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              {searchOpen && search.trim() && (
                <div className="absolute left-0 top-12 w-full rounded-xl border bg-white p-2 shadow-lg">
                  {entitySearchLoading && searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">No matches found.</p>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.key}
                        onClick={() => openSearchResult(result.route)}
                        className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{result.title}</p>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {result.resultType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{result.subtitle}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* MOBILE SEARCH BUTTON */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"
            >
              <Search size={16} />
            </button>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => {
                  const nextOpen = open === "notifications" ? null : "notifications";
                  setOpen(nextOpen);
                  if (nextOpen === "notifications") {
                    void fetchNotifications();
                  }
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Bell size={16} />
                {notificationUnreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                  </span>
                )}
              </button>

              {open === "notifications" && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white p-3 shadow-lg z-50">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Notifications</p>
                    {notificationUnreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-teal-600 hover:text-teal-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <p className="py-4 text-center text-sm text-gray-400">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">No new notifications</p>
                  ) : (
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.key}
                          onClick={() => markNotificationReadAndOpen(notification)}
                          className={`w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 ${
                            notification.is_read ? "opacity-70" : "bg-teal-50"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-teal-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatNotificationMessage(notification)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 border-t pt-2">
                    <button
                      onClick={() => {
                        setOpen(null);
                        navigate("/settings/notifications");
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-teal-700 hover:bg-teal-50"
                    >
                      Notification preferences
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SETTINGS — desktop only */}
            {isAdmin() && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setOpen(open === "settings" ? null : "settings")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"
                >
                  <Settings size={16} />
                </button>

                {open === "settings" && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-2 z-50">
                    <p
                      onClick={() => { navigate("/admin/users"); setOpen(null); }}
                      className="px-3 py-2 hover:
                      bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      User Management
                    </p>
                    <p
                      onClick={() => { navigate("/settings/notifications"); setOpen(null); }}
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      Notification Preferences
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            <div className="relative">
              <div
                onClick={() => setOpen(open === "profile" ? null : "profile")}
                className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l cursor-pointer"
              >
                <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium shrink-0">
                  {getInitials(user?.full_name)}
                </div>

                {/* Hide name/role on mobile */}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user?.full_name || "User"}</p>
                  <p className="text-xs text-gray-400">{getRoleLabel(user?.role)}</p>
                </div>
              </div>

              {open === "profile" && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-2 z-50">
                  <p
                    onClick={() => {
                      if (isAdmin()) navigate("/admin/profile");
                      else if (isDoctor()) navigate("/doctor/profile");
                      else if (isPatient()) navigate("/patient/profile");
                      else navigate("/dashboard");
                      setOpen(null);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                  >
                    Profile
                  </p>
                  {isPatient() && (
                    <p
                      onClick={() => { navigate("/patient/health"); setOpen(null); }}
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      My Health
                    </p>
                  )}
                  <p
                    onClick={() => { navigate("/settings/notifications"); setOpen(null); }}
                    className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                  >
                    Notification Settings
                  </p>
                  <p
                    onClick={() => { logout(); navigate("/"); }}
                    className="px-3 py-2 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer flex items-center gap-2 text-sm"
                  >
                    <LogOut size={14} /> Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH OVERLAY */}
        {mobileSearchOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white p-4 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults[0]) {
                      openSearchResult(searchResults[0].route);
                    }
                  }}
                  placeholder="Search pages, doctors, patients..."
                  className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button
                onClick={() => { setMobileSearchOpen(false); setSearch(""); }}
                className="text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>

            {search.trim() && (
              <div className="flex-1 overflow-y-auto rounded-xl border bg-white p-2 shadow-sm">
                {entitySearchLoading && searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400">No matches found.</p>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={result.key}
                      onClick={() => openSearchResult(result.route)}
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">{result.title}</p>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {result.resultType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{result.subtitle}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden">
          <div key={location.pathname} className="page-motion h-full overflow-auto p-4 md:p-8">{children}</div>
        </div>
      </div>

      {/* TOAST NOTIFICATIONS */}
      {toastNotifications.length > 0 && (
        <div className="pointer-events-none fixed bottom-24 right-3 md:right-5 z-[70] flex w-full max-w-[calc(100vw-24px)] md:max-w-sm flex-col gap-3">
          {toastNotifications.map((notification) => (
            <div
              key={notification.key}
              className={`pointer-events-auto overflow-hidden rounded-2xl border border-teal-100 bg-white/95 shadow-xl backdrop-blur ${notification.phase === "leaving" ? "toast-exit" : "toast-enter"}`}
            >
              <div className="flex items-start gap-3 p-4">
                {(() => {
                  const meta = NOTIFICATION_TOAST_META[notification.notification_type] || NOTIFICATION_TOAST_META.MESSAGE;
                  const Icon = meta.icon;
                  return (
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}>
                      <Icon size={18} />
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => markNotificationReadAndOpen(notification)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title || "New message"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatNotificationMessage(notification)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-teal-600">
                        {(NOTIFICATION_TOAST_META[notification.notification_type] || NOTIFICATION_TOAST_META.MESSAGE).actionLabel}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => dismissToast(notification.key)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPatient() && !location.pathname.startsWith("/messages") && <ChatBot />}
    </div>
  );
}

export default MainLayout;
  
