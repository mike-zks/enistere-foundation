/**
 * System IR — the normalized internal representation of a System Definition
 * (document 03: derived, never edited as a source of truth).
 *
 * Normalization makes the compiler independent from authoring order: lists
 * are sorted, defaults are made explicit (a component without environments
 * runs in every environment of the system) and domain items are resolved to
 * the pinned Domain Contract revision they belong to. Runtime preferences keep
 * their declared order: it is intent.
 */

import {
  digestOf,
  documentRef,
  formatRef,
  parseDomainItemRef,
  type Component,
  type ContractRef,
  type Digest,
  type SystemDefinition,
} from '@enistere/foundation-kernel-contracts';

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
  environments: { id: string; kind: string; deploymentMode: string }[];
  integrations: { id: string; kind: string; direction: string }[];
  components: IRComponent[];
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

/** Builds the IR of a definition that belongs to a valid contract set. */
export function buildSystemIR(definition: SystemDefinition): SystemIR {
  const environments = definition.spec.environments.map((environment) => ({ id: environment.id, kind: environment.kind, deploymentMode: environment.deploymentMode }));
  const allEnvironments = environments.map((environment) => environment.id);
  const resolveItem = domainItemResolver(definition);
  const content = {
    system: definition.spec.system,
    definition: documentRef(definition),
    environments,
    integrations: definition.spec.integrations
      .map((integration) => ({ id: integration.id, kind: integration.kind, direction: integration.direction }))
      .sort((a, b) => byText(a.id, b.id)),
    components: definition.spec.components
      .map((component) => normalizeComponent(component, allEnvironments, resolveItem))
      .sort((a, b) => byText(a.id, b.id)),
  };
  return { ...content, digest: digestOf(content) };
}
