import { describe, expect, it, vi } from 'vitest';
import { startInteractiveSession, normalizeAskOptions, ensureApiKeyInteractive } from '../src/index.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('normalizeAskOptions', () => {
  it('returns empty options when nothing provided', () => {
    const result = normalizeAskOptions({});
    expect(result).toEqual({ model: undefined, searchMode: undefined, stream: undefined });
  });

  it('passes through valid model', () => {
    const result = normalizeAskOptions({ model: 'sonar-pro' });
    expect(result.model).toBe('sonar-pro');
  });

  it('normalizes valid search modes', () => {
    expect(normalizeAskOptions({ searchMode: 'low' }).searchMode).toBe('low');
    expect(normalizeAskOptions({ searchMode: 'medium' }).searchMode).toBe('medium');
    expect(normalizeAskOptions({ searchMode: 'high' }).searchMode).toBe('high');
  });

  it('returns undefined for invalid search mode', () => {
    const result = normalizeAskOptions({ searchMode: 'invalid' });
    expect(result.searchMode).toBe(undefined);
  });

  it('passes through stream option', () => {
    expect(normalizeAskOptions({ stream: true }).stream).toBe(true);
    expect(normalizeAskOptions({ stream: false }).stream).toBe(false);
  });
});

describe('ensureApiKeyInteractive', () => {
  // Mock readline-sync
  vi.mock('readline-sync', () => ({
    default: {
      question: vi.fn(),
    },
  }));

  it('throws error when key is empty', async () => {
    const readlineSync = await import('readline-sync');
    vi.mocked(readlineSync.default.question).mockReturnValue('');

    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-key-'));
    const configPath = path.join(baseDir, '.pplxrc');

    expect(() => ensureApiKeyInteractive(configPath)).toThrow(/API key is required/);
  });

  it('throws error for invalid key format', async () => {
    const readlineSync = await import('readline-sync');
    vi.mocked(readlineSync.default.question).mockReturnValue('invalid-key');

    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-key-'));
    const configPath = path.join(baseDir, '.pplxrc');

    expect(() => ensureApiKeyInteractive(configPath)).toThrow(/Invalid API key/);
  });

  it('throws error for key that is too short', async () => {
    const readlineSync = await import('readline-sync');
    vi.mocked(readlineSync.default.question).mockReturnValue('pplx-short');

    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-key-'));
    const configPath = path.join(baseDir, '.pplxrc');

    expect(() => ensureApiKeyInteractive(configPath)).toThrow(/too short/);
  });
});

describe('startInteractiveSession', () => {
  it('keeps prompting until an exit command is entered', async () => {
    const prompts = ['First question', 'Second question', 'exit'];
    const promptFn = vi.fn().mockImplementation(() => {
      if (prompts.length === 0) {
        throw new Error('Unexpected prompt call');
      }
      return prompts.shift()!;
    });
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(3);
    expect(ask).toHaveBeenCalledTimes(2);
    expect(ask).toHaveBeenNthCalledWith(1, 'First question', {});
    expect(ask).toHaveBeenNthCalledWith(2, 'Second question', {});
  });

  it('ignores blank input and keeps the session alive', async () => {
    const prompts = ['   ', 'quit'];
    const promptFn = vi.fn().mockImplementation(() => {
      if (prompts.length === 0) {
        throw new Error('Unexpected prompt call');
      }
      return prompts.shift()!;
    });
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(ask).not.toHaveBeenCalled();
  });

  it('shows help and exits on :exit', async () => {
    const prompts = [':help', ':exit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift()!);
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(ask).not.toHaveBeenCalled();
  });

  it('handles Ctrl+C gracefully', async () => {
    const promptFn = vi.fn().mockImplementation(() => {
      throw new Error('SIGINT');
    });
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(1);
    expect(ask).not.toHaveBeenCalled();
  });

  it('handles error in ask function gracefully', async () => {
    const prompts = ['question', 'exit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift()!);
    const ask = vi.fn().mockRejectedValue(new Error('API error'));

    await startInteractiveSession({}, promptFn, ask);

    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('passes options to ask function', async () => {
    const prompts = ['question', 'exit'];
    const promptFn = vi.fn().mockImplementation(() => prompts.shift()!);
    const ask = vi.fn().mockResolvedValue(undefined);

    await startInteractiveSession({ model: 'sonar-pro', stream: true }, promptFn, ask);

    expect(ask).toHaveBeenCalledWith('question', { model: 'sonar-pro', stream: true });
  });
});
