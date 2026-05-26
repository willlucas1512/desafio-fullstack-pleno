import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { ChildrenRepository } from './repositories/children.repository.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const childrenRepo = await ChildrenRepository.fromSeedFile(env.SEED_FILE);
  const app = await buildApp({ env, childrenRepo });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`Loaded ${childrenRepo.list().length} children from ${env.SEED_FILE}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
