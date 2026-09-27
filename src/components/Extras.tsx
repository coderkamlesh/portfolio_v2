import { For, Show } from "solid-js";
import { useSite } from "../stores/site";
import SectionHeading from "./SectionHeading";
import styles from "./Extras.module.css";

function groupLabel(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Extras() {
  const site = useSite();
  const groups = () => site.extras();

  return (
    <Show when={groups() && (groups()?.length ?? 0) > 0}>
      <section id="extras" class={styles.section} aria-labelledby="extras-title">
        <div class="container">
          <SectionHeading id="extras-title" eyebrow="Highlights" title="Extras" />
          <For each={groups() ?? []}>
            {(group) => (
              <div class={styles.group}>
                <h3 class={styles.groupTitle}>{groupLabel(group.category)}</h3>
                <ul class={styles.grid}>
                  <For each={group.extras}>
                    {(extra) => (
                      <li class={styles.card}>
                        <article>
                          <h4>{extra.title}</h4>
                          <Show when={extra.issuer || extra.issued_date}>
                            <p class={styles.meta}>
                              {[extra.issuer, extra.issued_date].filter(Boolean).join(" · ")}
                            </p>
                          </Show>
                          <Show when={extra.description}>
                            <p class={styles.text}>{extra.description}</p>
                          </Show>
                          <Show when={extra.credential_url}>
                            <a
                              class={styles.credential}
                              href={extra.credential_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View credential
                            </a>
                          </Show>
                        </article>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
        </div>
      </section>
    </Show>
  );
}
