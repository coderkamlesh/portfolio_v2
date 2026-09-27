import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  buildEducationPayload,
  educationErrorText,
  emptyEducationForm,
  maxYear,
  parseOrder,
  parseYear,
  toEducationForm,
  validateEducationForm,
} from "../../services/education";
import type { AdminEducation, EducationForm } from "../../services/education";
import styles from "./EducationPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

function setField(
  setForm: (fn: (prev: EducationForm) => EducationForm) => void,
  key: keyof EducationForm,
  value: string,
): void {
  setForm((prev) => ({ ...prev, [key]: value }));
}

function yearRange(entry: AdminEducation): string {
  const start = entry.start_year !== undefined ? String(entry.start_year) : "—";
  return `${start} → ${entry.end_year !== undefined ? String(entry.end_year) : "Present"}`;
}

export default function EducationPage() {
  const auth = useAuth();

  const [entries, setEntries] = createSignal<AdminEducation[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal<EducationForm>({ ...emptyEducationForm });
  const [formError, setFormError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const res = await auth.authFetch<{ education: AdminEducation[] }>("/api/admin/education");
      setEntries(res.education);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(educationErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function resetForm(): void {
    setEditingId(null);
    setForm({ ...emptyEducationForm });
    setFormError(null);
  }

  function startEdit(entry: AdminEducation): void {
    setEditingId(entry.id);
    setForm(toEducationForm(entry));
    setFormError(null);
    setNotice(null);
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = form();
    const invalid = validateEducationForm(current);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    const start = parseYear(current.start_year, "Start year", true);
    if (!start.ok || start.value === null) {
      setFormError(start.ok ? "Start year is required." : start.message);
      return;
    }
    const end = parseYear(current.end_year, "End year", false);
    if (!end.ok) {
      setFormError(end.message);
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
      const body = buildEducationPayload(current, start.value, end.value, parsed.value);
      if (id) {
        await auth.authFetch(`/api/admin/education/${id}`, { method: "PUT", body });
        setNotice("Education updated.");
      } else {
        await auth.authFetch("/api/admin/education", { method: "POST", body });
        setNotice("Education created.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setFormError(educationErrorText(code, message));
      if (code === "education_not_found") {
        resetForm();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: AdminEducation): Promise<void> {
    if (!window.confirm(`Delete education at "${entry.institution}"?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/education/${entry.id}`, { method: "DELETE" });
      if (editingId() === entry.id) resetForm();
      setNotice("Education deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(educationErrorText(code, message));
      if (code === "education_not_found") await refresh();
    }
  }

  return (
    <>
      <h1>Education</h1>
      <p class={styles.sub}>Degrees and coursework. Server order is display_order; never re-sort client-side.</p>

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

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading education...</p>}>
        <Show when={entries().length > 0} fallback={<p class={styles.muted}>No education yet.</p>}>
          <ul class={styles.list}>
            <For each={entries()}>
              {(entry) => (
                <li class={styles.row}>
                  <span class={styles.orderBadge}>{entry.display_order}</span>
                  <span class={styles.rowMain}>
                    <strong>
                      {entry.degree} @ {entry.institution}
                    </strong>
                    <span class={styles.meta}>{yearRange(entry)}</span>
                  </span>
                  <button class={styles.link} type="button" onClick={() => startEdit(entry)}>
                    Edit
                  </button>
                  <button class={styles.link} type="button" onClick={() => void remove(entry)}>
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
          <h2 class={styles.formTitle}>{editingId() ? "Edit education" : "New education"}</h2>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label for="edu-institution">Institution *</label>
              <input
                id="edu-institution"
                type="text"
                maxlength={200}
                value={form().institution}
                onInput={(event) => setField(setForm, "institution", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="edu-degree">Degree *</label>
              <input
                id="edu-degree"
                type="text"
                maxlength={150}
                value={form().degree}
                onInput={(event) => setField(setForm, "degree", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="edu-field">Field of study</label>
              <input
                id="edu-field"
                type="text"
                maxlength={150}
                value={form().field_of_study}
                onInput={(event) => setField(setForm, "field_of_study", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="edu-grade">Grade</label>
              <input
                id="edu-grade"
                type="text"
                maxlength={50}
                value={form().grade}
                onInput={(event) => setField(setForm, "grade", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="edu-start">Start year *</label>
              <input
                id="edu-start"
                type="number"
                min="1950"
                max={maxYear()}
                step="1"
                value={form().start_year}
                onInput={(event) => setField(setForm, "start_year", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="edu-end">End year (empty = present)</label>
              <input
                id="edu-end"
                type="number"
                min="1950"
                max={maxYear()}
                step="1"
                value={form().end_year}
                onInput={(event) => setField(setForm, "end_year", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="edu-gpa">GPA</label>
              <input
                id="edu-gpa"
                type="text"
                maxlength={20}
                value={form().gpa}
                onInput={(event) => setField(setForm, "gpa", event.currentTarget.value)}
                disabled={saving()}
                placeholder="8.5/10"
              />
            </div>
            <div class={styles.field}>
              <label for="edu-order">Display order (optional)</label>
              <input
                id="edu-order"
                type="number"
                min="0"
                step="1"
                value={form().display_order}
                onInput={(event) => setField(setForm, "display_order", event.currentTarget.value)}
                disabled={saving()}
                placeholder="0"
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="edu-honors">Honors</label>
              <input
                id="edu-honors"
                type="text"
                maxlength={200}
                value={form().honors}
                onInput={(event) => setField(setForm, "honors", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="edu-coursework">Coursework (one per line, max 6 × 100 chars)</label>
              <textarea
                id="edu-coursework"
                value={form().coursework}
                onInput={(event) => setField(setForm, "coursework", event.currentTarget.value)}
                disabled={saving()}
                placeholder={"Data Structures\nOperating Systems"}
              />
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : editingId() ? "Save education" : "Create education"}
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
