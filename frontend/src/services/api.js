const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

    if (response.status === 401 && !_isRetry) {
      const refreshed = await this._tryRefresh();
      if (refreshed) {
        return this.request(endpoint, options, true); 
      }
      this.clearTokens();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Request failed: ${response.status}`);
    }

    if (response.status === 204) return null;

    return await response.json();
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

  removeToken() {
    this.clearTokens();
  }
}

export const api = new ApiService();
