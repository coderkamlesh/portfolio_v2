import { Show } from "solid-js";
import type { JSX } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../../stores/auth";
import AdminLogin from "./AdminLogin";
import styles from "./AdminLayout.module.css";

const contentLinks = [
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/extras", label: "Extras" },
  { href: "/admin/social-links", label: "Social Links" },
];

const systemLinks = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-log", label: "Audit Log" },
  { href: "/admin/account", label: "Account" },
];

export default function AdminLayout(props: { children?: JSX.Element }) {
  const auth = useAuth();

  async function handleLogout(): Promise<void> {
    await auth.logout(false);
  }

  return (
    <Show
      when={auth.status() === "authenticated"}
      fallback={<AdminLogin />}
    >
      <div class={styles.shell}>
        <aside class={styles.sidebar}>
          <A class={styles.brand} href="/admin">
            Admin
          </A>
          <nav class={styles.nav} aria-label="Admin">
            <A class={styles.link} activeClass={styles.active} href="/admin" end>
              Dashboard
            </A>
            <span class={styles.group}>Content</span>
            {contentLinks.map((link) => (
              <A class={styles.link} activeClass={styles.active} href={link.href}>
                {link.label}
              </A>
            ))}
            <span class={styles.group}>System</span>
            {systemLinks.map((link) => (
              <A class={styles.link} activeClass={styles.active} href={link.href}>
                {link.label}
              </A>
            ))}
          </nav>
        </aside>
        <div class={styles.main}>
          <header class={styles.topbar}>
            <span class={styles.user}>{auth.admin()?.email}</span>
            <button class={styles.logout} type="button" onClick={() => void handleLogout()}>
              Log out
            </button>
          </header>
          <main class={styles.content}>{props.children}</main>
        </div>
      </div>
    </Show>
  );
}
