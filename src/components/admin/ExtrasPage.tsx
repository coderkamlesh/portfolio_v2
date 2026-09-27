import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  EXTRA_CATEGORIES,
  buildExtraPayload,
  emptyExtraForm,
  extrasErrorText,
  parseOrder,
  toExtraForm,
  validateExtraForm,
} from "../../services/extras";
import type { AdminExtra, ExtraForm } from "../../services/extras";
import styles from "./ExtrasPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

function setField(
  setForm: (fn: (prev: ExtraForm) => ExtraForm) => void,
  key: keyof ExtraForm,
  value: string,
): void {
  setForm((prev) => ({ ...prev, [key]: value }));
}

export default function ExtrasPage() {
  const auth = useAuth();

  const [extras, setExtras] = createSignal<AdminExtra[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal<ExtraForm>({ ...emptyExtraForm });
  const [formError, setFormError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const res = await auth.authFetch<{ extras: AdminExtra[] }>("/api/admin/extras");
      setExtras(res.extras);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(extrasErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function resetForm(): void {
    setEditingId(null);
    setForm({ ...emptyExtraForm });
    setFormError(null);
  }

  function startEdit(extra: AdminExtra): void {
    setEditingId(extra.id);
    setForm(toExtraForm(extra));
    setFormError(null);
    setNotice(null);
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = form();
    const invalid = validateExtraForm(current);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    const parsed = parseOrder(current.display_order);
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }
    setSaving(true);
    setFormError(null);
    setNotice(null);
    const id = editingId();
    try {
      const body = buildExtraPayload(current, parsed.value);
      if (id) {
        await auth.authFetch(`/api/admin/extras/${id}`, { method: "PUT", body });
        setNotice("Entry updated.");
      } else {
        await auth.authFetch("/api/admin/extras", { method: "POST", body });
        setNotice("Entry created.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setFormError(extrasErrorText(code, message));
      if (code === "extra_not_found") {
        resetForm();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(extra: AdminExtra): Promise<void> {
    if (!window.confirm(`Delete "${extra.title}"?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/extras/${extra.id}`, { method: "DELETE" });
      if (editingId() === extra.id) resetForm();
      setNotice("Entry deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(extrasErrorText(code, message));
      if (code === "extra_not_found") await refresh();
    }
  }

  return (
    <>
      <h1>Extras</h1>
      <p class={styles.sub}>Certifications, awards, talks. Server order is category, then display_order.</p>

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

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading extras...</p>}>
        <Show when={extras().length > 0} fallback={<p class={styles.muted}>No extras yet.</p>}>
          <ul class={styles.list}>
            <For each={extras()}>
              {(extra) => (
                <li class={styles.row}>
                  <span class={styles.catBadge}>{extra.category}</span>
                  <span class={styles.rowMain}>
                    <strong>{extra.title}</strong>
                    <Show when={extra.issuer}>
                      <span class={styles.meta}>{extra.issuer}</span>
                    </Show>
                    <Show when={extra.issued_date}>
                      <span class={styles.meta}>{extra.issued_date}</span>
                    </Show>
                  </span>
                  <button class={styles.link} type="button" onClick={() => startEdit(extra)}>
                    Edit
                  </button>
                  <button class={styles.link} type="button" onClick={() => void remove(extra)}>
                    Delete
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <form onSubmit={save}>
          <Show when={formError()}>
            <p class={styles.error} role="alert">
              {formError()}
            </p>
          </Show>
          <h2 class={styles.formTitle}>{editingId() ? "Edit entry" : "New entry"}</h2>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label for="extra-category">Category *</label>
              <select
                id="extra-category"
                value={form().category}
                onChange={(event) => setField(setForm, "category", event.currentTarget.value)}
                disabled={saving()}
              >
                <For each={EXTRA_CATEGORIES}>{(category) => <option value={category}>{category}</option>}</For>
              </select>
            </div>
            <div class={styles.field}>
              <label for="extra-date">Issued date (YYYY-MM or YYYY-MM-DD)</label>
              <input
                id="extra-date"
                type="text"
                inputmode="numeric"
                value={form().issued_date}
                onInput={(event) => setField(setForm, "issued_date", event.currentTarget.value)}
                disabled={saving()}
                placeholder="2024-03"
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="extra-title">Title *</label>
              <input
                id="extra-title"
                type="text"
                maxlength={200}
                value={form().title}
                onInput={(event) => setField(setForm, "title", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="extra-issuer">Issuer</label>
              <input
                id="extra-issuer"
                type="text"
                maxlength={200}
                value={form().issuer}
                onInput={(event) => setField(setForm, "issuer", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="extra-credential">Credential URL</label>
              <input
                id="extra-credential"
                type="url"
                maxlength={500}
                value={form().credential_url}
                onInput={(event) => setField(setForm, "credential_url", event.currentTarget.value)}
                disabled={saving()}
                placeholder="https://"
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="extra-description">Description</label>
              <textarea
                id="extra-description"
                maxlength={2000}
                value={form().description}
                onInput={(event) => setField(setForm, "description", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="extra-order">Display order (optional)</label>
              <input
                id="extra-order"
                type="number"
                min="0"
                step="1"
                value={form().display_order}
                onInput={(event) => setField(setForm, "display_order", event.currentTarget.value)}
                disabled={saving()}
                placeholder="0"
              />
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : editingId() ? "Save entry" : "Create entry"}
            </button>
            <Show when={editingId()}>
              <button class={styles.link} type="button" onClick={resetForm} disabled={saving()}>
                Cancel
              </button>
            </Show>
          </div>
        </form>
      </Show>
    </>
  );
}
