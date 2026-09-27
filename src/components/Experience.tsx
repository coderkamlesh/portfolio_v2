import { For, Show } from "solid-js";
import { useSite } from "../stores/site";
import { formatMonthYear } from "../services/public";
import SectionHeading from "./SectionHeading";
import styles from "./Experience.module.css";

function dateRange(start?: string, end?: string, isCurrent?: boolean): string {
  const from = start ? formatMonthYear(start) : "—";
  if (isCurrent) return `${from} → Present`;
  return `${from} → ${end ? formatMonthYear(end) : "—"}`;
}

export default function Experience() {
  const site = useSite();
  const entries = () => site.experience();

  return (
    <Show when={entries() && (entries()?.length ?? 0) > 0}>
      <section id="experience" class={styles.section} aria-labelledby="experience-title">
        <div class="container">
          <SectionHeading id="experience-title" eyebrow="Career" title="Experience" />
          <ul class={styles.timeline}>
            <For each={entries() ?? []}>
              {(entry) => (
                <li class={styles.item}>
                  <h3>
                    {entry.role || "Team member"} · {entry.company_name}
                  </h3>
                  <p class={styles.meta}>
                    {[entry.employment_type, entry.location].filter(Boolean).join(" · ")}
                    {" · "}
                    {dateRange(entry.start_date, entry.end_date, entry.is_current)}
                  </p>
                  <Show when={(entry.bullets ?? []).length > 0}>
                    <ul class={styles.bullets}>
                      <For each={entry.bullets}>{(bullet) => <li>{bullet}</li>}</For>
                    </ul>
                  </Show>
                  <Show when={(entry.technologies ?? []).length > 0}>
                    <ul class={styles.tech} aria-label="Technologies used">
                      <For each={entry.technologies}>{(tech) => <li>{tech}</li>}</For>
                    </ul>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </div>
      </section>
    </Show>
  );
}
