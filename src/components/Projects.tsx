import { For } from 'solid-js';
import { profile } from '../data/profile';
import SectionHeading from './SectionHeading';
import styles from './Projects.module.css';

export default function Projects() {
  return (
    <section id="projects" class={styles.section} aria-labelledby="projects-title">
      <div class="container">
        <SectionHeading id="projects-title" eyebrow="Work" title="Selected projects" />
        <ul class={styles.grid}>
          <For each={profile.projects}>
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
      </div>
    </section>
  );
}
