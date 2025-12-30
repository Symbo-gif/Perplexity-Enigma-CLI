import { describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => {
  const post = vi.fn().mockResolvedValue({
    data: { choices: [{ message: { content: 'hello world' } }] },
  });
  return {
    default: { post },
    isAxiosError: (err: any) => Boolean(err?.isAxiosError),
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
        stream: true,
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
});
