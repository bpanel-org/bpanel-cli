'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _child_process = require('child_process');

var _underscore = require('underscore');

var _inquirer = require('inquirer');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _questions = require('./questions');

var _questions2 = _interopRequireDefault(_questions);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// constants for identifying insertion points
// in the index template
const endImportsTag = '/* END IMPORTS */';
const startExportsTag = '/* START EXPORTS */';
const endExportsTag = '/* END EXPORTS */';

exports.default = async () => {
  const answers = await (0, _inquirer.prompt)(_questions2.default);
  try {
    let indexTemplate = _fsExtra2.default.readFileSync((0, _path.resolve)(__dirname, '../indexTemplates/base.txt'), 'utf8');
    indexTemplate = (0, _underscore.template)(indexTemplate);
    indexTemplate = indexTemplate(answers);
    const {
      destination,
      author,
      name,
      version,
      description,
      license,
      keywords,
      dependencies,
      modules,
      targetComponent,
      theme
    } = answers;
    const keywordList = (0, _helpers.listToArray)(keywords);
    const destinationPath = (0, _path.resolve)(destination, (0, _helpers.makePath)(name));

    console.log(_chalk2.default.green('Creating plugin directory...'));
    await _fsExtra2.default.mkdir(destinationPath);
    await _fsExtra2.default.copy((0, _path.resolve)(__dirname, '../template'), destinationPath);
    console.log(_chalk2.default.blue('Done.'));

    // composing the text of the plugin entry point index.js
    console.log(_chalk2.default.green('Setting up plugin entry point (index.js)...'));
    let index;
    if (dependencies) {
      const depsConfig = await (0, _helpers.setupDeps)(dependencies, destinationPath);
      index = (0, _helpers.insertText)(depsConfig.import, indexTemplate, endImportsTag);
      index = (0, _helpers.insertText)(depsConfig.arr + '\n', index, startExportsTag);
      index = (0, _helpers.insertText)(depsConfig.export + '\n', index, endExportsTag);
    } else {
      index = indexTemplate + '\n';
    }

    if (theme) {
      const themeIndexText = await (0, _helpers.setupTheme)(index, destinationPath);
      index = (0, _helpers.insertText)(themeIndexText.imports, index, endImportsTag);
      index = (0, _helpers.insertText)(themeIndexText.exports, index, endExportsTag);
    }

    if (modules) {
      modules.forEach(async module => {
        const moduleTemplate = (0, _helpers.setupModule)(targetComponent)(module);
        index = (0, _helpers.insertText)(moduleTemplate, index, endExportsTag);
      });
    }

    // append text for index file
    await _fsExtra2.default.appendFile((0, _path.resolve)(destinationPath, 'index.js'), index);
    console.log(_chalk2.default.blue('Done.'));

    // add information to the plugin's package.json
    const pkgJson = await _fsExtra2.default.readFile((0, _path.resolve)(destinationPath, 'package.json'), 'utf8');
    const newPkg = (0, _assign2.default)(JSON.parse(pkgJson), { name, version, description, license, author, keywords: keywordList });
    await _fsExtra2.default.writeFile((0, _path.resolve)(destinationPath, 'package.json'), (0, _stringify2.default)(newPkg, null, 2));

    // setup npm dependencies for plugin
    console.log(_chalk2.default.green('Setting up node_modules...'));
    (0, _child_process.execSync)('npm install', { stdio: [0, 1, 2], cwd: destinationPath });
    if (dependencies) {
      console.log(_chalk2.default.green('Installing plugin dependencies from npm'));
      (0, _child_process.execSync)(`npm install ${dependencies.replace(/,/g, '')}`, { stdio: [0, 1, 2], cwd: destinationPath });
    }

    console.log(_chalk2.default.green('You\'re ready to start developing your plugin!'));
    console.log(_chalk2.default.green('Your plugin can be found here: ', destinationPath));
  } catch (err) {
    console.log(_chalk2.default.red('There was an error: ', err));
  }
};