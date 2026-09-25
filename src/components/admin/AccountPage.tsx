import { createSignal, onMount, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../../stores/auth";
import type { TwoFAStatus } from "../../services/auth";
import ChangePassword from "./ChangePassword";
import styles from "./AdminLogin.module.css";

export default function AccountPage() {
  const auth = useAuth();
  const [twoFA, setTwoFA] = createSignal<TwoFAStatus | null>(null);
  const [showChange, setShowChange] = createSignal(false);

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
            Email 2FA is mandatory and always on. Codes are sent to {twoFA()?.email}.
          </p>
        </Show>
      </div>

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
