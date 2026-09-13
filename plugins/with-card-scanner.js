const { withPodfile } = require('@expo/config-plugins');

// Use the OCR module's Apple Vision implementation on iOS. The upstream plugin
// rewrites nested Ruby blocks incorrectly on repeated prebuilds; this change is
// deliberately idempotent and leaves post_install untouched.
module.exports = function withCardScanner(config) {
  return withPodfile(config, (config) => {
    const line = "ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] = '1'";
    if (!config.modResults.contents.split(/\r?\n/).includes(line)) {
      config.modResults.contents = `${line}\n${config.modResults.contents}`;
    }
    return config;
  });
};
