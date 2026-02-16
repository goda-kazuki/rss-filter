import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/handlers/lambda.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  minify: true,
  sourcemap: true,
  external: [],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
});

console.log('✓ Build complete: dist/index.js');
