#!/usr/bin/env node

import { resolve } from 'path';
import { existsSync } from 'fs';

import mri from 'mri';
import ora from 'ora';

import { render } from './index.js';
import { tryCatch } from './try-catch.js';

(async () => {
  const spinner = ora({ spinner: 'point' });

  process.exitCode = await tryCatch(
    async () => {
      const { _, ...options } = mri(process.argv.slice(2));
      const context = resolve(process.cwd(), _[0] || '');

      const configPath = resolve(
        context,
        options.configFile || 'render.config.js',
      );

      const config = (
        existsSync(configPath)
          ? (await import(configPath)).default
          : () => ({})
      );

      const mergedOptions = { ...config(options), ...options };

      console.log([].concat(
        'svelte-render',
        `  context: ${context}`,
        '  options:',
        Object.entries(mergedOptions).map(([k, v]) => `    - ${k}: ${v}`),
      ).join('\n'));

      spinner.start();
      const exitCode = await render(context, mergedOptions);

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
