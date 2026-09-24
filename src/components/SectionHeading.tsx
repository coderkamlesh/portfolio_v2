import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
}

export default function SectionHeading(props: SectionHeadingProps) {
  return (
    <div class={styles.wrap}>
      <p class={styles.eyebrow}>{props.eyebrow}</p>
      <h2 id={props.id} class={styles.title}>
        {props.title}
      </h2>
    </div>
  );
}
