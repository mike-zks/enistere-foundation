/**
 * A9 — Design System: semantic rules and token resolution (mission E6,
 * ADR-100).
 *
 * Tokens follow the W3C Design Tokens format: nested groups, typed leaves
 * (`$type`, `$value`) and aliases (`{group.token}`). A design context may
 * override token values. Resolution flattens the tree, applies the context
 * overrides and resolves aliases: it is the only interpretation of tokens in
 * Foundation, used by validation and by the compiler's design bindings.
 *
 * A design system describes appearance; it never carries domain semantics.
 */

import { uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type { DesignSystem, DesignToken, DesignTokenGroup, DesignTokenType, DesignTokenValue } from '../types.ts';

export interface ResolvedToken {
  type: DesignTokenType;
  value: string | number | string[];
}

const ALIAS = /^\{([^{}]+)\}$/;
const VALUE_RULES: Readonly<Record<DesignTokenType, (value: DesignTokenValue) => boolean>> = Object.freeze({
  color: (value) => typeof value === 'string' && /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value),
  dimension: (value) => typeof value === 'string' && /^-?[0-9]+(?:\.[0-9]+)?(?:px|rem)$/.test(value),
  fontFamily: (value) => (typeof value === 'string' && value.length > 0) || (Array.isArray(value) && value.length > 0),
  fontWeight: (value) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1000,
  number: (value) => typeof value === 'number' && Number.isFinite(value),
  duration: (value) => typeof value === 'string' && /^[0-9]+(?:\.[0-9]+)?(?:ms|s)$/.test(value),
});

/** Every token of a tree, by dotted path, as authored. */
export function flattenTokens(group: DesignTokenGroup, prefix = ''): Map<string, { type: DesignTokenType; value: DesignTokenValue }> {
  const tokens = new Map<string, { type: DesignTokenType; value: DesignTokenValue }>();
  for (const [name, child] of Object.entries(group)) {
    if (name.startsWith('$')) continue;
    const path = prefix === '' ? name : `${prefix}.${name}`;
    if (child === undefined || typeof child !== 'object') continue;
    if ('$value' in child) {
      const token = child as DesignToken;
      tokens.set(path, { type: token.$type, value: token.$value });
    } else for (const [key, token] of flattenTokens(child as DesignTokenGroup, path)) tokens.set(key, token);
  }
  return tokens;
}

const aliasOf = (value: DesignTokenValue): string | null => (typeof value === 'string' ? (ALIAS.exec(value)?.[1] ?? null) : null);

/**
 * Checks a token tree (and optional overrides): values match their type,
 * aliases resolve to a token of the same type, without cycle.
 */
export function validateTokens(tokens: DesignTokenGroup, ref: string, basePath = '/spec/tokens'): Diagnostic[] {
  const found: Diagnostic[] = [];
  const flat = flattenTokens(tokens);
  const pointer = (path: string): string => `${basePath}/${path.split('.').join('/')}/$value`;
  for (const [path, token] of flat) {
    const target = aliasOf(token.value);
    if (target === null) {
      if (!VALUE_RULES[token.type](token.value)) found.push(diagnostic('DESIGN_TOKEN_INVALID_VALUE', `'${path}' is not a valid ${token.type}`, { ref, path: pointer(path) }));
      continue;
    }
    const aliased = flat.get(target);
    if (!aliased) {
      found.push(diagnostic('DESIGN_TOKEN_UNRESOLVED_ALIAS', `'${path}' refers to unknown token '${target}'`, { ref, path: pointer(path) }));
      continue;
    }
    if (aliased.type !== token.type) found.push(diagnostic('DESIGN_TOKEN_TYPE_MISMATCH', `'${path}' (${token.type}) refers to '${target}' (${aliased.type})`, { ref, path: pointer(path) }));
    const seen = new Set([path]);
    let next: string | null = target;
    while (next !== null) {
      if (seen.has(next)) {
        found.push(diagnostic('DESIGN_TOKEN_ALIAS_CYCLE', `'${path}' is part of an alias cycle`, { ref, path: pointer(path) }));
        break;
      }
      seen.add(next);
      const current = flat.get(next);
      next = current ? aliasOf(current.value) : null;
    }
  }
  return found;
}

export function designSystemItems(document: DesignSystem): Set<string> {
  return new Set(document.spec.contexts.map((context) => context.id));
}

export function validateDesignSystem(document: DesignSystem, ref: string): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [...uniqueIds(spec.contexts, '/spec/contexts', ref), ...validateTokens(spec.tokens, ref)];
  const flat = flattenTokens(spec.tokens);
  spec.contexts.forEach((context, index) => {
    for (const [path, value] of Object.entries(context.overrides ?? {})) {
      const pointer = `/spec/contexts/${index}/overrides/${path.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      const base = flat.get(path);
      if (!base) {
        found.push(diagnostic('DESIGN_CONTEXT_UNKNOWN_TOKEN', `context '${context.id}' overrides unknown token '${path}'`, { ref, path: pointer }));
        continue;
      }
      const target = aliasOf(value);
      if (target === null ? !VALUE_RULES[base.type](value) : flat.get(target)?.type !== base.type) {
        found.push(diagnostic('DESIGN_TOKEN_INVALID_VALUE', `context '${context.id}' gives '${path}' a value that is not a valid ${base.type}`, { ref, path: pointer }));
      }
    }
  });
  return found;
}

/**
 * The resolved tokens of a design context: overrides applied, aliases
 * resolved, sorted by path. The document must be valid.
 */
export function resolveDesignTokens(document: DesignSystem, contextId: string): Record<string, ResolvedToken> {
  const flat = flattenTokens(document.spec.tokens);
  const context = document.spec.contexts.find((candidate) => candidate.id === contextId);
  for (const [path, value] of Object.entries(context?.overrides ?? {})) {
    const base = flat.get(path);
    if (base) flat.set(path, { type: base.type, value });
  }
  const resolve = (path: string, depth = 0): ResolvedToken => {
    const token = flat.get(path);
    if (!token || depth > flat.size) throw new Error(`unresolvable design token '${path}'`);
    const target = aliasOf(token.value);
    return target === null ? { type: token.type, value: Array.isArray(token.value) ? [...token.value] : token.value } : { ...resolve(target, depth + 1), type: token.type };
  };
  const result: Record<string, ResolvedToken> = {};
  for (const path of [...flat.keys()].sort()) result[path] = resolve(path);
  return result;
}
