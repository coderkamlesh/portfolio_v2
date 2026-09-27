export const EXTRA_CATEGORIES = [
  "CERTIFICATION",
  "AWARD",
  "PUBLICATION",
  "OPEN_SOURCE",
  "TALK",
  "VOLUNTEER",
] as const;

export type ExtraCategory = (typeof EXTRA_CATEGORIES)[number];

export interface Extra {
  id: string;
  category: string;
  title: string;
  issuer?: string;
  issued_date?: string;
  credential_url?: string;
  description?: string;
  display_order: number;
}

export interface AdminExtra extends Extra {
  created_at: string;
}

export interface AdminExtrasResponse {
  extras: AdminExtra[];
}

export interface ExtraPayload {
  category: string;
  title: string;
  issuer?: string;
  issued_date?: string;
  credential_url?: string;
  description?: string;
  display_order?: number | null;
}

export interface ExtraForm {
  category: string;
  title: string;
  issuer: string;
  issued_date: string;
  credential_url: string;
  description: string;
  display_order: string;
}

export const emptyExtraForm: ExtraForm = {
  category: "CERTIFICATION",
  title: "",
  issuer: "",
  issued_date: "",
  credential_url: "",
  description: "",
  display_order: "",
};

export function toExtraForm(extra: AdminExtra): ExtraForm {
  return {
    category: extra.category ?? "CERTIFICATION",
    title: extra.title ?? "",
    issuer: extra.issuer ?? "",
    issued_date: extra.issued_date ?? "",
    credential_url: extra.credential_url ?? "",
    description: extra.description ?? "",
    display_order: String(extra.display_order ?? 0),
  };
}

export type OrderParse = { ok: true; value: number | null } | { ok: false; message: string };

export function parseOrder(raw: string): OrderParse {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) {
    return { ok: false, message: "Display order must be a whole number 0 or more." };
  }
  return { ok: true, value };
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const FULL_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isRealCalendarDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateExtraForm(form: ExtraForm): string | null {
  if (!EXTRA_CATEGORIES.includes(form.category as ExtraCategory)) {
    return "Category must be one of the six allowed values.";
  }
  if (!form.title.trim()) return "Title is required.";
  const issued = form.issued_date.trim();
  if (issued) {
    if (MONTH_RE.test(issued)) return null;
    if (FULL_DATE_RE.test(issued)) {
      if (!isRealCalendarDate(issued)) return "Issued date is not a real calendar date.";
      return null;
    }
    return "Issued date must be YYYY-MM or YYYY-MM-DD.";
  }
  return null;
}

export function buildExtraPayload(form: ExtraForm, order: number | null): ExtraPayload {
  const payload: ExtraPayload = {
    category: form.category,
    title: form.title.trim(),
    issuer: form.issuer.trim(),
    issued_date: form.issued_date.trim(),
    credential_url: form.credential_url.trim(),
    description: form.description.trim(),
  };
  if (order !== null) payload.display_order = order;
  return payload;
}

export function extrasErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "extra_not_found":
      return "That entry no longer exists. The list was refreshed.";
    case "invalid_json":
      return "The form sent an unsupported value.";
    case "empty_body":
      return "The form was empty.";
    case "body_too_large":
      return "The input is too large.";
    case "internal_error":
      return "Server error. Try again.";
    default:
      return "Something went wrong. Try again.";
  }
}
