import { profile } from '../data/profile';
import styles from './Nav.module.css';

export default function Nav() {
  return (
    <header class={styles.header}>
      <nav class={`${styles.nav} container`} aria-label="Primary">
        <a class={styles.brand} href="#top">
          {profile.name}
        </a>
        <ul class={styles.links}>
          {profile.nav.map((item) => (
            <li>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
