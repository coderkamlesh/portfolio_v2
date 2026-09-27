import { For, Show } from "solid-js";
import { useSite } from "../stores/site";
import SectionHeading from "./SectionHeading";
import styles from "./Education.module.css";

function yearRange(start?: number, end?: number): string {
  const from = start !== undefined ? String(start) : "—";
  return `${from} → ${end !== undefined ? String(end) : "Present"}`;
}

export default function Education() {
  const site = useSite();
  const entries = () => site.education();

  return (
    <Show when={entries() && (entries()?.length ?? 0) > 0}>
      <section id="education" class={styles.section} aria-labelledby="education-title">
        <div class="container">
          <SectionHeading id="education-title" eyebrow="Education" title="Education" />
          <ul class={styles.grid}>
            <For each={entries() ?? []}>
              {(entry) => (
                <li class={styles.card}>
                  <article>
                    <h3>{entry.institution}</h3>
                    <p class={styles.degree}>
                      {entry.degree}
                      <Show when={entry.field_of_study}> · {entry.field_of_study}</Show>
                    </p>
                    <p class={styles.meta}>{yearRange(entry.start_year, entry.end_year)}</p>
                    <Show when={entry.grade || entry.gpa}>
                      <p class={styles.meta}>
                        {[entry.grade, entry.gpa].filter(Boolean).join(" · ")}
                      </p>
                    </Show>
                    <Show when={(entry.coursework ?? []).length > 0}>
                      <ul class={styles.tech} aria-label="Coursework">
                        <For each={entry.coursework}>{(course) => <li>{course}</li>}</For>
                      </ul>
                    </Show>
                    <Show when={entry.honors}>
                      <p class={styles.honors}>{entry.honors}</p>
                    </Show>
                  </article>
                </li>
              )}
            </For>
          </ul>
        </div>
      </section>
    </Show>
  );
}
