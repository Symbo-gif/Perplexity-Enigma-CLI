import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import dotenv from 'dotenv';

dotenv.config();

// API key validation constants
const API_KEY_PREFIX = 'pplx-';
const API_KEY_MIN_LENGTH = 37;  // prefix (5) + minimum 32 chars for the key part
const API_KEY_MAX_LENGTH = 128; // reasonable upper bound for key length

/**
 * Validates API key format. Perplexity API keys:
 * - Must start with 'pplx-'
 * - Followed by 32-64 alphanumeric characters (including hyphens in some formats)
 * - Total length between 37-128 characters
 */
export const validateApiKeyFormat = (key: string): { valid: boolean; message?: string } => {
  if (!key || typeof key !== 'string') {
    return { valid: false, message: 'API key is required' };
  }

  const trimmedKey = key.trim();
  
  if (!trimmedKey.startsWith(API_KEY_PREFIX)) {
    return { valid: false, message: `API key must start with "${API_KEY_PREFIX}"` };
  }

  if (trimmedKey.length < API_KEY_MIN_LENGTH) {
    return { valid: false, message: 'API key is too short' };
  }

  if (trimmedKey.length > API_KEY_MAX_LENGTH) {
    return { valid: false, message: 'API key is too long' };
  }

  // Check that the part after prefix contains only valid characters
  const keyPart = trimmedKey.slice(API_KEY_PREFIX.length);
  if (!/^[a-zA-Z0-9_-]+$/.test(keyPart)) {
    return { valid: false, message: 'API key contains invalid characters' };
  }

  return { valid: true };
};

/**
 * Writes content to a file with secure permissions (mode 0600).
 * This ensures sensitive files like .env and .pplxrc are readable only by the owner.
 */
export const writeSecureFile = (filePath: string, content: string): void => {
  fs.writeFileSync(filePath, content, { encoding: 'utf-8', mode: 0o600 });
};

export type ApiConfig = {
  key?: string;
  base_url: string;
  timeout: number;
};

export type ModelConfig = {
  default: string;
  search_heavy: string;
  reasoning: string;
  fast: string;
  deep_research: string;
};

export type AgentConfig = {
  max_iterations: number;
  temperature: number;
  max_tokens: number;
  top_p: number;
};

export type ResearchConfig = {
  search_mode: 'low' | 'medium' | 'high';
  include_citations: boolean;
  focus_on_recent: boolean;
};

export type OutputConfig = {
  format: 'markdown' | 'json' | 'plain';
  stream: boolean;
  verbose: boolean;
};

export type EnigmaConfig = {
  api: ApiConfig;
  models: ModelConfig;
  agent: AgentConfig;
  research: ResearchConfig;
  output: OutputConfig;
};

export const defaultConfig: EnigmaConfig = {
  api: {
    key: undefined,
    base_url: 'https://api.perplexity.ai',
    timeout: 60000,
  },
  models: {
    default: 'sonar-pro',
    search_heavy: 'sonar-pro',
    reasoning: 'sonar-reasoning-pro',
    fast: 'sonar',
    deep_research: 'sonar-deep-research',
  },
  agent: {
    max_iterations: 10,
    temperature: 0.3,
    max_tokens: 4096,
    top_p: 0.9,
  },
  research: {
    search_mode: 'medium',
    include_citations: true,
    focus_on_recent: true,
  },
  output: {
    format: 'markdown',
    stream: false,
    verbose: false,
  },
};

export const AVAILABLE_MODELS = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning',
  'sonar-reasoning-pro',
  'sonar-reasoning-large',
  'sonar-deep-research',
  'sonar-large',
];

const CONFIG_FILE = '.pplxrc';
type EnvKey =
  | keyof ApiConfig
  | keyof ModelConfig
  | keyof AgentConfig
  | keyof ResearchConfig
  | keyof OutputConfig;
type PartialConfig = {
  api?: Partial<ApiConfig>;
  models?: Partial<ModelConfig>;
  agent?: Partial<AgentConfig>;
  research?: Partial<ResearchConfig>;
  output?: Partial<OutputConfig>;
};

const envMap: Record<EnvKey, string> = {
  key: 'PPLX_API_KEY',
  base_url: 'PPLX_API_BASE_URL',
  timeout: 'PPLX_API_TIMEOUT',
  default: 'PPLX_MODEL_DEFAULT',
  search_heavy: 'PPLX_MODEL_SEARCH_HEAVY',
  reasoning: 'PPLX_MODEL_REASONING',
  fast: 'PPLX_MODEL_FAST',
  deep_research: 'PPLX_MODEL_DEEP_RESEARCH',
  max_iterations: 'PPLX_AGENT_MAX_ITERATIONS',
  temperature: 'PPLX_AGENT_TEMPERATURE',
  max_tokens: 'PPLX_AGENT_MAX_TOKENS',
  top_p: 'PPLX_AGENT_TOP_P',
  search_mode: 'PPLX_SEARCH_MODE',
  include_citations: 'PPLX_INCLUDE_CITATIONS',
  focus_on_recent: 'PPLX_FOCUS_ON_RECENT',
  format: 'PPLX_OUTPUT_FORMAT',
  stream: 'PPLX_OUTPUT_STREAM',
  verbose: 'PPLX_VERBOSE',
};

