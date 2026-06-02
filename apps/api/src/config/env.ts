import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  TECHNICIAN_EMAIL: z.string().email(),
  TECHNICIAN_PASSWORD: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SEED_FILE: z.string().default('../../data/seed.json'),
  // Todo o estado vive no Postgres. O default aponta pro serviço do
  // docker-compose, então `docker compose up` e o dev local funcionam sem
  // precisar definir nada; sobrescreva via env pra apontar pra outro banco.
  DATABASE_URL: z.string().url().default('postgres://user:pass@localhost:5432/painel'),
});

export type Env = z.infer<typeof envSchema>;

// Placeholder de JWT_SECRET pro dev local; o entrypoint do container gera um
// secret aleatório no lugar dele. Este guard recusa subir em produção se ele
// vazar pra lá (rodar com ele = qualquer um forja token).
const INSECURE_JWT_SECRET = 'placeholder-value-used-only-for-local-dev-not-a-real-key';

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  const env = parsed.data;
  if (env.NODE_ENV === 'production' && env.JWT_SECRET === INSECURE_JWT_SECRET) {
    throw new Error(
      'Refusing to start in production with the placeholder JWT_SECRET. ' +
        'Set a strong JWT_SECRET via environment variables (the container entrypoint ' +
        'generates one automatically if you leave it unset).',
    );
  }

  return env;
}
