export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_year: number;
  end_year?: number;
  grade?: string;
  gpa?: string;
  coursework: string[];
  honors?: string;
  display_order: number;
}

export interface AdminEducation extends Education {
  created_at: string;
}

export interface AdminEducationResponse {
  education: AdminEducation[];
}

export interface EducationPayload {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_year: number;
  end_year?: number | null;
  grade?: string;
  gpa?: string;
  coursework?: string[];
  honors?: string;
  display_order?: number | null;
}

export interface EducationForm {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  grade: string;
  gpa: string;
  coursework: string;
  honors: string;
  display_order: string;
}

export const emptyEducationForm: EducationForm = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_year: "",
  end_year: "",
  grade: "",
  gpa: "",
  coursework: "",
  honors: "",
  display_order: "",
};

export function toEducationForm(entry: AdminEducation): EducationForm {
  return {
    institution: entry.institution ?? "",
    degree: entry.degree ?? "",
    field_of_study: entry.field_of_study ?? "",
    start_year: entry.start_year !== undefined ? String(entry.start_year) : "",
    end_year: entry.end_year !== undefined ? String(entry.end_year) : "",
    grade: entry.grade ?? "",
    gpa: entry.gpa ?? "",
    coursework: (entry.coursework ?? []).join("\n"),
    honors: entry.honors ?? "",
    display_order: String(entry.display_order ?? 0),
  };
}

function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function maxYear(): number {
  return new Date().getFullYear() + 10;
}

export type YearParse = { ok: true; value: number | null } | { ok: false; message: string };

export function parseYear(raw: string, label: string, required: boolean): YearParse {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: null };
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value)) return { ok: false, message: `${label} must be a whole year.` };
  if (value < 1950 || value > maxYear()) {
    return { ok: false, message: `${label} must be between 1950 and ${maxYear()}.` };
  }
  return { ok: true, value };
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

export function validateEducationForm(form: EducationForm): string | null {
  if (!form.institution.trim()) return "Institution is required.";
  if (!form.degree.trim()) return "Degree is required.";
  const start = parseYear(form.start_year, "Start year", true);
  if (!start.ok) return start.message;
  const end = parseYear(form.end_year, "End year", false);
  if (!end.ok) return end.message;
  if (start.value !== null && end.value !== null && end.value < start.value) {
    return "End year must not be earlier than start year.";
  }
  return null;
}

export function buildEducationPayload(
  form: EducationForm,
  startYear: number,
  endYear: number | null,
  order: number | null,
): EducationPayload {
  const payload: EducationPayload = {
    institution: form.institution.trim(),
    degree: form.degree.trim(),
    field_of_study: form.field_of_study.trim(),
    start_year: startYear,
    end_year: endYear,
    grade: form.grade.trim(),
    gpa: form.gpa.trim(),
    coursework: splitLines(form.coursework),
    honors: form.honors.trim(),
  };
  if (order !== null) payload.display_order = order;
  return payload;
}

export function educationErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "education_not_found":
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
