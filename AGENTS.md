# Portfolio v2 — Agent Context

## Stack

- SolidJS 1.9 + Vite 8 + TypeScript (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Styling: CSS Modules co-located (`Component.tsx` + `Component.module.css`). No Tailwind/UnoCSS, no CSS-in-JS, no new CSS deps.
- Data fetching: native `fetch` wrapper. No axios, no tanstack-query. Routing via `@solidjs/router` v1 (`/` public, `/admin` admin, `*404` fallback in `src/App.tsx`).
- Do not add dependencies (router, query lib, CSS framework, state lib) without explicit user approval.
- Do not run build/test/lint/dev commands unless explicitly asked.

## Source of truth

- `docs/` is the backend contract. Branch UI logic on `error.code`; use `error.message` for display copy only.
- Base URL: `VITE_API_BASE_URL` env, fallback `http://localhost:8080` (see `src/lib/api.ts`).
- All API responses carry `Cache-Control: no-store`. Request bodies max 64 KiB; unknown JSON fields are rejected (`400 invalid_json`).
- `204` and empty/non-JSON responses (logout, DELETE, router 404 plain text, 405 empty body) must never call `response.json()` — `apiRequest` already guards this.
- Honor `Retry-After` on `429`.
- Resume download is raw PDF bytes via plain `<a href>`, never `fetch` + `json()` (`docs/resume.md`).
- S3 uploads go browser → S3 directly with exactly the signed headers, never through the API client (`docs/uploads.md`).

## Auth module (`docs/auth.md`, `docs/admin-login.md`)

- Flow: password login → mandatory email OTP → token pair. The password step never returns tokens.
- State machine: `signed_out -> authenticating -> login_otp -> authenticated`.
- Access token lives in memory only (`createSignal`), never in `localStorage`. Refresh token is persisted in `localStorage` (`portfolio_admin_refresh`) and auto-restored via silent refresh on `AuthProvider` mount. Only terminal refresh failures (`invalid_refresh_token`, `refresh_token_reused`, `account_disabled`) and logout wipe it; transient network/5xx failures keep the stored token so the next mount or request retries. Backend returns JSON tokens; there are no `HttpOnly` cookies.
- Protected requests send `Authorization: Bearer <access_token>` only.
- On `401 missing_token` / `invalid_token`: single-flight refresh once, retry the original request once, else clear tokens + admin + challenge and route to login. Never run the refresh flow for public failures (wrong password / wrong OTP).
- Files:
  - `src/lib/api.ts` — `API_BASE_URL`, `ApiError { code, status, retryAfter }`, `apiRequest` envelope/empty-body handling.
  - `src/services/auth.ts` — endpoint functions + TS types taken from docs (login, OTP, refresh, me, logout, forgot/reset, change password, 2FA status).
  - `src/stores/auth.tsx` — `AuthProvider` + `useAuth()` (status, admin, challenge, resetChallenge, tokens, `authFetch`).
  - `src/components/admin/` — `AdminLogin.tsx` (password + OTP forms only), `ForgotPassword.tsx` (reset flow), `ChangePassword.tsx`, `AccountPage.tsx` (2FA status, password change, logout), `authErrors.ts` (code-based copy).

## Admin dashboard

- Routes are nested under `/admin` in `src/App.tsx`; the parent `AdminRoute` wraps `AuthProvider` + `AdminLayout`. Router v1 has no `Outlet` — the parent renders `props.children` as the content area.
- `AdminLayout.tsx` gates on `authenticated`: unauthenticated visits render `AdminLogin` inline. Sidebar links use `A` with `activeClass`; dashboard link needs `end`.
- `DashboardHome.tsx` is the `/admin` index (section cards). Unbuilt sections render `SectionPlaceholder.tsx` until their API wiring task starts. Wired: Profile (`ProfilePage.tsx` + `services/profile.ts`).
- Layout files: `AdminLayout.tsx` + `.module.css` (grid shell, sticky sidebar/topbar, single breakpoint at `720px`).

## Content modules

- Admin forms do a full-object PUT (never PATCH): send every editable field from the response-mapped form state, then replace local state from the response. On `404 *_not_found` during load, render the same form in first-time setup mode.
- Map absent optional fields to `""` for inputs (`toForm` helpers); the API omits empty optionals in responses.

## Conventions

- Shared layout/helpers (`.container`, buttons, section spacing) go in `src/index.css` (design tokens live there). One module file per section component; never split tiny elements into their own files.
- Form inputs stay medium: `font-size 0.9rem`, padding `0.5rem 0.625rem`, full width of the card; OTP/code inputs capped at `12rem` width. Do not make large hero-style inputs in forms.
- Keep `src/data/profile.ts` static content until the public API wiring task starts.
