import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const API_URL = "http://47.129.158.3:3000";
// export const API_URL = "http://localhost:3000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Authentication utilities
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
}

export const auth = {
  // Get stored access token
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  // Get stored user data
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;
    const expiration = localStorage.getItem("tokenExpiration");
    if (!expiration) return true;
    return Date.now() >= parseInt(expiration);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null && !this.isTokenExpired();
  },

  // Get authorization header
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    const tokenType = localStorage.getItem("tokenType") || "Bearer";
    if (!token) return {};
    return {
      Authorization: `${tokenType} ${token}`,
    };
  },

  // Clear all stored auth data
  clearAuth(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("expiresIn");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiration");
  },

  // Refresh token (placeholder for future implementation)
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();

      // Update stored tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("expiresIn", data.expiresIn.toString());

      const expirationTime = Date.now() + data.expiresIn * 1000;
      localStorage.setItem("tokenExpiration", expirationTime.toString());

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  },
};

// Authenticated fetch wrapper
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get auth headers
  const authHeaders = auth.getAuthHeader();

  // Merge headers
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders,
    ...options.headers,
  };

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && auth.getRefreshToken()) {
    const refreshSuccessful = await auth.refreshAccessToken();

    if (refreshSuccessful) {
      // Retry the request with new token
      const newAuthHeaders = auth.getAuthHeader();
      const retryHeaders = {
        "Content-Type": "application/json",
        ...newAuthHeaders,
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, clear auth and redirect to login
      auth.clearAuth();
      window.location.reload();
    }
  }

  return response;
}
