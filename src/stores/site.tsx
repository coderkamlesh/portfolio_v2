import { createContext, createSignal, onMount, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { publicProfileRequest } from "../services/profile";
import {
  publicEducationRequest,
  publicExperienceRequest,
  publicExtrasRequest,
  publicProjectsRequest,
  publicSkillsRequest,
  publicSocialLinksRequest,
} from "../services/public";
import type { PublicProfile } from "../services/profile";
import type { SkillCategory } from "../services/skills";
import type { Project } from "../services/projects";
import type { Experience } from "../services/experience";
import type { Education } from "../services/education";
import type { ExtrasGroup } from "../services/public";
import type { SocialLink } from "../services/social-links";

interface SiteContextValue {
  loaded: () => boolean;
  profile: () => PublicProfile | null;
  skills: () => SkillCategory[] | null;
  projects: () => Project[] | null;
  experience: () => Experience[] | null;
  education: () => Education[] | null;
  extras: () => ExtrasGroup[] | null;
  socialLinks: () => SocialLink[] | null;
}

const SiteContext = createContext<SiteContextValue>();

export function SiteProvider(props: { children: JSX.Element }) {
  const [loaded, setLoaded] = createSignal(false);
  const [profile, setProfile] = createSignal<PublicProfile | null>(null);
  const [skills, setSkills] = createSignal<SkillCategory[] | null>(null);
  const [projects, setProjects] = createSignal<Project[] | null>(null);
  const [experience, setExperience] = createSignal<Experience[] | null>(null);
  const [education, setEducation] = createSignal<Education[] | null>(null);
  const [extras, setExtras] = createSignal<ExtrasGroup[] | null>(null);
  const [socialLinks, setSocialLinks] = createSignal<SocialLink[] | null>(null);

  async function load(): Promise<void> {
    const [profileRes, skillsRes, projectsRes, experienceRes, educationRes, extrasRes, socialRes] =
      await Promise.allSettled([
        publicProfileRequest(),
        publicSkillsRequest(),
        publicProjectsRequest(),
        publicExperienceRequest(),
        publicEducationRequest(),
        publicExtrasRequest(),
        publicSocialLinksRequest(),
      ]);
    if (profileRes.status === "fulfilled") setProfile(profileRes.value);
    if (skillsRes.status === "fulfilled") setSkills(skillsRes.value.categories);
    if (projectsRes.status === "fulfilled") setProjects(projectsRes.value.projects);
    if (experienceRes.status === "fulfilled") setExperience(experienceRes.value.experiences);
    if (educationRes.status === "fulfilled") setEducation(educationRes.value.education);
    if (extrasRes.status === "fulfilled") setExtras(extrasRes.value.categories);
    if (socialRes.status === "fulfilled") setSocialLinks(socialRes.value.social_links);
    setLoaded(true);
  }

  onMount(() => {
    void load();
  });

  const value: SiteContextValue = {
    loaded,
    profile,
    skills,
    projects,
    experience,
    education,
    extras,
    socialLinks,
  };

  return <SiteContext.Provider value={value}>{props.children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used inside SiteProvider.");
  return context;
}
