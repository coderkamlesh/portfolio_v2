export type ProjectType = "PERSONAL" | "ACADEMIC" | "OPEN_SOURCE" | "INTERNSHIP";
export type ProjectStatus = "COMPLETED" | "IN_PROGRESS";

export interface Project {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  project_type?: string;
  role?: string;
  technologies: string[];
  repo_url?: string;
  live_url?: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_featured: boolean;
  bullets: string[];
  display_order: number;
}

export interface AdminProject extends Project {
  created_at: string;
  updated_at: string;
}

export interface AdminProjectsResponse {
  projects: AdminProject[];
}

export interface ProjectPayload {
  title: string;
  tagline?: string;
  description: string;
  project_type?: string;
  role?: string;
  technologies?: string[];
  repo_url?: string;
  live_url?: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_featured?: boolean;
  bullets?: string[];
  display_order?: number | null;
}

export interface ProjectForm {
  title: string;
  tagline: string;
  description: string;
  project_type: string;
  role: string;
  technologies: string;
  repo_url: string;
  live_url: string;
  image_url: string;
  start_date: string;
  end_date: string;
  status: string;
  is_featured: boolean;
  bullets: string;
  display_order: string;
}

export const emptyProjectForm: ProjectForm = {
  title: "",
  tagline: "",
  description: "",
  project_type: "",
  role: "",
  technologies: "",
  repo_url: "",
  live_url: "",
  image_url: "",
  start_date: "",
  end_date: "",
  status: "",
  is_featured: false,
  bullets: "",
  display_order: "",
};

export function toProjectForm(project: AdminProject): ProjectForm {
  return {
    title: project.title ?? "",
    tagline: project.tagline ?? "",
    description: project.description ?? "",
    project_type: project.project_type ?? "",
    role: project.role ?? "",
    technologies: (project.technologies ?? []).join("\n"),
    repo_url: project.repo_url ?? "",
    live_url: project.live_url ?? "",
    image_url: project.image_url ?? "",
    start_date: project.start_date ?? "",
    end_date: project.end_date ?? "",
    status: project.status ?? "",
    is_featured: project.is_featured ?? false,
    bullets: (project.bullets ?? []).join("\n"),
    display_order: String(project.display_order ?? 0),
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

export function validateProjectForm(form: ProjectForm): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (!form.description.trim()) return "Description is required.";
  if (form.start_date && !DATE_RE.test(form.start_date)) return "Start date must be YYYY-MM-DD.";
  if (form.end_date && !DATE_RE.test(form.end_date)) return "End date must be YYYY-MM-DD.";
  if (form.end_date && !form.start_date) return "Start date is required when end date is set.";
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    return "End date must not be earlier than start date.";
  }
  if (form.status.toUpperCase() === "IN_PROGRESS" && form.end_date) {
    return "In-progress projects must not have an end date.";
  }
  return null;
}

export function buildProjectPayload(form: ProjectForm, order: number | null): ProjectPayload {
  const payload: ProjectPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    tagline: form.tagline.trim(),
    role: form.role.trim(),
    project_type: form.project_type.trim(),
    status: form.status.trim(),
    repo_url: form.repo_url.trim(),
    live_url: form.live_url.trim(),
    image_url: form.image_url.trim(),
    start_date: form.start_date.trim(),
    end_date: form.end_date.trim(),
    is_featured: form.is_featured,
    technologies: splitLines(form.technologies),
    bullets: splitLines(form.bullets),
  };
  if (order !== null) payload.display_order = order;
  return payload;
}

export function projectsErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "project_not_found":
      return "That project no longer exists. The list was refreshed.";
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
