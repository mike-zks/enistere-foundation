/**
 * Regenerates the committed Asteria golden files from `source.ts` through the
 * kernel and the checker. Refuses to write a golden whose contract set is
 * invalid. Removes generated files that no longer exist.
 *
 *   node goldens/asteria/update.ts
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDiagnostics } from '../../kernel/contracts/src/index.ts';
import { buildAsteriaGolden } from './harness.ts';

const root = dirname(fileURLToPath(import.meta.url));
const golden = buildAsteriaGolden();
if (!golden.validation.valid) {
  console.error(formatDiagnostics(golden.validation.diagnostics));
  process.exitCode = 1;
} else {
  for (const folder of ['contracts', 'evidence']) {
    mkdirSync(join(root, folder), { recursive: true });
    for (const name of readdirSync(join(root, folder))) {
      if (!(`${folder}/${name}` in golden.files)) rmSync(join(root, folder, name));
    }
  }
  for (const [path, content] of Object.entries(golden.files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  console.log(`asteria golden: ${Object.keys(golden.files).length} files, ${golden.validation.diagnostics.length} diagnostics`);
}
