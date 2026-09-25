import { createEffect, createSignal, Show } from "solid-js";
import { useAuth } from "../../stores/auth";
import { errorCopy } from "./authErrors";
import styles from "./AdminLogin.module.css";

export default function ForgotPassword() {
  const auth = useAuth();
  const [email, setEmail] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [notice, setNotice] = createSignal<string | null>(null);
  const [cooldown, setCooldown] = createSignal(0);

  const inOtpStep = () => auth.status() === "reset_otp";

  createEffect(() => {
    const challenge = auth.resetChallenge();
    if (challenge) setCooldown(challenge.resend_after);
  });

  createEffect(() => {
    if (cooldown() <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  });

  createEffect(() => {
    const retryAfter = auth.lastError()?.retryAfter;
    if (retryAfter && retryAfter > 0) setCooldown(retryAfter);
  });

  async function handleForgot(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    setNotice(null);
    try {
      const message = await auth.forgotPassword(email().trim());
      setNotice(message);
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  async function handleReset(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    setNotice(null);
    try {
      await auth.resetPassword(otp().trim(), newPassword());
      setOtp("");
      setNewPassword("");
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  return (
    <>
      <h1>Reset password</h1>
      <p class={styles.sub}>We send a code to the admin email address.</p>

      <Show when={auth.lastError()}>
        <p class={styles.error} role="alert">
          {errorCopy(auth.lastError()?.code ?? "")} {auth.lastError()?.message}
        </p>
      </Show>

      <Show
        when={inOtpStep()}
        fallback={
          <form onSubmit={handleForgot}>
            <div class={styles.field}>
              <label for="reset-email">Admin email</label>
              <input
                id="reset-email"
                type="email"
                autocomplete="email"
                value={email()}
                onInput={(event) => setEmail(event.currentTarget.value)}
                disabled={auth.isBusy()}
                required
              />
            </div>
            <div class={styles.actions}>
              <button class={styles.primary} type="submit" disabled={auth.isBusy()}>
                {auth.isBusy() ? "Sending..." : "Send code"}
              </button>
              <button class={styles.link} type="button" onClick={auth.backToLogin}>
                Back to login
              </button>
            </div>
          </form>
        }
      >
        <Show when={notice()}>
          <p class={styles.masked}>{notice()}</p>
        </Show>
        <p class={styles.masked}>Code sent to {auth.resetChallenge()?.email}.</p>
        <form onSubmit={handleReset}>
          <div class={styles.field}>
            <label for="reset-otp">Email code</label>
            <input
              id="reset-otp"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength={auth.resetChallenge()?.code_length ?? 6}
              value={otp()}
              onInput={(event) => setOtp(event.currentTarget.value.replace(/\D/g, ""))}
              disabled={auth.isBusy()}
              required
            />
          </div>
          <div class={styles.field}>
            <label for="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              autocomplete="new-password"
              minlength={12}
              maxlength={256}
              value={newPassword()}
              onInput={(event) => setNewPassword(event.currentTarget.value)}
              disabled={auth.isBusy()}
              required
            />
          </div>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={auth.isBusy()}>
              {auth.isBusy() ? "Saving..." : "Set new password"}
            </button>
            <button
              class={styles.link}
              type="button"
              onClick={handleForgot}
              disabled={auth.isBusy() || cooldown() > 0}
            >
              {cooldown() > 0 ? `Resend in ${cooldown()}s` : "Resend code"}
            </button>
          </div>
          <div class={styles.actions}>
            <button class={styles.link} type="button" onClick={auth.backToLogin}>
              Back to login
            </button>
          </div>
        </form>
      </Show>
    </>
  );
}
