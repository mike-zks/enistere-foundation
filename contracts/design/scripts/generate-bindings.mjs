#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadDesignRegistry } from '../../../factory/engine/design-contract.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const GENERATED = 'contracts/design/generated';

function cssName(key) {
  return key.replaceAll('.', '-').replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function digestOf(registry) {
  return createHash('sha256').update(JSON.stringify(registry)).digest('hex');
}

function css(registry, digest) {
  const lines = [
    `/* GENERATED FROM contracts/design/. DO NOT EDIT. design-sha256: ${digest} */`,
  ];
  for (const pack of registry.packs) {
    for (const mode of ['light', 'dark']) {
      const selectors = pack.id === 'enistere-default' && mode === 'light'
        ? `:root, [data-enistere-theme="${pack.id}"][data-theme="${mode}"]`
        : pack.id === 'enistere-default' && mode === 'dark'
          ? `[data-theme="dark"]:not([data-enistere-theme]), [data-enistere-theme="${pack.id}"][data-theme="${mode}"]`
        : `[data-enistere-theme="${pack.id}"][data-theme="${mode}"]`;
      lines.push(`${selectors} {`);
      for (const [key, value] of Object.entries(pack.modes[mode].colors)) {
        lines.push(`  --enistere-color-${cssName(key)}: ${value};`);
      }
      for (const [key, value] of Object.entries(pack.shared.spacing)) {
        lines.push(`  --enistere-spacing-${key}: ${value}px;`);
      }
      for (const [key, value] of Object.entries(pack.shared.radius)) {
        lines.push(`  --enistere-radius-${key}: ${value}px;`);
      }
      lines.push(`  --enistere-minimum-touch-target: ${pack.shared.minimumTouchTarget}px;`);
      lines.push('}');
    }
  }
  return `${lines.join('\n')}\n`;
}

function typescript(registry, digest) {
  return `// GENERATED FROM contracts/design/. DO NOT EDIT. design-sha256: ${digest}\n`
    + `export const designExperience = ${JSON.stringify(registry.experience, null, 2)} as const;\n\n`
    + `export const themePacks = ${JSON.stringify(registry.packs, null, 2)} as const;\n\n`
    + `export type DesignThemeMode = 'light' | 'dark';\n`
    + `export interface DesignThemeSelection { readonly requestedId?: string; readonly institutionId?: string; readonly contextId?: string; readonly requestedMode?: DesignThemeMode; readonly systemMode?: DesignThemeMode; readonly unavailableIds?: readonly string[]; }\n`
    + `export function resolveDesignTheme(selection: DesignThemeSelection = {}) {\n`
    + `  const byId = new Map<string, (typeof themePacks)[number]>(themePacks.map((pack) => [pack.id, pack]));\n`
    + `  const contextId = selection.contextId ?? 'default';\n`
    + `  const contextual = themePacks.find((pack) => pack.institution.id === selection.institutionId && (pack.selection.contexts as readonly string[]).includes(contextId));\n`
    + `  const institutionalDefault = themePacks.find((pack) => pack.institution.id === selection.institutionId && (pack.selection.contexts as readonly string[]).includes('default'));\n`
    + `  let pack = byId.get(selection.requestedId ?? '') ?? contextual ?? institutionalDefault ?? byId.get('enistere-default');\n`
    + `  if (!pack) throw new Error('default theme is not registered');\n`
    + `  const unavailable = new Set(selection.unavailableIds ?? []);\n`
    + `  const visited = new Set<string>();\n`
    + `  while (unavailable.has(pack.id)) {\n`
    + `    if (visited.has(pack.id)) throw new Error('theme fallback cycle reached');\n`
    + `    visited.add(pack.id);\n`
    + `    pack = byId.get(pack.selection.fallbackThemeId ?? '') ?? byId.get('enistere-default');\n`
    + `    if (!pack || visited.has(pack.id)) throw new Error('no available fallback theme');\n`
    + `  }\n`
    + `  const mode = selection.requestedMode && pack.selection.allowUserMode ? selection.requestedMode : pack.selection.followSystem ? (selection.systemMode ?? 'light') : 'light';\n`
    + `  return { pack, mode, colors: pack.modes[mode].colors, shared: pack.shared } as const;\n`
    + `}\n`;
}

function dart(registry, digest) {
  const document = { experience: registry.experience, themePacks: registry.packs };
  return `// GENERATED FROM contracts/design/. DO NOT EDIT. design-sha256: ${digest}\n`
    + `const Map<String, Object?> enistereDesignContract = <String, Object?>${JSON.stringify(document, null, 2)};\n`;
}

export function renderDesignBindings(registry) {
  const digest = digestOf(registry);
  const cssBinding = css(registry, digest);
  const typescriptBinding = typescript(registry, digest);
  const dartBinding = dart(registry, digest);
  return new Map([
    [`${GENERATED}/design-tokens.css`, cssBinding],
    [`${GENERATED}/design-contract.ts`, typescriptBinding],
    [`${GENERATED}/design_contract.dart`, dartBinding],
    ['packages/ui-kit/generated/css/design-tokens.css', cssBinding],
    ['packages/ui-kit/src/tokens/generated/design-contract.ts', typescriptBinding],
    ['starters/angular/src/design-tokens.generated.css', cssBinding],
    ['starters/angular/src/app/core/theme/design-contract.generated.ts', typescriptBinding],
    ['starters/react-native/src/theme/design-contract.generated.ts', typescriptBinding],
    ['starters/flutter/lib/src/theme/design_contract.generated.dart', dartBinding],
    [`${GENERATED}/manifest.json`, `${JSON.stringify({
      schemaVersion: '1',
      digest,
      themes: registry.packs.map((pack) => ({
        id: pack.id,
        version: pack.version,
        digest: createHash('sha256').update(JSON.stringify(pack)).digest('hex'),
      })),
      bindings: ['css', 'typescript', 'dart'],
      materializations: {
        nextjs: 'packages/ui-kit/generated/css/design-tokens.css',
        angular: 'starters/angular/src/design-tokens.generated.css',
        'react-native': 'starters/react-native/src/theme/design-contract.generated.ts',
        flutter: 'starters/flutter/lib/src/theme/design_contract.generated.dart',
      },
    }, null, 2)}\n`],
  ]);
}

export async function generateDesignBindings({ root = ROOT, check = false } = {}) {
  const registry = loadDesignRegistry(root);
  const artifacts = renderDesignBindings(registry);
  const drift = [];
  for (const [relative, expected] of artifacts) {
    const path = resolve(root, relative);
    if (check) {
      let current = '';
      try { current = await readFile(path, 'utf8'); } catch { /* Missing is drift. */ }
      if (current !== expected) drift.push(relative);
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, expected);
    }
  }
  if (drift.length > 0) throw new Error(`Design bindings drift:\n- ${drift.join('\n- ')}`);
  return { drift, artifacts: [...artifacts.keys()] };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  generateDesignBindings({ check: process.argv.includes('--check') })
    .then((result) => console.log(JSON.stringify({ passed: true, ...result }, null, 2)))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
