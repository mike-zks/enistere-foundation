/**
 * Checks the design tokens of the Foundation interface (docs/design/design-tokens.json,
 * document 04) with the kernel's single W3C Design Tokens validator — the one that also
 * validates the Design Systems (A9) of the systems Foundation builds.
 *
 *   node tools/quality/design-tokens-check.mjs [file]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { formatDiagnostics, validateTokens } from '../../kernel/contracts/src/index.ts';

export const DEFAULT_FILE = fileURLToPath(new URL('../../docs/design/design-tokens.json', import.meta.url));

export function checkDesignTokens(file = DEFAULT_FILE) {
  const tokens = JSON.parse(readFileSync(file, 'utf8'));
  return validateTokens(tokens, 'docs/design/design-tokens.json', '');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const diagnostics = checkDesignTokens(process.argv[2]);
  if (diagnostics.length > 0) {
    console.error(formatDiagnostics(diagnostics));
    process.exitCode = 1;
  } else console.log('Design tokens check passed.');
}
