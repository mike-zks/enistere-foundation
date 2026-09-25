/**
 * A5 — Domain Contract: semantic rules.
 */

import { idSet, knownIds, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type { DomainContract, RequirementBaseline } from '../types.ts';

/** Primitive types every runtime family must be able to represent. */
export const DOMAIN_PRIMITIVES = Object.freeze(['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'file-ref'] as const);
const PRIMITIVES: ReadonlySet<string> = new Set(DOMAIN_PRIMITIVES);

/** The element type of a type expression (`list<X>` → `X`). */
export function elementType(expression: string): string {
  const match = /^list<(.+)>$/.exec(expression);
  return match ? (match[1] as string) : expression;
}

export function domainContractItems(document: DomainContract): Set<string> {
  const { spec } = document;
  return new Set([
    ...spec.types.map((item) => item.id),
    ...spec.operations.map((item) => item.id),
    ...spec.invariants.map((item) => item.id),
    ...spec.events.map((item) => item.id),
    ...spec.acceptance.map((item) => item.id),
  ]);
}

export function validateDomainContract(document: DomainContract, ref: string): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [
    ...uniqueIds(spec.types, '/spec/types', ref),
    ...uniqueIds(spec.operations, '/spec/operations', ref),
    ...uniqueIds(spec.invariants, '/spec/invariants', ref),
    ...uniqueIds(spec.events, '/spec/events', ref),
    ...uniqueIds(spec.acceptance, '/spec/acceptance', ref),
    ...uniqueIds(spec.facets, '/spec/facets', ref),
  ];
  const types = idSet(spec.types);
  const operations = idSet(spec.operations);
  const events = idSet(spec.events);
  const invariants = idSet(spec.invariants);

  const typeExpression = (expression: string | undefined, path: string): void => {
    if (expression === undefined) return;
    const element = elementType(expression);
    if (!PRIMITIVES.has(element) && !types.has(element)) {
      found.push(diagnostic('DOMAIN_UNKNOWN_TYPE', `unknown type '${element}'`, { ref, path }));
    }
  };

  spec.types.forEach((type, index) => {
    const path = `/spec/types/${index}`;
    const hasFields = (type.fields ?? []).length > 0;
    const hasValues = (type.values ?? []).length > 0;
    if (type.kind === 'ENUM' ? hasFields || !hasValues : hasValues || !hasFields) {
      found.push(diagnostic('DOMAIN_INVALID_TYPE_SHAPE', `${type.kind} type '${type.id}' has an invalid shape`, { ref, path }));
    }
    const names = new Set<string>();
    (type.fields ?? []).forEach((field, fieldIndex) => {
      const fieldPath = `${path}/fields/${fieldIndex}`;
      if (names.has(field.name)) found.push(diagnostic('CONTRACT_DUPLICATE_ITEM_ID', `field '${field.name}' is declared twice in '${type.id}'`, { ref, path: `${fieldPath}/name` }));
      names.add(field.name);
      typeExpression(field.type, `${fieldPath}/type`);
    });
  });

  spec.operations.forEach((operation, index) => {
    const path = `/spec/operations/${index}`;
    typeExpression(operation.input, `${path}/input`);
    typeExpression(operation.output, `${path}/output`);
    found.push(...knownIds(operation.emits, events, `${path}/emits`, ref, 'DOMAIN_UNKNOWN_EVENT', 'event'));
    found.push(...knownIds(operation.invariants, invariants, `${path}/invariants`, ref, 'DOMAIN_UNKNOWN_INVARIANT', 'invariant'));
  });

  spec.invariants.forEach((invariant, index) => {
    found.push(...knownIds(invariant.appliesTo, types, `/spec/invariants/${index}/appliesTo`, ref, 'DOMAIN_UNKNOWN_TYPE', 'type'));
  });
  spec.events.forEach((event, index) => typeExpression(event.payload, `/spec/events/${index}/payload`));
  spec.acceptance.forEach((scenario, index) => {
    found.push(...knownIds(scenario.operations, operations, `/spec/acceptance/${index}/operations`, ref, 'DOMAIN_UNKNOWN_OPERATION', 'operation'));
  });
  const facetTargets = new Set([...types, ...operations, ...events]);
  spec.facets.forEach((facet, index) => {
    found.push(...knownIds(facet.appliesTo, facetTargets, `/spec/facets/${index}/appliesTo`, ref, 'DOMAIN_UNKNOWN_TYPE', 'facet target'));
  });
  return found;
}

/** Acceptance scenarios cite requirements of the pinned baseline. */
export function crossValidateDomainContract(document: DomainContract, ref: string, baseline: RequirementBaseline): Diagnostic[] {
  const requirements = idSet(baseline.spec.requirements);
  return document.spec.acceptance.flatMap((scenario, index) =>
    knownIds(scenario.requirements, requirements, `/spec/acceptance/${index}/requirements`, ref, 'DOMAIN_UNKNOWN_REQUIREMENT', 'requirement'),
  );
}
