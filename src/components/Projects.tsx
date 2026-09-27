import { For, Show } from 'solid-js';
import { profile as fallback } from '../data/profile';
import { useSite } from '../stores/site';
import SectionHeading from './SectionHeading';
import styles from './Projects.module.css';

export default function Projects() {
  const site = useSite();
  const live = () => site.projects();
  const useLive = () => live() && (live()?.length ?? 0) > 0;

  return (
    <section id="projects" class={styles.section} aria-labelledby="projects-title">
      <div class="container">
        <SectionHeading id="projects-title" eyebrow="Work" title="Selected projects" />
        <Show
          when={useLive()}
          fallback={
            <ul class={styles.grid}>
              <For each={fallback.projects}>
                {(project) => (
                  <li class={styles.card}>
                    <article>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <ul class={styles.tech} aria-label="Technologies used">
                        <For each={project.tech}>{(tech) => <li>{tech}</li>}</For>
                      </ul>
                    </article>
                  </li>
                )}
              </For>
            </ul>
          }
        >
          <ul class={styles.grid}>
            <For each={live() ?? []}>
              {(project) => (
                <li class={styles.card}>
                  <article>
                    <h3>{project.title}</h3>
                    <Show when={project.tagline}>
                      <p>{project.tagline}</p>
                    </Show>
                    <p>{project.description}</p>
                    <Show when={(project.bullets ?? []).length > 0}>
                      <ul aria-label="Highlights">
                        <For each={project.bullets}>{(bullet) => <li>{bullet}</li>}</For>
                      </ul>
                    </Show>
                    <Show when={(project.technologies ?? []).length > 0}>
                      <ul class={styles.tech} aria-label="Technologies used">
                        <For each={project.technologies}>{(tech) => <li>{tech}</li>}</For>
                      </ul>
                    </Show>
                    <Show when={project.repo_url || project.live_url}>
                      <p>
                        <Show when={project.repo_url}>
                          <a href={project.repo_url} target="_blank" rel="noreferrer">
                            Code
                          </a>
                        </Show>
                        <Show when={project.repo_url && project.live_url}> · </Show>
                        <Show when={project.live_url}>
                          <a href={project.live_url} target="_blank" rel="noreferrer">
                            Live
                          </a>
                        </Show>
                      </p>
                    </Show>
                  </article>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </section>
  );
}
