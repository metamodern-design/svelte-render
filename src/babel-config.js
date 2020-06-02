const babelConfig = ({
  browsers = 'defaults',
  babelOptions = {},
  babelPlugins = [],
  babelPresets = [['@babel/preset-env', {
    targets: browsers,
    corejs: 3,
    useBuiltIns: 'usage',
  }]],
} = {}) => ({
  plugins: babelPlugins,
  presets: babelPresets,
  babelHelpers: 'bundled',
  ...babelOptions,
  exclude: [].concat(/\/core-js\//, babelOptions.exclude || []),
});


export default babelConfig;
