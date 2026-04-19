import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // Bindings injected only for vitest runs. These shadow any secrets
          // from the real deployment and are NEVER used in production.
          bindings: {
            LINKS_BACKEND_TOKEN: 'test-token-abc123',
            ANTHROPIC_API_KEY: 'sk-ant-dummy-for-tests',
            ANTHROPIC_MODEL: 'claude-haiku-4-5',
          },
        },
      },
    },
  },
});
