const { resolve } = require('path');
const fs = require('fs-extra');
const assert = require('bsert');
const validate = require('validate-npm-package-name');
const { format } = require('prettier');

const { checkExistence, npmExists } = require('./helpers');

function filterArgs() {
  // remove node, path, and command args
  const args = process.argv.slice(3);
  let names = args.filter(name => name[0] !== '-');
  return names;
}

module.exports = (config, logger) => async (name, cmd) => {
  try {
    const LOCAL_PLUGINS_DIR = resolve(config.prefix, 'local_plugins');
    const CONFIG_PATH = resolve(config.prefix, 'config.js');

    assert(fs.existsSync(CONFIG_PATH), 'Could not find bPanel config file');
    if (cmd.local)
      assert(
        fs.existsSync(LOCAL_PLUGINS_DIR),
        'Local plugins directory does not exist. ' +
          'Ensure bPanel has been initiated and --prefix option has been set correctly.'
      );

    const bpanelConfig = require(CONFIG_PATH);

    const names = filterArgs();

    const configList = cmd.local
      ? bpanelConfig.localPlugins
      : bpanelConfig.plugins;
    const startLength = configList.length;

    assert(names.indexOf(name) > -1, 'There was a problem parsing args');

    for (let i = 0; i < names.length; i++) {
      const packageName = names[i];
      // validate the name
      const validator = validate(packageName);
      const errorStr = `Skipping ${packageName}:`;
      if (validator.warnings) {
        logger.error(`${errorStr} ${validator.warnings.join(', ')}`);
        continue;
      }

      if (validator.errors) {
        logger.error(`${errorStr} ${validator.errors.join(', ')}`);
        continue;
      }

      const exists = checkExistence(packageName, configList, cmd.local);

      if (exists) {
        const message = exists.message || exists || 'Package exists: ';
        logger.warning(`${message}: skipping in config`);
        continue;
      }

      // if not installing a local plugin
      // also want to confirm that the package exists on npm
      if (!cmd.local) {
        const existsRemote = await npmExists(packageName);
        if (!existsRemote) {
          logger.warning(
            `${packageName} does not exist on npm. Use option '--local' if installing a local plugin. Skipping...`
          );
          continue;
        }
      }

      // for local plugins check if plugin exists locally
      if (cmd.local && !fs.existsSync(resolve(LOCAL_PLUGINS_DIR, packageName))) {
        logger.warning(
          `${packageName} does not exist in local plugins directory ${LOCAL_PLUGINS_DIR}. Please include it before installing to bPanel.`
        );
        continue;
      }

      logger.info(`${packageName}: Valid name, adding to config`);
      configList.push(packageName);
    }

    // only write to the file if there are new plugins
    // this avoids a webpack rebuild in bPanel
    if (configList.length > startLength) {
      const configText = format(
        'module.exports = ' + JSON.stringify(bpanelConfig, null, 2),
        { parser: 'babylon' }
      );
      fs.writeFileSync(CONFIG_PATH, configText);
    }
    logger.info('Plugin installation done');
  } catch (e) {
    logger.error('There was a problem on installation:', e.message);
  }
};
