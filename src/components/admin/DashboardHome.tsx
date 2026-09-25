import { A } from "@solidjs/router";
import { API_BASE_URL } from "../../lib/api";
import styles from "./DashboardHome.module.css";

const sections = [
  { href: "/admin/profile", title: "Profile", text: "Hero and contact data, single record." },
  { href: "/admin/projects", title: "Projects", text: "Showcase entries with bullets and links." },
  { href: "/admin/skills", title: "Skills", text: "Categories with nested skills." },
  { href: "/admin/experience", title: "Experience", text: "Work timeline with bullets." },
  { href: "/admin/education", title: "Education", text: "Degrees and coursework." },
  { href: "/admin/extras", title: "Extras", text: "Certifications, awards, talks." },
  { href: "/admin/social-links", title: "Social Links", text: "One transactional set of links." },
  { href: "/admin/analytics", title: "Analytics", text: "Resume download counts." },
  { href: "/admin/audit-log", title: "Audit Log", text: "Who changed what, newest first." },
];

export default function DashboardHome() {
  return (
    <>
      <h1>Dashboard</h1>
      <p class={styles.sub}>API: {API_BASE_URL}</p>
      <div class={styles.grid}>
        {sections.map((section) => (
          <A class={styles.card} href={section.href}>
            <strong>{section.title}</strong>
            <span>{section.text}</span>
          </A>
        ))}
      </div>
    </>
  );
}
