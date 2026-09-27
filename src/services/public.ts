import { apiRequest } from "../lib/api";
import type { PublicSkillsResponse } from "./skills";
import type { Project } from "./projects";
import type { Experience } from "./experience";
import type { Education } from "./education";
import type { Extra } from "./extras";
import type { SocialLink } from "./social-links";

export interface PublicProjectsResponse {
  projects: Project[];
}

export interface PublicProjectResponse {
  project: Project;
}

export interface PublicExperienceResponse {
  experiences: Experience[];
}

export interface PublicEducationResponse {
  education: Education[];
}

export interface ExtrasGroup {
  category: string;
  extras: Extra[];
}

export interface PublicExtrasResponse {
  categories: ExtrasGroup[];
}

export interface PublicSocialLinksResponse {
  social_links: SocialLink[];
}

export function publicSkillsRequest(): Promise<PublicSkillsResponse> {
  return apiRequest<PublicSkillsResponse>("/api/public/skills");
}

export function publicProjectsRequest(): Promise<PublicProjectsResponse> {
  return apiRequest<PublicProjectsResponse>("/api/public/projects");
}

export function publicExperienceRequest(): Promise<PublicExperienceResponse> {
  return apiRequest<PublicExperienceResponse>("/api/public/experience");
}

export function publicEducationRequest(): Promise<PublicEducationResponse> {
  return apiRequest<PublicEducationResponse>("/api/public/education");
}

export function publicExtrasRequest(): Promise<PublicExtrasResponse> {
  return apiRequest<PublicExtrasResponse>("/api/public/extras");
}

export function publicSocialLinksRequest(): Promise<PublicSocialLinksResponse> {
  return apiRequest<PublicSocialLinksResponse>("/api/public/social-links");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonthYear(iso: string): string {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(iso.trim());
  if (!match) return iso;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return iso;
  return `${MONTHS[month - 1]} ${match[1]}`;
}
