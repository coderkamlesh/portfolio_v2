import { createContext, createSignal, onMount, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { ApiError, apiRequest } from "../lib/api";
import {
  changePasswordRequest,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  resendOtpRequest,
  resetPasswordRequest,
  verifyOtpRequest,
} from "../services/auth";
import type { AdminView, OtpChallenge } from "../services/auth";

export type AuthStatus =
  | "signed_out"
  | "authenticating"
  | "login_otp"
  | "reset_requested"
  | "reset_otp"
  | "authenticated";

export interface AuthError {
  code: string;
  message: string;
  retryAfter: number | null;
}

function toAuthError(error: unknown): AuthError {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message, retryAfter: error.retryAfter };
  }
  return { code: "network_error", message: "Network request failed.", retryAfter: null };
}

interface AuthContextValue {
  status: () => AuthStatus;
  admin: () => AdminView | null;
  challenge: () => OtpChallenge | null;
  resetChallenge: () => OtpChallenge | null;
  lastError: () => AuthError | null;
  isBusy: () => boolean;
  accessToken: () => string | null;
  login: (identifier: string, password: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  startPasswordReset: () => void;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (otp: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  backToLogin: () => void;
  restore: () => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  clearError: () => void;
  authFetch: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue>();

const REFRESH_STORAGE_KEY = "portfolio_admin_refresh";

function readStoredRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefresh(token: string): void {
  try {
    localStorage.setItem(REFRESH_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode); session stays memory-only.
  }
}

function clearStoredRefresh(): void {
  try {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    // Ignore storage errors on logout.
  }
}

let refreshFlight: Promise<boolean> | null = null;

export function AuthProvider(props: { children: JSX.Element }) {
  const [status, setStatus] = createSignal<AuthStatus>("signed_out");
  const [admin, setAdmin] = createSignal<AdminView | null>(null);
  const [challenge, setChallenge] = createSignal<OtpChallenge | null>(null);
  const [resetChallenge, setResetChallenge] = createSignal<OtpChallenge | null>(null);
  const [lastError, setLastError] = createSignal<AuthError | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [accessToken, setAccessToken] = createSignal<string | null>(null);
  const [refreshToken, setRefreshToken] = createSignal<string | null>(readStoredRefresh());

  function saveTokenPair(access: string, refresh: string): void {
    setAccessToken(access);
    setRefreshToken(refresh);
    writeStoredRefresh(refresh);
  }

  function clearAuthState(): void {
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredRefresh();
    setAdmin(null);
    setChallenge(null);
    setResetChallenge(null);
    setStatus("signed_out");
  }

  async function refreshTokens(): Promise<boolean> {
    if (refreshFlight) return refreshFlight;
    const currentRefresh = refreshToken();
    if (!currentRefresh) return false;

    refreshFlight = (async () => {
      try {
        const result = await refreshRequest(currentRefresh);
        saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
        setAdmin(result.admin);
        return true;
      } catch (error) {
        setLastError(toAuthError(error));
        if (
          error instanceof ApiError &&
          (error.code === "invalid_refresh_token" ||
            error.code === "refresh_token_reused" ||
            error.code === "account_disabled")
        ) {
          clearAuthState();
        }
        return false;
      } finally {
        refreshFlight = null;
      }
    })();

    return refreshFlight;
  }

  async function authFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const token = accessToken();
    try {
      return await apiRequest<T>(path, { ...options, token });
    } catch (error) {
      if (error instanceof ApiError && (error.code === "missing_token" || error.code === "invalid_token")) {
        const refreshed = await refreshTokens();
        if (!refreshed) throw error;
        return apiRequest<T>(path, { ...options, token: accessToken() });
      }
      throw error;
    }
  }

  async function login(identifier: string, password: string): Promise<void> {
    setBusy(true);
    setLastError(null);
    setStatus("authenticating");
    try {
      const result = await loginRequest(identifier, password);
      if (result.two_factor_required && result.challenge) {
        setChallenge(result.challenge);
        setStatus("login_otp");
        return;
      }
      if (result.tokens && result.admin) {
        saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
        setAdmin(result.admin);
        setChallenge(null);
        setStatus("authenticated");
        return;
      }
      setChallenge(null);
      setStatus("login_otp");
    } catch (error) {
      setLastError(toAuthError(error));
      setStatus("signed_out");
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(otp: string): Promise<void> {
    const current = challenge();
    if (!current) {
      const error = { code: "no_challenge", message: "Login session expired. Start again.", retryAfter: null };
      setLastError(error);
      throw new Error(error.message);
    }
    setBusy(true);
    setLastError(null);
    try {
      const result = await verifyOtpRequest(current.id, otp);
      saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
      setAdmin(result.admin);
      setChallenge(null);
      setStatus("authenticated");
    } catch (error) {
      const authError = toAuthError(error);
      setLastError(authError);
      if (authError.code === "challenge_expired" || authError.code === "challenge_already_used") {
        setChallenge(null);
        setStatus("signed_out");
      }
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp(): Promise<void> {
    const current = challenge();
    if (!current) return;
    setBusy(true);
    setLastError(null);
    try {
      const next = await resendOtpRequest(current.id);
      setChallenge(next);
    } catch (error) {
      setLastError(toAuthError(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }

  function startPasswordReset(): void {
    setLastError(null);
    setStatus("reset_requested");
  }

  function backToLogin(): void {
    setChallenge(null);
    setResetChallenge(null);
    setLastError(null);
    setStatus("signed_out");
  }

  async function forgotPassword(email: string): Promise<string> {
    setBusy(true);
    setLastError(null);
    setStatus("reset_requested");
    try {
      const result = await forgotPasswordRequest(email);
      setResetChallenge(result.challenge);
      setStatus("reset_otp");
      return result.message;
    } catch (error) {
      setLastError(toAuthError(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(otp: string, newPassword: string): Promise<void> {
    const current = resetChallenge();
    if (!current) {
      const error = { code: "no_challenge", message: "Reset session expired. Start again.", retryAfter: null };
      setLastError(error);
      throw new Error(error.message);
    }
    setBusy(true);
    setLastError(null);
    try {
      const result = await resetPasswordRequest(current.id, otp, newPassword);
      saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
      setAdmin(result.admin);
      setResetChallenge(null);
      setStatus("authenticated");
    } catch (error) {
      const authError = toAuthError(error);
      setLastError(authError);
      if (authError.code === "challenge_expired" || authError.code === "challenge_already_used") {
        setResetChallenge(null);
        setStatus("signed_out");
      }
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    setBusy(true);
    setLastError(null);
    try {
      let token = accessToken();
      if (!token) throw new Error("Not authenticated.");
      try {
        const result = await changePasswordRequest(token, currentPassword, newPassword);
        saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
      } catch (error) {
        if (error instanceof ApiError && (error.code === "missing_token" || error.code === "invalid_token")) {
          const refreshed = await refreshTokens();
          if (!refreshed) throw error;
          const retryToken = accessToken();
          if (!retryToken) throw error;
          const result = await changePasswordRequest(retryToken, currentPassword, newPassword);
          saveTokenPair(result.tokens.access_token, result.tokens.refresh_token);
        } else {
          throw error;
        }
      }
    } catch (error) {
      setLastError(toAuthError(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function restore(): Promise<void> {
    if (!accessToken() || !refreshToken()) return;
    setBusy(true);
    try {
      const token = accessToken();
      if (!token) return;
      const me = await meRequest(token);
      setAdmin(me.admin);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && (error.code === "missing_token" || error.code === "invalid_token")) {
        const refreshed = await refreshTokens();
        if (!refreshed) return;
        try {
          const token = accessToken();
          if (!token) return;
          const me = await meRequest(token);
          setAdmin(me.admin);
          setStatus("authenticated");
        } catch {
          clearAuthState();
        }
        return;
      }
      setLastError(toAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout(allDevices = false): Promise<void> {
    const access = accessToken();
    const refresh = refreshToken();
    try {
      if (access) {
        await logoutRequest(access, refresh, allDevices);
      }
    } catch {
      // Local state clears even when the network call fails after confirm.
    } finally {
      clearAuthState();
      setLastError(null);
    }
  }

  function clearError(): void {
    setLastError(null);
  }

  onMount(() => {
    if (status() === "authenticated" || !refreshToken()) return;
    setBusy(true);
    void refreshTokens()
      .then((ok) => {
        if (ok) setStatus("authenticated");
      })
      .finally(() => setBusy(false));
  });

  const value: AuthContextValue = {
    status,
    admin,
    challenge,
    resetChallenge,
    lastError,
    isBusy: busy,
    accessToken,
    login,
    verifyOtp,
    resendOtp,
    startPasswordReset,
    forgotPassword,
    resetPassword,
    changePassword,
    backToLogin,
    restore,
    logout,
    clearError,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
