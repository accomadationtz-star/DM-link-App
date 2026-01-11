import apiClient from "@/services/api/client";

export interface RegisterPayload {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  message?: string;
  userId?: string;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/api/users/register",
    payload
  );
  return response.data;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      username: string;
      email: string;
      phoneNumber: string;
      role: string;
    };
  };
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/users/login",
    payload
  );
  return response.data;
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

// Adjust the path below if your backend uses a different refresh endpoint
export async function refreshTokens(
  refreshToken: string
): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>(
    "/api/users/refresh-token",
    {
      refreshToken,
    }
  );
  return response.data;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export async function logoutUser(
  refreshToken?: string
): Promise<LogoutResponse> {
  // Some backends require the refresh token to invalidate server-side sessions
  const response = await apiClient.post<LogoutResponse>(
    "/api/users/logout",
    refreshToken ? { refreshToken } : undefined
  );
  return response.data;
}
