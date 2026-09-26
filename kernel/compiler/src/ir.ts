/**
 * System IR — the normalized internal representation of a System Definition
 * (document 03: derived, never edited as a source of truth).
 *
 * Normalization makes the compiler independent from authoring order: lists
 * are sorted, defaults are made explicit (a component without environments
 * runs in every environment of the system) and domain items are resolved to
 * the pinned Domain Contract revision they belong to. Runtime preferences keep
 * their declared order: it is intent.
 *
 * The IR carries the Domain IR of every pinned Domain Contract (E3) and binds
 * each operation and event to the components that implement, consume,
 * publish or subscribe to it. An event is published by the components that
 * declare it and by the implementers of an operation that emits it. An
 * operation nobody implements, or an event nobody publishes, is listed as
 * unsupported intent: explicit, never blocking.
 */

import {
  digestOf,
  documentRef,
  formatRef,
  parseDomainItemRef,
  type Component,
  type ContractRef,
  type Digest,
  type DesignSystem,
  type DomainContract,
  type SystemDefinition,
} from '@enistere/foundation-kernel-contracts';

import { buildDesignBindings, type DesignBinding } from './design.ts';
import { buildDomainIR, type DomainIR } from './domain-ir.ts';

export interface IRInteraction {
  target: string;
  interaction: string;
  operations: string[];
}

export interface IRComponent {
  id: string;
  name: string;
  kind: string;
  audience: string | null;
  runtime: { preferences: string[]; constraints: string[] };
  platformCapabilities: { id: string; version: string | null }[];
  interactions: IRInteraction[];
  publishes: string[];
  subscribes: string[];
  implements: string[];
  data: { store: string; access: string }[];
  integrations: string[];
  environments: string[];
  ownership: { class: string; team: string };
  requirements: string[];
  decisions: string[];
}

