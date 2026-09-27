import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  buildProjectPayload,
  emptyProjectForm,
  parseOrder,
  projectsErrorText,
  toProjectForm,
  validateProjectForm,
} from "../../services/projects";
import type { AdminProject, ProjectForm } from "../../services/projects";
import styles from "./ProjectsPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

function setField(setForm: (fn: (prev: ProjectForm) => ProjectForm) => void, key: keyof ProjectForm, value: string | boolean): void {
  setForm((prev) => ({ ...prev, [key]: value }));
}

export default function ProjectsPage() {
  const auth = useAuth();

  const [projects, setProjects] = createSignal<AdminProject[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal<ProjectForm>({ ...emptyProjectForm });
  const [formError, setFormError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const res = await auth.authFetch<{ projects: AdminProject[] }>("/api/admin/projects");
      setProjects(res.projects);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(projectsErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function resetForm(): void {
    setEditingId(null);
    setForm({ ...emptyProjectForm });
    setFormError(null);
  }

  function startEdit(project: AdminProject): void {
    setEditingId(project.id);
    setForm(toProjectForm(project));
    setFormError(null);
    setNotice(null);
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = form();
    const invalid = validateProjectForm(current);
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
      const body = buildProjectPayload(current, parsed.value);
      if (id) {
        await auth.authFetch(`/api/admin/projects/${id}`, { method: "PUT", body });
        setNotice("Project updated.");
      } else {
        await auth.authFetch("/api/admin/projects", { method: "POST", body });
        setNotice("Project created.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setFormError(projectsErrorText(code, message));
      if (code === "project_not_found") {
        resetForm();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(project: AdminProject): Promise<void> {
    if (!window.confirm(`Delete project "${project.title}" and its bullets?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (editingId() === project.id) resetForm();
      setNotice("Project deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(projectsErrorText(code, message));
      if (code === "project_not_found") await refresh();
    }
  }

  return (
    <>
      <h1>Projects</h1>
      <p class={styles.sub}>Showcase entries. Server order is featured-first; never re-sort client-side.</p>

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

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading projects...</p>}>
        <Show when={projects().length > 0} fallback={<p class={styles.muted}>No projects yet.</p>}>
          <ul class={styles.list}>
            <For each={projects()}>
              {(project) => (
                <li class={styles.row}>
                  <span class={styles.orderBadge}>{project.display_order}</span>
                  <span class={styles.rowMain}>
                    <strong>{project.title}</strong>
                    <Show when={project.is_featured}>
                      <span class={styles.featured}>featured</span>
                    </Show>
                    <Show when={project.project_type || project.status}>
                      <span class={styles.meta}>
                        {[project.project_type, project.status].filter(Boolean).join(" · ")}
                      </span>
                    </Show>
                  </span>
                  <button class={styles.link} type="button" onClick={() => startEdit(project)}>
                    Edit
                  </button>
                  <button class={styles.link} type="button" onClick={() => void remove(project)}>
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
          <h2 class={styles.formTitle}>{editingId() ? "Edit project" : "New project"}</h2>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label for="project-title">Title *</label>
              <input
                id="project-title"
                type="text"
                maxlength={150}
                value={form().title}
                onInput={(event) => setField(setForm, "title", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="project-role">Role</label>
              <input
                id="project-role"
                type="text"
                maxlength={150}
                value={form().role}
                onInput={(event) => setField(setForm, "role", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="project-tagline">Tagline</label>
              <input
                id="project-tagline"
                type="text"
                maxlength={200}
                value={form().tagline}
                onInput={(event) => setField(setForm, "tagline", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="project-description">Description *</label>
              <textarea
                id="project-description"
                maxlength={4000}
                value={form().description}
                onInput={(event) => setField(setForm, "description", event.currentTarget.value)}
                disabled={saving()}
                required
              />
            </div>
            <div class={styles.field}>
              <label for="project-type">Type</label>
              <select
                id="project-type"
                value={form().project_type}
                onChange={(event) => setField(setForm, "project_type", event.currentTarget.value)}
                disabled={saving()}
              >
                <option value="">—</option>
                <option value="PERSONAL">Personal</option>
                <option value="ACADEMIC">Academic</option>
                <option value="OPEN_SOURCE">Open source</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
            <div class={styles.field}>
              <label for="project-status">Status</label>
              <select
                id="project-status"
                value={form().status}
                onChange={(event) => setField(setForm, "status", event.currentTarget.value)}
                disabled={saving()}
              >
                <option value="">—</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In progress</option>
              </select>
            </div>
            <div class={styles.field}>
              <label for="project-start">Start date</label>
              <input
                id="project-start"
                type="date"
                value={form().start_date}
                onInput={(event) => setField(setForm, "start_date", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="project-end">End date</label>
              <input
                id="project-end"
                type="date"
                value={form().end_date}
                onInput={(event) => setField(setForm, "end_date", event.currentTarget.value)}
                disabled={saving()}
              />
            </div>
            <div class={styles.field}>
              <label for="project-repo">Repo URL</label>
              <input
                id="project-repo"
                type="url"
                maxlength={500}
                value={form().repo_url}
                onInput={(event) => setField(setForm, "repo_url", event.currentTarget.value)}
                disabled={saving()}
                placeholder="https://"
              />
            </div>
            <div class={styles.field}>
              <label for="project-live">Live URL</label>
              <input
                id="project-live"
                type="url"
                maxlength={500}
                value={form().live_url}
                onInput={(event) => setField(setForm, "live_url", event.currentTarget.value)}
                disabled={saving()}
                placeholder="https://"
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="project-image">Image URL</label>
              <input
                id="project-image"
                type="url"
                maxlength={500}
                value={form().image_url}
                onInput={(event) => setField(setForm, "image_url", event.currentTarget.value)}
                disabled={saving()}
                placeholder="https://"
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="project-tech">Technologies (one per line, max 30)</label>
              <textarea
                id="project-tech"
                value={form().technologies}
                onInput={(event) => setField(setForm, "technologies", event.currentTarget.value)}
                disabled={saving()}
                placeholder={"Go\nPostgreSQL"}
              />
            </div>
            <div class={`${styles.field} ${styles.full}`}>
              <label for="project-bullets">Bullets (one per line, max 20 × 300 chars)</label>
              <textarea
                id="project-bullets"
                value={form().bullets}
                onInput={(event) => setField(setForm, "bullets", event.currentTarget.value)}
                disabled={saving()}
                placeholder="Cut p95 latency by 38% with a Redis cache."
              />
            </div>
            <div class={styles.field}>
              <label for="project-order">Display order (optional)</label>
              <input
                id="project-order"
                type="number"
                min="0"
                step="1"
                value={form().display_order}
                onInput={(event) => setField(setForm, "display_order", event.currentTarget.value)}
                disabled={saving()}
                placeholder="0"
              />
            </div>
            <div class={`${styles.field} ${styles.check}`}>
              <label for="project-featured">
                <input
                  id="project-featured"
                  type="checkbox"
                  checked={form().is_featured}
                  onChange={(event) => setField(setForm, "is_featured", event.currentTarget.checked)}
                  disabled={saving()}
                />
                Featured (lists first)
              </label>
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : editingId() ? "Save project" : "Create project"}
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
