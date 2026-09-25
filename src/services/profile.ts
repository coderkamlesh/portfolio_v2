import { apiRequest } from "../lib/api";

export interface PublicProfile {
  full_name: string;
  title: string;
  tagline?: string;
  summary?: string;
  email: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  twitter_url?: string;
  resume_file_url?: string;
  career_gap_note?: string;
  experience_level?: string;
}

export interface AdminProfile extends PublicProfile {
  id: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name: string;
  title: string;
  tagline: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  avatar_url: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  twitter_url: string;
  resume_file_url: string;
  career_gap_note: string;
  experience_level: string;
}

export const emptyProfileForm: UpdateProfileRequest = {
  full_name: "",
  title: "",
  tagline: "",
  summary: "",
  email: "",
  phone: "",
  location: "",
  avatar_url: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  twitter_url: "",
  resume_file_url: "",
  career_gap_note: "",
  experience_level: "",
};

export function publicProfileRequest(): Promise<PublicProfile> {
  return apiRequest<PublicProfile>("/api/public/profile");
}

export function toForm(profile: AdminProfile): UpdateProfileRequest {
  return {
    full_name: profile.full_name ?? "",
    title: profile.title ?? "",
    tagline: profile.tagline ?? "",
    summary: profile.summary ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    avatar_url: profile.avatar_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    github_url: profile.github_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    twitter_url: profile.twitter_url ?? "",
    resume_file_url: profile.resume_file_url ?? "",
    career_gap_note: profile.career_gap_note ?? "",
    experience_level: profile.experience_level ?? "",
  };
}
