import axios from 'axios';
import Ora from 'ora';
import chalk from 'chalk';
import { EnigmaConfig, resolveApiKey, validateModelName, AVAILABLE_MODELS } from './config.js';

export type AskOptions = {
  model?: string;
  searchMode?: 'low' | 'medium' | 'high';
};

export const askPerplexity = async (
  question: string,
  config: EnigmaConfig,
  options: AskOptions = {},
): Promise<string> => {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error('API key not found. Run "enigma config" to set it up.');
  }

  const validatedModel = validateModelName(options.model, config).model;
  const payload = {
    model: validatedModel,
    messages: [{ role: 'user', content: question }],
    stream: false,
    search_mode: options.searchMode ?? config.research.search_mode,
  };

  if (config.output.stream) {
    console.warn(chalk.yellow('Streaming responses are not yet supported. Falling back to non-streaming mode.'));
  }

  const response = await axios.post(`${config.api.base_url}/chat/completions`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: config.api.timeout,
  });

  const content = response.data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  return JSON.stringify(response.data, null, 2);
};

export const withSpinner = async <T>(message: string, fn: () => Promise<T>): Promise<T> => {
  const spinner = Ora(message).start();
  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
};

export const formatError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.error ?? error.message;
    if (!status && error.code) {
      return `Network error (${error.code}). Please check your connection and try again.`;
    }
    if (status === 401 || status === 403) {
      return 'API key invalid or unauthorized. Run "enigma config" to update your key.';
    }
    if (status === 404) {
      return 'Endpoint not found. Please try again in a moment.';
    }
    return status ? `API error (${status}): ${detail}` : `API error: ${detail}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
};

export const printAnswer = (answer: string) => {
  console.log(chalk.greenBright('\n=== Perplexity ===\n'));
  console.log(answer);
  console.log('\n');
};

export const availableModelsMessage = () =>
  `Available models: ${AVAILABLE_MODELS.join(', ')}. Set a model with --model or in .pplxrc.`;
