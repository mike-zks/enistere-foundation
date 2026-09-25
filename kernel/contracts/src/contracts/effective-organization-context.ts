/**
 * A3 — Effective Organization Context: deterministic derivation and its checks.
 *
 * Algorithm `foundation.effective-organization-context` version 1:
 *
 * 1. layers are applied by ascending precedence (general → specific);
 * 2. for each rule, the first layer defining it APPLIES; a later layer
 *    OVERRIDES it unless the current value is locked, in which case the later
 *    value is REFUSED_LOCKED and the lock is kept;
 * 3. a waiver then replaces the effective value (WAIVED), even a locked one:
 *    that is precisely what a waiver is for, and it is explicit, reasoned,
 *    approved by a human and time-limited;
 * 4. effective rules are sorted by rule id.
 *
 * The derived document is never edited: validation recomputes it from its own
 * layers and waivers and reports CONTEXT_NOT_REPRODUCIBLE on any difference.
 */

import { canonicalEquals, deepFreeze } from '../primitives/canonical-json.ts';
import { timestamp, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type {
  ContextCategory,
  ContextLayer,
  ContextWaiver,
  EffectiveOrganizationContext,
  EffectiveRule,
  TraceEntry,
} from '../types.ts';

export const DERIVATION = Object.freeze({ algorithm: 'foundation.effective-organization-context', version: '1' } as const);

export interface DerivationResult {
  effective: EffectiveRule[];
  diagnostics: Diagnostic[];
}

interface Working {
  category: ContextCategory;
  value: unknown;
  locked: boolean;
  source: { type: 'LAYER' | 'WAIVER'; id: string };
  trace: TraceEntry[];
}

/** Pure derivation of the effective rules from layers and waivers. */
export function deriveEffectiveRules(layers: readonly ContextLayer[], waivers: readonly ContextWaiver[], ref = ''): DerivationResult {
  const found: Diagnostic[] = [];
  const precedences = new Map<number, string>();
  layers.forEach((layer, index) => {
    const other = precedences.get(layer.precedence);
    if (other !== undefined) {
      found.push(
        diagnostic('CONTEXT_DUPLICATE_PRECEDENCE', `layers '${other}' and '${layer.id}' share precedence ${layer.precedence}`, {
          ref,
          path: `/spec/layers/${index}/precedence`,
        }),
      );
    } else precedences.set(layer.precedence, layer.id);
  });

  const ordered = [...layers].sort((a, b) => a.precedence - b.precedence || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rules = new Map<string, Working>();
  for (const layer of ordered) {
    const layerIndex = layers.indexOf(layer);
    layer.rules.forEach((rule, ruleIndex) => {
      const current = rules.get(rule.id);
      if (!current) {
        rules.set(rule.id, {
          category: rule.category,
          value: rule.value,
          locked: rule.locked === true,
          source: { type: 'LAYER', id: layer.id },
          trace: [{ from: 'LAYER', id: layer.id, value: rule.value, outcome: 'APPLIED' }],
        });
        return;
      }
      if (current.category !== rule.category) {
        found.push(
          diagnostic('CONTEXT_RULE_CATEGORY_CONFLICT', `rule '${rule.id}' is ${current.category} and ${rule.category}`, {
            ref,
            path: `/spec/layers/${layerIndex}/rules/${ruleIndex}/category`,
          }),
        );
      }
      if (current.locked) {
        current.trace.push({
          from: 'LAYER',
          id: layer.id,
          value: rule.value,
          outcome: 'REFUSED_LOCKED',
          reason: `locked by ${current.source.type.toLowerCase()} '${current.source.id}'`,
        });
        return;
      }
      const applied = current.trace.findLast((entry) => entry.outcome === 'APPLIED');
      if (applied) applied.outcome = 'OVERRIDDEN';
      current.trace.push({ from: 'LAYER', id: layer.id, value: rule.value, outcome: 'APPLIED' });
      current.value = rule.value;
      current.locked = rule.locked === true;
      current.source = { type: 'LAYER', id: layer.id };
    });
  }

  const sortedWaivers = [...waivers].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const waiver of sortedWaivers) {
    const current = rules.get(waiver.rule);
    if (!current) {
      found.push(diagnostic('CONTEXT_UNKNOWN_RULE', `waiver '${waiver.id}' excepts unknown rule '${waiver.rule}'`, { ref, path: `/spec/waivers/${waivers.indexOf(waiver)}/rule` }));
      continue;
    }
    const applied = current.trace.findLast((entry) => entry.outcome === 'APPLIED' || entry.outcome === 'WAIVED');
    if (applied) applied.outcome = 'OVERRIDDEN';
    current.trace.push({ from: 'WAIVER', id: waiver.id, value: waiver.value, outcome: 'WAIVED', reason: waiver.reason });
    current.value = waiver.value;
    current.source = { type: 'WAIVER', id: waiver.id };
  }

  const effective = [...rules.keys()].sort().map((rule) => {
    const working = rules.get(rule) as Working;
    return { rule, category: working.category, value: working.value, locked: working.locked, source: working.source, trace: working.trace };
  });
  return { effective: deepFreeze(structuredClone(effective)), diagnostics: found };
}

export function effectiveContextItems(document: EffectiveOrganizationContext): Set<string> {
  const items = new Set<string>();
  for (const layer of document.spec.layers) items.add(layer.id);
  for (const waiver of document.spec.waivers) items.add(waiver.id);
  for (const rule of document.spec.effective) items.add(rule.rule);
  return items;
}

export function validateEffectiveOrganizationContext(document: EffectiveOrganizationContext, ref: string): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [...uniqueIds(spec.layers, '/spec/layers', ref), ...uniqueIds(spec.waivers, '/spec/waivers', ref)];
  spec.layers.forEach((layer, index) => {
    const seen = new Set<string>();
    layer.rules.forEach((rule, ruleIndex) => {
      if (seen.has(rule.id)) {
        found.push(diagnostic('CONTRACT_DUPLICATE_ITEM_ID', `rule '${rule.id}' is declared twice in layer '${layer.id}'`, { ref, path: `/spec/layers/${index}/rules/${ruleIndex}/id` }));
      }
      seen.add(rule.id);
    });
  });
  spec.waivers.forEach((waiver, index) => {
    const path = `/spec/waivers/${index}`;
    found.push(...timestamp(waiver.expiresAt, `${path}/expiresAt`, ref));
    if (waiver.approvedBy.type === 'AI_AGENT') {
      found.push(diagnostic('AUTHORITY_AI_CANNOT_DECIDE', `waiver '${waiver.id}' approved by AI agent '${waiver.approvedBy.id}'`, { ref, path: `${path}/approvedBy` }));
    } else if (waiver.approvedBy.type !== 'HUMAN') {
      found.push(diagnostic('AUTHORITY_ACTOR_CANNOT_DECIDE', `waiver '${waiver.id}' approved by ${waiver.approvedBy.type}`, { ref, path: `${path}/approvedBy` }));
    }
  });
  const derived = deriveEffectiveRules(spec.layers, spec.waivers, ref);
  found.push(...derived.diagnostics);
  if (!canonicalEquals(derived.effective, spec.effective)) {
    found.push(
      diagnostic('CONTEXT_NOT_REPRODUCIBLE', 'spec.effective differs from the kernel derivation of its layers and waivers', {
        ref,
        path: '/spec/effective',
      }),
    );
  }
  return found;
}
