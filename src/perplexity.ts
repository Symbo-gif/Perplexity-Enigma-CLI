import axios from 'axios';
import Ora from 'ora';
import chalk from 'chalk';
import { EnigmaConfig, resolveApiKey } from './config.js';

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
    throw new Error('Perplexity API key is not configured. Set PPLX_API_KEY or update .pplxrc.');
  }

  const payload = {
    model: options.model ?? config.models.default,
    messages: [{ role: 'user', content: question }],
    stream: config.output.stream,
    search_mode: options.searchMode ?? config.research.search_mode,
  };

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
    return status ? `API error (${status}): ${detail}` : `API error: ${detail}`;
  }
  return (error as Error).message ?? String(error);
};

export const printAnswer = (answer: string) => {
  console.log(chalk.greenBright('\n=== Perplexity ===\n'));
  console.log(answer);
  console.log('\n');
};
