import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { childArraySchema } from './child.js';

describe('seed.json', () => {
  it('parses and validates against the domain schema', async () => {
    const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
    const raw = await readFile(seedPath, 'utf-8');
    const seed = childArraySchema.parse(JSON.parse(raw) as unknown);
    expect(seed).toHaveLength(25);
  });
});
