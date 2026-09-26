/**
 * Authority rules shared by every contract (document 02 §5, FR-GOV-03, FR-AI-03).
 *
 * Five authority classes exist: OBSERVE, PROPOSE, DECIDE, COMPILE_APPLY and
 * VERIFY. A contract's status never grants authority by itself:
 *
 * - an AUTHORITATIVE contract (desired state) records a DECIDE transition
 *   whenever its status states a decision; only a human, or the system under an
 *   explicit approval policy, may exercise DECIDE — never an AI agent, a
 *   compiler, a checker or an observer; confidence is never approval;
 * - a DERIVED contract is produced by the deterministic compiler and is never
 *   "accepted": it is recomputed;
 * - a RECORD (Evidence) is produced by VERIFY — a checker or a human reviewer,
 *   never an AI answer.
 */

import { diagnostic, type Diagnostic } from './primitives/diagnostics.ts';
import type { Actor, ContractDocument, EvidenceRecordSpec, MaterializationRecordSpec } from './types.ts';

export type StateClass = 'AUTHORITATIVE' | 'DERIVED' | 'RECORD';

/** Statuses that state a decision and therefore require an acceptance record. */
const DECIDED: Readonly<Record<string, 'ACCEPTED' | 'REJECTED'>> = Object.freeze({
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  APPLIED: 'ACCEPTED',
});

/** Statuses in which no decision has been taken yet. */
const UNDECIDED = new Set(['DRAFT', 'PROPOSED', 'WITHDRAWN']);

function decideActor(actor: Actor, hasPolicy: boolean, ref: string): Diagnostic[] {
  const path = '/metadata/acceptance/actor';
  switch (actor.type) {
    case 'HUMAN':
      return [];
    case 'SYSTEM':
      return hasPolicy
        ? []
        : [diagnostic('AUTHORITY_SYSTEM_DECISION_WITHOUT_POLICY', `automatic decision by '${actor.id}' without approval policy`, { ref, path })];
    case 'AI_AGENT':
      return [diagnostic('AUTHORITY_AI_CANNOT_DECIDE', `AI agent '${actor.id}' cannot exercise DECIDE`, { ref, path })];
    default:
      return [diagnostic('AUTHORITY_ACTOR_CANNOT_DECIDE', `${actor.type} '${actor.id}' cannot exercise DECIDE`, { ref, path })];
  }
}

function authoritative(document: ContractDocument, ref: string): Diagnostic[] {
  const { status, acceptance } = document.metadata;
  const expected = DECIDED[status];
  const found: Diagnostic[] = [];
  if (expected && !acceptance) {
    found.push(diagnostic('AUTHORITY_ACCEPTANCE_MISSING', `status ${status} requires an explicit DECIDE transition`, { ref, path: '/metadata/acceptance' }));
  }
  if (acceptance) {
    if (expected && acceptance.decision !== expected) {
      found.push(
        diagnostic('AUTHORITY_ACCEPTANCE_INCONSISTENT', `status ${status} contradicts acceptance decision ${acceptance.decision}`, {
          ref,
          path: '/metadata/acceptance/decision',
        }),
      );
    }
    if (UNDECIDED.has(status)) {
      found.push(
        diagnostic('AUTHORITY_ACCEPTANCE_INCONSISTENT', `status ${status} cannot carry a decision (${acceptance.decision})`, {
          ref,
          path: '/metadata/acceptance',
        }),
      );
    }
    found.push(...decideActor(acceptance.actor, acceptance.approvalPolicy !== undefined, ref));
  }
  return found;
}

function derived(document: ContractDocument, ref: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  const { provenance, acceptance } = document.metadata;
  if (provenance.origin !== 'COMPILER' || provenance.actor.type !== 'COMPILER') {
    found.push(
      diagnostic('AUTHORITY_DERIVED_NOT_COMPILED', `derived contract produced by ${provenance.origin}/${provenance.actor.type}`, {
        ref,
        path: '/metadata/provenance',
      }),
    );
  }
  if (acceptance) {
    found.push(diagnostic('AUTHORITY_ACCEPTANCE_INCONSISTENT', 'a derived contract is recomputed, never accepted', { ref, path: '/metadata/acceptance' }));
  }
  return found;
}

function verifyActor(actor: Actor, mode: string, path: string, ref: string): Diagnostic[] {
  if (actor.type === 'AI_AGENT') return [diagnostic('AUTHORITY_AI_CANNOT_VERIFY', `AI agent '${actor.id}' cannot exercise VERIFY`, { ref, path })];
  const expected = mode === 'HUMAN_REVIEW' ? 'HUMAN' : 'CHECKER';
  if (actor.type !== expected) {
    return [diagnostic('AUTHORITY_ACTOR_CANNOT_VERIFY', `${mode} evidence must be produced by a ${expected}, not ${actor.type} '${actor.id}'`, { ref, path })];
  }
  return [];
}

/** COMPILE_APPLY: a materialization is recorded by the compiler only. */
function applyActor(actor: Actor, path: string, ref: string): Diagnostic[] {
  if (actor.type === 'AI_AGENT') return [diagnostic('AUTHORITY_AI_CANNOT_APPLY', `AI agent '${actor.id}' cannot exercise COMPILE_APPLY`, { ref, path })];
  if (actor.type !== 'COMPILER') return [diagnostic('AUTHORITY_ACTOR_CANNOT_APPLY', `a materialization is recorded by the COMPILER, not ${actor.type} '${actor.id}'`, { ref, path })];
  return [];
}

function record(document: ContractDocument, ref: string): Diagnostic[] {
  if (document.kind === 'MaterializationRecord') {
    const found = [
      ...applyActor((document.spec as MaterializationRecordSpec).producedBy, '/spec/producedBy', ref),
      ...applyActor(document.metadata.provenance.actor, '/metadata/provenance/actor', ref),
    ];
    if (document.metadata.provenance.origin !== 'COMPILER') {
      found.push(diagnostic('AUTHORITY_ACTOR_CANNOT_APPLY', `a materialization record originates from the COMPILER, not ${document.metadata.provenance.origin}`, { ref, path: '/metadata/provenance/origin' }));
    }
    if (document.metadata.acceptance) {
      found.push(diagnostic('AUTHORITY_ACCEPTANCE_INCONSISTENT', 'a materialization record is applied, never accepted', { ref, path: '/metadata/acceptance' }));
    }
    return found;
  }
  const spec = document.spec as EvidenceRecordSpec;
  const found = verifyActor(spec.producedBy, spec.checker.mode, '/spec/producedBy', ref);
  found.push(...verifyActor(document.metadata.provenance.actor, spec.checker.mode, '/metadata/provenance/actor', ref));
  if (document.metadata.acceptance) {
    found.push(diagnostic('AUTHORITY_ACCEPTANCE_INCONSISTENT', 'an Evidence record is verified, never accepted', { ref, path: '/metadata/acceptance' }));
  }
  return found;
}

/** Authority diagnostics of one structurally valid document. */
export function authorityDiagnostics(stateClass: StateClass, document: ContractDocument, ref: string): Diagnostic[] {
  switch (stateClass) {
    case 'AUTHORITATIVE':
      return authoritative(document, ref);
    case 'DERIVED':
      return derived(document, ref);
    case 'RECORD':
      return record(document, ref);
  }
}
