const { resolve } = require('path');
const fs = require('fs-extra');
const assert = require('bsert');
const inquirer = require('inquirer');
const { format } = require('prettier');

const { checkExistence } = require('./helpers');

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

    let exists;
    const list = cmd.local ? bpanelConfig.localPlugins : bpanelConfig.plugins;

    if (cmd.local)
      exists = checkExistence(name, list, true)
    else
      exists = checkExistence(name, list)

    if (!exists)
      throw new Error(`${name} does not exist in config`);

    while(exists) {
      const index = list.findIndex(item => item === name);
      if (index === -1)
        exists = false
      else {
        list.splice(index, 1);
      }
    }

    // once we know we can remove the plugin
    // confirm removal with user
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove ${name}? `,
        default: false
      }
    ]);

    if (!confirm)
      return;

    // replace config with new list
    if (cmd.local)
      bpanelConfig.localPlugins = list;
    else
      bpanelConfig.plugins = list;

    logger.info(`Removing ${name} from config...`);
    const configText = format('module.exports = ' + JSON.stringify(bpanelConfig, null, 2), { parser: 'babylon' });
    fs.writeFileSync(configPath, configText)
    logger.info('Done');
  } catch (e) {
    logger.error('There was a problem on installation:', e.message);
  }

}