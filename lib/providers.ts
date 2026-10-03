import type { GenerateErrorCode } from "@/lib/types";

/**
 * Which endpoint the app calls, and how it is configured.
 *
 * Every provider below speaks the same OpenAI-compatible chat-completions
 * format, so one client in `lib/llm.ts` covers all of them: switching provider
 * changes a base URL, a key and a model name, never the request shape.
 * Adding a provider is one entry in `PROVIDERS`.
 *
 * No model is ever assumed. LLM_MODEL is required, for every provider, because
 * model names are released and retired faster than this file is edited — a
 * built-in default is a default that rots. The presets only supply a base URL
 * and a key-variable name; both stay overridable.
 */

export type ProviderId =
  | "openrouter"
  | "groq"
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "deepseek"
  | "xai"
  | "ollama"
  | "custom";

type ProviderPreset = {
  /** Shown in error messages, so the user knows who refused the request. */
  label: string;
  /** Base URL without the trailing `/chat/completions`. Empty = must be supplied. */
  baseUrl: string;
  /** Key variables checked when LLM_API_KEY is not set. */
  apiKeyEnv: string[];
  /** Local servers that accept requests without credentials. */
  keyOptional?: boolean;
  /** OpenRouter reads these for dashboard attribution; others do not. */
  attribution?: boolean;
};

export const PROVIDERS: Record<ProviderId, ProviderPreset> = {
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: ["OPENROUTER_API_KEY"],
    attribution: true,
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyEnv: ["GROQ_API_KEY"],
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyEnv: ["OPENAI_API_KEY"],
  },
  // Anthropic's OpenAI-compatibility layer. They describe it as suitable for
  // evaluation rather than production.
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyEnv: ["ANTHROPIC_API_KEY"],
  },
  google: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKeyEnv: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  },
  mistral: {
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKeyEnv: ["MISTRAL_API_KEY"],
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: ["DEEPSEEK_API_KEY"],
  },
  xai: {
    label: "xAI",
    baseUrl: "https://api.x.ai/v1",
    apiKeyEnv: ["XAI_API_KEY"],
  },
  ollama: {
    label: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    apiKeyEnv: [],
    keyOptional: true,
  },
  custom: {
    label: "OpenAI-compatible endpoint",
    baseUrl: "",
    apiKeyEnv: [],
    keyOptional: true,
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export type LlmConfig = {
  providerId: string;
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** "GROQ_API_KEY or LLM_API_KEY" — quoted back when a key is rejected. */
  keyHint: string;
  siteUrl?: string;
  siteName?: string;
  maxTokensField: string;
  temperature?: number;
};

export type ResolveResult =
  | { ok: true; config: LlmConfig }
  | { ok: false; code: GenerateErrorCode; message: string };

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_NAME = "Master Prompt Builder";
const DEFAULT_TEMPERATURE = 0.7;
/**
 * OpenRouter and Groq both document `max_tokens` as deprecated in favour of
 * this. Older self-hosted servers can be pointed back with LLM_MAX_TOKENS_FIELD.
 */
const DEFAULT_MAX_TOKENS_FIELD = "max_completion_tokens";

const read = (env: NodeJS.ProcessEnv, name: string): string => env[name]?.trim() ?? "";

/**
 * An empty value means "omit the field entirely", which some reasoning models
 * require; an unset variable keeps the default.
 */
function resolveTemperature(env: NodeJS.ProcessEnv): number | undefined {
  const raw = env.LLM_TEMPERATURE;
  if (raw === undefined) return DEFAULT_TEMPERATURE;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TEMPERATURE;
}

export function resolveLlmConfig(env: NodeJS.ProcessEnv = process.env): ResolveResult {
  const requested = read(env, "LLM_PROVIDER").toLowerCase();
  const known = PROVIDER_IDS.find((id) => id === requested);
  const providerId: ProviderId = known ?? (requested === "" ? "openrouter" : "custom");
  const preset = PROVIDERS[providerId];
  const isOpenRouter = providerId === "openrouter";

  // OpenRouter's own variable names keep working, but only for OpenRouter: a key
  // meant for one provider must never be sent to another.
  const baseUrl = (
    read(env, "LLM_BASE_URL") ||
    (isOpenRouter ? read(env, "OPENROUTER_BASE_URL") : "") ||
    preset.baseUrl
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    // Only `custom` and unrecognised names can reach this: every preset above
    // ships a base URL.
    const message =
      requested && requested !== "custom"
        ? `Unknown provider "${requested}". Set LLM_BASE_URL to its OpenAI-compatible ` +
          `endpoint, or use one of: ${PROVIDER_IDS.join(", ")}.`
        : "No base URL configured. Set LLM_BASE_URL to the endpoint you want to call, for example https://your-host/v1.";
    return { ok: false, code: "INVALID_CONFIG", message };
  }

  const model = read(env, "LLM_MODEL") || (isOpenRouter ? read(env, "OPENROUTER_MODEL") : "");

  if (!model) {
    return {
      ok: false,
      code: "INVALID_CONFIG",
      message: `No model selected. Set LLM_MODEL to a model name your ${preset.label} account can use.`,
    };
  }

  const acceptedKeyVars = ["LLM_API_KEY", ...preset.apiKeyEnv];
  const apiKey =
    read(env, "LLM_API_KEY") || acceptedKeyVars.map((name) => read(env, name)).find(Boolean) || "";

  if (!apiKey && !preset.keyOptional) {
    return {
      ok: false,
      code: "MISSING_API_KEY",
      message: `No API key for ${preset.label}. Set ${acceptedKeyVars.join(" or ")} and restart the server.`,
    };
  }

  const maxTokensField = read(env, "LLM_MAX_TOKENS_FIELD");
  const siteUrl = isOpenRouter
    ? read(env, "LLM_SITE_URL") || read(env, "OPENROUTER_SITE_URL") || DEFAULT_SITE_URL
    : read(env, "LLM_SITE_URL");
  const siteName = isOpenRouter
    ? read(env, "LLM_SITE_NAME") || read(env, "OPENROUTER_SITE_NAME") || DEFAULT_SITE_NAME
    : read(env, "LLM_SITE_NAME");

  return {
    ok: true,
    config: {
      providerId,
      label: preset.label,
      apiKey,
      baseUrl,
      model,
      keyHint: acceptedKeyVars.join(" or "),
      siteUrl: preset.attribution ? siteUrl : undefined,
      siteName: preset.attribution ? siteName : undefined,
      maxTokensField: /^[A-Za-z_][A-Za-z0-9_]*$/.test(maxTokensField)
        ? maxTokensField
        : DEFAULT_MAX_TOKENS_FIELD,
      temperature: resolveTemperature(env),
    },
  };
}
