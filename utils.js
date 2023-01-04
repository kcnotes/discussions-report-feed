// Given a config (also known as format, within a formatMap), return a boolean value.
// If the value is not in the config, returns a default value.
// If no default value is provided, returns false.
function getBooleanConfigValue(config, defaultConfig, attribute) {
  if (attribute in config) {
    return config[attribute];
  }
  if (attribute in defaultConfig) {
    return defaultConfig[attribute];
  }
  return false;
}

module.exports = { getBooleanConfigValue };
