/**
 * A2 — Decision Set: semantic rules.
 */

import { idSet, knownIds, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type { DecisionSet, RequirementBaseline } from '../types.ts';

export function decisionSetItems(document: DecisionSet): Set<string> {
  return idSet(document.spec.decisions);
}

export function validateDecisionSet(document: DecisionSet, ref: string): Diagnostic[] {
  const { spec, metadata } = document;
  const found: Diagnostic[] = [...uniqueIds(spec.decisions, '/spec/decisions', ref)];
  const decisions = idSet(spec.decisions);

  spec.decisions.forEach((decision, index) => {
    const path = `/spec/decisions/${index}`;
    found.push(...uniqueIds(decision.options, `${path}/options`, ref));
    const options = idSet(decision.options);
    if (decision.chosenOption !== undefined && !options.has(decision.chosenOption)) {
      found.push(diagnostic('DECISION_UNKNOWN_OPTION', `chosen option '${decision.chosenOption}' was not evaluated`, { ref, path: `${path}/chosenOption` }));
    }
    if (decision.status === 'ACCEPTED') {
      if (decision.chosenOption === undefined || decision.rationale === undefined) {
        found.push(diagnostic('DECISION_CHOSEN_OPTION_MISSING', `accepted decision '${decision.id}' lacks its chosen option or rationale`, { ref, path }));
      }
      if (decision.options.length < 2) {
        found.push(diagnostic('DECISION_NO_ALTERNATIVE', `accepted decision '${decision.id}' records no alternative`, { ref, path: `${path}/options` }));
      }
    }
    if (decision.supersedes !== undefined && (!decisions.has(decision.supersedes) || decision.supersedes === decision.id)) {
      found.push(diagnostic('DECISION_UNKNOWN_SUPERSEDED', `'${decision.id}' supersedes unknown decision '${decision.supersedes}'`, { ref, path: `${path}/supersedes` }));
    }
    if (metadata.status === 'ACCEPTED' && decision.status === 'PROPOSED') {
      found.push(diagnostic('DECISION_NOT_DECIDED', `decision '${decision.id}' is still PROPOSED`, { ref, path: `${path}/status` }));
    }
  });
  return found;
}

/** Drivers and satisfied requirements exist in the pinned baseline. */
export function crossValidateDecisionSet(document: DecisionSet, ref: string, baseline: RequirementBaseline): Diagnostic[] {
  const requirements = idSet(baseline.spec.requirements);
  const found: Diagnostic[] = [];
  document.spec.decisions.forEach((decision, index) => {
    const path = `/spec/decisions/${index}`;
    found.push(...knownIds(decision.drivers, requirements, `${path}/drivers`, ref, 'DECISION_UNKNOWN_REQUIREMENT', 'requirement'));
    decision.options.forEach((option, optionIndex) => {
      found.push(...knownIds(option.satisfies, requirements, `${path}/options/${optionIndex}/satisfies`, ref, 'DECISION_UNKNOWN_REQUIREMENT', 'requirement'));
    });
  });
  return found;
}
