import { createEffect, createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../../stores/auth";
import { errorCopy } from "./authErrors";
import ForgotPassword from "./ForgotPassword";
import styles from "./AdminLogin.module.css";

export default function AdminLogin() {
  const auth = useAuth();
  const [identifier, setIdentifier] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [cooldown, setCooldown] = createSignal(0);

  const isResetting = () => auth.status() === "reset_requested" || auth.status() === "reset_otp";

  createEffect(() => {
    const challenge = auth.challenge();
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

  async function handleLogin(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    auth.clearError();
    try {
      await auth.login(identifier().trim(), password());
      setPassword("");
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  async function handleVerify(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    auth.clearError();
    try {
      await auth.verifyOtp(otp().trim());
      setOtp("");
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  async function handleResend(): Promise<void> {
    auth.clearError();
    try {
      await auth.resendOtp();
    } catch {
      // Error already stored in auth.lastError.
    }
  }

  return (
    <div class={styles.page}>
      <div class={styles.card}>
        <Show
          when={auth.status() === "authenticated"}
          fallback={
            <Show
              when={isResetting()}
              fallback={
                <>
                  <h1>Admin login</h1>
                  <p class={styles.sub}>Password first, then the email code.</p>

                  <Show when={auth.lastError()}>
                    <p class={styles.error} role="alert">
                      {errorCopy(auth.lastError()?.code ?? "")} {auth.lastError()?.message}
                    </p>
                  </Show>

                  <Show
                    when={auth.status() === "login_otp" && auth.challenge()}
                    fallback={
                      <form onSubmit={handleLogin}>
                        <div class={styles.field}>
                          <label for="admin-identifier">Username or email</label>
                          <input
                            id="admin-identifier"
                            type="text"
                            autocomplete="username"
                            value={identifier()}
                            onInput={(event) => setIdentifier(event.currentTarget.value)}
                            disabled={auth.isBusy()}
                            required
                          />
                        </div>
                        <div class={styles.field}>
                          <label for="admin-password">Password</label>
                          <input
                            id="admin-password"
                            type="password"
                            autocomplete="current-password"
                            value={password()}
                            onInput={(event) => setPassword(event.currentTarget.value)}
                            disabled={auth.isBusy()}
                            required
                          />
                        </div>
                        <div class={styles.actions}>
                          <button class={styles.primary} type="submit" disabled={auth.isBusy()}>
                            {auth.isBusy() ? "Signing in..." : "Continue"}
                          </button>
                          <button
                            class={styles.link}
                            type="button"
                            onClick={auth.startPasswordReset}
                            disabled={auth.isBusy()}
                          >
                            Forgot password?
                          </button>
                        </div>
                      </form>
                    }
                  >
                    <p class={styles.masked}>Code sent to {auth.challenge()?.email}.</p>
                    <form onSubmit={handleVerify}>
                      <div class={styles.field}>
                        <label for="admin-otp">Email code</label>
                        <input
                          id="admin-otp"
                          type="text"
                          inputmode="numeric"
                          autocomplete="one-time-code"
                          maxlength={auth.challenge()?.code_length ?? 6}
                          value={otp()}
                          onInput={(event) => setOtp(event.currentTarget.value.replace(/\D/g, ""))}
                          disabled={auth.isBusy()}
                          required
                        />
                      </div>
                      <div class={styles.actions}>
                        <button class={styles.primary} type="submit" disabled={auth.isBusy()}>
                          {auth.isBusy() ? "Verifying..." : "Verify"}
                        </button>
                        <button
                          class={styles.link}
                          type="button"
                          onClick={handleResend}
                          disabled={auth.isBusy() || cooldown() > 0}
                        >
                          {cooldown() > 0 ? `Resend in ${cooldown()}s` : "Resend code"}
                        </button>
                      </div>
                      <div class={styles.actions}>
                        <button class={styles.link} type="button" onClick={auth.backToLogin}>
                          Start over
                        </button>
                      </div>
                    </form>
                  </Show>
                </>
              }
            >
              <ForgotPassword />
            </Show>
          }
        >
          <h1>Signed in</h1>
          <p class={styles.sub}>Opening the dashboard...</p>
          <div class={styles.actions}>
            <A class={styles.primary} href="/admin">
              Go to dashboard
            </A>
          </div>
        </Show>
      </div>
    </div>
  );
}
