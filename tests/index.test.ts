import { describe, expect, it, vi } from 'vitest';
import { startInteractiveSession } from '../src/index.js';

describe('startInteractiveSession', () => {
  it('keeps prompting until an exit command is entered', async () => {
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
    const prompts = ['   ', 'quit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift() ?? 'quit');
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(ask).not.toHaveBeenCalled();
  });
});
