/**
 * The contract registry: one entry per E0 contract kind (A1–A7).
 *
 * Each entry states the Desired/Resolved/Observed class of the contract, its
 * schema, its intra-document semantic rules and the items a stable reference may
 * address (`#item`). There is exactly one entry per responsibility.
 */

import type { StateClass } from './authority.ts';
import { changeRequestItems, validateChangeRequest } from './contracts/change-request.ts';
import { decisionSetItems, validateDecisionSet } from './contracts/decision-set.ts';
import { domainContractItems, validateDomainContract } from './contracts/domain-contract.ts';
import { effectiveContextItems, validateEffectiveOrganizationContext } from './contracts/effective-organization-context.ts';
import { evidenceRecordItems, validateEvidenceRecord } from './contracts/evidence-record.ts';
import { requirementBaselineItems, validateRequirementBaseline } from './contracts/requirement-baseline.ts';
import { systemDefinitionItems, validateSystemDefinition } from './contracts/system-definition.ts';
import type { Diagnostic } from './primitives/diagnostics.ts';
import type { ContractKind } from './primitives/refs.ts';
import { SCHEMA_FILES } from './schema-validation.ts';
import type { AnyContract } from './types.ts';

export interface KindDefinition {
  readonly kind: ContractKind;
  readonly code: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7';
  readonly stateClass: StateClass;
  /** Desired (authoritative intent), Derived (recomputable) or Record (append-only proof). */
  readonly plane: 'DESIRED' | 'DERIVED' | 'EVIDENCE';
  readonly schema: string;
  /** Statuses in which the revision is the one in force (used for staleness). */
  readonly inForce: readonly string[];
  /** Statuses a dependent ACCEPTED contract may rely on. */
  readonly reliable: readonly string[];
  readonly validate: (document: AnyContract, ref: string) => Diagnostic[];
  readonly items: (document: AnyContract) => Set<string>;
}

const define = <T extends AnyContract>(
  definition: Omit<KindDefinition, 'validate' | 'items' | 'schema'> & {
    validate: (document: T, ref: string) => Diagnostic[];
    items: (document: T) => Set<string>;
  },
): KindDefinition =>
  Object.freeze({
    ...definition,
    schema: SCHEMA_FILES[definition.kind],
    inForce: Object.freeze([...definition.inForce]),
    reliable: Object.freeze([...definition.reliable]),
    validate: definition.validate as KindDefinition['validate'],
    items: definition.items as KindDefinition['items'],
  });

const DECIDED_IN_FORCE = ['ACCEPTED'];
const DECIDED_RELIABLE = ['ACCEPTED', 'SUPERSEDED'];

export const CONTRACT_REGISTRY: Readonly<Record<ContractKind, KindDefinition>> = Object.freeze({
  RequirementBaseline: define({
    kind: 'RequirementBaseline',
    code: 'A1',
    stateClass: 'AUTHORITATIVE',
    plane: 'DESIRED',
    inForce: DECIDED_IN_FORCE,
    reliable: DECIDED_RELIABLE,
    validate: validateRequirementBaseline,
    items: requirementBaselineItems,
  }),
  DecisionSet: define({
    kind: 'DecisionSet',
    code: 'A2',
    stateClass: 'AUTHORITATIVE',
    plane: 'DESIRED',
    inForce: DECIDED_IN_FORCE,
    reliable: DECIDED_RELIABLE,
    validate: validateDecisionSet,
    items: decisionSetItems,
  }),
  EffectiveOrganizationContext: define({
    kind: 'EffectiveOrganizationContext',
    code: 'A3',
    stateClass: 'DERIVED',
    plane: 'DERIVED',
    inForce: ['CURRENT'],
    reliable: ['CURRENT'],
    validate: validateEffectiveOrganizationContext,
    items: effectiveContextItems,
  }),
  SystemDefinition: define({
    kind: 'SystemDefinition',
    code: 'A4',
    stateClass: 'AUTHORITATIVE',
    plane: 'DESIRED',
    inForce: DECIDED_IN_FORCE,
    reliable: DECIDED_RELIABLE,
    validate: validateSystemDefinition,
    items: systemDefinitionItems,
  }),
  DomainContract: define({
    kind: 'DomainContract',
    code: 'A5',
    stateClass: 'AUTHORITATIVE',
    plane: 'DESIRED',
    inForce: DECIDED_IN_FORCE,
    reliable: DECIDED_RELIABLE,
    validate: validateDomainContract,
    items: domainContractItems,
  }),
  ChangeRequest: define({
    kind: 'ChangeRequest',
    code: 'A6',
    stateClass: 'AUTHORITATIVE',
    plane: 'DESIRED',
    inForce: ['ACCEPTED', 'APPLIED'],
    reliable: ['ACCEPTED', 'APPLIED'],
    validate: validateChangeRequest,
    items: changeRequestItems,
  }),
  EvidenceRecord: define({
    kind: 'EvidenceRecord',
    code: 'A7',
    stateClass: 'RECORD',
    plane: 'EVIDENCE',
    inForce: ['VALID'],
    reliable: ['VALID'],
    validate: validateEvidenceRecord,
    items: evidenceRecordItems,
  }),
});
