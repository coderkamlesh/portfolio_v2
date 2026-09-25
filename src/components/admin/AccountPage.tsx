import { createSignal, onMount, Show } from "solid-js";
import { A } from "@solidjs/router";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import type { TwoFAStatus } from "../../services/auth";
import { errorCopy } from "./authErrors";
import ChangePassword from "./ChangePassword";
import styles from "./AdminLogin.module.css";

export default function AccountPage() {
  const auth = useAuth();
  const [twoFA, setTwoFA] = createSignal<TwoFAStatus | null>(null);
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [confirmError, setConfirmError] = createSignal<string | null>(null);
  const [showChange, setShowChange] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  async function loadTwoFA(): Promise<void> {
    try {
      const status = await auth.authFetch<TwoFAStatus>("/api/auth/2fa");
      setTwoFA(status);
    } catch {
      // Error already surfaced through logout/refresh handling.
    }
  }

  onMount(() => {
    void loadTwoFA();
  });

  async function handleConfirm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    setConfirmError(null);
    setBusy(true);
    try {
      const status = await auth.authFetch<TwoFAStatus>("/api/auth/2fa/email/enable", {
        method: "POST",
        body: { password: confirmPassword() },
      });
      setTwoFA(status);
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof ApiError) {
        setConfirmError(`${errorCopy(error.code)} ${error.message}`);
      } else {
        setConfirmError("Network request failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout(allDevices: boolean): Promise<void> {
    await auth.logout(allDevices);
  }

  return (
    <>
      <h1>Account</h1>
      <p class={styles.sub}>
        {auth.admin()?.username} ({auth.admin()?.email})
      </p>

      <div class={styles.meta}>
        <Show when={twoFA()} fallback={<p>Checking two-factor status...</p>}>
          <p>
            Email 2FA: {twoFA()?.enabled ? "on" : "off"} ({twoFA()?.email})
          </p>
        </Show>
      </div>

      <form onSubmit={handleConfirm}>
        <Show when={confirmError()}>
          <p class={styles.error} role="alert">
            {confirmError()}
          </p>
        </Show>
        <div class={styles.field}>
          <label for="admin-confirm-password">Confirm password (repair 2FA)</label>
          <input
            id="admin-confirm-password"
            type="password"
            autocomplete="current-password"
            value={confirmPassword()}
            onInput={(event) => setConfirmPassword(event.currentTarget.value)}
            disabled={busy()}
          />
        </div>
        <div class={styles.actions}>
          <button class={styles.primary} type="submit" disabled={busy() || !confirmPassword()}>
            {busy() ? "Confirming..." : "Confirm 2FA"}
          </button>
        </div>
      </form>

      <div class={styles.actions}>
        <button class={styles.link} type="button" onClick={() => setShowChange((value) => !value)}>
          {showChange() ? "Hide password change" : "Change password"}
        </button>
      </div>
      <Show when={showChange()}>
        <ChangePassword />
      </Show>

      <div class={styles.actions}>
        <button class={styles.primary} type="button" onClick={() => void handleLogout(false)}>
          Log out
        </button>
        <button class={styles.link} type="button" onClick={() => void handleLogout(true)}>
          Log out everywhere
        </button>
        <A class={styles.link} href="/admin">
          Back to dashboard
        </A>
      </div>
    </>
  );
}
