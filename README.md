# @metamodern/svelte-render

*A friendly Jamstack-focused build tool for Svelte apps*

I created this utility to scaffold build configurations for my Svelte projects. Because I focus on modern static sites and client-side apps that can be deployed with Netlify, Sapper includes a lot of infrastructure for server-side development that I don't need. Svelte Kit is around the corner as a next-gen replacement for Sapper, but it may not be production-ready in the immediate future, so I will be maintaining this CLI tool until I have a solid replacement. 

## Features

Here are some of the features that `svelte-render` adds on top of a starter Rollup configuration:
- Assumes a sensible directory structure, but allows customization 
- Includes a CLI script with flags for common rendering options
- Includes essential plugins out of the box
- Supports a JavaScript configuration file to import additional plugins, etc.
- Comes with a built-in Babel configuration (with option not to transpile)
- Supports render hooks to automate additional build steps
- ES modules everywhere – never `require()` again!


## Install

```sh
npm i @metamodern/svelte-render

```

## CLI Usage

The CLI script is released as an ES module only. Minimum Node.js version is 14 (latest LTS as of release date). 

```sh
npx svelte-render [context] [--key=value]

# default to process.cwd() as context
cd project
npx svelte-render [--key=value]

# skip production optimizations
npx svelte-render --development

# just output HTML from the entry file
npx svelte-render --client=0 --noCss

# specify a custom directory structure
npx svelte-render --src=. --dist=public

# specify the path to your config file
# ** if not at ./render.config.js **
npx svelte-render --configFile=./config/svelte-render.js

```


## Configuration file

Options may be specified using a configuration file. The file should use ES module import/export syntax. Its default export should be a function that takes an object containing command-line options as its arugment and returns an object specifying additional options to pass to the rendering function.

The config file is expected to be found at `./render.config.js` (relative to `context`), but a custom path can be specified from the command line as shown above.

See below for a list of all options that may be passed to the rendering function.


## JavaScript API & Configuration Options

The JavaScript API is released as an ES module only. CommonJS `require()` is not supported.

The module's default export is a function with the following parameters:

```ts
async function(context: string, {
  src = 'src',
  assets = 'assets',
  dist = 'dist',
  entry = 'index.svelte',
  client = 'client.js',
  noCss = false,
  development = false,
  transpile = !development,
  rollupInputPlugins = [],
  rollupInputOptions = {},
  compilerOptions = {},
  sveltePreprocess = {},
  svelteOptions = {},
  terserOptions = {},
  browsers = 'defaults',
  babelPresets = [['@babel/preset-env', {
    targets: browsers,
    corejs: 3,
    useBuiltIns: 'usage',
  }]],
  babelPlugins = [],
  babelOptions = {},
  before,
  onRender,
  after,
} = {}): Promise<number> // returns 0 on success

```

#### Required

- __context__: path to the project's root directory

*Note: The `context` argument is only required when using the JavaScript API. When using the CLI script, `context` defaults to `process.cwd()`.*

#### Configuring the Directory Structure

The following options may be specified as file names or paths and will be resolved relative to `context`.

- __src__: parent directory of `entry` and `client` source files
- __assets__: directory of static assets to be copied to `dist`
- __dist__: public directory where web files will be served
- __entry__: a Svelte file to be pre-rendered as the initial view (ignored when the `development` flag is on)
- __client__: a JavaScript source file that will be rolled-up as the client-side script (to render static HTML only, set `client` to `false` and don't use the `development` flag)

#### Setting Rendering Option Flags

- __noCss__: don't output CSS generated from Svelte `<style>` blocks
- __development__: skip production optimizations (pre-rendering markup, transpiling JS, minifying JS & CSS)
- __transpile__: use Babel to transform/polyfill client-side JS as needed for target browsers (turned on by default, unless the `development` flag is passed)

#### Advanced Rendering Options (for Rollup, Svelte, Terser)

- __rollupInputPlugins__: input plugins ([official](https://github.com/rollup/plugins), [community](https://github.com/rollup/awesome)) to pass to Rollup
- __rollupInputOptions__: additional [input options](http://rollupjs.org/guide/en/#inputoptions-object) to pass to Rollup
- __compilerOptions__: [compiler options](https://svelte.dev/docs#svelte_compile) to pass to `rollup-plugin-svelte` (under the `compilerOptions` key)
- __sveltePreprocess__: [preprocessing functions](https://svelte.dev/docs#svelte_preprocess) to pass to `rollup-plugin-svelte` (under the `preprocess` key)
- __svelteOptions__: additional [options](https://github.com/sveltejs/rollup-plugin-svelte#usage) to pass to `rollup-plugin-svelte`
- __terserOptions__: [options](https://github.com/terser/terser#minify-options) to pass to `rollup-plugin-terser`

#### Transpiling Options (for Babel)

- __browsers__: a valid Browserslist configuration
- __babelPresets__: presets to pass to Babel
- __babelPlugins__: plugins to pass to Babel
- __babelOptions__: additional options to pass to Babel

*Note: These options are ignored when `transpile` is set to `false`*

#### Render Hooks

Render hooks are functions to execute in tandem with the main rendering function. Each function will be passed the resolved `context` and the full options object. Async functions are supported.

- __before__: function to invoke and await before rendering
- __onRender__: function to invoke and await in parallel with Rollup build of client/entry scripts
- __after__: function to invoke and await after rendering


## License
© 2020 Daniel C. Narey

ISC License
