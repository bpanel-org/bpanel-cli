import fs from 'fs-extra';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { template } from 'underscore';
import { prompt } from 'inquirer';
import chalk from 'chalk';

import questions from './questions';
import { makePath, listToArray, setupDeps } from './helpers';

export default async () => {
  const answers = await prompt(questions);
  try {
    let metadata = fs.readFileSync(resolve(process.cwd(), './indexTemplate.txt'), 'utf8');
    metadata = template(metadata);
    metadata = metadata(answers);
    const {
      destination,
      author,
      name,
      version,
      description,
      license,
      keywords,
      dependencies
    } = answers;
    const keywordList = listToArray(keywords);
    const destinationPath = resolve(destination, makePath(name));

    await fs.mkdir(destinationPath);
    await fs.copy('./template', destinationPath);

    // composing the text of the plugin entry point index.js
    let index;
    if (dependencies) {
      const depsConfig = await setupDeps(dependencies, destinationPath);
      index = depsConfig.import +
      '\n\n' +
      depsConfig.arr +
      '\n\n' +
      metadata +
      '\n\n' +
      depsConfig.export
    } else {
      index = metadata + '\n';
    }
    await fs.appendFile(resolve(destinationPath, 'index.js'), index);

    // add information to the plugin's package.json
    const pkgJson = await fs.readFile(resolve(destinationPath, 'package.json'), 'utf8');
    const newPkg =
      Object.assign(
        JSON.parse(pkgJson),
        { name, version, description, license, author, keywords: keywordList }
      );
    await fs.writeFile(
      resolve(destinationPath, 'package.json'),
      JSON.stringify(newPkg, null, 2)
    );
    console.log(chalk.green('Setting up node_modules...'));
    execSync('npm install', {stdio: [0,1,2], cwd: destinationPath});
    if (dependencies) {
      console.log(chalk.green('Installing plugin dependencies from npm'));
      execSync(
        `npm install ${dependencies.replace(/,/g, '')}`,
        {stdio: [0,1,2], cwd: destinationPath}
      );
    }
  } catch(err) {
    console.log(chalk.red('There was an error: ', err));
  }
}
