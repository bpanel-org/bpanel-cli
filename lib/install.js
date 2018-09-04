const { resolve } = require('path');
const fs = require('fs-extra');
const assert = require('bsert');
const validate = require('validate-npm-package-name');
const { format } = require('prettier');

const { checkExistence } = require('./helpers');

module.exports = (config, logger) => async (name, cmd) => {
  let originalConfig, bpanelConfig, configPath;
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
    // set a fallback in case anything goes wrong
    originalConfig = bpanelConfig

    // validate the name
    const validator = validate(name);

    if (validator.warnings)
      throw new Error(validator.warnings.join(', '));

    if (validator.errors)
      throw new Error(validator.errors.join(', '));

    let exists;
    if (cmd.local) {
      exists = checkExistence(name, bpanelConfig.localPlugins, 'local');
      bpanelConfig.localPlugins.push(name);
    }
    else {
      exists = checkExistence(name, bpanelConfig.plugins);
      bpanelConfig.plugins.push(name);
    }

    if (exists)
      throw new Error(exists.message);

    logger.info('Name is valid, adding to config');

  } catch (e) {
    logger.error('There was a problem on installation:', e.message);
    if (originalConfig) {
      logger.info('Resetting config to previous state');
      bpanelConfig = originalConfig
    }
  }

  const configText = format('module.exports = ' + JSON.stringify(bpanelConfig, null, 2),  { parser: 'babylon' });
  fs.writeFileSync(configPath, configText)
};
