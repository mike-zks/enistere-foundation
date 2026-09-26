/**
 * Domain IR — the normalized internal representation of a Domain Contract
 * (A5), derived and never edited (document 03: System IR / Domain IR).
 *
 * Normalization: collections are sorted by id (field order is kept: it is
 * intent), type expressions are resolved to a primitive or to a type of the
 * contract, and every cross-reference (emitted events, invariants, acceptance
 * operations, facet targets) becomes a pinned item reference
 * (`DomainContract/<id>@<revision>#<item>`), so that two contracts can never
 * be confused.
 *
 * Facets (offline sync, scheduling, workflow…) are carried as data and listed
 * as `unsupported`: the kernel does not interpret them before the domain
 * projection (E5) and the organization bindings (E6). Nothing is dropped.
 */

import {
  contractDigest,
  digestOf,
  documentRef,
  DOMAIN_PRIMITIVES,
  elementType,
  formatRef,
  type Digest,
  type DomainContract,
  type JsonValue,
} from '@enistere/foundation-kernel-contracts';

export interface DomainTypeRef {
  expression: string;
  list: boolean;
  primitive: string | null;
  type: string | null;
}

export interface DomainIR {
  contract: { ref: string; digest: Digest };
  boundedContext: string;
  types: {
    id: string;
    ref: string;
    kind: string;
    fields: { name: string; type: DomainTypeRef; required: boolean; sensitive: boolean }[];
    values: string[];
  }[];
  operations: {
    id: string;
    ref: string;
    kind: string;
    input: DomainTypeRef | null;
    output: DomainTypeRef | null;
    errors: string[];
    authorization: { intent: string; roles: string[] };
    emits: string[];
    invariants: string[];
    idempotent: boolean;
  }[];
  events: { id: string; ref: string; version: number; payload: DomainTypeRef }[];
  invariants: { id: string; ref: string; statement: string; appliesTo: string[]; enforcement: string }[];
  acceptance: { id: string; ref: string; operations: string[]; requirements: string[] }[];
  facets: { id: string; version: string; appliesTo: string[]; configuration: JsonValue }[];
  unsupported: { kind: 'FACET'; id: string; code: 'IR_FACET_NOT_INTERPRETED' }[];
  digest: Digest;
}

const PRIMITIVES: ReadonlySet<string> = new Set(DOMAIN_PRIMITIVES);
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const byId = <T extends { id: string }>(a: T, b: T): number => byText(a.id, b.id);
const sorted = (values: readonly string[] | undefined): string[] => [...new Set(values ?? [])].sort(byText);

export function buildDomainIR(contract: DomainContract): DomainIR {
  const item = (id: string): string => formatRef({ kind: 'DomainContract', id: contract.metadata.id, revision: contract.metadata.revision, item: id });
  const typeIds = new Set(contract.spec.types.map((type) => type.id));
  const resolveType = (expression: string): DomainTypeRef => {
    const element = elementType(expression);
    return {
      expression,
      list: element !== expression,
      primitive: PRIMITIVES.has(element) ? element : null,
      // Contract validation guarantees every non-primitive element is a declared type.
      type: typeIds.has(element) ? item(element) : null,
    };
  };
  const { spec } = contract;
  const content = {
    contract: { ref: documentRef(contract), digest: contractDigest(contract) },
    boundedContext: spec.boundedContext,
    types: spec.types
      .map((type) => ({
        id: type.id,
        ref: item(type.id),
        kind: type.kind,
        fields: (type.fields ?? []).map((field) => ({ name: field.name, type: resolveType(field.type), required: field.required, sensitive: field.sensitive === true })),
        values: [...(type.values ?? [])],
      }))
      .sort(byId),
    operations: spec.operations
      .map((operation) => ({
        id: operation.id,
        ref: item(operation.id),
        kind: operation.kind,
        input: operation.input === undefined ? null : resolveType(operation.input),
        output: operation.output === undefined ? null : resolveType(operation.output),
        errors: sorted(operation.errors),
        authorization: { intent: operation.authorization.intent, roles: sorted(operation.authorization.roles) },
        emits: sorted((operation.emits ?? []).map(item)),
        invariants: sorted((operation.invariants ?? []).map(item)),
        idempotent: operation.idempotent === true,
      }))
      .sort(byId),
    events: spec.events.map((event) => ({ id: event.id, ref: item(event.id), version: event.version, payload: resolveType(event.payload) })).sort(byId),
    invariants: spec.invariants
      .map((invariant) => ({ id: invariant.id, ref: item(invariant.id), statement: invariant.statement, appliesTo: sorted(invariant.appliesTo.map(item)), enforcement: invariant.enforcement }))
      .sort(byId),
    acceptance: spec.acceptance
      .map((scenario) => ({ id: scenario.id, ref: item(scenario.id), operations: sorted(scenario.operations.map(item)), requirements: sorted(scenario.requirements) }))
      .sort(byId),
    facets: spec.facets
      .map((facet) => ({ id: facet.id, version: facet.version, appliesTo: sorted(facet.appliesTo.map(item)), configuration: (facet.configuration ?? {}) as JsonValue }))
      .sort(byId),
    unsupported: spec.facets.map((facet) => ({ kind: 'FACET' as const, id: facet.id, code: 'IR_FACET_NOT_INTERPRETED' as const })).sort(byId),
  };
  return { ...content, digest: digestOf(content) };
}