export interface SystemIR {
  system: string;
  definition: string;
  environments: { id: string; kind: string; deploymentMode: string; region: string | null }[];
  integrations: { id: string; kind: string; direction: string; provider: string | null }[];
  components: IRComponent[];
  domains: DomainIR[];
  /** Surfaces bound to a pinned Design System (E6): appearance, independent from the domain. */
  designBindings: DesignBinding[];
  operationBindings: { item: string; implementedBy: string[]; consumedBy: string[] }[];
  eventBindings: { item: string; publishedBy: string[]; subscribedBy: string[] }[];
  unsupported: { item: string; code: 'IR_OPERATION_UNIMPLEMENTED' | 'IR_EVENT_UNPUBLISHED' | 'IR_FACET_NOT_INTERPRETED' }[];
  digest: Digest;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const sorted = (values: readonly string[] | undefined): string[] => [...new Set(values ?? [])].sort(byText);

function domainItemResolver(definition: SystemDefinition): (text: string) => string {
  const contracts = new Map<string, ContractRef>(definition.spec.inputs.domainContracts.map((ref) => [ref.id, ref]));
  return (text) => {
    const parsed = parseDomainItemRef(text);
    const ref = parsed ? contracts.get(parsed.contract) : undefined;
    // Contract-set validation already guarantees resolvable items; keep the text otherwise.
    return parsed && ref ? formatRef({ kind: ref.kind, id: ref.id, revision: ref.revision, item: parsed.item }) : text;
  };
}

function normalizeComponent(component: Component, allEnvironments: readonly string[], resolveItem: (text: string) => string): IRComponent {
  const declared = component.environments ?? allEnvironments;
  return {
    id: component.id,
    name: component.name,
    kind: component.kind,
    audience: component.audience ?? null,
    runtime: { preferences: [...(component.runtime?.preferences ?? [])], constraints: [...(component.runtime?.constraints ?? [])] },
    platformCapabilities: (component.platformCapabilities ?? [])
      .map((capability) => ({ id: capability.id, version: capability.version ?? null }))
      .sort((a, b) => byText(a.id, b.id)),
    interactions: (component.consumes ?? [])
      .map((edge) => ({ target: edge.component, interaction: edge.interaction, operations: sorted((edge.operations ?? []).map(resolveItem)) }))
      .sort((a, b) => byText(a.target, b.target) || byText(a.interaction, b.interaction)),
    publishes: sorted((component.publishes ?? []).map(resolveItem)),
    subscribes: sorted((component.subscribes ?? []).map(resolveItem)),
    implements: sorted((component.implements ?? []).map(resolveItem)),
    data: (component.data ?? []).map((access) => ({ store: access.store, access: access.access })).sort((a, b) => byText(a.store, b.store)),
    integrations: sorted(component.integrations),
    // Declaration order of the system, not of the component.
    environments: allEnvironments.filter((id) => declared.includes(id)),
    ownership: { class: component.ownership.class, team: component.ownership.team },
    requirements: sorted(component.requirements),
    decisions: sorted(component.decisions),
  };
}

function bindings(components: readonly IRComponent[], domains: readonly DomainIR[]): Pick<SystemIR, 'operationBindings' | 'eventBindings' | 'unsupported'> {
  const members = (select: (component: IRComponent) => readonly string[], item: string): string[] =>
    components.filter((component) => select(component).includes(item)).map((component) => component.id);
  const operationBindings = domains.flatMap((domain) =>
    domain.operations.map((operation) => ({
      item: operation.ref,
      implementedBy: members((component) => component.implements, operation.ref),
      consumedBy: members((component) => component.interactions.flatMap((edge) => edge.operations), operation.ref),
    })),
  );
  const eventBindings = domains.flatMap((domain) =>
    domain.events.map((event) => {
      const emitters = domain.operations.filter((operation) => operation.emits.includes(event.ref)).map((operation) => operation.ref);
      const publishedBy = components
        .filter((component) => component.publishes.includes(event.ref) || component.implements.some((operation) => emitters.includes(operation)))
        .map((component) => component.id);
      return { item: event.ref, publishedBy, subscribedBy: members((component) => component.subscribes, event.ref) };
    }),
  );
  const unsupported: SystemIR['unsupported'] = [
    ...operationBindings.filter((binding) => binding.implementedBy.length === 0).map((binding) => ({ item: binding.item, code: 'IR_OPERATION_UNIMPLEMENTED' as const })),
    ...eventBindings.filter((binding) => binding.publishedBy.length === 0).map((binding) => ({ item: binding.item, code: 'IR_EVENT_UNPUBLISHED' as const })),
    ...domains.flatMap((domain) => domain.unsupported.map((facet) => ({ item: `${domain.contract.ref}#${facet.id}`, code: facet.code }))),
  ].sort((a, b) => byText(a.item, b.item) || byText(a.code, b.code));
  return {
    operationBindings: operationBindings.sort((a, b) => byText(a.item, b.item)),
    eventBindings: eventBindings.sort((a, b) => byText(a.item, b.item)),
    unsupported,
  };
}

/**
 * Builds the IR of a definition that belongs to a valid contract set.
 * `domainContracts` are the Domain Contracts of its closure; only the
 * revisions the definition pins are used.
 */
export function buildSystemIR(definition: SystemDefinition, domainContracts: readonly DomainContract[] = [], designSystems: readonly DesignSystem[] = []): SystemIR {
  const environments = definition.spec.environments.map((environment) => ({ id: environment.id, kind: environment.kind, deploymentMode: environment.deploymentMode, region: environment.region ?? null }));
  const allEnvironments = environments.map((environment) => environment.id);
  const resolveItem = domainItemResolver(definition);
  const content = {
    system: definition.spec.system,
    definition: documentRef(definition),
    environments,
    integrations: definition.spec.integrations
      .map((integration) => ({ id: integration.id, kind: integration.kind, direction: integration.direction, provider: integration.provider ?? null }))
      .sort((a, b) => byText(a.id, b.id)),
    components: definition.spec.components
      .map((component) => normalizeComponent(component, allEnvironments, resolveItem))
      .sort((a, b) => byText(a.id, b.id)),
  };
  const pinned = definition.spec.inputs.domainContracts;
  const domains = domainContracts
    .filter((contract) => pinned.some((ref) => ref.id === contract.metadata.id && ref.revision === contract.metadata.revision))
    .map(buildDomainIR)
    .sort((a, b) => byText(a.contract.ref, b.contract.ref));
  const withDomains = { ...content, domains, designBindings: buildDesignBindings(definition, designSystems), ...bindings(content.components, domains) };
  return { ...withDomains, digest: digestOf(withDomains) };
}
