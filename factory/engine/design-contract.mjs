/** Executable neutral design/experience contracts (ADR-008, UI study 2026-08-09). */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileSchema } from './json-schema.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DESIGN_ROOT = join(ROOT, 'contracts/design');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export const designExperienceSchema = loadJson(join(DESIGN_ROOT, 'schemas/design-experience.v1.schema.json'));
export const themePackSchema = loadJson(join(DESIGN_ROOT, 'schemas/theme-pack.v1.schema.json'));
const validateExperienceShape = compileSchema(designExperienceSchema);
const validateThemeShape = compileSchema(themePackSchema);

function issuesFrom(compiled, value) {
  compiled(value);
  return (compiled.errors ?? [])
    .filter((error) => !['if', 'allOf'].includes(error.keyword))
    .map((error) => ({
      path: error.instancePath || '/',
      keyword: error.keyword,
      message: error.message,
    }));
}

export function validateDesignExperience(value) {
  const issues = issuesFrom(validateExperienceShape, value);
  const ids = (value?.patterns ?? []).map((pattern) => pattern.id);
  if (new Set(ids).size !== ids.length) {
    issues.push({ path: '/patterns', keyword: 'unique-id', message: 'pattern ids must be unique' });
  }
  return issues;
}

export function validateThemePack(value, experience) {
  const issues = issuesFrom(validateThemeShape, value);
  const expected = [...(experience?.semanticColorKeys ?? [])].sort();
  for (const mode of ['light', 'dark']) {
    const actual = Object.keys(value?.modes?.[mode]?.colors ?? {}).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      issues.push({
        path: `/modes/${mode}/colors`,
        keyword: 'semantic-parity',
        message: 'semantic color keys must exactly match design-experience/v1',
      });
    }
  }
  return issues;
}

export function validateThemeRegistry(experience, packs) {
  const issues = [...validateDesignExperience(experience)];
  if (!Array.isArray(packs)) {
    return [...issues, { path: '/themes', keyword: 'type', message: 'themes must be an array' }];
  }
  const byId = new Map();
  for (const pack of packs) {
    issues.push(...validateThemePack(pack, experience).map((issue) => ({
      ...issue,
      path: `/themes/${pack?.id ?? 'unknown'}${issue.path === '/' ? '' : issue.path}`,
    })));
    if (byId.has(pack?.id)) {
      issues.push({ path: `/themes/${pack?.id ?? 'unknown'}`, keyword: 'unique-id', message: 'theme ids must be unique' });
    }
    byId.set(pack?.id, pack);
  }
  const selectors = new Map();
  for (const pack of packs) {
    for (const context of pack?.selection?.contexts ?? []) {
      const selector = `${pack?.institution?.id}/${context}`;
      if (selectors.has(selector)) {
        issues.push({
          path: `/themes/${pack?.id ?? 'unknown'}/selection/contexts`,
          keyword: 'unique-selector',
          message: `institution/context selector ${selector} is already owned by ${selectors.get(selector)}`,
        });
      } else {
        selectors.set(selector, pack?.id);
      }
    }
  }
  for (const pack of packs) {
    const fallback = pack?.selection?.fallbackThemeId;
    if (fallback !== null && !byId.has(fallback)) {
      issues.push({ path: `/themes/${pack?.id ?? 'unknown'}/selection/fallbackThemeId`, keyword: 'reference', message: `unknown fallback theme ${fallback}` });
    }
    const visited = new Set([pack?.id]);
    let cursor = fallback;
    while (cursor !== null && cursor !== undefined && byId.has(cursor)) {
      if (visited.has(cursor)) {
        issues.push({ path: `/themes/${pack?.id ?? 'unknown'}/selection/fallbackThemeId`, keyword: 'cycle', message: 'fallback themes must be acyclic' });
        break;
      }
      visited.add(cursor);
      cursor = byId.get(cursor)?.selection?.fallbackThemeId;
    }
  }
  return issues;
}

function assertValid(label, issues) {
  if (issues.length > 0) {
    throw new Error(`${label} is invalid:\n${issues.map((issue) => `- ${issue.path} ${issue.message}`).join('\n')}`);
  }
}

export function loadDesignRegistry(root = ROOT) {
  const designRoot = join(root, 'contracts/design');
  const experience = loadJson(join(designRoot, 'design-experience.v1.json'));
  const themesRoot = join(designRoot, 'themes');
  const packs = readdirSync(themesRoot)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => loadJson(join(themesRoot, name)));
  assertValid('Design registry', validateThemeRegistry(experience, packs));
  return { experience, packs };
}

/**
 * Selects only a registered pack and mode. Unknown ids follow the declared
 * default; no remote location, CSS or executable payload is accepted.
 */
export function resolveTheme({
  packs,
  requestedId,
  institutionId,
  contextId = 'default',
  requestedMode,
  systemMode = 'light',
  defaultId = 'enistere-default',
  unavailableIds = [],
}) {
  const byId = new Map(packs.map((pack) => [pack.id, pack]));
  const contextual = packs.find((candidate) =>
    candidate.institution.id === institutionId && candidate.selection.contexts.includes(contextId));
  const institutionalDefault = packs.find((candidate) =>
    candidate.institution.id === institutionId && candidate.selection.contexts.includes('default'));
  let pack = byId.get(requestedId) ?? contextual ?? institutionalDefault ?? byId.get(defaultId);
  if (!pack) throw new Error(`default theme is not registered: ${defaultId}`);
  const unavailable = new Set(unavailableIds);
  const visited = new Set();
  while (unavailable.has(pack.id)) {
    if (visited.has(pack.id)) throw new Error(`theme fallback cycle reached: ${pack.id}`);
    visited.add(pack.id);
    pack = byId.get(pack.selection.fallbackThemeId) ?? byId.get(defaultId);
    if (!pack) throw new Error(`no available fallback theme for: ${[...visited].join(', ')}`);
    if (visited.has(pack.id)) throw new Error(`no available fallback theme for: ${[...visited].join(', ')}`);
  }
  const mode = requestedMode && pack.selection.allowUserMode
    ? requestedMode
    : pack.selection.followSystem ? systemMode : 'light';
  if (!['light', 'dark'].includes(mode)) throw new Error(`unsupported theme mode: ${mode}`);
  return {
    packId: pack.id,
    version: pack.version,
    digest: createHash('sha256').update(JSON.stringify(pack)).digest('hex'),
    institution: { ...pack.institution },
    mode,
    colors: { ...pack.modes[mode].colors },
    shared: {
      spacing: { ...pack.shared.spacing },
      radius: { ...pack.shared.radius },
      minimumTouchTarget: pack.shared.minimumTouchTarget,
    },
  };
}
