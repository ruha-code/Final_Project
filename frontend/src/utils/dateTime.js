function pad(value) {
  return String(value).padStart(2, "0");
}

export function getTodayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysToDateString(dateString, daysToAdd) {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(year, month - 1, day + daysToAdd);

  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

export function getBrowserTimezoneOffsetMinutes() {
  return new Date().getTimezoneOffset();
}

export function buildLocalAppointmentTimestamp(date, time) {
  const safeTime = time.length === 5 ? `${time}:00` : time;
  const offsetMinutes = -getBrowserTimezoneOffsetMinutes();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = pad(Math.floor(absoluteMinutes / 60));
  const minutes = pad(absoluteMinutes % 60);

  return `${date}T${safeTime}${sign}${hours}:${minutes}`;
}

export function formatDisplayDate(dateString, locale = "en-GB") {
  if (!dateString) return "—";

  const [year, month, day] = dateString.split("-").map(Number);
  const value = new Date(year, month - 1, day);

  return value.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDisplayShortDate(dateString, locale = "en-GB") {
  if (!dateString) return "—";

  const [year, month, day] = dateString.split("-").map(Number);
  const value = new Date(year, month - 1, day);

  return value.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

export function formatAppointmentDateTime(dateTime, locale = "en-GB") {
  if (!dateTime) {
    return { date: "—", time: "—", dateKey: "" };
  }

  const value = new Date(dateTime);

  return {
    date: value.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    }),
    time: value.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dateKey: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
  };
}

export function formatTimeLabel(timeValue) {
  if (!timeValue) return "—";

  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue.slice(0, 5);
  }

  return formatAppointmentDateTime(timeValue).time;
}
