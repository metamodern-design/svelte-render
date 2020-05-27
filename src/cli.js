#!/bin/sh 
":" //# comment; exec /usr/bin/env node --experimental-modules --no-warnings "$0" "$@" 

import path from 'path';
import fs from 'fs-extra';
import mri from 'mri';
import ora from 'ora';

import svelteRender from './index.js';
import tryCatch from './try-catch.js';


(async () => {
  const spinner = ora({ spinner: 'point' });

  process.exitCode = await tryCatch(
    async () => {
      const { _, ...options } = mri(process.argv.slice(2));
      const context = path.resolve(process.cwd(), _[0] || '');
      const configPath = path.resolve(context, 'render.config.js');

      const config = (
        await fs.pathExists(configPath)
          ? (await import(configPath)).default
          : {}
      );

      const mergedOptions = { ...config, ...options };

      console.log([].concat(
        'svelte-render',
        `  context: ${context}`,
        '  options:',
        Object.entries(mergedOptions).map(([k, v]) => `    - ${k}: ${v}`),
      ).join('\n'));

      spinner.start();
      const exitCode = await svelteRender(context, mergedOptions);

      if (exitCode === 0) {
        spinner.succeed('Build complete!');
      }

      return exitCode;
    },
    (err) => {
      spinner.fail('Build failed');
      return err;
    },
  );
})();
