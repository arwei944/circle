import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
   oxc: false,
   esbuild: {
      jsx: 'automatic',
   },
   resolve: {
      alias: {
         '@': path.resolve(__dirname),
      },
   },
   test: {
      environment: 'node',
      include: ['**/*.test.{ts,tsx}'],
      globals: true,
   },
});
