import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';

import {
  designExperienceSchema,
  loadDesignRegistry,
  resolveTheme,
  themePackSchema,
  validateDesignExperience,
  validateThemePack,
  validateThemeRegistry,
} from '../engine/design-contract.mjs';
import { renderDesignBindings } from '../../contracts/design/scripts/generate-bindings.mjs';

function clone(value) {
  return structuredClone(value);
}

describe('neutral design and experience contracts', () => {
  it('loads two closed theme packs against seven observable UX patterns', () => {
    const registry = loadDesignRegistry();
    assert.deepEqual(validateThemeRegistry(registry.experience, registry.packs), []);
    assert.deepEqual(registry.experience.patterns.map((pattern) => pattern.id), [
      'loading', 'empty', 'error', 'success', 'unauthorized', 'forbidden', 'offline',
    ]);
    assert.deepEqual(registry.packs.map((pack) => pack.id), ['enistere-default', 'sunrise-institute']);
    for (const pattern of registry.experience.patterns) {
      assert.equal(pattern.safeContent, true);
      assert.equal(pattern.revealTechnicalDetails, false);
    }
  });

  it('keeps the autonomous evaluator aligned with Ajv', () => {
    const registry = loadDesignRegistry();
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const experienceReference = ajv.compile(designExperienceSchema);
    const themeReference = ajv.compile(themePackSchema);
    const invalidExperience = clone(registry.experience);
    invalidExperience.patterns[0].announcement = 'loud';
    const invalidTheme = clone(registry.packs[0]);
    invalidTheme.assets = [{ id: 'remote-logo', kind: 'logo', path: 'https://third-party.test/logo.svg', alt: 'Remote', modes: ['light'] }];
    for (const sample of [registry.experience, invalidExperience]) {
      assert.equal(validateDesignExperience(sample).length === 0, experienceReference(sample));
    }
    for (const sample of [registry.packs[0], invalidTheme]) {
      assert.equal(validateThemePack(sample, registry.experience).length === 0, themeReference(sample));
    }
  });

  it('rejects remote assets, executable payloads, missing keys and fallback cycles', () => {
    const registry = loadDesignRegistry();
    const remote = clone(registry.packs[0]);
    remote.assets = [{ id: 'logo', kind: 'logo', path: 'https://third-party.test/logo.svg', alt: 'Logo', modes: ['light'] }];
    remote.script = 'alert(1)';
    assert.ok(validateThemePack(remote, registry.experience).some((issue) => issue.keyword === 'additionalProperties'));
    assert.ok(validateThemePack(remote, registry.experience).some((issue) => issue.path.includes('/assets/0/path')));

    const missing = clone(registry.packs[0]);
    delete missing.modes.dark.colors['focus.ring'];
    assert.ok(validateThemePack(missing, registry.experience).some((issue) => issue.path.includes('/modes/dark/colors')));

    const cyclic = clone(registry.packs);
    cyclic[0].selection.fallbackThemeId = cyclic[1].id;
    assert.ok(validateThemeRegistry(registry.experience, cyclic).some((issue) => issue.keyword === 'cycle'));

    const ambiguous = clone(registry.packs);
    ambiguous[0].institution.id = ambiguous[1].institution.id;
    assert.ok(validateThemeRegistry(registry.experience, ambiguous).some((issue) => issue.keyword === 'unique-selector'));
    assert.doesNotThrow(() => validateThemeRegistry(registry.experience, [{}]));
    assert.ok(validateThemeRegistry(registry.experience, [{}]).length > 0);
    assert.doesNotThrow(() => validateThemeRegistry(registry.experience, [null]));
  });

  it('resolves institution, system mode and user preference without remote input', () => {
    const { packs } = loadDesignRegistry();
    const institution = resolveTheme({ packs, institutionId: 'sunrise', contextId: 'learning', systemMode: 'dark' });
    assert.equal(institution.packId, 'sunrise-institute');
    assert.equal(institution.mode, 'dark');
    assert.equal(institution.shared.minimumTouchTarget, 48);
    assert.match(institution.digest, /^[0-9a-f]{64}$/);

    const preferred = resolveTheme({ packs, requestedId: 'sunrise-institute', requestedMode: 'light', systemMode: 'dark' });
    assert.equal(preferred.mode, 'light');
    const contextualFallback = resolveTheme({ packs, institutionId: 'sunrise', contextId: 'unknown' });
    assert.equal(contextualFallback.packId, 'sunrise-institute');
    const unavailableFallback = resolveTheme({
      packs,
      institutionId: 'sunrise',
      contextId: 'learning',
      unavailableIds: ['sunrise-institute'],
    });
    assert.equal(unavailableFallback.packId, 'enistere-default');
    const fallback = resolveTheme({ packs, requestedId: 'not-registered', requestedMode: 'dark' });
    assert.equal(fallback.packId, 'enistere-default');
  });

  it('keeps identical semantic keys across institutions and modes', () => {
    const { experience, packs } = loadDesignRegistry();
    const expected = [...experience.semanticColorKeys].sort();
    for (const pack of packs) {
      assert.ok(pack.shared.minimumTouchTarget >= 44);
      for (const mode of ['light', 'dark']) {
        assert.deepEqual(Object.keys(pack.modes[mode].colors).sort(), expected);
      }
    }
    assert.notEqual(
      packs[0].modes.light.colors['action.primary'],
      packs[1].modes.light.colors['action.primary'],
      'fixtures must prove distinct institutional identities',
    );
  });

  it('renders byte-identical CSS, TypeScript and Dart bindings with one digest', () => {
    const registry = loadDesignRegistry();
    const first = renderDesignBindings(registry);
    const second = renderDesignBindings(registry);
    assert.deepEqual(first, second);
    const manifest = JSON.parse(first.get('contracts/design/generated/manifest.json'));
    assert.match(manifest.digest, /^[0-9a-f]{64}$/);
    assert.ok(manifest.themes.every((theme) => /^[0-9a-f]{64}$/.test(theme.digest)));
    for (const path of [
      'contracts/design/generated/design-tokens.css',
      'contracts/design/generated/design-contract.ts',
      'contracts/design/generated/design_contract.dart',
    ]) {
      assert.ok(first.get(path).includes(manifest.digest), path);
    }
    assert.ok(first.get('contracts/design/generated/design-tokens.css').includes('[data-enistere-theme="sunrise-institute"]'));
    assert.ok(!JSON.stringify([...first.values()]).includes('https://'));
  });
});
