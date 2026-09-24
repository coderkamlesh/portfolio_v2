import { profile } from '../data/profile';
import SectionHeading from './SectionHeading';
import styles from './Contact.module.css';

export default function Contact() {
  return (
    <section id="contact" class={styles.section} aria-labelledby="contact-title">
      <div class="container">
        <SectionHeading id="contact-title" eyebrow="Contact" title="Get in touch" />
        <p class={styles.text}>
          Have a role, a project, or just a good systems debate in mind? My inbox is
          open.
        </p>
        <a class={styles.button} href={`mailto:${profile.email}`}>
          Say hello
        </a>
      </div>
    </section>
  );
}
