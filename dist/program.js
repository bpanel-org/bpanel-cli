#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _makePlugin = require('./makePlugin');

var _makePlugin2 = _interopRequireDefault(_makePlugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { description, version } = require('../package.json');

_commander2.default.version(version).description(description);

_commander2.default.command('create').description('Generate a boilerplate bpanel plugin').action(_makePlugin2.default);

_commander2.default.parse(process.argv);