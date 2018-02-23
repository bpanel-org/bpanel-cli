import { resolve } from 'path';
import fs from 'fs-extra';

export const makePath = str => str.toLowerCase().replace(/ /g, '-');

export const listToArray = list => list.replace(/ /g, '').split(',');

export const camelize = str =>
  str.replace(/_/g, '-').replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/[^\w\s]/gi, '');

export const setupDeps = async (deps_, pluginRoot) => {
  const deps = Array.isArray(deps_) ? deps_ : listToArray(deps_);
  deps.forEach(async dep => {
    const camelized = camelize(dep);
    fs.appendFile(resolve(pluginRoot, 'lib', 'plugins.js'),
      `export * as ${camelized} from '${dep}'; \n`
    );
  });

  return {
    import: `import modules from './lib/plugins';`,
    arr: `const plugins = Object.keys(modules).map(name => modules[name]);`,
    export: `export const pluginConfig = {plugins};`
  }
};
