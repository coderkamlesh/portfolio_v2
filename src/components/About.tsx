import { For, Show } from 'solid-js';
import { profile as fallback } from '../data/profile';
import { useSite } from '../stores/site';
import SectionHeading from './SectionHeading';
import styles from './About.module.css';

export default function About() {
  const site = useSite();
  const live = () => site.profile();
  const groups = () => site.skills();

  return (
    <section id="about" class={styles.section} aria-labelledby="about-title">
      <div class="container">
        <SectionHeading id="about-title" eyebrow="About" title="A little background" />
        <div class={styles.grid}>
          <div>
            <Show
              when={live()?.summary || live()?.tagline}
              fallback={<For each={fallback.bio}>{(para) => <p>{para}</p>}</For>}
            >
              <Show when={live()?.tagline}>
                <p>
                  <strong>{live()?.tagline}</strong>
                </p>
              </Show>
              <Show when={live()?.summary}>
                <p>{live()?.summary}</p>
              </Show>
            </Show>
          </div>
          <div>
            <Show
              when={groups() && (groups()?.length ?? 0) > 0}
              fallback={
                <>
                  <h3 class={styles.subhead}>Working stack</h3>
                  <ul class={styles.chips} aria-label="Technologies I work with">
                    <For each={fallback.stack}>{(tech) => <li>{tech}</li>}</For>
                  </ul>
                </>
              }
            >
              <For each={groups() ?? []}>
                {(group) => (
                  <>
                    <h3 class={styles.subhead}>{group.name}</h3>
                    <ul class={styles.chips} aria-label={`${group.name} skills`}>
                      <For each={group.skills}>{(skill) => <li>{skill.name}</li>}</For>
                    </ul>
                  </>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </section>
  );
}
