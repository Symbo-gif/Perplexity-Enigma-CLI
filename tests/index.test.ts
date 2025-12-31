import { describe, expect, it, vi } from 'vitest';

describe('startInteractiveSession', () => {
  it('keeps prompting until an exit command is entered', async () => {
    const { startInteractiveSession } = await import('../src/index.js');
    const prompts = ['First question', 'Second question', 'exit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift() ?? 'exit');
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(3);
    expect(ask).toHaveBeenCalledTimes(2);
    expect(ask).toHaveBeenNthCalledWith(1, 'First question', {});
    expect(ask).toHaveBeenNthCalledWith(2, 'Second question', {});
  });

  it('ignores blank input and keeps the session alive', async () => {
    const { startInteractiveSession } = await import('../src/index.js');
    const prompts = ['   ', 'quit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift() ?? 'quit');
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(ask).not.toHaveBeenCalled();
  });
});
