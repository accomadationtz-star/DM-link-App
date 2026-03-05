import apiClient from "@/services/api/client";
import { AuthUser, PendingGoogleAuth, GoogleAuthUser } from "@/types/user.d";

// ============ REGISTRATION ============
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

// ============ EMAIL/PASSWORD LOGIN ============
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
    user: AuthUser;
  };
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/users/login",
    payload
  );
  return response.data;
}

// ============ GOOGLE OAUTH FLOW ============
/**
 * Exchange Google idToken for either:
 * 1. Full session (if Google user already has phone number)
 * 2. Pending auth (if Google user needs to complete phone)
 */
export interface GoogleAuthPayload {
  idToken: string;
}

export interface GoogleAuthResponseFull {
  success: boolean;
  status: "completed"; // User already has phone
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export interface GoogleAuthResponsePending {
  success: boolean;
  status: "requiresPhone"; // User needs to complete phone
  data: {
    pendingToken: string; // Short-lived token to complete phone
    user: GoogleAuthUser; // Partial user without phone
    phoneRequired: true;
  };
}

export type GoogleAuthResponse = GoogleAuthResponseFull | GoogleAuthResponsePending;

export async function googleSignIn(
  payload: GoogleAuthPayload
): Promise<GoogleAuthResponse> {
  const response = await apiClient.post<GoogleAuthResponse>(
    "/api/auth/google",
    payload
  );
  return response.data;
}

// ============ PHONE COMPLETION (for incomplete Google users) ============
export interface CompletePhonePayload {
  phoneNumber: string;
}

export interface CompletePhoneResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

/**
 * Complete phone verification for pending Google users.
 * Must be called with valid pendingToken in Authorization header (set by client interceptor).
 */
export async function completePhoneNumber(
  payload: CompletePhonePayload
): Promise<CompletePhoneResponse> {
  const response = await apiClient.post<CompletePhoneResponse>(
    "/api/auth/complete-phone",
    payload
  );
  return response.data;
}

// ============ TOKEN REFRESH ============
export interface RefreshResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

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

// ============ LOGOUT ============
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export async function logoutUser(
  refreshToken?: string
): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>(
    "/api/users/logout",
    refreshToken ? { refreshToken } : undefined
  );
  return response.data;
}
