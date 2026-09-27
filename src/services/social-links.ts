export const SOCIAL_PLATFORMS = ["linkedin", "github", "twitter", "medium"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

export interface AdminSocialLinksResponse {
  social_links: SocialLink[];
}

export interface SocialLinkEntry {
  platform: string;
  url: string;
  display_order?: number | null;
}

export interface ReplaceSocialLinksPayload {
  links: SocialLinkEntry[];
}

export interface SocialLinkRow {
  key: number;
  platform: string;
  url: string;
}

let nextKey = 1;

export function toRows(links: SocialLink[]): SocialLinkRow[] {
  return links.map((link) => ({ key: nextKey++, platform: link.platform ?? "", url: link.url ?? "" }));
}

export function emptyRow(): SocialLinkRow {
  return { key: nextKey++, platform: "", url: "" };
}

export function validateSocialLinksRows(rows: SocialLinkRow[]): string | null {
  if (rows.length === 0) return "At least one link is required. Empty sets are rejected.";
  if (rows.length > 4) return "At most 4 entries are allowed.";
  const seen = new Set<string>();
  for (const row of rows) {
    const platform = row.platform.trim().toLowerCase();
    if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
      return "Platform must be one of linkedin, github, twitter, medium.";
    }
    if (seen.has(platform)) return `Duplicate platform "${platform}" in this set.`;
    seen.add(platform);
    const url = row.url.trim();
    if (!url) return `URL is required for "${platform}".`;
    if (/\s/.test(url)) return "URL must not contain whitespace.";
    if (!/^https?:\/\/.+/i.test(url)) return "URL must be an http or https URL.";
  }
  return null;
}

export function buildReplacePayload(rows: SocialLinkRow[]): ReplaceSocialLinksPayload {
  return {
    links: rows.map((row, index) => ({
      platform: row.platform.trim().toLowerCase(),
      url: row.url.trim(),
      display_order: index,
    })),
  };
}

export function socialLinksErrorText(code: string, message: string): string {
  switch (code) {
    case "validation_failed":
      return message || "Please check the fields and try again.";
    case "social_link_conflict":
      return message || "The same platform appears twice in this set.";
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
