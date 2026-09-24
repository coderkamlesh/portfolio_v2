import { For } from 'solid-js';
import { profile } from '../data/profile';
import SectionHeading from './SectionHeading';
import styles from './About.module.css';

export default function About() {
  return (
    <section id="about" class={styles.section} aria-labelledby="about-title">
      <div class="container">
        <SectionHeading id="about-title" eyebrow="About" title="A little background" />
        <div class={styles.grid}>
          <div>
            <For each={profile.bio}>{(para) => <p>{para}</p>}</For>
          </div>
          <div>
            <h3 class={styles.subhead}>Working stack</h3>
            <ul class={styles.chips} aria-label="Technologies I work with">
              <For each={profile.stack}>{(tech) => <li>{tech}</li>}</For>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
