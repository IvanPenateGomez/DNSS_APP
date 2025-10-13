module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    plugins: [['inline-import', { extensions: ['.sql'] }]], // <-- add this
  };
};
