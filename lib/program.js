#!/usr/bin/env node
import program from 'commander';
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
    .description('Generate a boilerplate bpanel plugin')
    .action(create(config, logger));

  program
    .command('install')
    .description('Install a plugin for your local bPanel instance.')
    .action(install(config, logger));

  program.parse(process.argv);
})()
