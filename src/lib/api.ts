const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

function normalizeBase(value: string | undefined): string {
  if (!value) return "http://localhost:8080";
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBase(rawBase);

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  retryAfter: number | null;

  constructor(status: number, code: string, message: string, retryAfter: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const value = Number.parseInt(header, 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function isJsonContentType(header: string | null): boolean {
  if (!header) return false;
  return header.toLowerCase().includes("application/json");
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("Content-Type");
  const hasBody =
    contentType !== null || response.headers.get("Content-Length") !== "0";

  if (!hasBody) {
    if (!response.ok) {
      throw new ApiError(response.status, `http_${response.status}`, response.statusText || "Request failed.", retryAfter);
    }
    return null as T;
  }

  if (!isJsonContentType(contentType)) {
    const text = (await response.text()).trim();
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `http_${response.status}`,
        text || response.statusText || "Request failed.",
        retryAfter,
      );
    }
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new ApiError(response.status, `http_${response.status}`, "Request failed.", retryAfter);
    }
    return null as T;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(response.status, "invalid_response", "Server returned malformed JSON.", retryAfter);
  }

  if (!response.ok) {
    const envelope = parsed as { error?: ApiErrorBody };
    const code = envelope?.error?.code ?? `http_${response.status}`;
    const message = envelope?.error?.message ?? "Request failed.";
    throw new ApiError(response.status, code, message, retryAfter);
  }

  return parsed as T;
}
