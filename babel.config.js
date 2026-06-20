module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 + Expo SDK 55: ONLY the preset with jsxImportSource.
    // - Do NOT add the deprecated "nativewind/babel" preset (that's v2 config;
    //   it double-injects the worklets plugin + a conflicting JSX runtime).
    // - Do NOT add "react-native-worklets/plugin" manually — babel-preset-expo
    //   auto-injects it once when react-native-worklets is installed.
    // Triple-applying the worklets plugin corrupted the release (Hermes) bundle:
    // animated wrappers failed, flex rows collapsed, and Text fell back to serif.
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
  };
};
