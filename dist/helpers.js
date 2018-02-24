'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupModule = exports.modulesWithTarget = exports.setupTheme = exports.setupDeps = exports.insertText = exports.camelize = exports.listToArray = exports.makePath = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _path = require('path');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _underscore = require('underscore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const makePath = exports.makePath = str => str.toLowerCase().replace(/ /g, '-');

const listToArray = exports.listToArray = list => list.replace(/ /g, '').split(',');

const camelize = exports.camelize = str => str.replace(/_/g, '-').replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
  return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
}).replace(/[^\w\s]/gi, '');

// Will return mutated string with str being inserted in destination
// at specified target
const insertText = exports.insertText = (str, destination, target) => {
  const index = destination.indexOf(target);
  (0, _assert2.default)(index > -1, 'Target in destination for string insertion did not exit');
  const beginning = destination.slice(0, index);
  const end = destination.slice(index);
  return beginning + str + '\n' + end;
};

const setupDeps = exports.setupDeps = async (deps_, pluginRoot) => {
  const deps = Array.isArray(deps_) ? deps_ : listToArray(deps_);
  let pluginsIndex = '';
  let pluginsList = ' ';
  deps.forEach(async dep => {
    const camelized = camelize(dep);
    pluginsList += `${camelized}, `;
    pluginsIndex += `import * as ${camelized} from '${dep}'; \n`;
  });

  pluginsIndex += `\nexport default {${pluginsList}};`;
  await _fsExtra2.default.appendFile((0, _path.resolve)(pluginRoot, 'lib', 'plugins.js'), pluginsIndex);

  return {
    import: `import modules from './lib/plugins';`,
    arr: `const plugins = Object.keys(modules).map(name => modules[name]);`,
    export: `export const pluginConfig = {plugins};`
  };
};

const setupTheme = exports.setupTheme = async (indexText_, pluginRoot) => {
  let indexText = indexText_;
  let configText = `// Configuration for your plugin theme.` + `\n` + `// The "skeleton" of your styles` + `\n\n` + `import themeVariables from './themeVariables';` + `\n\n` + `const { } = themeVariables; // import the variables for your config here` + `\n\n` + `// setup your configs here, e.g. \`app\` or \`sidebar\` objects` + `\n` + `const themeConfigs = {};` + `\n\n` + `export default themeConfigs;` + `\n`;

  let varText = `// Set the variables that you would like to update for your theme \n\n` + `// Setup variables object to be imported in your themeConfigs \n` + `const themeVariables = {}; \n\n` + `export default themeVariables;\n`;

  const themeImports = `import themeVariables from './lib/themeVariables';` + `\n` + `import themeConfig from './lib/themeConfig';` + `\n`;

  const themeExport = `export const decorateTheme = themeCreator => () =>` + `\n` + `  themeCreator(themeVariables, themeConfig);` + `\n`;

  await _promise2.default.all([_fsExtra2.default.appendFile((0, _path.resolve)(pluginRoot, 'lib', 'themeConfig.js'), configText), _fsExtra2.default.appendFile((0, _path.resolve)(pluginRoot, 'lib', 'themeVariables.js'), varText)]);

  return {
    imports: themeImports,
    exports: themeExport
  };
};

const modulesWithTarget = exports.modulesWithTarget = ['decorateComponent', 'mapComponentState', 'mapComponentDispatch'];

const setupModule = exports.setupModule = targetComponent => module => {
  let moduleTemplate = _fsExtra2.default.readFileSync((0, _path.resolve)(__dirname, '../indexTemplates/', `${module}.txt`), 'utf8');
  if (targetComponent) {
    moduleTemplate = (0, _underscore.template)(moduleTemplate);
    return moduleTemplate({ targetComponent });
  }
  return moduleTemplate;
};