import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings, LogOut, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAdmin, isDoctor, isPatient } = useAuth();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [entitySearchResults, setEntitySearchResults] = useState([]);
  const [entitySearchLoading, setEntitySearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const dropdownRef = useRef();
  const notificationsWsRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);

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

  useEffect(() => {
    setSearch("");
    setSearchOpen(false);
  }, [location.pathname]);

  const menuItem = (path, name) => {
    const isActive = location.pathname.startsWith(path);

    return (
      <li
        key={path}
        onClick={() => navigate(path)}
        className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm transition ${
          isActive
            ? "bg-teal-500 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {name}
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
    if (path.includes("patients")) return "Patients";
    if (path.includes("doctors")) return "Doctors";
    if (path.includes("departments")) return "Departments";
    if (path.includes("schedule")) return "My Schedule";
    if (path.includes("my-patients")) return "My Patients";
    if (path.includes("/doctor/profile")) return "My Profile";
    if (path.includes("/patient/profile")) return "My Profile";
    if (path.includes("/admin/profile")) return "My Profile";
    if (path.includes("calendar")) return "Calendar";
    if (path.includes("inventory")) return "Inventory";
    if (path.includes("messages")) return "Messages";
    if (path.includes("settings/notifications")) return "Notification Settings";

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
    if (path.includes("patients")) return "Patient data & profiles";
    if (path.includes("schedule")) return "Manage your weekly availability";
    if (path.includes("my-patients")) return "View your assigned patients";
    if (path.includes("/doctor/profile")) return "Edit your doctor profile";
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
      setNotifications(items);
      setNotificationUnreadCount(data?.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    void fetchNotifications();
    const intervalId = setInterval(() => {
      void fetchNotifications();
    }, 120000);
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
            void fetchNotifications();
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
  }, [fetchNotifications, user]);

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
      setNotificationUnreadCount((current) => Math.max(0, current - (notification.is_read ? 0 : 1)));
      setOpen(null);
      navigate(notification.route);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setNotificationUnreadCount(0);
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
      { label: "Messages", description: "Chat with users", path: "/messages", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
      { label: "My Profile", description: "Update account profile", path: dynamicProfilePath, roles: ["ADMIN", "DOCTOR", "PATIENT"] },
      { label: "Doctors", description: "Browse doctors", path: "/doctors", roles: ["ADMIN", "PATIENT"] },
      { label: "Patients", description: "Patient records", path: "/patients", roles: ["ADMIN"] },
      { label: "My Patients", description: "Doctor patient list", path: "/my-patients", roles: ["DOCTOR"] },
      { label: "My Schedule", description: "Doctor weekly schedule", path: "/schedule", roles: ["DOCTOR"] },
      { label: "Departments", description: "Department management", path: "/departments", roles: ["ADMIN"] },
      { label: "Calendar", description: "Clinic events", path: "/calendar", roles: ["ADMIN"] },
      { label: "Inventory", description: "Inventory management", path: "/inventory", roles: ["ADMIN"] },
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
    navigate(route);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7]">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col justify-between px-6 py-7">
        <div>
          <div className="mb-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-teal-600">Medlink</h2>
          </div>

          <ul className="space-y-2">
            {menuItem("/dashboard", "Dashboard")}
            {menuItem("/appointments", "Appointments")}
            {isAdmin() && menuItem("/patients", "Patients")}
            {(isAdmin() || isPatient()) && menuItem("/doctors", "Doctors")}
            {isAdmin() && menuItem("/departments", "Departments")}
            {isDoctor() && menuItem("/schedule", "My Schedule")}
            {isDoctor() && menuItem("/my-patients", "My Patients")}
            {isDoctor() && menuItem("/doctor/profile", "My Profile")}
            {isPatient() && menuItem("/patient/profile", "My Profile")}
            {isAdmin() && menuItem("/calendar", "Calendar")}
            {isAdmin() && menuItem("/inventory", "Inventory")}
            {menuItem("/messages", "Messages")}
            {isAdmin() && (
              <>
                <li className="pt-4 pb-1 px-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Admin
                </li>
                {menuItem("/admin/users", "Users")}
                {menuItem("/admin/audit-logs", "Audit Logs")}
                {menuItem("/admin/analytics", "Analytics")}
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
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* NAVBAR */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center relative z-50">
          {/* LEFT */}
          <div>
            <h1 className="text-base font-semibold text-gray-700">
              {getTitle()}
            </h1>
            <p className="text-xs text-gray-400">{getSubtitle()}</p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
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
                className="bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 w-64"
              />
              {searchOpen && search.trim() && (
                <div className="absolute left-0 top-12 w-full rounded-xl border bg-white p-2 shadow-lg">
                  {entitySearchLoading && searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">
                      Searching...
                    </p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">
                      No matches found.
                    </p>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.key}
                        onClick={() => openSearchResult(result.route)}
                        className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">
                            {result.title}
                          </p>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {result.resultType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {result.subtitle}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

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
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white p-3 shadow-lg z-50">
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
                          <p className="text-xs text-gray-500">{notification.message}</p>
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

            {/* SETTINGS */}
            {isAdmin() && (
              <div className="relative">
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
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
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
                className="flex items-center gap-3 pl-3 border-l cursor-pointer"
              >
                <div className="w-9 h-9 bg-teal-500 text-white flex items-center justify-center rounded-full text-sm font-medium">
                  {getInitials(user?.full_name)}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getRoleLabel(user?.role)}
                  </p>
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
                  {isAdmin() && (
                    <p
                      onClick={() => { navigate("/admin/users"); setOpen(null); }}
                      className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                    >
                      Settings
                    </p>
                  )}
                  <p
                    onClick={() => {
                      navigate("/settings/notifications");
                      setOpen(null);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                  >
                    Notification Settings
                  </p>
                  <p
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="px-3 py-2 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer flex items-center gap-2 text-sm"
                  >
                    <LogOut size={14} /> Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
