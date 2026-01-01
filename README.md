# Perplexity - Enigma CLI

Your friendly Windows-first CLI for asking Perplexity anything—no Node.js expertise required.

## What you'll be able to do
- Ask Perplexity questions right from PowerShell (`enigma "Explain this error"`).
- Stay interactive with quick follow-ups (`enigma` then keep chatting).
- Save your settings once; they auto-load every time.
- Switch models on the fly (sonar, sonar-pro, sonar-reasoning, sonar-deep-research, etc.).

---

## Windows Quick Start (≈2 minutes)
1. **Install Node.js 18+**  
   Download and run: https://nodejs.org (LTS recommended).

2. **Open PowerShell** (Start menu ➜ type “PowerShell” ➜ Run).

3. **Install Enigma from npm**  
   ```powershell
   npm install -g perplexity-enigma
   ```
   (If you’re running from this repo instead, run `pwsh .\setup.ps1`.)

4. **Launch and enter your API key**  
   ```powershell
   enigma
   ```
   - If no key is found, you’ll be prompted to paste it.  
   - Key is saved to both `.env` and `.pplxrc` for future runs.

5. **See it work**  
   ```powershell
   enigma "What can you help me with?"
   ```

Visual confirmation: you’ll see a green “=== Perplexity ===” header followed by the answer.

---

## Commands you’ll use most
- `enigma` — Interactive mode (type `:help` inside for tips, `:exit` to quit).
- `enigma ask "your question"` — One-shot question.
- `enigma --model sonar-pro "optimize this script"` — Override model for a call.
- `enigma config` — View resolved config (model, search mode, streaming note).
- `enigma config --save` — Persist current settings to `.pplxrc` (path shown).

Run `enigma --help` or `enigma <command> --help` for examples.

---

## Configuration & Models
Precedence: **Env vars > `.pplxrc` > defaults**.  
Key env vars: `PPLX_API_KEY`, `PPLX_MODEL_DEFAULT`, `PPLX_SEARCH_MODE`, `PPLX_OUTPUT_STREAM`.

Built-in models list:
`sonar`, `sonar-pro`, `sonar-reasoning`, `sonar-reasoning-pro`, `sonar-reasoning-large`, `sonar-deep-research`, `sonar-large`.
If you provide an invalid model, Enigma shows the valid list and falls back to the default (`sonar-pro`).

`.pplxrc` is YAML; malformed YAML is ignored with a warning and defaults are used.

---

## Windows specifics
- PowerShell profile lives at: `C:\Users\<you>\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`
- `setup.ps1` is idempotent: it creates the profile if missing, avoids duplicate `enigma` functions, and prints what changed.
- After running `setup.ps1`, restart PowerShell (or run `. $PROFILE`) then use `enigma` anywhere.

---

## Troubleshooting
| Issue | What to do |
| --- | --- |
| **API key not found** | Run `enigma`; paste your key when prompted or run `enigma config` to set it. |
| **API key invalid (401/403)** | Re-run `enigma config` and update your key. |
| **Invalid model** | CLI will list available models and auto-fallback to `sonar-pro`. |
| **Network/timeout** | Check connection/VPN, then retry your question. |
| **Malformed .pplxrc** | CLI will warn and continue with defaults. Fix the YAML or delete `.pplxrc`. |
| **Command not found** | If installed globally, restart PowerShell or run `. $PROFILE`. For local dev, use `npm link` then `enigma`. |

---

## Development (optional)
```bash
npm install
npm run build
npm test
npm link   # to try the global `enigma` command locally
```

---

## FAQ (Windows)
- **Where do files live?** In this folder; profile is at `C:\\Users\\<you>\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1`.
- **Do I need Git?** Only if running from source. From npm, just `npm install -g perplexity-enigma`.
- **Can I change models per call?** Yes: `enigma --model sonar-reasoning "question"`.
- **How do I exit interactive mode?** Type `:exit` or press `Ctrl+C`.

Happy questioning!
