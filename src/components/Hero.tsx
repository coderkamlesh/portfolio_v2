import { profile as fallback } from '../data/profile';
import { useSite } from '../stores/site';
import styles from './Hero.module.css';

export default function Hero() {
  const site = useSite();
  const live = () => site.profile();
  const name = () => live()?.full_name || fallback.name;
  const role = () => live()?.title || fallback.role;
  const location = () => live()?.location || fallback.location;
  const summary = () => live()?.summary || live()?.tagline || fallback.summary;

  return (
    <section id="top" class={styles.hero} aria-labelledby="hero-title">
      <div class="container">
        <p class={styles.kicker}>{location()}</p>
        <h1 id="hero-title">
          {name()} — {role()}
        </h1>
        <p class={styles.summary}>{summary()}</p>
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
