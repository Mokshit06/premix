#!/usr/bin/env node
import { Command } from 'commander';
import startDevServer from 'src/build/watcher';
import build from '../build';
import { fork } from 'child_process';
import { promises as fs, constants } from 'fs';
import chalk from 'chalk';

async function main() {
  const program = new Command();

  program.version('0.1');

  program
    .command('build')
    .description('Build Premix App')
    .action(async (source, destination) => {
      process.env.NODE_ENV ||= 'production';
      await build({
        production: true,
        prerender: false,
        watch: false,
      });
    });

  program
    .command('start')
    .description('Start bundled app')
    .option('-p, --port <number>', 'server port', '3000')
    .action(async options => {
      const build = 'build/server.js';
      process.env.NODE_ENV ||= 'production';
      process.env.PORT = options.port;

      try {
        await fs.access(build, constants.R_OK | constants.W_OK);
        fork(build);
      } catch (error) {
        console.log(
          chalk.red`Cannot find server build. Try running {underline yarn build}`
        );
      }
    });

  program
    .command('dev')
    .description('Start Premix dev server')
    .option('-p, --port <number>', 'server port', '3000')
    .action(async options => {
      process.env.NODE_ENV ||= 'development';
      process.env.PORT = options.port;

      await build({
        production: false,
        prerender: false,
        watch: true,
      });
      startDevServer();
    });

  program.parse(process.argv);
}

main();