export const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
};

export const parseNumber = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseSearchMode = (value: string | undefined): ResearchConfig['search_mode'] | undefined => {
  if (!value) return undefined;
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return undefined;
};

export const parseOutputFormat = (value: string | undefined): OutputConfig['format'] | undefined => {
  if (!value) return undefined;
  if (value === 'markdown' || value === 'json' || value === 'plain') return value;
  return undefined;
};

export const deepMerge = <T>(base: T, override: Partial<T>): T => {
  if (typeof override !== 'object' || override === null) return base;
  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = [...value];
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      result[key] = deepMerge((result as any)[key] ?? {}, value as any);
      continue;
    }
    (result as any)[key] = value;
  }
  return result as T;
};

const loadFileConfig = (baseDir: string): Partial<EnigmaConfig> => {
  const filePath = path.join(baseDir, CONFIG_FILE);
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return YAML.parse(raw) ?? {};
  } catch (err) {
    console.error(`Unable to parse ${CONFIG_FILE}: ${(err as Error).message}. Using defaults.`);
    return {};
  }
};

const applyEnvOverrides = (config: EnigmaConfig): EnigmaConfig => {
  const envOverrides: PartialConfig = { api: {}, models: {}, agent: {}, research: {}, output: {} };

  for (const [key, envKey] of Object.entries(envMap)) {
    const value = process.env[envKey as string];
    if (value === undefined) continue;

    switch (key) {
      case 'key':
        (envOverrides.api as ApiConfig).key = value;
        break;
      case 'base_url':
        (envOverrides.api as ApiConfig).base_url = value;
        break;
      case 'timeout':
        (envOverrides.api as ApiConfig).timeout = parseNumber(value) ?? config.api.timeout;
        break;
      case 'default':
      case 'search_heavy':
      case 'reasoning':
      case 'fast':
      case 'deep_research':
        (envOverrides.models as any)[key] = value;
        break;
      case 'max_iterations':
        (envOverrides.agent as AgentConfig).max_iterations = parseNumber(value) ?? config.agent.max_iterations;
        break;
      case 'temperature':
        (envOverrides.agent as AgentConfig).temperature = parseNumber(value) ?? config.agent.temperature;
        break;
      case 'max_tokens':
        (envOverrides.agent as AgentConfig).max_tokens = parseNumber(value) ?? config.agent.max_tokens;
        break;
      case 'top_p':
        (envOverrides.agent as AgentConfig).top_p = parseNumber(value) ?? config.agent.top_p;
        break;
      case 'search_mode':
        (envOverrides.research as ResearchConfig).search_mode = parseSearchMode(value) ?? config.research.search_mode;
        break;
      case 'include_citations':
        (envOverrides.research as ResearchConfig).include_citations = parseBoolean(value) ?? config.research.include_citations;
        break;
      case 'focus_on_recent':
        (envOverrides.research as ResearchConfig).focus_on_recent = parseBoolean(value) ?? config.research.focus_on_recent;
        break;
      case 'format':
        (envOverrides.output as OutputConfig).format = parseOutputFormat(value) ?? config.output.format;
        break;
      case 'stream':
        (envOverrides.output as OutputConfig).stream = parseBoolean(value) ?? config.output.stream;
        break;
      case 'verbose':
        (envOverrides.output as OutputConfig).verbose = parseBoolean(value) ?? config.output.verbose;
        break;
      default:
        break;
    }
  }

  return deepMerge<EnigmaConfig>(config, envOverrides as Partial<EnigmaConfig>);
};

export const loadConfig = (baseDir = process.cwd()): EnigmaConfig => {
  const fileConfig = loadFileConfig(baseDir);
  const merged = deepMerge(defaultConfig, fileConfig);
  return applyEnvOverrides(merged);
};

export const resolveApiKey = (config: EnigmaConfig): string | undefined => {
  return process.env.PPLX_API_KEY ?? config.api.key;
};

export const saveConfig = (config: EnigmaConfig, targetPath = path.join(process.cwd(), CONFIG_FILE)) => {
  const yaml = YAML.stringify(config);
  writeSecureFile(targetPath, yaml);
};

export const validateModelName = (model: string | undefined, config: EnigmaConfig): { model: string; warned: boolean } => {
  if (!model) return { model: config.models.default, warned: false };
  if (AVAILABLE_MODELS.includes(model)) return { model, warned: false };
  console.error(
    `Invalid model "${model}". Available models: ${AVAILABLE_MODELS.join(
      ', ',
    )}. Using default: ${config.models.default}`,
  );
  return { model: config.models.default, warned: true };
};
