import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { refreshTokens } from "@/services/api/auth";

const envUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
const baseURL: string =
  envUrl ??
  (Platform.OS === "android"
    ? "http://192.168.1.117:5000"
    : "http://localhost:5000");

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 120000,
});

// Token refresh state management
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 API Request:", config.method?.toUpperCase(), config.url);
    console.log("Base URL:", config.baseURL);
    console.log("Full URL:", `${config.baseURL}${config.url}`);

    if (config.data instanceof FormData) {
      console.log("Data: FormData (multipart/form-data)");
    } else if (config.data) {
      console.log("Data:", JSON.stringify(config.data, null, 2));
    }

    // Add auth token (skip for refresh endpoint)
    if (!config.url?.includes("/refresh-token")) {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔑 Auth token added");
        }
      } catch (error) {
        console.log("⚠️  Could not read auth token");
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return config;
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "✅ API Response:",
      response.config.method?.toUpperCase(),
      response.config.url,
    );
    console.log("Status:", response.status, response.statusText);
    console.log("Success:", response.data?.success ?? "N/A");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return response;
  },
  async (error: AxiosError) => {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(
      "❌ API Error:",
      error.config?.method?.toUpperCase(),
      error.config?.url,
    );

    if (error.response) {
      console.error(
        "Status:",
        error.response.status,
        error.response.statusText,
      );
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else if (error.request) {
      console.error("No response received from server");
      console.error("Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      });
    } else {
      console.error("Request setup error:", error.message);
    }
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    // Handle 401 Unauthorized
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Check if this is a refresh token endpoint error
      if (originalRequest.url?.includes("/refresh-token")) {
        console.log("❌ Refresh token failed, clearing session");
        await clearAuthData();
        processQueue(error, null);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log("🔄 Token refresh in progress, queuing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Start refresh process
      isRefreshing = true;
      console.log("🔄 Starting token refresh...");

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const rToken = await SecureStore.getItemAsync("refreshToken");
            if (!rToken) {
              console.log("❌ No refresh token available");
              throw new Error("No refresh token");
            }

            console.log("🔄 Calling refresh endpoint...");
            const refreshed = await refreshTokens(rToken);

            if (!refreshed.success) {
              throw new Error(refreshed.message || "Refresh failed");
            }

            const newAccess = refreshed.data.accessToken;
            const newRefresh = refreshed.data.refreshToken ?? rToken;

            // Update stored tokens
            await SecureStore.setItemAsync("token", newAccess);
            await SecureStore.setItemAsync("refreshToken", newRefresh);

            console.log("✅ Tokens refreshed successfully");

            // Process queued requests
            processQueue(null, newAccess);

            return newAccess;
          } catch (refreshError: any) {
            console.error("❌ Token refresh failed:", refreshError);

            // Clear auth data on refresh failure
            await clearAuthData();

            // Reject queued requests
            processQueue(refreshError, null);

            return null;
          } finally {
            refreshPromise = null;
            isRefreshing = false;
          }
        })();
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("🔄 Retrying original request with new token...");
        return apiClient.request(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to clear auth data
async function clearAuthData() {
  try {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    console.log("🧹 Auth data cleared");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}

export default apiClient;
