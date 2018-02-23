#!/usr/bin/env node
import program from 'commander';

import makePlugin from './makePlugin';
const { description, version } = require('../package.json');

program
  .version(version)
  .description(description);

program
  .command('create')
  .description('Generate a boilerplate bpanel plugin')
  .action(makePlugin());

program.parse(process.argv);