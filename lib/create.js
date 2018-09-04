import fs from 'fs-extra';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { template } from 'underscore';
import inquirer from 'inquirer';
import chalk from 'chalk';
import _ from 'underscore';
import { format } from 'prettier';
import assert from 'bsert';

import questions from './questions';
import {
  insertText,
  makePath,
  listToArray,
  setupDeps,
  setupModule,
  setupTheme
} from './helpers';

// constants for identifying insertion points
// in the index template
const endImportsTag = '/* END IMPORTS */';
const startExportsTag = '/* START EXPORTS */';
const endExportsTag = '/* END EXPORTS */';

export default (config, logger) => async () => {
  const answers = await inquirer.prompt(questions(config));
  const {
    author,
    dependencies,
    description,
    localPlugins,
    destination,
    display,
    keywords = '',
    license,
    modules = [],
    name,
    targetComponent,
    theme,
    nav,
    icon,
    version
  } = answers;
  const displayName = display ? display : name;
  // only needs path if it will decoratePanel
  const pathName = modules.indexOf('decoratePanel') > -1 ? encodeURI(name) : '';
  const metadata = Object.assign(answers, { displayName, pathName });

  try {
    const baseTemplate = fs.readFileSync(
      resolve(__dirname, '../indexTemplates/base.txt'),
      'utf8'
    );
    const _indexTemplate = template(baseTemplate);
    const indexTemplate = _indexTemplate(metadata);

    const keywordList = listToArray(keywords);
    let destinationPath;
    if (localPlugins) {
      const localPluginsDir = resolve(config.prefix, 'local_plugins');
      assert(
        fs.existsSync(localPluginsDir),
        'Cannot find local_plugins in your bPanel directory. \
        Make sure you have initialized your local bPanel. \
        If bPanel is set in a custom directory, make sure to set the --prefix \
        option correction when running bpanel-cli'
      );
      destinationPath = resolve(localPluginsDir, makePath(name));
    } else {
      destinationPath = resolve(destination, makePath(name));
    }

    logger.info(chalk.green('Creating plugin directory...'));
    await fs.ensureDir(destinationPath);
    await fs.copy(resolve(__dirname, '../template'), destinationPath);

    // since .gitignore won't make it in to the npm package
    // and thus won't be copied over from template
    // our template has a file prefixed with underscore
    // we need to rename it
    fs.renameSync(
      resolve(destinationPath, '_gitignore'),
      resolve(destinationPath, '.gitignore')
    );

    logger.info(chalk.blue('Done.'));

    // composing the text of the plugin entry point index.js
    logger.info(chalk.green('Setting up plugin entry point (lib/index.js)...'));
    let index;
    if (dependencies) {
      const depsConfig = await setupDeps(dependencies, destinationPath);
      index = insertText(depsConfig.import, indexTemplate, endImportsTag);
      index = insertText(depsConfig.arr + '\n', index, startExportsTag);
      index = insertText(depsConfig.export + '\n', index, endExportsTag);
    } else {
      index = indexTemplate + '\n';
    }

    if (theme) {
      const themeIndexText = await setupTheme(index, destinationPath);
      index = insertText(themeIndexText.imports, index, endImportsTag);
      index = insertText(themeIndexText.exports, index, endExportsTag);
    }

    if (modules) {
      modules.forEach(async module => {
        const moduleTemplate = setupModule(targetComponent)(module);
        index = insertText(moduleTemplate, index, endExportsTag);
      });
    }

    // append text for index file
    index = format(index, { singleQuote: true });
    await fs.appendFile(resolve(destinationPath, 'lib/index.js'), index);
    logger.info(chalk.blue('Done.'));

    // add information to the plugin's package.json
    const pkgJson = await fs.readFile(
      resolve(destinationPath, 'package.json'),
      'utf8'
    );
    const newKeywords = _.union(JSON.parse(pkgJson).keywords, keywordList);
    const newPkg = Object.assign(JSON.parse(pkgJson), {
      name,
      version,
      description,
      license,
      author,
      keywords: newKeywords
    });
    await fs.writeFile(
      resolve(destinationPath, 'package.json'),
      JSON.stringify(newPkg, null, 2)
    );

    // setup npm dependencies for plugin
    logger.info(chalk.green('Setting up node_modules...'));
    execSync('npm install', { stdio: [0, 1, 2], cwd: destinationPath });
    if (dependencies) {
      logger.info(chalk.green('Installing plugin dependencies from npm'));
      execSync(`npm install --save ${dependencies.replace(/,/g, '')}`, {
        stdio: [0, 1, 2],
        cwd: destinationPath
      });
    }

    logger.info(chalk.green("You're ready to start developing your plugin!"));
    logger.info(
      chalk.green('Your plugin can be found here: ', destinationPath)
    );
    logger.info(
      chalk.green(
        'Next step is to cd into your plugin directory and `npm link` it to your bpanel project so it an be imported as a plugin.'
      )
    );
  } catch (err) {
    logger.info(chalk.red('There was an error: ', err));
  }
};
