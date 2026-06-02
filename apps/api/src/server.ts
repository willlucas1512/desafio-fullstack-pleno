import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { PostgresChildrenRepository } from "./repositories/postgres-children.repository.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const childrenRepo = await PostgresChildrenRepository.create({
    databaseUrl: env.DATABASE_URL,
    seedPath: env.SEED_FILE,
  });
  const app = await buildApp({ env, childrenRepo });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
    const count = (await childrenRepo.listAll()).length;
    app.log.info(`${count} crianças no Postgres`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await childrenRepo.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

void main();
