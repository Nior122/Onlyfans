# Master Prompt Builder

Turn a rough idea — a goal, a role and an output type — into a structured, role-based **master
prompt** you can reuse anywhere. Save prompts to a local library, search and filter them, and
export the whole thing as JSON.

A Next.js portfolio project with a server-side OpenRouter integration: the API key never reaches
the browser.

---

## Features

**Generator**

- Goal (textarea), Role (free text with 8 quick-pick chips), Output type (10 options)
- Optional advanced fields: tone, target audience, desired length, extra constraints
- Inline client-side validation with messages that match the API's rules exactly
- Loading, disabled and empty states; regenerate without retyping the brief

**The generated prompt**

- Seven required sections: Role, Context, Objective, Step-by-step instructions, Output format,
  Constraints and quality rules, Self-check
- Long-form by design (the meta-prompt targets 600–1100 words), no filler or clichés
- A section counter warns if the model drops part of the structure

**Result panel**

- Copy with 2-second "Copied" feedback, Edit-in-place, Regenerate, Save to library
- Word and section counts, plus the model that produced it

**Library**

- Save with an auto-suggested title, category and a short preview
- Default categories (Writing, Coding, Marketing, Business, Education, Research, Other) plus your
  own
- Search across titles, goals and prompt text; filter by category; sort newest/oldest
- Per card: Copy, View full, Edit, Delete (with confirmation)
- Export the library as JSON and import it back, with duplicate detection on merge

**Craft**

- Dark and light themes, defaulting to your system setting, applied before first paint
- Responsive from 360px up; keyboard accessible with visible focus, labelled controls and ARIA
  live regions
- Small Framer Motion transitions that respect `prefers-reduced-motion`
- Toasts for save, copy, delete, import, export and errors

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`, no `any`) |
| Styling | Tailwind CSS 3.4 with CSS-variable theming (tokens in `app/globals.css`) |
| Motion | Framer Motion (small transitions only) |
| Icons | lucide-react |
| LLM | OpenRouter `chat/completions` |
| Storage | `localStorage` (no database in v1) |

No Gemini, no Google AI SDKs, no client-side API keys.

---

## Quick start

Requires **Node.js 20.9 or newer** (Next.js 16 requires it) and a free
[OpenRouter](https://openrouter.ai/keys) key.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
#    then edit .env.local and set OPENROUTER_API_KEY

# 3. Run
npm run dev
#    open http://localhost:3000
```

That is the whole setup — roughly two minutes.

---

## Environment variables

All variables are server-side only. None is prefixed with `NEXT_PUBLIC_`, so none can end up in
the browser bundle.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | **yes** | — | Authenticates requests to OpenRouter. |
| `OPENROUTER_MODEL` | no | `openai/gpt-4o-mini` | Any OpenRouter chat model. |
| `OPENROUTER_SITE_URL` | no | `http://localhost:3000` | Sent as the `HTTP-Referer` header. |
| `OPENROUTER_SITE_NAME` | no | `Master Prompt Builder` | Sent as the `X-Title` header. |
| `OPENROUTER_BASE_URL` | no | `https://openrouter.ai/api/v1` | Override for a proxy or gateway. |

Changing `.env.local` while `npm run dev` is running reloads the variables automatically.

---

## Project structure

```
app/
  api/generate/route.ts   POST endpoint: validate → rate limit → OpenRouter → normalise
  error.tsx               Route-level error boundary
  fonts/                  Self-hosted Inter (subset, OFL) — no font CDN at build or run time
  globals.css             Design tokens, base styles, reduced-motion rules
  layout.tsx              Metadata, pre-paint theme script, skip link
  not-found.tsx           404 page
  page.tsx                Server component that renders <AppShell />
components/
  AppShell.tsx            Owns the active view; wraps providers and motion config
  BuilderView.tsx         Generation lifecycle for the Builder tab
  CategoryManager.tsx     Add / remove categories
  CopyButton.tsx          Copy with icon and live-region feedback
  GeneratorForm.tsx       The form, chips, advanced fields, validation
  LibraryModals.tsx       Full-view and delete-confirmation dialogs
  LibraryProvider.tsx     Context + useLibrary() over localStorage
  LibraryToolbar.tsx      Search, filter, sort, import, export
  LibraryView.tsx         The library grid and its empty states
  Navbar.tsx              Brand, tabs, theme toggle
  PromptCard.tsx          One saved prompt
  ResultPanel.tsx         Empty / loading / error / success states
  RoleChips.tsx           Quick-pick roles
  SavePromptDialog.tsx    Save and edit dialog
  ThemeToggle.tsx         Light / dark toggle
  useLibraryActions.ts    Library mutations + persistence
  ui/                     The design system; the only place styling is defined
    buttonClass.ts        Button recipes (shared with the 404 page)
    Button.tsx            Three variants, three heights
    Chip.tsx              28px quick-pick pill
    Badge.tsx             Neutral pill + category dot colour
    Card.tsx              Bordered surface, plus the loading skeleton
    FieldShell.tsx        Label / hint / error layout and the control classes
    Input.tsx             Single-line field, optional leading icon
    Textarea.tsx          Multi-line field
    Select.tsx            Native select with matching styling
    Modal.tsx             Accessible dialog (focus trap, Escape, scroll lock)
    Toast.tsx             Toast provider and cards
lib/
  library.ts              Pure SavedPrompt transforms
  libraryFile.ts          JSON export / import / merge
  metaPrompt.ts           The system prompt sent to the model
  rateLimit.ts            In-memory per-IP limiter
  storage.ts              Safe typed localStorage access
  types.ts                Shared domain and API types
  utils.ts                cn, uid, clipboard, formatting, title suggestions
  validation.ts           One rule set shared by the form and the API
```

