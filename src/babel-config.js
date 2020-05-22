const babelConfig = ({
  browserslist = '> 1.5% in US, Firefox ESR, not ie <= 11, not dead',
  babelOptions = {},
  babelPlugins = [],
  babelPresets = [['@babel/preset-env', {
    targets: browserslist,
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
