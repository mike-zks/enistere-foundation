/**
 * A4 — System Definition: semantic rules.
 *
 * The kernel checks the coherence of the desired state (identities, relations,
 * data ownership, traceability to requirements and decisions, domain
 * operations and events). It never interprets component kinds or runtime
 * preferences: those are opaque identifiers that extensions resolve (E2).
 */

import { idSet, knownIds, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import { parseDomainItemRef } from '../primitives/refs.ts';
import type { DecisionSet, DomainContract, RequirementBaseline, SystemDefinition } from '../types.ts';

export function systemDefinitionItems(document: SystemDefinition): Set<string> {
  return new Set([
    ...document.spec.components.map((component) => component.id),
    ...document.spec.integrations.map((integration) => integration.id),
    ...document.spec.environments.map((environment) => environment.id),
  ]);
}

export function validateSystemDefinition(document: SystemDefinition, ref: string): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [
    ...uniqueIds(spec.components, '/spec/components', ref),
    ...uniqueIds(spec.integrations, '/spec/integrations', ref),
    ...uniqueIds(spec.environments, '/spec/environments', ref),
  ];
  const components = idSet(spec.components);
  const integrations = idSet(spec.integrations);
  const environments = idSet(spec.environments);
  const owners = new Map<string, string[]>();

  spec.components.forEach((component, index) => {
    const path = `/spec/components/${index}`;
    (component.consumes ?? []).forEach((consumed, consumedIndex) => {
      const consumedPath = `${path}/consumes/${consumedIndex}/component`;
      if (consumed.component === component.id) {
        found.push(diagnostic('SYSTEM_SELF_DEPENDENCY', `component '${component.id}' consumes itself`, { ref, path: consumedPath }));
      } else if (!components.has(consumed.component)) {
        found.push(diagnostic('SYSTEM_UNKNOWN_COMPONENT', `unknown component '${consumed.component}'`, { ref, path: consumedPath }));
      }
    });
    (component.data ?? []).forEach((access, accessIndex) => {
      if (!components.has(access.store)) {
        found.push(diagnostic('SYSTEM_UNKNOWN_COMPONENT', `unknown data store '${access.store}'`, { ref, path: `${path}/data/${accessIndex}/store` }));
      } else if (access.access === 'OWNER') {
        owners.set(access.store, [...(owners.get(access.store) ?? []), component.id]);
      }
    });
    found.push(...knownIds(component.integrations, integrations, `${path}/integrations`, ref, 'SYSTEM_UNKNOWN_INTEGRATION', 'integration'));
    found.push(...knownIds(component.environments, environments, `${path}/environments`, ref, 'SYSTEM_UNKNOWN_ENVIRONMENT', 'environment'));
  });

  const stores = new Set(spec.components.flatMap((component) => (component.data ?? []).map((access) => access.store)));
  for (const store of [...stores].sort()) {
    if (!components.has(store)) continue;
    const storeOwners = owners.get(store) ?? [];
    const storePath = `/spec/components/${spec.components.findIndex((component) => component.id === store)}`;
    if (storeOwners.length > 1) {
      found.push(diagnostic('SYSTEM_DATA_OWNER_CONFLICT', `data store '${store}' is owned by ${storeOwners.join(', ')}`, { ref, path: storePath }));
    } else if (storeOwners.length === 0) {
      found.push(diagnostic('SYSTEM_DATA_STORE_WITHOUT_OWNER', `data store '${store}' has no owning component`, { ref, path: storePath }));
    }
  }
  return found;
}

export interface SystemDefinitionInputs {
  baseline?: RequirementBaseline | undefined;
  decisions?: DecisionSet | undefined;
  domains: ReadonlyMap<string, DomainContract>;
}

/** Traceability and domain coherence against the pinned inputs. */
export function crossValidateSystemDefinition(document: SystemDefinition, ref: string, inputs: SystemDefinitionInputs): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [];
  const requirements = inputs.baseline ? idSet(inputs.baseline.spec.requirements) : null;
  const decisions = inputs.decisions ? idSet(inputs.decisions.spec.decisions) : null;

  const domainItem = (text: string, expected: 'operation' | 'event', path: string): { contract: string; item: string } | null => {
    const parsed = parseDomainItemRef(text);
    const domain = parsed ? inputs.domains.get(parsed.contract) : undefined;
    const items = domain ? (expected === 'operation' ? domain.spec.operations : domain.spec.events) : [];
    if (!parsed || !domain || !items.some((item) => item.id === parsed.item)) {
      found.push(diagnostic('SYSTEM_UNKNOWN_DOMAIN_ITEM', `unknown domain ${expected} '${text}'`, { ref, path }));
      return null;
    }
    return parsed;
  };

  const implemented = new Map<string, Set<string>>();
  const published = new Set<string>();
  spec.components.forEach((component, index) => {
    const path = `/spec/components/${index}`;
    if (requirements) found.push(...knownIds(component.requirements, requirements, `${path}/requirements`, ref, 'SYSTEM_UNKNOWN_REQUIREMENT', 'requirement'));
    if (decisions) found.push(...knownIds(component.decisions, decisions, `${path}/decisions`, ref, 'SYSTEM_UNKNOWN_DECISION', 'decision'));
    const own = new Set<string>();
    (component.implements ?? []).forEach((text, itemIndex) => {
      const parsed = domainItem(text, 'operation', `${path}/implements/${itemIndex}`);
      if (!parsed) return;
      own.add(text);
      const operation = inputs.domains.get(parsed.contract)?.spec.operations.find((item) => item.id === parsed.item);
      for (const event of operation?.emits ?? []) published.add(`${parsed.contract}#${event}`);
    });
    implemented.set(component.id, own);
    (component.publishes ?? []).forEach((text, itemIndex) => {
      if (domainItem(text, 'event', `${path}/publishes/${itemIndex}`)) published.add(text);
    });
  });

  spec.components.forEach((component, index) => {
    const path = `/spec/components/${index}`;
    (component.consumes ?? []).forEach((consumed, consumedIndex) => {
      (consumed.operations ?? []).forEach((text, opIndex) => {
        const opPath = `${path}/consumes/${consumedIndex}/operations/${opIndex}`;
        if (!domainItem(text, 'operation', opPath)) return;
        if (!(implemented.get(consumed.component)?.has(text) ?? false)) {
          found.push(diagnostic('SYSTEM_OPERATION_WITHOUT_PROVIDER', `'${consumed.component}' does not implement '${text}'`, { ref, path: opPath }));
        }
      });
    });
    (component.subscribes ?? []).forEach((text, itemIndex) => {
      const eventPath = `${path}/subscribes/${itemIndex}`;
      if (domainItem(text, 'event', eventPath) && !published.has(text)) {
        found.push(diagnostic('SYSTEM_EVENT_WITHOUT_PRODUCER', `no component publishes '${text}'`, { ref, path: eventPath }));
      }
    });
  });

  if (inputs.baseline) {
    const allocated = new Set(spec.components.flatMap((component) => component.requirements ?? []));
    inputs.baseline.spec.requirements.forEach((requirement) => {
      if (requirement.status === 'ACCEPTED' && requirement.type === 'FUNCTIONAL' && !allocated.has(requirement.id)) {
        found.push(diagnostic('SYSTEM_REQUIREMENT_UNCOVERED', `accepted requirement '${requirement.id}' is allocated to no component`, { ref, path: '/spec/components' }));
      }
    });
  }
  return found;
}
