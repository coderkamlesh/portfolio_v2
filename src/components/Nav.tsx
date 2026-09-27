import { For } from 'solid-js';
import { profile as fallback } from '../data/profile';
import { useSite } from '../stores/site';
import styles from './Nav.module.css';

const links = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Extras', href: '#extras' },
  { label: 'Contact', href: '#contact' },
];

export default function Nav() {
  const site = useSite();
  const brand = () => site.profile()?.full_name || fallback.name;

  return (
    <header class={styles.header}>
      <nav class={`${styles.nav} container`} aria-label="Primary">
        <a class={styles.brand} href="#top">
          {brand()}
        </a>
        <ul class={styles.links}>
          <For each={links}>
            {(item) => (
              <li>
                <a href={item.href}>{item.label}</a>
              </li>
            )}
          </For>
        </ul>
      </nav>
    </header>
  );
}
