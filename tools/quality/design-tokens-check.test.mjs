import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { checkDesignTokens } from './design-tokens-check.mjs';

test('the Foundation interface tokens of document 04 are valid W3C Design Tokens', () => {
  assert.deepEqual(checkDesignTokens(), []);
});

test('an invalid token is reported', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tokens-'));
  try {
    const file = join(directory, 'tokens.json');
    writeFileSync(file, JSON.stringify({ color: { primary: { $type: 'color', $value: 'navy' } } }));
    assert.deepEqual(checkDesignTokens(file).map((item) => item.code), ['DESIGN_TOKEN_INVALID_VALUE']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
