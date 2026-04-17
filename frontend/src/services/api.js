const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function formatValidationDetail(detail) {
  if (!Array.isArray(detail)) return null;

  const messages = detail
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;

      const location = Array.isArray(item.loc)
        ? item.loc
            .filter(
              (segment) =>
                typeof segment === "string" &&
                !["body", "query", "path", "response"].includes(segment),
            )
            .at(-1)
        : "";

      const fieldLabel = location
        ? location
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : "";

      const cleanedMessage = item.msg
        ? item.msg
            .replace(/^Value error,\s*/i, "")
            .replace(/^Assertion failed,\s*/i, "")
            .trim()
        : "";

      if (!cleanedMessage) {
        return fieldLabel || null;
      }

      if (fieldLabel) {
        const normalizedLabel = fieldLabel.toLowerCase();
        if (cleanedMessage.toLowerCase().includes(normalizedLabel)) {
          return cleanedMessage;
        }
        return `${fieldLabel}: ${cleanedMessage}`;
      }

      return cleanedMessage;
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : null;
}

function buildApiError(status, payload) {
  const message =
    formatValidationDetail(payload?.detail) ||
    payload?.message ||
    payload?.detail ||
    payload?.error ||
    `Request failed: ${status}`;

  return new ApiError(message, status, payload);
}

function shouldAttemptRefresh(endpoint) {
  return !["/auth/login", "/auth/register", "/auth/refresh"].includes(endpoint);
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}, _isRetry = false) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (response.status === 401 && !_isRetry && shouldAttemptRefresh(endpoint)) {
      const refreshed = await this._tryRefresh();
      if (refreshed) {
        return this.request(endpoint, options, true);
      }
      this.clearTokens();
      window.location.href = "/";
      throw new ApiError("Unauthorized", 401);
    }

    const payload = await response.json().catch(() => null);

    if (response.status === 403) {
      if (endpoint === "/auth/me") {
        this.clearTokens();
        window.location.href = "/";
      }
      throw buildApiError(403, payload);
    }

    if (!response.ok) {
      throw buildApiError(response.status, payload);
    }

    if (response.status === 204) return null;

    return payload;
  }

  async _tryRefresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    if (this._refreshing) {
      return this._refreshing;
    }

    this._refreshing = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return false;
        const data = await response.json();
        this.setToken(data.access_token);
        if (data.refresh_token) this.setRefreshToken(data.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        this._refreshing = null;
      }
    })();

    return this._refreshing;
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Token management
  getToken() {
    return localStorage.getItem("token");
  }

  setToken(token) {
    localStorage.setItem("token", token);
  }

  getRefreshToken() {
    return localStorage.getItem("refresh_token");
  }

  setRefreshToken(token) {
    localStorage.setItem("refresh_token", token);
  }

  clearTokens() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  }

  getWebSocketUrl(endpoint, params = {}) {
    const wsBaseUrl = this.baseURL.replace(/^http/, "ws");
    const url = new URL(`${wsBaseUrl}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  removeToken() {
    this.clearTokens();
  }
}

export const api = new ApiService();
export { ApiError };
