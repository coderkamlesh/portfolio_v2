export interface SkillItem {
  id: string;
  name: string;
  icon_slug?: string;
  display_order: number;
}

export interface SkillCategory {
  id: string;
  name: string;
  display_order: number;
  skills: SkillItem[];
}

export interface PublicSkillsResponse {
  categories: SkillCategory[];
}

export interface AdminSkillCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface AdminSkill extends SkillItem {
  category_id: string;
  created_at: string;
}

export interface AdminSkillCategoriesResponse {
  categories: AdminSkillCategory[];
}

export interface AdminSkillsResponse {
  skills: AdminSkill[];
}

export interface CategoryPayload {
  name: string;
  display_order?: number | null;
}

export interface SkillPayload {
  category_id?: string;
  name: string;
  icon_slug?: string;
  display_order?: number | null;
}

export function categoryPayload(name: string, order: number | null): CategoryPayload {
  const payload: CategoryPayload = { name: name.trim() };
  if (order !== null) payload.display_order = order;
  return payload;
}

export function createSkillPayload(
  categoryId: string,
  name: string,
  iconSlug: string,
  order: number | null,
): SkillPayload {
  const payload: SkillPayload = { category_id: categoryId, name: name.trim() };
  const icon = iconSlug.trim();
  if (icon) payload.icon_slug = icon;
  if (order !== null) payload.display_order = order;
  return payload;
}

export function updateSkillPayload(
  name: string,
  iconSlug: string,
  order: number | null,
  categoryId?: string,
): SkillPayload {
  const payload: SkillPayload = { name: name.trim(), icon_slug: iconSlug.trim() };
  if (categoryId) payload.category_id = categoryId;
  if (order !== null) payload.display_order = order;
  return payload;
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

export function skillsErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "skill_category_exists":
      return "A category with that name already exists.";
    case "skill_exists":
      return "That skill name already exists in this category.";
    case "skill_category_not_found":
      return "That category no longer exists. The list was refreshed.";
    case "skill_not_found":
      return "That skill no longer exists. The list was refreshed.";
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
