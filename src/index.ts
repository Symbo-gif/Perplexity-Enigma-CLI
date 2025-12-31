#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { loadConfig, parseSearchMode, saveConfig } from './config.js';
import { askPerplexity, formatError, printAnswer, withSpinner } from './perplexity.js';

const program = new Command();
program.name('enigma').description('Perplexity - Enigma CLI').version('1.0.0');

type NormalizedAskOptions = { model?: string; searchMode?: 'low' | 'medium' | 'high' };

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

const handleQuestion = async (question: string, options: { model?: string; searchMode?: 'low' | 'medium' | 'high' }) => {
  const config = loadConfig();
  try {
    const answer = await withSpinner('Contacting Perplexity...', () =>
      askPerplexity(question, config, {
        model: options.model,
        searchMode: options.searchMode,
      }),
    );
    printAnswer(answer);
  } catch (error) {
    console.error(chalk.red(formatError(error)));
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
  console.log(chalk.cyan('\nInteractive mode. Type "exit" to quit.\n'));

  while (true) {
    const input = prompt('> ');
    const trimmed = input.trim();
    if (!trimmed) {
      console.log(chalk.yellow('Please enter a question or type "exit" to quit.'));
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'exit' || lower === 'quit') {
      console.log(chalk.cyan('Goodbye!'));
      break;
    }

    try {
      await ask(trimmed, options);
    } catch (error) {
      console.error(chalk.red(formatError(error)));
    }
  }
};

program
  .argument('[question...]', 'Ask a question (interactive mode if omitted)')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --search-mode <mode>', 'Search mode: low | medium | high')
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
  .action(async (questionParts: string[], options) => {
    const question = questionParts.join(' ');
    await handleQuestion(question, normalizeAskOptions(options));
  });

program
  .command('config')
  .description('Show the resolved configuration and write it back if needed')
  .option('--save', 'Persist the resolved config to .pplxrc')
  .action((options) => {
    const config = loadConfig();
    console.log(chalk.cyan('\nResolved configuration:'));
    console.log(JSON.stringify(config, null, 2));

    if (options.save) {
      saveConfig(config);
      console.log(chalk.green('Configuration written to .pplxrc'));
    }
  });

if (process.env.VITEST !== 'true') {
  program.parseAsync(process.argv);
}

export { normalizeAskOptions, handleQuestion, startInteractiveSession };