---

## How generation works

1. The browser posts the form fields to `/api/generate` (never to OpenRouter directly).
2. The route rate-limits the caller, validates and sanitises the body, then builds a system prompt
   plus a user message from the brief.
3. OpenRouter is called with a 45-second timeout, `max_tokens: 2400` and the recommended
   `HTTP-Referer` / `X-Title` headers.
4. The reply is checked for a sane length, unwrapped from any stray code fence, and returned as
   `{ prompt, model }`.

Errors are JSON with correct status codes: `400` (bad body or invalid fields, with per-field
messages), `405` (wrong method), `413` (body over 32 KB), `429` (rate limited, with `Retry-After`),
`500` (missing API key), `502`/`503`/`504` (upstream failures). Every response is sent with
`Cache-Control: no-store` so a generated prompt is never cached.

### Security notes

- The API key lives only in `.env.local` and is read inside the route handler.
- Every field is length-capped and control characters are stripped; bodies over 32 KB are
  rejected before they are parsed.
- Imports are capped at 5 MB and validated record by record.
- Brief text is wrapped in `<brief>` tags and explicitly framed as data, so a prompt inside the
  goal cannot hijack the task.
- The rate limiter is in-memory and per process: 10 requests per minute per IP. It is a
  credit guard for a public demo, not a hard quota — on serverless hosts each instance keeps its
  own counters, so swap in a shared store (for example Upstash Redis) if you need a guarantee.
  `x-forwarded-for` is only trustworthy behind a proxy that sets it.

---

## Data and storage

Everything lives in the browser, under three keys:

| Key | Contents |
| --- | --- |
| `mpb:prompts` | Saved prompts |
| `mpb:categories` | Category names (defaults are always merged in) |
| `mpb:theme` | `light` or `dark` |

Reads are defensive: unavailable storage, empty values and corrupted JSON all fall back instead of
crashing, and individual malformed records are dropped while the rest are kept. The library syncs
across tabs. Export produces `master-prompt-library-YYYY-MM-DD.json`; import accepts that file or a
bare array of prompts and skips duplicate ids.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Deploy to Vercel

1. Push this repository to GitHub (the default branch builds automatically).
2. In Vercel choose **Add New → Project** and import the repository. The framework preset is
   detected as Next.js; leave the build command and output directory at their defaults.
3. Before the first deploy, open **Settings → Environment Variables** and add:
   - `OPENROUTER_API_KEY` — your key, marked as **Sensitive**, for Production, Preview and
     Development.
   - `OPENROUTER_MODEL` — optional, for example `openai/gpt-4o-mini`.
   - `OPENROUTER_SITE_URL` — your deployed URL, for example `https://your-app.vercel.app`.
   - `OPENROUTER_SITE_NAME` — the label you want shown on OpenRouter dashboards.
4. Deploy. The route runs on the Node.js runtime with `maxDuration = 60`, which fits Vercel's
   limits on Hobby and Pro plans.
5. Smoke-test the deployed API:

   ```bash
   curl -s -X POST https://your-app.vercel.app/api/generate \
     -H "Content-Type: application/json" \
     -d '{"goal":"Write a launch email for a budgeting app","role":"Copywriter","outputType":"Email"}'
   ```

Notes for production:

- Keep the model cheap and fast; generation cost scales with prompt length, and this app asks for
  long answers by design.
- Serverless instances are ephemeral, so treat the built-in rate limit as best-effort (see above).
- Never commit `.env.local`; `.gitignore` already excludes it.

---

## Accessibility

- Skip link, landmark regions, one `h1`, and a logical heading order
- Every control has a visible label or an accessible name; errors are tied to fields with
  `aria-invalid` / `aria-describedby`
- Tabs follow the tablist pattern with arrow-key navigation; modals trap focus, close on Escape and
  restore focus
- Loading states use `aria-busy`; toasts and generation results are announced through live regions
- Decorative icons are `aria-hidden`; the scrollable prompt region is focusable
- Reduced-motion preferences are respected by both CSS and Framer Motion

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Server is missing OPENROUTER_API_KEY` | Add the key to `.env.local` and restart, or set it in your host's environment. |
| `OpenRouter rejected the API key` | Check the key at openrouter.ai/keys; make sure there is no trailing whitespace. |
| `Too many requests` | The 10-per-minute limit per IP. Wait for the `Retry-After` window. |
| `OpenRouter took too long to respond` | Try a faster model via `OPENROUTER_MODEL`. |
| `The model returned an unusably short prompt` | The model ignored the brief; switch models. |
| Prompts vanish after refresh | Local storage is blocked (private window or site settings). The library view says so explicitly. |

---

## License

MIT — use it, adapt it, ship it.
