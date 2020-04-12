const babelConfig = ({
  targets = '> 1.5% in US, Firefox ESR, not dead',
  babelOptions = {},
  babelPlugins = [],
  babelPresets = [['@babel/preset-env', {
    targets,
    corejs: 3,
    useBuiltIns: 'usage',
  }]],
} = {}) => ({
  plugins: babelPlugins,
  presets: babelPresets,
  ...babelOptions,
  exclude: [].concat(/\/core-js\//, babelOptions.exclude || []),
});


export default babelConfig;
