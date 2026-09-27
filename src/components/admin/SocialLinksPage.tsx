import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  SOCIAL_PLATFORMS,
  buildReplacePayload,
  emptyRow,
  socialLinksErrorText,
  toRows,
  validateSocialLinksRows,
} from "../../services/social-links";
import type { SocialLinkRow } from "../../services/social-links";
import styles from "./SocialLinksPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

export default function SocialLinksPage() {
  const auth = useAuth();

  const [rows, setRows] = createSignal<SocialLinkRow[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const res = await auth.authFetch<{ social_links: { id: string; platform: string; url: string }[] }>(
        "/api/public/social-links",
      );
      const loaded = toRows(res.social_links);
      setRows(loaded.length > 0 ? loaded : [emptyRow()]);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(socialLinksErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function addRow(): void {
    if (rows().length >= 4) return;
    setRows((prev) => [...prev, emptyRow()]);
    setNotice(null);
  }

  function removeRow(key: number): void {
    setRows((prev) => prev.filter((row) => row.key !== key));
    setNotice(null);
  }

  function setRowField(key: number, field: "platform" | "url", value: string): void {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = rows();
    const invalid = validateSocialLinksRows(current);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const res = await auth.authFetch<{ social_links: { id: string; platform: string; url: string }[] }>(
        "/api/admin/social-links",
        { method: "PUT", body: buildReplacePayload(current) },
      );
      const loaded = toRows(res.social_links);
      setRows(loaded.length > 0 ? loaded : [emptyRow()]);
      setNotice("Social links saved. The whole set was replaced.");
    } catch (err) {
      const { code, message } = describeError(err);
      setFormError(socialLinksErrorText(code, message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Social Links</h1>
      <p class={styles.sub}>
        One transactional set (max 4). Saving replaces everything — a platform you remove here is deleted.
      </p>

      <Show when={error()}>
        <p class={styles.error} role="alert">
          {error()}
        </p>
      </Show>
      <Show when={notice()}>
        <p class={styles.success} role="status">
          {notice()}
        </p>
      </Show>

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading social links...</p>}>
        <form onSubmit={save}>
          <Show when={formError()}>
            <p class={styles.error} role="alert">
              {formError()}
            </p>
          </Show>
          <ul class={styles.list}>
            <For each={rows()}>
              {(row) => (
                <li class={styles.row}>
                  <select
                    aria-label="Platform"
                    value={row.platform}
                    onChange={(event) => setRowField(row.key, "platform", event.currentTarget.value)}
                    disabled={saving()}
                    required
                  >
                    <option value="" disabled>
                      Platform
                    </option>
                    <For each={SOCIAL_PLATFORMS}>{(platform) => <option value={platform}>{platform}</option>}</For>
                  </select>
                  <input
                    type="url"
                    aria-label="URL"
                    maxlength={500}
                    value={row.url}
                    onInput={(event) => setRowField(row.key, "url", event.currentTarget.value)}
                    disabled={saving()}
                    placeholder="https://"
                    required
                  />
                  <button
                    class={styles.link}
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={saving() || rows().length <= 1}
                    title="Remove this row (deleted on save)"
                  >
                    Remove
                  </button>
                </li>
              )}
            </For>
          </ul>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : "Save all links"}
            </button>
            <button class={styles.link} type="button" onClick={addRow} disabled={saving() || rows().length >= 4}>
              Add link
            </button>
            <button class={styles.link} type="button" onClick={() => void refresh()} disabled={saving()}>
              Reload
            </button>
          </div>
        </form>
      </Show>
    </>
  );
}
