import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'legacy/**',
      'apps/web-sirinx/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
});
