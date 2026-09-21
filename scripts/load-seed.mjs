import { build } from 'vite';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Loads the TypeScript seed as real data for Node scripts.
 *
 * The seed modules use extensionless imports and TS enums, so plain `node` cannot import
 * them. Rather than add a runner dependency, this bundles them with Vite's own build API —
 * already a devDependency, and the same resolver the app itself uses, so what a script sees
 * is exactly what the app sees.
 */
export async function loadSeed() {
  const outDir = await mkdtemp(join(tmpdir(), 'ria-seed-'));
  await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      ssr: true,
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: { seed: 'src/data/seed.ts', remedies: 'src/data/remedyTable.ts' },
        output: { entryFileNames: '[name].mjs', format: 'es' },
      },
    },
  });
  const { seed } = await import(pathToFileURL(join(outDir, 'seed.mjs')).href);
  const { remedyTable } = await import(pathToFileURL(join(outDir, 'remedies.mjs')).href);
  return { seed, remedyTable };
}
