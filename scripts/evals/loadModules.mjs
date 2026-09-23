import { build } from 'vite';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Loads the TypeScript seed, the pure analysis services, and the /api/analyze core as real
 * code for a Node script — same technique as scripts/load-seed.mjs, extended to also pull in
 * the pieces the eval needs to build realistic requests and call the model directly.
 *
 * Each module is built in its own Rollup graph (one `build()` call per entry) rather than as
 * one multi-entry build: a shared build would factor out modules the entries have in common
 * (e.g. the enums both the seed and the services import) into a separate chunk file, and that
 * chunk — plain ".js", with no package.json nearby to mark it "module" — gets loaded by Node
 * as CommonJS even though its content is ESM. One entry per build has nothing to share, so
 * everything a module needs is inlined into its own single, self-contained ".mjs" file.
 *
 * The build output lives under this project's own node_modules (gitignored, and already
 * cleaned up by `emptyOutDir`) rather than the system tmpdir: analyzeApi.mjs imports
 * @anthropic-ai/sdk and zod as bare specifiers, and Yarn PnP only resolves those for files it
 * recognizes as part of a package it manages — a file under the OS tmpdir is outside that
 * entirely, while one under node_modules/ inherits the top-level project's own dependencies.
 */
export async function loadEvalModules() {
  const outDir = await mkdtemp(join(process.cwd(), 'node_modules', '.ria-eval-'));
  const entries = {
    seed: 'src/data/seed.ts',
    reviewAnalysis: 'src/services/reviewAnalysisService.ts',
    impactAnalysis: 'src/services/impactAnalysisService.ts',
    analyzeApi: 'api/analyze.ts',
  };

  for (const [name, input] of Object.entries(entries)) {
    await build({
      configFile: false,
      logLevel: 'silent',
      build: {
        ssr: true,
        outDir,
        emptyOutDir: false,
        rollupOptions: {
          input: { [name]: input },
          output: { entryFileNames: '[name].mjs', format: 'es' },
        },
      },
    });
  }

  const { seed } = await import(pathToFileURL(join(outDir, 'seed.mjs')).href);
  const { analyzeReview } = await import(pathToFileURL(join(outDir, 'reviewAnalysis.mjs')).href);
  const { getVisibleReviews } = await import(pathToFileURL(join(outDir, 'impactAnalysis.mjs')).href);
  const { runAnalysis, RequestSchema } = await import(pathToFileURL(join(outDir, 'analyzeApi.mjs')).href);

  return { seed, analyzeReview, getVisibleReviews, runAnalysis, RequestSchema };
}
