# Perplexity - Enigma CLI

Perplexity Enigma is a lightweight command-line wrapper around the Perplexity API with sensible defaults, YAML/ENV configuration, and a PowerShell-friendly bootstrap script.

## Requirements

- Node.js 18+
- A Perplexity API key from https://www.perplexity.ai/settings/api

## Quick start

```bash
git clone https://github.com/Symbo-gif/Perplexity-Enigma-CLI
cd Perplexity-Enigma-CLI
npm install
cp .env.example .env   # add your PPLX_API_KEY
npm run build
npm start -- "What is the Perplexity Enigma CLI?"
```

You can also install the PowerShell helper that adds an `enigma` function to your profile:

```powershell
pwsh ./setup.ps1
# Restart your shell, then run:
enigma "Tell me a joke about TypeScript"
```

## Configuration

Enigma reads settings from (in order of precedence):

1. Environment variables (e.g. `PPLX_API_KEY`, `PPLX_MODEL_DEFAULT`, `PPLX_OUTPUT_STREAM`)
2. A YAML file at `.pplxrc` (see `.pplxrc.example`)
3. Built-in defaults (Sonar Pro, streaming output, medium search)

Create your own config by copying `.pplxrc.example`:

```bash
cp .pplxrc.example .pplxrc
```

Show the resolved configuration:

```bash
npm start -- config
# or once built:
node dist/index.js config
```

## Usage

```bash
# Interactive prompt (default)
enigma

# One-shot question
enigma ask "How do I use the Perplexity API?" --model sonar-reasoning

# Save the resolved config to .pplxrc
enigma config --save
```

Flags:

- `--model` / `-m`: override the model for a single call
- `--search-mode` / `-s`: set search aggressiveness (`low`, `medium`, `high`)

## Development

```bash
npm install
npm run build   # compile TypeScript to dist/
npm test        # run vitest suite
npm run dev     # run the CLI in watch mode with tsx
```

Generated artifacts live in `dist/`. PowerShell wrapper scripts are in `bin/` and `setup.ps1` wires them into your profile on Windows.
