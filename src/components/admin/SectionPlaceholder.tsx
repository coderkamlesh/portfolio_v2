import { A } from "@solidjs/router";

export default function SectionPlaceholder(props: { title: string }) {
  return (
    <>
      <h1>{props.title}</h1>
      <p>This section is not wired to the API yet.</p>
      <p>
        <A href="/admin">Back to dashboard</A>
      </p>
    </>
  );
}
