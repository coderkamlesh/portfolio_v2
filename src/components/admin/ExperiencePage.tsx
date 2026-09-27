import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  buildExperiencePayload,
  emptyExperienceForm,
  experienceErrorText,
  parseOrder,
  toExperienceForm,
  validateExperienceForm,
} from "../../services/experience";
import type { AdminExperience, ExperienceForm } from "../../services/experience";
import styles from "./ExperiencePage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

function setField(
  setForm: (fn: (prev: ExperienceForm) => ExperienceForm) => void,
  key: keyof ExperienceForm,
  value: string | boolean,
): void {
  setForm((prev) => ({ ...prev, [key]: value }));
}

function dateRange(experience: AdminExperience): string {
  const start = experience.start_date || "—";
  if (experience.is_current) return `${start} → present`;
  return `${start} → ${experience.end_date || "—"}`;
}

export default function ExperiencePage() {
  const auth = useAuth();

  const [experiences, setExperiences] = createSignal<AdminExperience[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal<ExperienceForm>({ ...emptyExperienceForm });
  const [formError, setFormError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const res = await auth.authFetch<{ experiences: AdminExperience[] }>("/api/admin/experience");
      setExperiences(res.experiences);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(experienceErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function resetForm(): void {
    setEditingId(null);
    setForm({ ...emptyExperienceForm });
    setFormError(null);
  }

  function startEdit(experience: AdminExperience): void {
    setEditingId(experience.id);
    setForm(toExperienceForm(experience));
    setFormError(null);
    setNotice(null);
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = form();
    const invalid = validateExperienceForm(current);
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
      const body = buildExperiencePayload(current, parsed.value);
      if (id) {
        await auth.authFetch(`/api/admin/experience/${id}`, { method: "PUT", body });
        setNotice("Experience updated.");
      } else {
        await auth.authFetch("/api/admin/experience", { method: "POST", body });
        setNotice("Experience created.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setFormError(experienceErrorText(code, message));
      if (code === "experience_not_found") {
        resetForm();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(experience: AdminExperience): Promise<void> {
    if (!window.confirm(`Delete experience at "${experience.company_name}" and its bullets?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/experience/${experience.id}`, { method: "DELETE" });
      if (editingId() === experience.id) resetForm();
      setNotice("Experience deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(experienceErrorText(code, message));
      if (code === "experience_not_found") await refresh();
    }
  }

  return (
    <>
      <h1>Experience</h1>
      <p class={styles.sub}>Work timeline. Server order is reverse-chronological; never re-sort client-side.</p>

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

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading experience...</p>}>
        <Show when={experiences().length > 0} fallback={<p class={styles.muted}>No experience yet.</p>}>
          <ul class={styles.list}>
            <For each={experiences()}>
              {(experience) => (
                <li class={styles.row}>
                  <span class={styles.orderBadge}>{experience.display_order}</span>
                  <span class={styles.rowMain}>
                    <strong>
                      {experience.role || "Role"} @ {experience.company_name}
                    </strong>
                    <Show when={experience.is_current}>
                      <span class={styles.current}>current</span>
                    </Show>
                    <span class={styles.meta}>{dateRange(experience)}</span>
                  </span>
                  <button class={styles.link} type="button" onClick={() => startEdit(experience)}>
                    Edit
                  </button>
                  <button class={styles.link} type="button" onClick={() => void remove(experience)}>
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
          <h2 class={styles.formTitle}>{editingId() ? "Edit experience" : "New experience"}</h2>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label for="exp-company">Company name *</label>
              <input
                id="exp-company"
                type="text"
                value={form().company_name}
                onInput={(event) => setField(setForm, "company_name", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="exp-role">Role</label>
              <input
                id="exp-role"
                type="text"
                value={form().role}
                onInput={(event) => setField(setForm, "role", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="exp-type">Employment type</label>
              <select
                id="exp-type"
                value={form().employment_type}
                onChange={(event) => setField(setForm, "employment_type", event.currentTarget.value)}
                disabled={saving()}
              >
                <option value="">—</option>
                <option value="FULL_TIME">Full time</option>
                <option value="PART_TIME">Part time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div class={styles.field}>
              <label for="exp-location">Location</label>
              <input
                id="exp-location"
                type="text"
                value={form().location}
                onInput={(event) => setField(setForm, "location", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="exp-logo">Company logo URL</label>
              <input
                id="exp-logo"
                type="url"
                maxlength={500}
                value={form().company_logo_url}
                onInput={(event) => setField(setForm, "company_logo_url", event.currentTarget.value)}
                disabled={saving()}
                placeholder="https://"
              />
            </div>
            <div class={styles.field}>
              <label for="exp-start">Start date</label>
              <input
                id="exp-start"
                type="date"
                value={form().start_date}
                onInput={(event) => setField(setForm, "start_date", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="exp-end">End date</label>
              <input
                id="exp-end"
                type="date"
                value={form().end_date}
                onInput={(event) => setField(setForm, "end_date", event.currentTarget.value)}
                disabled={saving() || form().is_current}
              />
            </div>
            <div class={`${styles.field} ${styles.check}`}>
              <label for="exp-current">
                <input
                  id="exp-current"
                  type="checkbox"
                  checked={form().is_current}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setForm((prev) => ({ ...prev, is_current: checked, end_date: checked ? "" : prev.end_date }));
                  }}
                  disabled={saving()}
                />
                Currently working here
              </label>
            </div>
            <div class={styles.field}>
              <label for="exp-order">Display order (optional)</label>
              <input
                id="exp-order"
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
              <label for="exp-tech">Technologies (one per line, max 20)</label>
              <textarea
                id="exp-tech"
                value={form().technologies}
                onInput={(event) => setField(setForm, "technologies", event.currentTarget.value)}
                disabled={saving()}
                placeholder={"Go\nPostgreSQL"}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="exp-bullets">Bullets (one per line, max 10 × 500 chars)</label>
              <textarea
                id="exp-bullets"
                value={form().bullets}
                onInput={(event) => setField(setForm, "bullets", event.currentTarget.value)}
                disabled={saving()}
                placeholder="Cut p99 latency by 42% with batched reads."
              />
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : editingId() ? "Save experience" : "Create experience"}
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
