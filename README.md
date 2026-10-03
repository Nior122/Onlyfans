# Master Prompt Builder

Turn a goal, a role and an output type into a structured, role-based master prompt — then save,
search and reuse it.

## Run it

```bash
npm install
cp .env.example .env.local   # add your OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | Server-side only. Used by `/api/generate`. |
| `OPENROUTER_MODEL` | no | Defaults to `openai/gpt-4o-mini`. |
| `OPENROUTER_SITE_URL` | no | Sent as the `HTTP-Referer` header to OpenRouter. |
| `OPENROUTER_SITE_NAME` | no | Sent as the `X-Title` header to OpenRouter. |

Full documentation (features, stack, deployment) is added in the polish phase.
