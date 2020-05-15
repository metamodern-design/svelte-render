#!/usr/bin/env node

import path from 'path';
import esmConfig from 'esm-config';
import fs from 'fs-extra';
import mri from 'mri';
import ora from 'ora';

import svelteRender from './index';
import tryCatch from './src/try-catch';


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
      
      console.log(`Svelte render in progress >>
        context: ${context}
        options: ${mergedOptions.map((k,v) => `\n    - ${k}: ${v} `)}
      `);
      
      ora.start();
        
      const exitCode = await svelteRender(context, mergedOptions);
      
      if (exitCode) {
        ora.succeed('Build complete!');
      }
      
      return exitCode;
    },
    (err) => {
      ora.fail('Build failed:');
      return err;
    },
  );
})();
