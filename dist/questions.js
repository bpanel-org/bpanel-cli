'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
  type: 'input',
  name: 'name',
  message: 'Name of your plugin: ',
  validate: input => input.length > 0 ? true : 'Please input a name'
}, {
  type: 'input',
  name: 'version',
  message: 'Version (0.0.1): ',
  default: '0.0.1',
  validate: version => _semver2.default.valid(version) ? true : 'Please enter valid semver'
}, {
  type: 'input',
  name: 'author',
  message: 'Author: '
}, {
  type: 'input',
  name: 'description',
  message: 'Description: '
}, {
  type: 'input',
  name: 'keywords',
  message: 'Keywords (separated by comma): '
}, {
  type: 'input',
  name: 'license',
  message: 'License: ',
  default: 'MIT'
}, {
  type: 'confirm',
  name: 'dependencyCheck',
  message: 'Will your plugin depend on any other published bpanel plugins?',
  default: false
}, {
  type: 'input',
  name: 'dependencies',
  message: 'List your dependencies (separated by commas and only the list of bpanel plugins your plugin depends on):',
  when: answers => answers.dependencyCheck
}, {
  type: 'confirm',
  name: 'theme',
  message: 'Will you be making a theme?',
  default: false
}, {
  type: 'confirm',
  name: 'additionalModules',
  message: 'Would you like to add any additional module templates (e.g. mapComponentState, decoratePanel, reduceNode, etc.)?',
  default: false
}, {
  type: 'checkbox',
  name: 'modules',
  message: 'Select additional modules (choose none to build yourself)',
  choices: [{
    name: 'decorateComponent'
  }, {
    name: 'decoratePanel'
  }, {
    name: 'getRouteProps'
  }, {
    name: 'mapComponentDispatch'
  }, {
    name: 'mapComponentState'
  }, {
    name: 'middleware'
  }, {
    name: 'reduceNode'
  }, {
    name: 'socketListeners'
  }],
  when: answers => answers.additionalModules
}, {
  type: 'list',
  name: 'targetComponent',
  message: 'Pick target component for decoration:',
  choices: ['Footer', 'Header', 'Sidebar', 'Panel'],
  when: answers => {
    const { modules } = answers;
    return _helpers.modulesWithTarget.some(name => modules.indexOf(name) > -1);
  }
}, {
  type: 'input',
  name: 'destination',
  message: 'Pick a target destination for your plugin directory',
  default: process.cwd,
  validate: dest => _fsExtra2.default.existsSync(dest) ? true : 'Please enter valid path'
}];