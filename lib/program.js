#!/usr/bin/env node
import program from 'commander';
import chalk from 'chalk';
import Config from 'bcfg';
const Logger = require('blgr');


import create from './create';
import install from './install';

const { description, version } = require('../package.json');

const logger = new Logger('info');

const config = new Config('bpanel');
config.load({
  env: true,
  argv: true,
  arg: true
});

(async function() {
  await logger.open();

  program
    .version(version)
    .option('--prefix <path>', 'Prefix for module directory defaults to ~/.bpanel')
    .description(description);

  program
    .command('create')
    .alias('c')
    .description('Generate a boilerplate bpanel plugin')
    .action(create(config, logger));

  program
    .command('install [name]')
    .alias('i')
    .description('Install a plugin for your local bPanel instance.')
    .option('-l, --local', 'Install as local plugin. If not set, installs from npm.')
    .action(install(config, logger));

  program
    .command('uninstall [name]')
    .alias('u')
    .description('Removes all instances of a plugin from your bPanel\'s config')
    .option('-l, --local', 'Install as local plugin. If not set, installs from npm.')
    .action(install(config, logger));

  // output help if no command was passed
  if (!process.argv.slice(2).length) {
    logger.error('No command was passed. See options below:');
    program.outputHelp();
  }

  program.parse(process.argv);
})()
