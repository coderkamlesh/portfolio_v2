import { For, Show } from 'solid-js';
import { profile as fallback } from '../data/profile';
import { useSite } from '../stores/site';
import SectionHeading from './SectionHeading';
import styles from './Contact.module.css';

export default function Contact() {
  const site = useSite();
  const email = () => site.profile()?.email || fallback.email;
  const links = () => site.socialLinks();

  return (
    <section id="contact" class={styles.section} aria-labelledby="contact-title">
      <div class="container">
        <SectionHeading id="contact-title" eyebrow="Contact" title="Get in touch" />
        <p class={styles.text}>
          Have a role, a project, or just a good systems debate in mind? My inbox is
          open.
        </p>
        <a class={styles.button} href={`mailto:${email()}`}>
          Say hello
        </a>
        <Show when={links() && (links()?.length ?? 0) > 0}>
          <p class={styles.text}>
            <For each={links() ?? []}>
              {(link, index) => (
                <>
                  <Show when={index() > 0}> · </Show>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.platform}
                  </a>
                </>
              )}
            </For>
          </p>
        </Show>
      </div>
    </section>
  );
}
