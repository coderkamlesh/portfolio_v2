import { apiRequest } from "../lib/api";

export interface OtpChallenge {
  id: string;
  purpose: string;
  email: string;
  code_length: number;
  expires_at: string;
  expires_in: number;
  attempts_left: number;
  resend_after: number;
}

export interface TokenPair {
  token_type: string;
  access_token: string;
  expires_in: number;
  expires_at: string;
  refresh_token: string;
  refresh_expires_in: number;
  refresh_expires_at: string;
}

export interface AdminView {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login_at?: string;
}

export interface LoginResponse {
  two_factor_required: boolean;
  challenge?: OtpChallenge;
  tokens?: TokenPair;
  admin?: AdminView;
}

export interface VerifyResponse {
  two_factor_required: boolean;
  tokens: TokenPair;
  admin: AdminView;
}

export interface RefreshResponse {
  two_factor_required: boolean;
  tokens: TokenPair;
  admin: AdminView;
}

export interface TwoFAStatus {
  required: boolean;
  method: string;
  email: string;
}

export interface MeResponse {
  admin: AdminView;
  two_factor: TwoFAStatus;
  active_sessions: number;
}

export interface ForgotResponse {
  message: string;
  challenge: OtpChallenge;
}

export function loginRequest(identifier: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { identifier, password },
  });
}

export function verifyOtpRequest(challengeId: string, otp: string): Promise<VerifyResponse> {
  return apiRequest<VerifyResponse>("/api/auth/2fa/verify", {
    method: "POST",
    body: { challenge_id: challengeId, otp },
  });
}

export function resendOtpRequest(challengeId: string): Promise<OtpChallenge> {
  return apiRequest<OtpChallenge>("/api/auth/2fa/resend", {
    method: "POST",
    body: { challenge_id: challengeId },
  });
}

export function refreshRequest(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function meRequest(accessToken: string): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/auth/me", { token: accessToken });
}

export function logoutRequest(accessToken: string, refreshToken: string | null, allDevices: boolean): Promise<null> {
  const body = allDevices ? { all_devices: true } : { refresh_token: refreshToken, all_devices: false };
  return apiRequest<null>("/api/auth/logout", {
    method: "POST",
    body,
    token: accessToken,
  });
}

export function forgotPasswordRequest(email: string): Promise<ForgotResponse> {
  return apiRequest<ForgotResponse>("/api/auth/password/forgot", {
    method: "POST",
    body: { email },
  });
}

export function resetPasswordRequest(challengeId: string, otp: string, newPassword: string): Promise<VerifyResponse> {
  return apiRequest<VerifyResponse>("/api/auth/password/reset", {
    method: "POST",
    body: { challenge_id: challengeId, otp, new_password: newPassword },
  });
}

export interface ChangePasswordResponse {
  tokens: TokenPair;
}

export function changePasswordRequest(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordResponse>("/api/auth/password/change", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
    token: accessToken,
  });
}

export function get2faStatusRequest(accessToken: string): Promise<TwoFAStatus> {
  return apiRequest<TwoFAStatus>("/api/auth/2fa", { token: accessToken });
}
