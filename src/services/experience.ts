export interface Experience {
  id: string;
  company_name: string;
  company_logo_url?: string;
  role?: string;
  employment_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  technologies: string[];
  bullets: string[];
  display_order: number;
}

export interface AdminExperience extends Experience {
  created_at: string;
  updated_at: string;
}

export interface AdminExperienceResponse {
  experiences: AdminExperience[];
}

export interface ExperiencePayload {
  company_name: string;
  company_logo_url?: string;
  role?: string;
  employment_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  technologies?: string[];
  bullets?: string[];
  display_order?: number | null;
}

export interface ExperienceForm {
  company_name: string;
  company_logo_url: string;
  role: string;
  employment_type: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  technologies: string;
  bullets: string;
  display_order: string;
}

export const emptyExperienceForm: ExperienceForm = {
  company_name: "",
  company_logo_url: "",
  role: "",
  employment_type: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  technologies: "",
  bullets: "",
  display_order: "",
};

export function toExperienceForm(experience: AdminExperience): ExperienceForm {
  return {
    company_name: experience.company_name ?? "",
    company_logo_url: experience.company_logo_url ?? "",
    role: experience.role ?? "",
    employment_type: experience.employment_type ?? "",
    location: experience.location ?? "",
    start_date: experience.start_date ?? "",
    end_date: experience.end_date ?? "",
    is_current: experience.is_current ?? false,
    technologies: (experience.technologies ?? []).join("\n"),
    bullets: (experience.bullets ?? []).join("\n"),
    display_order: String(experience.display_order ?? 0),
  };
}

function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateExperienceForm(form: ExperienceForm): string | null {
  if (!form.company_name.trim()) return "Company name is required.";
  if (form.start_date && !DATE_RE.test(form.start_date)) return "Start date must be YYYY-MM-DD.";
  if (form.end_date && !DATE_RE.test(form.end_date)) return "End date must be YYYY-MM-DD.";
  if (form.is_current && form.end_date) return "Current roles must not have an end date.";
  if (!form.is_current && form.end_date && !form.start_date) {
    return "Start date is required when end date is set.";
  }
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    return "End date must not be earlier than start date.";
  }
  return null;
}

export function buildExperiencePayload(form: ExperienceForm, order: number | null): ExperiencePayload {
  const payload: ExperiencePayload = {
    company_name: form.company_name.trim(),
    company_logo_url: form.company_logo_url.trim(),
    role: form.role.trim(),
    employment_type: form.employment_type.trim(),
    location: form.location.trim(),
    start_date: form.start_date.trim(),
    is_current: form.is_current,
    technologies: splitLines(form.technologies),
    bullets: splitLines(form.bullets),
  };
  if (!form.is_current) payload.end_date = form.end_date.trim();
  if (order !== null) payload.display_order = order;
  return payload;
}

export function experienceErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "experience_not_found":
      return "That experience no longer exists. The list was refreshed.";
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
