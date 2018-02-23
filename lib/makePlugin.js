import fs from 'fs-extra';
import { resolve } from 'path';
import { template } from 'underscore';
import { prompt } from 'inquirer';
import chalk from 'chalk';

import questions from './questions';
import { makePath } from './helpers';

export default async () => {
  const answers = await prompt(questions);
  try {
    let index = fs.readFileSync('./lib/indexTemplate.txt', 'utf8');
    index = template(index);
    index = index(answers);
    const {
      destination,
      author,
      name,
      version,
      description,
      license,
      keywords
    } = answers;
    const keywordList = keywords.replace(/ /g, '').split(',');
    const destinationPath = resolve(destination, makePath(name));

    await fs.mkdir(destinationPath);
    await fs.copy('./template', destinationPath);
    await fs.appendFile(resolve(destinationPath, 'index.js'), index);

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
  } catch(err) {
    console.log(chalk.red('There was an error: ', err));
  }
}
