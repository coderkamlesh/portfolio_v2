import { createSignal, For, onMount, Show } from "solid-js";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import { DAY_PRESETS, analyticsErrorText, normalizeDays } from "../../services/analytics";
import type { DownloadsResponse } from "../../services/analytics";
import styles from "./AnalyticsPage.module.css";

function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  return { code: "network_error", message: "Network request failed." };
}

export default function AnalyticsPage() {
  const auth = useAuth();

  const [days, setDays] = createSignal(30);
  const [customDays, setCustomDays] = createSignal("30");
  const [data, setData] = createSignal<DownloadsResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function load(windowDays: number): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await auth.authFetch<DownloadsResponse>(`/api/admin/analytics/downloads?days=${windowDays}`);
      setData(res);
    } catch (err) {
      const { code, message } = describeError(err);
      setError(analyticsErrorText(code, message));
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    void load(days());
  });

  function selectPreset(value: number): void {
    setDays(value);
    setCustomDays(String(value));
    void load(value);
  }

  function applyCustom(event: SubmitEvent): void {
    event.preventDefault();
    const value = normalizeDays(customDays(), days());
    setDays(value);
    setCustomDays(String(value));
    void load(value);
  }

  function maxCount(): number {
    const points = data()?.by_day ?? [];
    return Math.max(1, ...points.map((point) => point.count));
  }

  return (
    <>
      <h1>Analytics</h1>
      <p class={styles.sub}>Resume downloads. The chart is dense and ordered — no gap-filling needed.</p>

      <div class={styles.rangeRow} role="group" aria-label="Window in days">
        <For each={DAY_PRESETS}>
          {(preset) => (
            <button
              class={days() === preset ? styles.presetActive : styles.preset}
              type="button"
              onClick={() => selectPreset(preset)}
              disabled={loading()}
              aria-pressed={days() === preset}
            >
              {preset}d
            </button>
          )}
        </For>
        <form class={styles.customForm} onSubmit={applyCustom}>
          <label class={styles.customLabel} for="analytics-days">
            Days
          </label>
          <input
            id="analytics-days"
            type="number"
            min="1"
            max="365"
            step="1"
            value={customDays()}
            onInput={(event) => setCustomDays(event.currentTarget.value)}
            disabled={loading()}
          />
          <button class={styles.link} type="submit" disabled={loading()}>
            Apply
          </button>
        </form>
      </div>

      <Show when={error()}>
        <p class={styles.error} role="alert">
          {error()}
        </p>
      </Show>

      <Show when={!loading()} fallback={<p class={styles.sub}>Loading analytics...</p>}>
        <Show when={data()}>
          <div class={styles.stats}>
            <div class={styles.stat}>
              <span class={styles.statValue}>{data()?.total ?? 0}</span>
              <span class={styles.statLabel}>Downloads</span>
            </div>
            <div class={styles.stat}>
              <span class={styles.statValue}>{data()?.unique_ips ?? 0}</span>
              <span class={styles.statLabel}>Unique visitors (upper bound)</span>
            </div>
            <div class={styles.stat}>
              <span class={styles.statValue}>
                {data()?.from} → {data()?.to}
              </span>
              <span class={styles.statLabel}>Window (UTC)</span>
            </div>
          </div>

          <Show when={(data()?.unique_ips ?? -1) === 0 && (data()?.total ?? 0) > 0}>
            <p class={styles.warning} role="note">
              Unique count is 0 while downloads exist — the server needs ANALYTICS_HASH_SECRET configured. Totals
              are still correct.
            </p>
          </Show>

          <Show
            when={(data()?.by_day.length ?? 0) > 0}
            fallback={<p class={styles.muted}>No days in this window.</p>}
          >
            <div class={styles.chart} role="img" aria-label={`Downloads per day, last ${days()} days`}>
              <For each={data()?.by_day ?? []}>
                {(point) => (
                  <div class={styles.barWrap} title={`${point.date}: ${point.count}`}>
                    <div class={styles.barTrack}>
                      <div class={styles.bar} style={{ height: `${(point.count / maxCount()) * 100}%` }} />
                    </div>
                    <span class={styles.barCount}>{point.count}</span>
                  </div>
                )}
              </For>
            </div>
            <p class={styles.muted}>
              {data()?.by_day[0]?.date} → {data()?.by_day[(data()?.by_day.length ?? 1) - 1]?.date} ·{" "}
              {data()?.by_day.length} days
            </p>
          </Show>
        </Show>
      </Show>
    </>
  );
}
