import { createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import { emptyProfileForm, toForm } from "../../services/profile";
import type { AdminProfile, UpdateProfileRequest } from "../../services/profile";
import { errorCopy } from "./authErrors";
import form from "./AdminLogin.module.css";
import styles from "./ProfilePage.module.css";

interface FieldDef {
  key: keyof UpdateProfileRequest;
  label: string;
  type: string;
  required?: boolean;
  textarea?: boolean;
  full?: boolean;
  placeholder?: string;
}

const fields: FieldDef[] = [
  { key: "full_name", label: "Full name", type: "text", required: true },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "location", label: "Location", type: "text" },
  { key: "experience_level", label: "Experience level", type: "text", placeholder: "senior" },
  { key: "tagline", label: "Tagline", type: "text", full: true },
  { key: "summary", label: "Summary", type: "text", textarea: true, full: true },
  { key: "career_gap_note", label: "Career gap note", type: "text", textarea: true, full: true },
  { key: "avatar_url", label: "Avatar URL", type: "url" },
  { key: "resume_file_url", label: "Resume file URL", type: "url" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { key: "github_url", label: "GitHub URL", type: "url" },
  { key: "portfolio_url", label: "Portfolio URL", type: "url" },
  { key: "twitter_url", label: "Twitter URL", type: "url" },
];

export default function ProfilePage() {
  const auth = useAuth();
  const [formData, setFormData] = createStore<UpdateProfileRequest>({ ...emptyProfileForm });
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [setupMode, setSetupMode] = createSignal(false);
  const [updatedAt, setUpdatedAt] = createSignal<string | null>(null);
  const [saved, setSaved] = createSignal(false);
  const [error, setError] = createSignal<{ code: string; message: string } | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await auth.authFetch<AdminProfile>("/api/admin/profile");
      setFormData(toForm(data));
      setUpdatedAt(data.updated_at);
      setSetupMode(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "profile_not_found") {
        setFormData({ ...emptyProfileForm });
        setSetupMode(true);
      } else if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message });
      } else {
        setError({ code: "network_error", message: "Network request failed." });
      }
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void load();
  });

  async function handleSave(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await auth.authFetch<AdminProfile>("/api/admin/profile", {
        method: "PUT",
        body: { ...formData },
      });
      setFormData(toForm(data));
      setUpdatedAt(data.updated_at);
      setSetupMode(false);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message });
      } else {
        setError({ code: "network_error", message: "Network request failed." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Profile</h1>
      <Show
        when={!loading()}
        fallback={<p class={form.sub}>Loading profile...</p>}
      >
        <Show when={setupMode()}>
          <p class={form.sub}>No profile yet. Fill the form to create it.</p>
        </Show>
        <Show when={!setupMode() && updatedAt()}>
          <p class={form.sub}>Last updated: {updatedAt()}</p>
        </Show>

        <Show when={error()}>
          <p class={form.error} role="alert">
            {errorCopy(error()?.code ?? "")} {error()?.message}
          </p>
        </Show>
        <Show when={saved()}>
          <p class={form.success} role="status">
            Profile saved.
          </p>
        </Show>

        <form onSubmit={handleSave}>
          <div class={styles.grid}>
            {fields.map((field) => (
              <div class={`${form.field} ${field.full ? styles.full : ""}`}>
                <label for={`profile-${field.key}`}>{field.label}</label>
                <Show
                  when={field.textarea}
                  fallback={
                    <input
                      id={`profile-${field.key}`}
                      type={field.type}
                      value={formData[field.key]}
                      placeholder={field.placeholder ?? ""}
                      onInput={(event) => setFormData(field.key, event.currentTarget.value)}
                      disabled={saving()}
                      required={field.required}
                    />
                  }
                >
                  <textarea
                    id={`profile-${field.key}`}
                    class={styles.full}
                    value={formData[field.key]}
                    onInput={(event) => setFormData(field.key, event.currentTarget.value)}
                    disabled={saving()}
                    required={field.required}
                  />
                </Show>
              </div>
            ))}
          </div>
          <div class={form.actions}>
            <button class={form.primary} type="submit" disabled={saving()}>
              {saving() ? "Saving..." : setupMode() ? "Create profile" : "Save profile"}
            </button>
          </div>
        </form>
      </Show>
    </>
  );
}
