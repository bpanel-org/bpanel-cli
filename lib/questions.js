import semver from 'semver';
import fs from 'fs-extra';
import validate from 'validate-npm-package-name';

import { modulesWithTarget } from './helpers';

export default [
{
    type: 'input',
    name: 'name',
    message: 'Name of your plugin: ',
    // npm name validation so plugin names conform to npm rules
    validate: input => {
      const { errors = [], warnings = [], validForNewPackages } = validate(input);

      if (errors.length || warnings.length) return errors.concat(warnings).join(' & ');
      return validForNewPackages;
    }
  },
  {
    type: 'input',
    name: 'display',
    message: 'Display name (defaults to package name if blank):'
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
    message: 'Will your plugin depend on any other published bPanel plugins?',
    default: false
  },
  {
    type: 'input',
    name: 'dependencies',
    message: 'List your dependencies (separated by commas and only valid bPanel plugins):',
    when: answers => answers.dependencyCheck,
    validate: plugins => {
      const pluginsArr = plugins.split(',');
      for (let plugin of pluginsArr){
        if (plugin.indexOf('bpanel-ui') > -1
        || plugin.indexOf('bpanel-utils') > -1) {
          return `${plugin} is not a valid bPanel plugin but a utility library `+
                  `and is already included in peerDependencies by default. `+
                  `Plugins must expose metadata and at least one of the API ` +
                  `extensions (e.g. decoratePanel or middleware)`;
        } else if (plugin.indexOf('bpanel-cli') > -1) {
          return `${plugin} is not a plugin`;
        }
      };
      return true;
    }
  },
  {
    type: 'confirm',
    name: 'theme',
    message: 'Will you be making a theme?',
    default: false
  },
  {
    type: 'confirm',
    name: 'nav',
    message: 'Would you like to add your plugin to the app\'s navigation?',
    default: false

  },
  {
    type: 'autocomplete',
    name: 'icon',
    message: 'What icon would you like to use for your nav item? (supports font awesome icon names: https://fontawesome.com) ',
    when: answers => answers.nav,
    validate: icon => {
      if ( /fa-/.test(icon) )
        return `Exclude 'fa-' prefix`;
      else if (/\s/.test(icon))
        return 'Must not include white space'
      return true;
    }
  },
  {
    type: 'confirm',
    name: 'additionalModules',
    message: 'Would you like to add any additional module templates (e.g. mapComponentState, decoratePanel, reduceNode, etc.)?',
    default: false
  },
  {
    type: 'checkbox',
    name: 'modules',
    message: 'Select additional modules (choose none to build yourself)',
    choices: [
      {
        name: 'decorateComponent'
      },
      {
        name: 'decoratePanel'
      },
      {
        name: 'getRouteProps'
      },
      {
        name: 'mapComponentDispatch'
      },
      {
        name: 'mapComponentState'
      },
      {
        name: 'middleware'
      },
      {
        name: 'reduceNode'
      },
      {
        name: 'reduceChain'
      },
      {
        name: 'reduceWallets'
      },
      {
        name: 'reducePlugins'
      },
      {
        name: 'socketListeners'
      }
    ],
    when: answers => answers.additionalModules
  },
  {
    type: 'list',
    name: 'targetComponent',
    message: 'Pick target component for decoration or mapping:',
    choices: ['Footer', 'Header', 'Sidebar', 'Panel'],
    when: answers => {
      const { modules } = answers;
      if (!modules)
        return false;
      return modulesWithTarget.some(name => modules.indexOf(name) > -1);
    }
  },
  {
    type: 'input',
    name: 'destination',
    message: 'Pick a target destination for your plugin directory',
    default: process.cwd,
    validate: dest => fs.existsSync(dest) ? true : 'Please enter valid path. Must be absolute path'
  },
];
