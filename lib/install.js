const { resolve } = require('path');
const fs = require('fs-extra');
const assert = require('bsert');
const validate = require('validate-npm-package-name');
const { format } = require('prettier');

function checkExistence(name, list=[], local=false) {
  const exists = list.some(item => item === name);
  if (exists)
  throw new Error(`${name} already exists in ${local ? 'local ' : ''}plugins config`);

  return true;
}

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

    if (cmd.local) {
      checkExistence(name, bpanelConfig.localPlugins, 'local');
      bpanelConfig.localPlugins.push(name);
    }
    else {
      checkExistence(name, bpanelConfig.plugins);
      bpanelConfig.plugins.push(name);
    }

    logger.info('Name is valid, adding to config');

  } catch (e) {
    logger.error('There was a problem on installation:', e.message);
    logger.error(e.stack);
    if (originalConfig) {
      logger.info('Resetting config to previous state');
      bpanelConfig = originalConfig
    }
  }

  const configText = format('module.exports = ' + JSON.stringify(bpanelConfig, null, 2));
  fs.writeFileSync(configPath, configText)
};
