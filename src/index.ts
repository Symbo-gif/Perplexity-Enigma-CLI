#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { loadConfig, parseSearchMode, saveConfig } from './config.js';
import { askPerplexity, availableModelsMessage, formatError, printAnswer, withSpinner } from './perplexity.js';

const program = new Command();
program.name('enigma').description('Perplexity - Enigma CLI').version('1.0.0');

type NormalizedAskOptions = { model?: string; searchMode?: ReturnType<typeof parseSearchMode> };

const logFormattedError = (error: unknown) => {
  console.error(chalk.red(formatError(error)));
};

const EXIT_INSTRUCTIONS = 'Type "exit" or "quit" to leave.';

const normalizeAskOptions = (options: { model?: string; searchMode?: string }): NormalizedAskOptions => {
  const normalizedSearchMode = parseSearchMode(options.searchMode);
  if (options.searchMode && !normalizedSearchMode) {
    console.error(chalk.yellow(`Search mode "${options.searchMode}" is invalid. Using config default.`));
  }
  return {
    model: options.model,
    searchMode: normalizedSearchMode,
  };
};

const ensureApiKeyInteractive = (configPath: string): string => {
  console.log(chalk.yellow('\nNo Perplexity API key found.'));
  const key = readlineSync.question('Paste your PPLX API key (starts with pplx-), or press Enter to cancel: ', {
    hideEchoBack: true,
  });
  if (!key.trim()) {
    throw new Error('API key is required. Run "enigma config" to set it later.');
  }

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, `PPLX_API_KEY=${key.trim()}\n`, 'utf-8');
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig, api: { ...currentConfig.api, key: key.trim() } };
  saveConfig(updatedConfig, configPath);

  console.log(chalk.green('\nSaved your API key to .env and .pplxrc.'));
  console.log(chalk.cyan('Try: enigma "What can you do?"\n'));
  return key.trim();
};

const handleQuestion = async (question: string, options: NormalizedAskOptions) => {
  const config = loadConfig();
  const configPath = path.join(process.cwd(), '.pplxrc');
  const apiKey = process.env.PPLX_API_KEY ?? config.api.key;
  let effectiveConfig = config;
  if (!apiKey) {
    try {
      const newKey = ensureApiKeyInteractive(configPath);
      effectiveConfig = { ...config, api: { ...config.api, key: newKey } };
    } catch (err) {
      throw err;
    }
  }
  try {
    const answer = await withSpinner('Contacting Perplexity...', () =>
      askPerplexity(question, effectiveConfig, {
        model: options.model,
        searchMode: options.searchMode,
      }),
    );
    printAnswer(answer);
  } catch (error) {
    logFormattedError(error);
    process.exitCode = 1;
  }
};

/**
 * Runs the interactive prompt loop, repeatedly asking questions until the user exits.
 */
const startInteractiveSession = async (
  options: NormalizedAskOptions,
  prompt: (query: string) => string = readlineSync.question,
  ask: (question: string, opts: NormalizedAskOptions) => Promise<void> = handleQuestion,
) => {
  console.log(chalk.cyan('\nWelcome to Enigma!'));
  console.log(chalk.cyan('Type your question or :help for commands | :exit to quit\n'));

  while (true) {
    let input: string;
    try {
      input = prompt('> ');
    } catch (err) {
      console.log(chalk.cyan('\nExiting. See you next time!'));
      break;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      console.log(chalk.yellow('Please enter a question or type :help'));
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (lower === ':help' || lower === 'help') {
      console.log(chalk.cyan('\nExamples:'));
      console.log(chalk.cyan('  enigma ask "How do I create a PowerShell profile?"'));
      console.log(chalk.cyan('  enigma --model sonar-pro "Summarize this repo"'));
      console.log(chalk.cyan(availableModelsMessage()));
      continue;
    }

    if (lower === 'exit' || lower === 'quit' || lower === ':exit') {
      console.log(chalk.cyan('Goodbye!'));
      break;
    }

    try {
      await ask(trimmed, options);
    } catch (error) {
      logFormattedError(error);
      console.error(chalk.yellow(`An error occurred. Please try again or ${EXIT_INSTRUCTIONS.toLowerCase()}`));
    }
  }
};

program
  .argument('[question...]', 'Ask a question (interactive mode if omitted)')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --search-mode <mode>', 'Search mode: low | medium | high')
  .addHelpText(
    'after',
    `
Examples:
  enigma                         # Start interactive mode
  enigma "How do I deploy?"      # Quick answer
  enigma --model sonar-pro "Debug this test"
`,
  )
  .action(async (questionParts: string[], options) => {
    const normalizedOptions = normalizeAskOptions(options);

    if (questionParts.length === 0) {
      await startInteractiveSession(normalizedOptions);
      return;
    }

    const question = questionParts.join(' ');
    if (!question.trim()) {
      console.error(chalk.yellow('No question provided. Exiting.'));
      return;
    }
    await handleQuestion(question, normalizedOptions);
  });

program
  .command('ask')
  .description('Ask Perplexity a question without entering interactive mode')
  .argument('<question...>', 'Question to ask')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --search-mode <mode>', 'Search mode: low | medium | high')
  .addHelpText(
    'after',
    `
Example:
  enigma ask "What is PowerShell profile?"
`,
  )
  .action(async (questionParts: string[], options) => {
    const question = questionParts.join(' ');
    await handleQuestion(question, normalizeAskOptions(options));
  });

program
  .command('config')
  .description('Show the resolved configuration and write it back if needed')
  .option('--save', 'Persist the resolved config to .pplxrc')
  .addHelpText(
    'after',
    `
Examples:
  enigma config            # Show current settings (model, search mode, streaming)
  enigma config --save     # Save resolved config path to .pplxrc
`,
  )
  .action((options) => {
    const config = loadConfig();
    console.log(chalk.cyan('\nResolved configuration:'));
    console.log(JSON.stringify(config, null, 2));
    console.log(chalk.yellow('Streaming is forced off for now.'));

    if (options.save) {
      const targetPath = path.join(process.cwd(), '.pplxrc');
      saveConfig(config, targetPath);
      console.log(chalk.green(`Configuration written to ${targetPath}`));
    }
  });

if (process.env.NODE_ENV !== 'test') {
  program.parseAsync(process.argv);
}

export { normalizeAskOptions, handleQuestion, startInteractiveSession };
