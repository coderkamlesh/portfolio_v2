import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditLogErrorText,
  buildAuditQuery,
  clampOffset,
  diffKeys,
  pageCount,
  parseSnapshot,
  relativeTime,
} from "../../services/audit-log";
import type { AuditEntry, AuditLogResponse } from "../../services/audit-log";
import styles from "./AuditLogPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "—";
  } catch {
    return "Unprintable value.";
  }
}

function EntryDetail(props: { entry: AuditEntry }) {
  const parsedBefore = parseSnapshot(props.entry.old_value);
  const parsedAfter = parseSnapshot(props.entry.new_value);
  const beforeValue = parsedBefore.ok ? parsedBefore.value : undefined;
  const afterValue = parsedAfter.ok ? parsedAfter.value : undefined;
  const hasBoth = parsedBefore.ok && parsedAfter.ok;
  const changed = hasBoth ? diffKeys(beforeValue, afterValue) : [];

  return (
    <div class={styles.detail}>
      <Show
        when={hasBoth}
        fallback={<pre class={styles.pre}>{stringify(beforeValue ?? afterValue ?? "No snapshot on either side.")}</pre>}
      >
        <div class={styles.diffCols}>
          <div>
            <h4>Before</h4>
            <pre class={styles.pre}>{stringify(beforeValue)}</pre>
          </div>
          <div>
            <h4>After</h4>
            <pre class={styles.pre}>{stringify(afterValue)}</pre>
          </div>
        </div>
        <Show when={changed.length > 0}>
          <p class={styles.muted}>Changed keys: {changed.join(", ")}</p>
        </Show>
      </Show>
      <p class={styles.muted} title={props.entry.created_at}>
        {props.entry.created_at} UTC
        <Show when={props.entry.admin_id}> · admin {props.entry.admin_id}</Show>
      </p>
    </div>
  );
}

export default function AuditLogPage() {
  const auth = useAuth();

  const [entityType, setEntityType] = createSignal("");
  const [action, setAction] = createSignal("");
  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [entries, setEntries] = createSignal<AuditEntry[]>([]);
  const [total, setTotal] = createSignal(0);
  const [appliedLimit, setAppliedLimit] = createSignal(50);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [expanded, setExpanded] = createSignal<string[]>([]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await auth.authFetch<AuditLogResponse>(
        buildAuditQuery({
          entityType: entityType(),
          action: action(),
          limit: limit(),
          offset: clampOffset(page() * limit()),
        }),
      );
      setEntries(res.entries);
      setTotal(res.total);
      setAppliedLimit(res.limit);
      setExpanded([]);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(auditLogErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void load();
  });

  function applyFilters(event: SubmitEvent): void {
    event.preventDefault();
    setPage(0);
    void load();
  }

  function resetFilters(): void {
    setEntityType("");
    setAction("");
    setLimit(50);
    setPage(0);
    void load();
  }

  function toggle(id: string): void {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  const pages = () => pageCount(total(), appliedLimit());

  function goTo(next: number): void {
    const clamped = Math.min(Math.max(0, next), Math.max(0, pages() - 1));
    setPage(clamped);
    void load();
  }

  return (
    <>
      <h1>Audit Log</h1>
      <p class={styles.sub}>Who changed what, newest first. Rows are immutable and read-only.</p>

      <form class={styles.filters} onSubmit={applyFilters}>
        <div class={styles.field}>
          <label for="audit-entity">Entity</label>
          <select
            id="audit-entity"
            value={entityType()}
            onChange={(event) => setEntityType(event.currentTarget.value)}
            disabled={loading()}
          >
            <option value="">All</option>
            <For each={AUDIT_ENTITY_TYPES}>{(type) => <option value={type}>{type}</option>}</For>
          </select>
        </div>
        <div class={styles.field}>
          <label for="audit-action">Action</label>
          <select
            id="audit-action"
            value={action()}
            onChange={(event) => setAction(event.currentTarget.value)}
            disabled={loading()}
          >
            <option value="">All</option>
            <For each={AUDIT_ACTIONS}>{(item) => <option value={item}>{item}</option>}</For>
          </select>
        </div>
        <div class={styles.field}>
          <label for="audit-limit">Per page</label>
          <select
            id="audit-limit"
            value={String(limit())}
            onChange={(event) => setLimit(Number(event.currentTarget.value))}
            disabled={loading()}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class={styles.actions}>
          <button class={styles.primary} type="submit" disabled={loading()}>
            Apply
          </button>
          <button class={styles.link} type="button" onClick={resetFilters} disabled={loading()}>
            Reset
          </button>
        </div>
      </form>

      <Show when={error()}>
        <p class={styles.error} role="alert">
          {error()}
        </p>
      </Show>

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading audit log...</p>}>
        <Show when={entries().length > 0} fallback={<p class={styles.muted}>No entries match these filters.</p>}>
          <ul class={styles.list}>
            <For each={entries()}>
              {(entry) => (
                <li class={styles.row}>
                  <button
                    class={styles.rowButton}
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-expanded={expanded().includes(entry.id)}
                  >
                    <span class={`${styles.badge} ${styles[entry.action] ?? ""}`}>{entry.action}</span>
                    <span class={styles.rowMain}>
                      <strong>{entry.entity_type}</strong>
                      <Show when={entry.entity_id}>
                        <span class={styles.meta}>{entry.entity_id}</span>
                      </Show>
                    </span>
                    <span class={styles.meta} title={entry.created_at}>
                      {relativeTime(entry.created_at)}
                    </span>
                    <span class={styles.chevron} aria-hidden="true">
                      {expanded().includes(entry.id) ? "▾" : "▸"}
                    </span>
                  </button>
                  <Show when={expanded().includes(entry.id)}>
                    <EntryDetail entry={entry} />
                  </Show>
                </li>
              )}
            </For>
          </ul>
          <div class={styles.pager}>
            <button class={styles.link} type="button" onClick={() => goTo(page() - 1)} disabled={page() <= 0}>
              ← Prev
            </button>
            <span class={styles.muted}>
              Page {page() + 1} of {pages()} · {total()} total
            </span>
            <button
              class={styles.link}
              type="button"
              onClick={() => goTo(page() + 1)}
              disabled={page() + 1 >= pages()}
            >
              Next →
            </button>
          </div>
        </Show>
      </Show>
    </>
  );
}
