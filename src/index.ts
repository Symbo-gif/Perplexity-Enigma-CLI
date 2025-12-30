#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { loadConfig, saveConfig } from './config.js';
import { askPerplexity, formatError, printAnswer, withSpinner } from './perplexity.js';

const program = new Command();
program.name('enigma').description('Perplexity - Enigma CLI').version('1.0.0');

const handleQuestion = async (question: string, options: { model?: string; searchMode?: string }) => {
  const config = loadConfig();
  try {
    const answer = await withSpinner('Contacting Perplexity...', () =>
      askPerplexity(question, config, {
        model: options.model,
        searchMode: options.searchMode as any,
      }),
    );
    printAnswer(answer);
  } catch (error) {
    console.error(chalk.red(formatError(error)));
    process.exitCode = 1;
  }
};

program
  .argument('[question...]', 'Ask a question (interactive mode if omitted)')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --search-mode <mode>', 'Search mode: low | medium | high')
  .action(async (questionParts: string[], options) => {
    const question =
      questionParts.length > 0 ? questionParts.join(' ') : readlineSync.question('What would you like to ask Perplexity?\n> ');
    if (!question.trim()) {
      console.error(chalk.yellow('No question provided. Exiting.'));
      return;
    }
    await handleQuestion(question, options);
  });

program
  .command('ask')
  .description('Ask Perplexity a question without entering interactive mode')
  .argument('<question...>', 'Question to ask')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --search-mode <mode>', 'Search mode: low | medium | high')
  .action(async (questionParts: string[], options) => {
    const question = questionParts.join(' ');
    await handleQuestion(question, options);
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

program.parseAsync(process.argv);
