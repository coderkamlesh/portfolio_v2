import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  categoryPayload,
  createSkillPayload,
  parseOrder,
  skillsErrorText,
  updateSkillPayload,
} from "../../services/skills";
import type { AdminSkill, AdminSkillCategory } from "../../services/skills";
import styles from "./SkillsPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

export default function SkillsPage() {
  const auth = useAuth();

  const [categories, setCategories] = createSignal<AdminSkillCategory[]>([]);
  const [skills, setSkills] = createSignal<AdminSkill[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const [catEditingId, setCatEditingId] = createSignal<string | null>(null);
  const [catName, setCatName] = createSignal("");
  const [catOrder, setCatOrder] = createSignal("");
  const [catError, setCatError] = createSignal<string | null>(null);
  const [catSaving, setCatSaving] = createSignal(false);

  const [skEditingId, setSkEditingId] = createSignal<string | null>(null);
  const [skCategoryId, setSkCategoryId] = createSignal("");
  const [skName, setSkName] = createSignal("");
  const [skIcon, setSkIcon] = createSignal("");
  const [skOrder, setSkOrder] = createSignal("");
  const [skError, setSkError] = createSignal<string | null>(null);
  const [skSaving, setSkSaving] = createSignal(false);

  function skillsFor(categoryId: string): AdminSkill[] {
    return skills().filter((skill) => skill.category_id === categoryId);
  }

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const [catRes, skRes] = await Promise.all([
        auth.authFetch<{ categories: AdminSkillCategory[] }>("/api/admin/skill-categories"),
        auth.authFetch<{ skills: AdminSkill[] }>("/api/admin/skills"),
      ]);
      setCategories(catRes.categories);
      setSkills(skRes.skills);
      const current = skCategoryId();
      if (!current || !catRes.categories.some((category) => category.id === current)) {
        setSkCategoryId(catRes.categories[0]?.id ?? "");
      }
    } catch (err) {
      const { code, message } = describeError(err);
      setError(skillsErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void refresh();
  });

  function resetCatForm(): void {
    setCatEditingId(null);
    setCatName("");
    setCatOrder("");
    setCatError(null);
  }

  function startEditCategory(category: AdminSkillCategory): void {
    setCatEditingId(category.id);
    setCatName(category.name);
    setCatOrder(String(category.display_order));
    setCatError(null);
    setNotice(null);
  }

  async function saveCategory(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsed = parseOrder(catOrder());
    if (!parsed.ok) {
      setCatError(parsed.message);
      return;
    }
    setCatSaving(true);
    setCatError(null);
    setNotice(null);
    const editingId = catEditingId();
    try {
      if (editingId) {
        await auth.authFetch(`/api/admin/skill-categories/${editingId}`, {
          method: "PUT",
          body: categoryPayload(catName(), parsed.value),
        });
        setNotice("Category updated.");
      } else {
        await auth.authFetch("/api/admin/skill-categories", {
          method: "POST",
          body: categoryPayload(catName(), parsed.value),
        });
        setNotice("Category created.");
      }
      resetCatForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setCatError(skillsErrorText(code, message));
      if (code === "skill_category_not_found") {
        resetCatForm();
        await refresh();
      }
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategory(category: AdminSkillCategory): Promise<void> {
    if (!window.confirm(`Delete "${category.name}" and all of its skills?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/skill-categories/${category.id}`, { method: "DELETE" });
      if (catEditingId() === category.id) resetCatForm();
      setNotice("Category deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(skillsErrorText(code, message));
      if (code === "skill_category_not_found") await refresh();
    }
  }

  function resetSkillForm(): void {
    setSkEditingId(null);
    setSkCategoryId(categories()[0]?.id ?? "");
    setSkName("");
    setSkIcon("");
    setSkOrder("");
    setSkError(null);
  }

  function startEditSkill(skill: AdminSkill): void {
    setSkEditingId(skill.id);
    setSkCategoryId(skill.category_id);
    setSkName(skill.name);
    setSkIcon(skill.icon_slug ?? "");
    setSkOrder(String(skill.display_order));
    setSkError(null);
    setNotice(null);
  }

  async function saveSkill(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsed = parseOrder(skOrder());
    if (!parsed.ok) {
      setSkError(parsed.message);
      return;
    }
    const editingId = skEditingId();
    if (!editingId && !skCategoryId()) {
      setSkError("Create a category first, then add skills to it.");
      return;
    }
    setSkSaving(true);
    setSkError(null);
    setNotice(null);
    try {
      if (editingId) {
        await auth.authFetch(`/api/admin/skills/${editingId}`, {
          method: "PUT",
          body: updateSkillPayload(skName(), skIcon(), parsed.value, skCategoryId()),
        });
        setNotice("Skill updated.");
      } else {
        await auth.authFetch("/api/admin/skills", {
          method: "POST",
          body: createSkillPayload(skCategoryId(), skName(), skIcon(), parsed.value),
        });
        setNotice("Skill created.");
      }
      resetSkillForm();
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setSkError(skillsErrorText(code, message));
      if (code === "skill_category_not_found" || code === "skill_not_found") {
        resetSkillForm();
        await refresh();
      }
    } finally {
      setSkSaving(false);
    }
  }

  async function deleteSkill(skill: AdminSkill): Promise<void> {
    if (!window.confirm(`Delete skill "${skill.name}"?`)) return;
    setNotice(null);
    try {
      await auth.authFetch(`/api/admin/skills/${skill.id}`, { method: "DELETE" });
      if (skEditingId() === skill.id) resetSkillForm();
      setNotice("Skill deleted.");
      await refresh();
    } catch (err) {
      const { code, message } = describeError(err);
      setError(skillsErrorText(code, message));
      if (code === "skill_not_found") await refresh();
    }
  }

  return (
    <>
      <h1>Skills</h1>
      <p class={styles.sub}>Categories with nested skills. Server order is preserved.</p>

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

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading skills...</p>}>
        <div class={styles.columns}>
          <section class={styles.panel} aria-labelledby="skills-categories-title">
            <h2 id="skills-categories-title">Categories</h2>
            <Show when={categories().length > 0} fallback={<p class={styles.muted}>No categories yet.</p>}>
              <ul class={styles.list}>
                <For each={categories()}>
                  {(category) => (
                    <li class={styles.row}>
                      <span class={styles.orderBadge}>{category.display_order}</span>
                      <span class={styles.rowName}>{category.name}</span>
                      <button class={styles.link} type="button" onClick={() => startEditCategory(category)}>
                        Edit
                      </button>
                      <button class={styles.link} type="button" onClick={() => void deleteCategory(category)}>
                        Delete
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>

            <form onSubmit={saveCategory}>
              <Show when={catError()}>
                <p class={styles.error} role="alert">
                  {catError()}
                </p>
              </Show>
              <div class={styles.field}>
                <label for="skill-cat-name">
                  <Show when={catEditingId()} fallback="New category name">
                    Category name
                  </Show>
                </label>
                <input
                  id="skill-cat-name"
                  type="text"
                  maxlength={100}
                  value={catName()}
                  onInput={(event) => setCatName(event.currentTarget.value)}
                  disabled={catSaving()}
                  required
                />
              </div>
              <div class={styles.field}>
                <label for="skill-cat-order">Display order (optional)</label>
                <input
                  id="skill-cat-order"
                  type="number"
                  min="0"
                  step="1"
                  value={catOrder()}
                  onInput={(event) => setCatOrder(event.currentTarget.value)}
                  disabled={catSaving()}
                  placeholder="0"
                />
              </div>
              <div class={styles.actions}>
                <button class={styles.primary} type="submit" disabled={catSaving() || !catName().trim()}>
                  {catSaving() ? "Saving..." : catEditingId() ? "Save category" : "Create category"}
                </button>
                <Show when={catEditingId()}>
                  <button class={styles.link} type="button" onClick={resetCatForm} disabled={catSaving()}>
                    Cancel
                  </button>
                </Show>
              </div>
            </form>
          </section>

          <section class={styles.panel} aria-labelledby="skills-items-title">
            <h2 id="skills-items-title">Skills</h2>
            <Show
              when={categories().length > 0}
              fallback={<p class={styles.muted}>Create a category before adding skills.</p>}
            >
              <Show when={skills().length > 0} fallback={<p class={styles.muted}>No skills yet.</p>}>
                <For each={categories()}>
                  {(category) => (
                    <div class={styles.group}>
                      <h3>{category.name}</h3>
                      <Show when={skillsFor(category.id).length > 0} fallback={<p class={styles.muted}>Empty</p>}>
                        <ul class={styles.list}>
                          <For each={skillsFor(category.id)}>
                            {(skill) => (
                              <li class={styles.row}>
                                <span class={styles.orderBadge}>{skill.display_order}</span>
                                <span class={styles.rowName}>
                                  {skill.name}
                                  <Show when={skill.icon_slug}>
                                    <span class={styles.slug}>{skill.icon_slug}</span>
                                  </Show>
                                </span>
                                <button class={styles.link} type="button" onClick={() => startEditSkill(skill)}>
                                  Edit
                                </button>
                                <button class={styles.link} type="button" onClick={() => void deleteSkill(skill)}>
                                  Delete
                                </button>
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </div>
                  )}
                </For>
              </Show>
            </Show>

            <form onSubmit={saveSkill}>
              <Show when={skError()}>
                <p class={styles.error} role="alert">
                  {skError()}
                </p>
              </Show>
              <div class={styles.field}>
                <label for="skill-item-category">Category</label>
                <select
                  id="skill-item-category"
                  value={skCategoryId()}
                  onChange={(event) => setSkCategoryId(event.currentTarget.value)}
                  disabled={skSaving() || categories().length === 0}
                >
                  <For each={categories()}>{(category) => <option value={category.id}>{category.name}</option>}</For>
                </select>
              </div>
              <div class={styles.field}>
                <label for="skill-item-name">Skill name</label>
                <input
                  id="skill-item-name"
                  type="text"
                  maxlength={100}
                  value={skName()}
                  onInput={(event) => setSkName(event.currentTarget.value)}
                  disabled={skSaving()}
                  required
                />
              </div>
              <div class={styles.field}>
                <label for="skill-item-icon">Icon slug (optional)</label>
                <input
                  id="skill-item-icon"
                  type="text"
                  maxlength={64}
                  value={skIcon()}
                  onInput={(event) => setSkIcon(event.currentTarget.value)}
                  disabled={skSaving()}
                  placeholder="go"
                />
              </div>
              <div class={styles.field}>
                <label for="skill-item-order">Display order (optional)</label>
                <input
                  id="skill-item-order"
                  type="number"
                  min="0"
                  step="1"
                  value={skOrder()}
                  onInput={(event) => setSkOrder(event.currentTarget.value)}
                  disabled={skSaving()}
                  placeholder="0"
                />
              </div>
              <div class={styles.actions}>
                <button
                  class={styles.primary}
                  type="submit"
                  disabled={skSaving() || !skName().trim() || categories().length === 0}
                >
                  {skSaving() ? "Saving..." : skEditingId() ? "Save skill" : "Create skill"}
                </button>
                <Show when={skEditingId()}>
                  <button class={styles.link} type="button" onClick={resetSkillForm} disabled={skSaving()}>
                    Cancel
                  </button>
                </Show>
              </div>
            </form>
          </section>
        </div>
      </Show>
    </>
  );
}
