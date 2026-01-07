import axios from 'axios';
import Ora from 'ora';
import chalk from 'chalk';
import { EnigmaConfig, resolveApiKey, validateModelName, AVAILABLE_MODELS } from './config.js';

export type AskOptions = {
  model?: string;
  searchMode?: 'low' | 'medium' | 'high';
};

/**
 * Builds the API payload with all configured parameters.
 * Wires agent config (temperature, max_tokens, top_p) and research config to the API.
 */
export const buildApiPayload = (
  question: string,
  config: EnigmaConfig,
  options: AskOptions,
  streaming: boolean = false
): Record<string, unknown> => {
  const validatedModel = validateModelName(options.model, config).model;
  
  return {
    model: validatedModel,
    messages: [{ role: 'user', content: question }],
    stream: streaming,
    // Research config
    search_mode: options.searchMode ?? config.research.search_mode,
    // Agent config - wired to API payload
    temperature: config.agent.temperature,
    max_tokens: config.agent.max_tokens,
    top_p: config.agent.top_p,
  };
};

/**
 * Non-streaming request to Perplexity API.
 */
export const askPerplexity = async (
  question: string,
  config: EnigmaConfig,
  options: AskOptions = {},
): Promise<string> => {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error('API key not found. Run "enigma config" to set it up.');
  }

  const payload = buildApiPayload(question, config, options, false);

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

/**
 * Parses a Server-Sent Events (SSE) line and extracts the content delta.
 * Returns the content string if present, null for keep-alive or non-content messages,
 * or 'done' if the stream is complete.
 */
export const parseSSELine = (line: string): string | null | 'done' => {
  if (!line || line.trim() === '') {
    return null;
  }
  
  if (line.startsWith(':')) {
    // SSE comment (keep-alive)
    return null;
  }
  
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  const data = line.slice(6); // Remove 'data: ' prefix
  
  if (data === '[DONE]') {
    return 'done';
  }
  
  try {
    const parsed = JSON.parse(data);
    const delta = parsed?.choices?.[0]?.delta?.content;
    if (typeof delta === 'string') {
      return delta;
    }
    return null;
  } catch {
    // JSON parse error - skip this chunk
    return null;
  }
};

/**
 * Streaming request to Perplexity API with progressive terminal output.
 * Uses Server-Sent Events (SSE) to receive incremental responses.
 */
export const askPerplexityStreaming = async (
  question: string,
  config: EnigmaConfig,
  options: AskOptions = {},
): Promise<void> => {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error('API key not found. Run "enigma config" to set it up.');
  }

  const payload = buildApiPayload(question, config, options, true);

  const response = await axios.post(`${config.api.base_url}/chat/completions`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    timeout: config.api.timeout,
    responseType: 'stream',
  });

  return new Promise<void>((resolve, reject) => {
    let buffer = '';
    
    response.data.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        const result = parseSSELine(line);
        if (result === 'done') {
          resolve();
          return;
        }
        if (result !== null) {
          process.stdout.write(result);
        }
      }
    });
    
    response.data.on('end', () => {
      // Process any remaining buffer
      if (buffer.trim()) {
        const result = parseSSELine(buffer);
        if (result !== null && result !== 'done') {
          process.stdout.write(result);
        }
      }
      resolve();
    });
    
    response.data.on('error', (error: Error) => {
      reject(new Error(`Stream interrupted: ${error.message}`));
    });
  });
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
    if (status === 429) {
      return 'Rate limit exceeded. Please wait a moment and try again.';
    }
    if (status === 500 || status === 502 || status === 503) {
      return `Server error (${status}). The Perplexity API may be temporarily unavailable. Please try again later.`;
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
