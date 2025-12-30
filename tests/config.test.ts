import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadConfig', () => {
  it('returns defaults when no config file is present', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-config-'));

    const { loadConfig, defaultConfig } = await import('../src/config.js');
    const config = loadConfig(baseDir);

    expect(config.api.base_url).toBe(defaultConfig.api.base_url);
    expect(config.models.default).toBe(defaultConfig.models.default);
    expect(config.output.stream).toBe(true);
  });

  it('applies environment variable overrides', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-config-env-'));
    vi.stubEnv('PPLX_MODEL_DEFAULT', 'sonar');
    vi.stubEnv('PPLX_OUTPUT_STREAM', 'false');

    const { loadConfig } = await import('../src/config.js');
    const config = loadConfig(baseDir);

    expect(config.models.default).toBe('sonar');
    expect(config.output.stream).toBe(false);
  });

  it('merges values from .pplxrc when present', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enigma-config-file-'));

    const configPath = path.join(baseDir, '.pplxrc');
    fs.writeFileSync(
      configPath,
      `
api:
  base_url: "https://example.test"
output:
  format: "json"
`,
    );

    const { loadConfig } = await import('../src/config.js');
    const config = loadConfig(baseDir);

    expect(config.api.base_url).toBe('https://example.test');
    expect(config.output.format).toBe('json');
  });
});
