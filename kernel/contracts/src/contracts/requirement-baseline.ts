/**
 * A1 — Requirement Baseline: semantic rules the schema cannot express.
 */

import { idSet, knownIds, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type { RequirementBaseline } from '../types.ts';

const UNDECIDED_REQUIREMENT = new Set(['INFERRED', 'PROPOSED']);

/** Addressable items: `RequirementBaseline/<id>@<rev>#<item>`. */
export function requirementBaselineItems(document: RequirementBaseline): Set<string> {
  const items = new Set<string>();
  for (const goal of document.spec.goals) items.add(goal.id);
  for (const actor of document.spec.actors) items.add(actor.id);
  for (const requirement of document.spec.requirements) {
    items.add(requirement.id);
    for (const criterion of requirement.acceptanceCriteria ?? []) items.add(criterion.id);
  }
  for (const ambiguity of document.spec.ambiguities) items.add(ambiguity.id);
  return items;
}

function dependencyCycles(document: RequirementBaseline, ref: string): Diagnostic[] {
  const graph = new Map(document.spec.requirements.map((requirement) => [requirement.id, requirement.dependsOn ?? []]));
  const state = new Map<string, 'visiting' | 'done'>();
  const found: Diagnostic[] = [];
  const visit = (id: string, trail: string[]): void => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      const cycle = [...trail.slice(trail.indexOf(id)), id];
      found.push(diagnostic('REQUIREMENT_DEPENDENCY_CYCLE', `dependency cycle ${cycle.join(' → ')}`, { ref, path: '/spec/requirements', details: { cycle } }));
      return;
    }
    state.set(id, 'visiting');
    for (const next of [...(graph.get(id) ?? [])].sort()) if (graph.has(next)) visit(next, [...trail, id]);
    state.set(id, 'done');
  };
  for (const id of [...graph.keys()].sort()) visit(id, []);
  return found;
}

export function validateRequirementBaseline(document: RequirementBaseline, ref: string): Diagnostic[] {
  const { spec, metadata } = document;
  const found: Diagnostic[] = [
    ...uniqueIds(spec.sources, '/spec/sources', ref),
    ...uniqueIds(spec.goals, '/spec/goals', ref),
    ...uniqueIds(spec.actors, '/spec/actors', ref),
    ...uniqueIds(spec.requirements, '/spec/requirements', ref),
    ...uniqueIds(spec.ambiguities, '/spec/ambiguities', ref),
  ];
  const sources = idSet(spec.sources);
  const goals = idSet(spec.goals);
  const actors = idSet(spec.actors);
  const requirements = idSet(spec.requirements);

  spec.requirements.forEach((requirement, index) => {
    const path = `/spec/requirements/${index}`;
    found.push(...uniqueIds(requirement.acceptanceCriteria, `${path}/acceptanceCriteria`, ref));
    found.push(...knownIds(requirement.goals, goals, `${path}/goals`, ref, 'REQUIREMENT_UNKNOWN_REFERENCE', 'goal'));
    found.push(...knownIds(requirement.actors, actors, `${path}/actors`, ref, 'REQUIREMENT_UNKNOWN_REFERENCE', 'actor'));
    found.push(...knownIds(requirement.dependsOn, requirements, `${path}/dependsOn`, ref, 'REQUIREMENT_UNKNOWN_REFERENCE', 'requirement'));
    found.push(...knownIds(requirement.conflictsWith, requirements, `${path}/conflictsWith`, ref, 'REQUIREMENT_UNKNOWN_REFERENCE', 'requirement'));
    (requirement.sourceRefs ?? []).forEach((sourceRef, sourceIndex) => {
      if (!sources.has(sourceRef.source)) {
        found.push(diagnostic('REQUIREMENT_UNKNOWN_SOURCE', `unknown source '${sourceRef.source}'`, { ref, path: `${path}/sourceRefs/${sourceIndex}/source` }));
      }
    });
    if (UNDECIDED_REQUIREMENT.has(requirement.status) && (requirement.sourceRefs ?? []).length === 0) {
      found.push(diagnostic('REQUIREMENT_WITHOUT_PROVENANCE', `${requirement.status} requirement '${requirement.id}' cites no source`, { ref, path }));
    }
    if (metadata.status === 'ACCEPTED' && UNDECIDED_REQUIREMENT.has(requirement.status)) {
      found.push(diagnostic('REQUIREMENT_NOT_DECIDED', `requirement '${requirement.id}' is still ${requirement.status}`, { ref, path: `${path}/status` }));
    }
    if (requirement.status === 'ACCEPTED' && requirement.type === 'FUNCTIONAL' && (requirement.acceptanceCriteria ?? []).length === 0) {
      found.push(diagnostic('REQUIREMENT_ACCEPTED_WITHOUT_CRITERIA', `accepted requirement '${requirement.id}' has no acceptance criteria`, { ref, path }));
    }
  });

  spec.ambiguities.forEach((ambiguity, index) => {
    const path = `/spec/ambiguities/${index}`;
    found.push(...knownIds(ambiguity.relatedRequirements, requirements, `${path}/relatedRequirements`, ref, 'REQUIREMENT_UNKNOWN_REFERENCE', 'requirement'));
    if (metadata.status === 'ACCEPTED' && ambiguity.impact === 'BLOCKING' && ambiguity.status === 'OPEN') {
      found.push(diagnostic('REQUIREMENT_BLOCKING_AMBIGUITY_OPEN', `blocking ambiguity '${ambiguity.id}' is still open`, { ref, path }));
    }
  });

  found.push(...dependencyCycles(document, ref));
  return found;
}
