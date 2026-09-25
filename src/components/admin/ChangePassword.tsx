import { createSignal, Show } from "solid-js";
import { useAuth } from "../../stores/auth";
import { errorCopy } from "./authErrors";
import styles from "./AdminLogin.module.css";

export default function ChangePassword() {
  const auth = useAuth();
  const [current, setCurrent] = createSignal("");
  const [next, setNext] = createSignal("");
  const [saved, setSaved] = createSignal(false);

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    auth.clearError();
    setSaved(false);
    try {
      await auth.changePassword(current(), next());
      setCurrent("");
      setNext("");
      setSaved(true);
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Show when={auth.lastError()}>
        <p class={styles.error} role="alert">
          {errorCopy(auth.lastError()?.code ?? "")} {auth.lastError()?.message}
        </p>
      </Show>
      <Show when={saved()}>
        <p class={styles.success} role="status">
          Password changed. Other sessions were signed out.
        </p>
      </Show>
      <div class={styles.field}>
        <label for="change-current">Current password</label>
        <input
          id="change-current"
          type="password"
          autocomplete="current-password"
          value={current()}
          onInput={(event) => setCurrent(event.currentTarget.value)}
          disabled={auth.isBusy()}
          required
        />
      </div>
      <div class={styles.field}>
        <label for="change-new">New password</label>
        <input
          id="change-new"
          type="password"
          autocomplete="new-password"
          minlength={12}
          maxlength={256}
          value={next()}
          onInput={(event) => setNext(event.currentTarget.value)}
          disabled={auth.isBusy()}
          required
        />
      </div>
      <div class={styles.actions}>
        <button class={styles.primary} type="submit" disabled={auth.isBusy()}>
          {auth.isBusy() ? "Saving..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
