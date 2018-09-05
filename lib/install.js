const { resolve } = require('path');
const fs = require('fs-extra');
const assert = require('bsert');
const validate = require('validate-npm-package-name');
const { format } = require('prettier');

const { checkExistence } = require('./helpers');

function filterArgs() {
  // remove node, path, and command args
  const args = process.argv.slice(3);
  let names = args.filter(name => name[0] !== '-');
  return names;
}

module.exports = (config, logger) => async (name, cmd) => {
  let bpanelConfig, configPath;

  try {
    const localPluginsDir = resolve(config.prefix, 'local_plugins');
    configPath = resolve(config.prefix, 'config.js');

    assert(fs.existsSync(configPath), 'Could not find bPanel config file');
    if (cmd.local)
      assert(
        fs.existsSync(localPluginsDir),
        'Local plugins directory does not exist. ' +
          'Ensure bPanel has been initiated and --prefix option has been set correctly.'
      );

    bpanelConfig = require(configPath);

    const names = filterArgs();

    const configList = cmd.local ? bpanelConfig.localPlugins : bpanelConfig.plugins;
    const startLength = configList.length;

    assert(names.indexOf(name) > -1, 'There was a problem parsing args');

    for (let i = 0; i < names.length; i++) {
      let includeConfig = true;
      // validate the name
      const validator = validate(names[i]);
      const errorStr = `Skipping ${names[i]}:`;
      if (validator.warnings) {
        includeConfig = false;
        logger.error(`${errorStr} ${validator.warnings.join(', ')}`);
        continue;
      }

      if (validator.errors) {
        includeConfig = false
        logger.error(`${errorStr} ${validator.errors.join(', ')}`);
        continue;
      }

      const exists = checkExistence(names[i], configList, cmd.local);

      if (exists) {
        includeConfig = false;
        logger.warning(`${exists.message}: skipping in config`);
        continue;
      }

      if (includeConfig) {
        logger.info(`${names[i]}: Valid name, adding to config`);
        configList.push(names[i]);
      }
    }

    // only write to the file if there are new plugins
    // this avoids a webpack rebuild in bPanel
    if (configList.length > startLength) {
      const configText = format('module.exports = ' + JSON.stringify(bpanelConfig, null, 2),  { parser: 'babylon' });
      fs.writeFileSync(configPath, configText);
    }
    logger.info('Plugin installation done');
  } catch (e) {
    logger.error('There was a problem on installation:', e.message);
  }

};
