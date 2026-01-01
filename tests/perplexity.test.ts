import { describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => {
  const post = vi.fn().mockResolvedValue({
    data: { choices: [{ message: { content: 'hello world' } }] },
  });
  const isAxiosError = (err: any) => Boolean(err?.isAxiosError);
  return {
    default: { post, isAxiosError },
    isAxiosError,
  };
});

describe('askPerplexity', () => {
  it('builds the correct request payload', async () => {
    const axios = await import('axios');
    const { askPerplexity } = await import('../src/perplexity.js');
    const { defaultConfig } = await import('../src/config.js');

    const config = {
      ...defaultConfig,
      api: { ...defaultConfig.api, key: 'pplx-test' },
    };

    const answer = await askPerplexity('test question', config, { model: 'sonar-reasoning' });

    expect(answer).toBe('hello world');
    expect((axios as any).default.post).toHaveBeenCalledWith(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-reasoning',
        messages: [{ role: 'user', content: 'test question' }],
        stream: false,
        search_mode: 'medium',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer pplx-test',
          'Content-Type': 'application/json',
        }),
        timeout: 60000,
      }),
    );
  });

  it('throws when the API key is missing', async () => {
    const { askPerplexity } = await import('../src/perplexity.js');
    const { defaultConfig } = await import('../src/config.js');
    const config = { ...defaultConfig };

    await expect(askPerplexity('hello', config)).rejects.toThrow(/API key/i);
  });

  it('falls back to default model when invalid', async () => {
    const axios = await import('axios');
    const { askPerplexity } = await import('../src/perplexity.js');
    const { defaultConfig } = await import('../src/config.js');
    const config = {
      ...defaultConfig,
      api: { ...defaultConfig.api, key: 'pplx-test' },
    };

    const answer = await askPerplexity('test question', config, { model: 'invalid-model' });

    expect(answer).toBe('hello world');
    expect((axios as any).default.post).toHaveBeenCalledWith(
      'https://api.perplexity.ai/chat/completions',
      expect.objectContaining({ model: defaultConfig.models.default }),
      expect.any(Object),
    );
  });
});

describe('formatError', () => {
  it('returns actionable message for 401/403', async () => {
    const { formatError } = await import('../src/perplexity.js');
    const message = formatError({ isAxiosError: true, response: { status: 401 }, message: 'unauthorized' });
    expect(message).toMatch(/API key invalid/);
  });

  it('handles network errors with code', async () => {
    const { formatError } = await import('../src/perplexity.js');
    const message = formatError({ isAxiosError: true, code: 'ETIMEDOUT', message: 'timeout' });
    expect(message).toMatch(/Network error/);
  });
});
