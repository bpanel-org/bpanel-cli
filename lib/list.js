const { resolve } = require('path');

module.exports = function list(config, logger) {
  const configPath = resolve(config.prefix, 'config.js');
  return () => {
    const bpanelConfig = require(configPath);
    logger.info('Here are the plugins currently installed in your config.js:');
    logger.info(`Remote plugins: ${bpanelConfig.plugins.join(', ')}`);
    logger.info(`Local plugins: ${bpanelConfig.localPlugins.join(', ')}`);
  };
};
