/**
 * Design bindings — what each surface looks like, derived from the Design
 * System (A9) it pins and the design context it declares (mission E6,
 * ADR-100).
 *
 * A binding carries the resolved tokens (context overrides applied, aliases
 * resolved, by the kernel's single token resolution) and the accessibility
 * conformance of the design system. It is independent from the domain: a
 * token change never changes the Domain IR or an API contract, and a domain
 * change never changes a binding (theme ≠ domain).
 */

import { contractDigest, digestOf, documentRef, resolveDesignTokens, type DesignSystem, type Digest, type ResolvedToken, type SystemDefinition } from '@enistere/foundation-kernel-contracts';

export interface DesignBinding {
  component: string;
  designSystem: { ref: string; digest: Digest };
  context: string;
  accessibility: { standard: string; level: string };
  tokens: Record<string, ResolvedToken>;
  digest: Digest;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The binding of every surface that pins a design system of `designSystems`. */
export function buildDesignBindings(definition: SystemDefinition, designSystems: readonly DesignSystem[]): DesignBinding[] {
  const bindings: DesignBinding[] = [];
  for (const component of definition.spec.components) {
    const pinned = component.experience?.designSystem;
    if (!component.experience || !pinned) continue;
    const system = designSystems.find((candidate) => candidate.metadata.id === pinned.id && candidate.metadata.revision === pinned.revision);
    if (!system) continue;
    const content = {
      component: component.id,
      designSystem: { ref: documentRef(system), digest: contractDigest(system) },
      context: component.experience.designContext,
      accessibility: { ...system.spec.accessibility },
      tokens: resolveDesignTokens(system, component.experience.designContext),
    };
    bindings.push({ ...content, digest: digestOf(content) });
  }
  return bindings.sort((a, b) => byText(a.component, b.component));
}
