const semver = require('semver');
const fs = require('fs-extra');

export default [
{
    type: 'input',
    name: 'name',
    message: 'Name of your plugin: ',
    validate: input => input.length > 0 ? true : 'Please input a name'
  },
  {
    type: 'input',
    name: 'version',
    message: 'Version (0.0.1): ',
    default: '0.0.1',
    validate: version => semver.valid(version) ? true : 'Please enter valid semver'
  },
  {
    type: 'input',
    name: 'author',
    message: 'Author: ',
  },
  {
    type: 'input',
    name: 'description',
    message: 'Description: ',
  },
  {
    type: 'input',
    name: 'keywords',
    message: 'Keywords (separated by comma): '
  },
  {
    type: 'input',
    name: 'license',
    message: 'License: ',
    default: 'MIT'
  },
  {
    type: 'confirm',
    name: 'dependencyCheck',
    message: 'Will your plugin depend on any other published plugins?',
    default: false
  },
  {
    type: 'input',
    name: 'dependencies',
    message: 'List your dependencies (separated by commas)',
    when: answers => answers.dependencyCheck
  },
  {
    type: 'input',
    name: 'destination',
    message: 'Pick a target destination for your plugin files',
    default: process.cwd,
    validate: dest => fs.existsSync(dest) ? true : 'Please enter valid path'
  },
];
