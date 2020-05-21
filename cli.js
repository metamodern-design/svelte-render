#!/usr/bin/env node

import path from 'path';
import esmConfig from 'esm-config';
import fs from 'fs-extra';
import mri from 'mri';
import ora from 'ora';

import svelteRender from './index.js';
import tryCatch from './src/try-catch.js';


(async () => {
  process.exitCode = await tryCatch(
    async () => {
      const { _, ...options } = mri(process.argv.slice(2));

      const context = path.resolve(process.cwd(), _[0] || '');

      const configPath = path.resolve(context, 'render.config.js');

      const config = (
        await fs.pathExists(configPath)
          ? await esmConfig(configPath)
          : {}
      );
      
      const mergedOptions = { ...config, ...options };
      
      const listedOptions = (
        Object.entries(mergedOptions)
          .map(([k, v]) => `    - ${k}: ${v}`)
          .join('\n')
      );
      
      console.log([
        'Starting svelte-render >>',
        `  context: ${context}`,
        `  options: ${listedOptions}`,
      ].join('\n'));
      
      const spinner = ora({
        text: 'Building',
        spinner: 'arrow3',
      }).start();
        
      const exitCode = await svelteRender(context, mergedOptions);
      
      if (exitCode) {
        spinner.succeed('Build complete!');
      }
      
      return exitCode;
    },
    (err) => {
      spinner.fail('Build failed:');
      return err;
    },
  );
})();
