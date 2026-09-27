export const AUDIT_ENTITY_TYPES = [
  "profile",
  "skill_category",
  "skill",
  "experience",
  "project",
  "education",
  "extra",
  "social_link",
] as const;

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE"] as const;

export interface AuditEntry {
  id: string;
  admin_id?: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditFilters {
  entityType: string;
  action: string;
  limit: number;
  offset: number;
}

export function buildAuditQuery(filters: AuditFilters): string {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entity_type", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));
  return `/api/admin/audit-log?${params.toString()}`;
}

export function pageCount(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, limit)));
}

export function clampOffset(offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(10000, Math.floor(offset));
}

export function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function parseSnapshot(raw: string | undefined): { ok: true; value: unknown } | { ok: false } {
  if (!raw) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export function diffKeys(before: unknown, after: unknown): string[] {
  if (typeof before !== "object" || before === null || typeof after !== "object" || after === null) {
    return [];
  }
  const keys = new Set([...Object.keys(before as object), ...Object.keys(after as object)]);
  return [...keys].filter(
    (key) =>
      JSON.stringify((before as Record<string, unknown>)[key]) !==
      JSON.stringify((after as Record<string, unknown>)[key]),
  );
}

export function auditLogErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Unknown action filter. Use CREATE, UPDATE or DELETE.";
    case "unauthorized":
      return "Session expired. Log in again.";
    case "service_unavailable":
      return "Audit log is temporarily unavailable. Try again later.";
    case "internal_error":
      return "Server error. Try again.";
    default:
      return message || "Something went wrong. Try again.";
  }
}
