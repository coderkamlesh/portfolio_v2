import { profile } from '../data/profile';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section id="top" class={styles.hero} aria-labelledby="hero-title">
      <div class="container">
        <p class={styles.kicker}>{profile.location}</p>
        <h1 id="hero-title">
          {profile.name} — {profile.role}
        </h1>
        <p class={styles.summary}>{profile.summary}</p>
        <div class={styles.actions}>
          <a class={styles.primary} href="#projects">
            View projects
          </a>
          <a class={styles.secondary} href="#contact">
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
}
