import fs from 'fs-extra';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { template } from 'underscore';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import _ from 'underscore';

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

export default async () => {
  const answers = await prompt(questions);
  const {
    author,
    dependencies,
    description,
    destination,
    display,
    keywords = '',
    license,
    modules = [],
    name,
    targetComponent,
    theme,
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
    const destinationPath = resolve(destination, makePath(name));

    console.log(chalk.green('Creating plugin directory...'));
    await fs.ensureDir(destinationPath);
    await fs.copy(resolve(__dirname, '../template'), destinationPath);

    // since .gitignore won't make to the npm package
    // and thus won't be copied over from template
    // our template has a file prefixed with underscore
    // we need to rename it
    fs.renameSync(
      resolve(destinationPath, '_gitignore'),
      resolve(destinationPath, '.gitignore')
    );

    console.log(chalk.blue('Done.'));

    // composing the text of the plugin entry point index.js
    console.log(chalk.green('Setting up plugin entry point (lib/index.js)...'));
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
    await fs.appendFile(resolve(destinationPath, 'lib/index.js'), index);
    console.log(chalk.blue('Done.'));

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
    console.log(chalk.green('Setting up node_modules...'));
    execSync('npm install', { stdio: [0, 1, 2], cwd: destinationPath });
    if (dependencies) {
      console.log(chalk.green('Installing plugin dependencies from npm'));
      execSync(`npm install --save ${dependencies.replace(/,/g, '')}`, {
        stdio: [0, 1, 2],
        cwd: destinationPath
      });
    }

    console.log(chalk.green("You're ready to start developing your plugin!"));
    console.log(
      chalk.green('Your plugin can be found here: ', destinationPath)
    );
    console.log(
      chalk.green(
        'Next step is to cd into your plugin directory and `npm link` it to your bpanel project so it an be imported as a plugin.'
      )
    );
  } catch (err) {
    console.log(chalk.red('There was an error: ', err));
  }
};
