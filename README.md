# Master Prompt Builder

Turn a rough idea — a goal, a role and an output type — into a structured, role-based **master
prompt** you can reuse anywhere. Save prompts to a local library, search and filter them, and
export the whole thing as JSON.

A Next.js portfolio project with a server-side LLM integration. It speaks the OpenAI-compatible
`chat/completions` format, so it runs against **OpenRouter, Groq, OpenAI, Anthropic, Gemini,
Mistral, DeepSeek, xAI, Ollama or any other compatible endpoint** — and the API key never reaches
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
| LLM | Any OpenAI-compatible `chat/completions` endpoint (OpenRouter, Groq, OpenAI, …) |
| Storage | `localStorage` (no database in v1) |

No provider SDKs and no client-side API keys: one `fetch` against a base URL you configure.

---

## Quick start

Requires **Node.js 20.9 or newer** (Next.js 16 requires it) and an API key from any supported
provider — a free [Groq](https://console.groq.com/keys) key works, as does
[OpenRouter](https://openrouter.ai/keys).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
#    then set LLM_BASE_URL (or LLM_PROVIDER), LLM_MODEL and LLM_API_KEY

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
| `LLM_PROVIDER` | no | `openrouter` | Which provider to call. See the table below. |
| `LLM_API_KEY` | **yes**\* | — | The key for the selected provider. |
| `LLM_MODEL` | **yes** | — | The model to call. Never assumed — see below. |
| `LLM_BASE_URL` | no | per provider | Point at a gateway, a proxy or any compatible server. |
| `LLM_SITE_URL` | no | — | Attribution header, sent only to providers that use it. |
| `LLM_SITE_NAME` | no | — | Attribution header, sent only to providers that use it. |
| `LLM_MAX_TOKENS_FIELD` | no | `max_completion_tokens` | Set to `max_tokens` for older self-hosted servers. |
| `LLM_TEMPERATURE` | no | `0.7` | Set it empty to omit the field, which some reasoning models require. |

\* Not needed for `ollama` or `custom`, which may run without credentials.

There is deliberately **no built-in model**, for any provider. Model names appear and get retired
faster than this repository changes, so a hardcoded default is a default that eventually breaks a
deployment at 2am. Three values drive everything: the base URL, the model, and the key.

Provider-specific key names also work, so you can reuse what you already export:
`GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`,
`MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`. A key is only ever read for the provider that
was selected, so an OpenRouter key cannot be sent to Groq by accident.

Changing `.env.local` while `npm run dev` is running reloads the variables automatically.

---

## Providers

Every endpoint below speaks the same OpenAI-compatible format, so the request shape never changes.

Setting `LLM_PROVIDER` only saves you typing a base URL — you can always set `LLM_BASE_URL` yourself,
and it wins. A model is required in every case.

| `LLM_PROVIDER` | Base URL it fills in | Where to get a key |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `groq` | `https://api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) |
| `openai` | `https://api.openai.com/v1` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `anthropic` | `https://api.anthropic.com/v1` | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `google` | `https://generativelanguage.googleapis.com/v1beta/openai` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `mistral` | `https://api.mistral.ai/v1` | [console.mistral.ai](https://console.mistral.ai/api-keys) |
| `deepseek` | `https://api.deepseek.com/v1` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| `xai` | `https://api.x.ai/v1` | [console.x.ai](https://console.x.ai) |
| `ollama` | `http://localhost:11434/v1` | none needed — runs locally |
| `custom` | `LLM_BASE_URL` | whatever your gateway uses |

Groq, in full — the URL, the model and the key:

```bash
LLM_PROVIDER=groq                       # or LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b           # copy the exact id from Groq's model list
LLM_API_KEY=gsk_...
```

Anything not in the table works the same way — point `LLM_BASE_URL` at it:

```bash
LLM_PROVIDER=custom        # or any name you like, it only labels error messages
LLM_BASE_URL=https://your-gateway.example/v1
LLM_MODEL=your-model-id
# LLM_API_KEY is optional here: leave it out for keyless local servers
```

Two notes on model choice. OpenRouter and Groq both report `max_tokens` as deprecated in favour of
`max_completion_tokens`, which is what this app sends; older self-hosted servers that only accept
`max_tokens` are covered by `LLM_MAX_TOKENS_FIELD=max_tokens`. And some reasoning models reject a
`temperature` field outright — set `LLM_TEMPERATURE=` to omit it.

---

## Project structure

```
app/
  api/generate/route.ts   POST endpoint: validate → rate limit → provider call → normalise
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
  llm.ts                  One OpenAI-compatible client: request, timeout, error mapping
  library.ts              Pure SavedPrompt transforms
  libraryFile.ts          JSON export / import / merge
  metaPrompt.ts           The system prompt sent to the model
  providers.ts            Provider presets and environment resolution
  rateLimit.ts            In-memory per-IP limiter
  storage.ts              Safe typed localStorage access
  types.ts                Shared domain and API types
  utils.ts                cn, uid, clipboard, formatting, title suggestions
  validation.ts           One rule set shared by the form and the API
```

---

## How generation works

1. The browser posts the form fields to `/api/generate` (never to the provider directly).
2. The route rate-limits the caller, validates and sanitises the body, then builds a system prompt
   plus a user message from the brief.
3. The configured provider is called with a 45-second timeout and a 2400-token ceiling. OpenRouter
   additionally receives the recommended `HTTP-Referer` / `X-Title` attribution headers.
4. The reply is checked for a sane length, unwrapped from any stray code fence, and returned as
   `{ prompt, model }`.

Errors are JSON with correct status codes: `400` (bad body or invalid fields, with per-field
messages), `405` (wrong method), `413` (body over 32 KB), `429` (rate limited, with `Retry-After`),
`500` (missing API key, or unusable provider configuration), `502`/`503`/`504` (upstream failures). Every response is sent with
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
   - `LLM_PROVIDER` — optional shorthand: `groq`, `openrouter`, `openai`, `google`, … Skips the URL.
   - `LLM_BASE_URL` — the endpoint instead of a provider name. Overrides `LLM_PROVIDER`.
   - `LLM_MODEL` — **required**: the exact model id your account can call.
   - `LLM_API_KEY` — your key, marked as **Sensitive**, for Production, Preview and Development.
     Provider-specific names such as `GROQ_API_KEY` work too.
   - `LLM_SITE_URL` — your deployed URL, for example `https://your-app.vercel.app`.
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
| `No API key for <provider>` | Set `LLM_API_KEY` (or the provider's own variable) and restart, or add it in your host's dashboard. |
| `<provider> rejected the API key` | Check the key, and make sure `LLM_PROVIDER` matches the provider the key belongs to. |
| `Unknown provider "…"` | A typo in `LLM_PROVIDER`. Use a name from the provider table, or set `LLM_BASE_URL` for a custom one. |
| `No model selected` | `LLM_MODEL` is not set. It is required for every provider — copy an exact model id from your provider's model list. |
| `<provider> rejected the request (HTTP 400)` | The model may not accept `temperature` or the token field. Try `LLM_TEMPERATURE=` or `LLM_MAX_TOKENS_FIELD=max_tokens`. |
| `Too many requests` | The 10-per-minute limit per IP. Wait for the `Retry-After` window. |
| `<provider> took too long to respond` | Try a faster model via `LLM_MODEL`. |
| `The model returned an unusably short prompt` | The model ignored the brief; switch models. |
| Prompts vanish after refresh | Local storage is blocked (private window or site settings). The library view says so explicitly. |

---

## License

MIT — use it, adapt it, ship it.
