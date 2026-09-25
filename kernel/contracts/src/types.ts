/**
 * TypeScript view of the seven E0 contracts. The JSON Schemas under
 * `schemas/v1alpha1/` are the language-neutral source of the shape; these types
 * are the reference implementation's reading of it and are only trusted after
 * `validateContract` has accepted a document.
 */

import type { Digest } from './primitives/digest.ts';
import type { ContractKind, ContractRef } from './primitives/refs.ts';
import type { CURRENT_API_VERSION } from './primitives/versioning.ts';

export type ApiVersion = typeof CURRENT_API_VERSION;

export type ActorType = 'HUMAN' | 'AI_AGENT' | 'COMPILER' | 'CHECKER' | 'OBSERVER' | 'SYSTEM';
export type AuthorityClass = 'OBSERVE' | 'PROPOSE' | 'DECIDE' | 'COMPILE_APPLY' | 'VERIFY';
export type ProvenanceOrigin = 'HUMAN' | 'IMPORT' | 'AI_PROPOSAL' | 'COMPILER' | 'CHECKER' | 'OBSERVER' | 'MIGRATION';

export interface Actor {
  type: ActorType;
  id: string;
  role?: string;
}

export interface SourceArtifact {
  id: string;
  type: string;
  uri: string;
  digest?: Digest;
  title?: string;
}

export interface Provenance {
  origin: ProvenanceOrigin;
  actor: Actor;
  tool?: { name: string; version: string };
  sources?: SourceArtifact[];
  derivedFrom?: ContractRef[];
  confidence?: number;
}

export interface ExternalRef {
  type: string;
  id: string;
  version: string;
  digest?: Digest;
}

export interface Acceptance {
  decision: 'ACCEPTED' | 'REJECTED';
  authority: 'DECIDE';
  actor: Actor;
  at: string;
  rationale?: string;
  approvalPolicy?: ExternalRef;
}

export interface Metadata<Status extends string = string> {
  id: string;
  revision: number;
  title: string;
  description?: string;
  status: Status;
  owner?: { team: string; contact?: string };
  provenance: Provenance;
  acceptance?: Acceptance;
  supersedes?: ContractRef;
  labels?: Record<string, string>;
}

export interface ContractDocument<K extends ContractKind = ContractKind, S = unknown, Status extends string = string> {
  apiVersion: ApiVersion;
  kind: K;
  metadata: Metadata<Status>;
  spec: S;
}

export type DecidedStatus = 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';

// ── A1 Requirement Baseline ────────────────────────────────────────────────
export interface Requirement {
  id: string;
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'DATA' | 'INTEGRATION' | 'UX_ACCESSIBILITY' | 'SECURITY' | 'CONSTRAINT';
  statement: string;
  priority: 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
  status: 'INFERRED' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'DEFERRED';
  goals?: string[];
  actors?: string[];
  sourceRefs?: { source: string; locator?: string }[];
  acceptanceCriteria?: { id: string; statement: string }[];
  dependsOn?: string[];
  conflictsWith?: string[];
  owner?: string;
  confidence?: number;
}

export interface RequirementBaselineSpec {
  system: string;
  sources: SourceArtifact[];
  goals: { id: string; statement: string }[];
  actors: { id: string; name: string; description?: string }[];
  requirements: Requirement[];
  ambiguities: {
    id: string;
    question: string;
    impact: 'BLOCKING' | 'HIGH' | 'DEFERRABLE';
    status: 'OPEN' | 'RESOLVED' | 'DEFERRED';
    relatedRequirements?: string[];
    resolution?: string;
  }[];
}
export type RequirementBaseline = ContractDocument<'RequirementBaseline', RequirementBaselineSpec, DecidedStatus>;

// ── A2 Decision Set ───────────────────────────────────────────────────────
export interface Decision {
  id: string;
  title: string;
  category: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
  context: string;
  drivers: string[];
  options: {
    id: string;
    summary: string;
    satisfies?: string[];
    tradeoffs?: string[];
    risks?: string[];
    operationalComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  chosenOption?: string;
  rationale?: string;
  consequences?: string[];
  supersedes?: string;
}

export interface DecisionSetSpec {
  system: string;
  requirementBaseline: ContractRef;
  decisions: Decision[];
}
export type DecisionSet = ContractDocument<'DecisionSet', DecisionSetSpec, DecidedStatus>;

// ── A3 Effective Organization Context ─────────────────────────────────────
export type ContextCategory =
  | 'ARCHITECTURE'
  | 'RUNTIME'
  | 'SECURITY'
  | 'DATA'
  | 'DESIGN'
  | 'QUALITY'
  | 'DEPLOYMENT'
  | 'APPROVAL'
  | 'AI'
  | 'EVIDENCE';

export interface ContextRule {
  id: string;
  category: ContextCategory;
  value: unknown;
  locked?: boolean;
  rationale?: string;
}

export interface ContextLayer {
  id: string;
  scope: 'ORGANIZATION' | 'BUSINESS_UNIT' | 'CLIENT' | 'PRODUCT_LINE' | 'SYSTEM';
  precedence: number;
  source: ExternalRef;
  rules: ContextRule[];
}

export interface ContextWaiver {
  id: string;
  rule: string;
  value: unknown;
  reason: string;
  approvedBy: Actor;
  expiresAt: string;
}

export interface TraceEntry {
  from: 'LAYER' | 'WAIVER';
  id: string;
  value: unknown;
  outcome: 'APPLIED' | 'OVERRIDDEN' | 'REFUSED_LOCKED' | 'WAIVED';
  reason?: string;
}

export interface EffectiveRule {
  rule: string;
  category: ContextCategory;
  value: unknown;
  locked: boolean;
  source: { type: 'LAYER' | 'WAIVER'; id: string };
  trace: TraceEntry[];
}

export interface EffectiveOrganizationContextSpec {
  system: string;
  derivation: { algorithm: 'foundation.effective-organization-context'; version: '1' };
  layers: ContextLayer[];
  waivers: ContextWaiver[];
  effective: EffectiveRule[];
}
export type EffectiveOrganizationContext = ContractDocument<
  'EffectiveOrganizationContext',
  EffectiveOrganizationContextSpec,
  'CURRENT' | 'STALE'
>;

// ── A4 System Definition ──────────────────────────────────────────────────
export interface Component {
  id: string;
  name: string;
  kind: string;
  responsibilities: string[];
  audience?: 'PUBLIC' | 'INTERNAL' | 'FIELD' | 'PARTNER' | 'SYSTEM';
  requirements?: string[];
  decisions?: string[];
  implements?: string[];
  publishes?: string[];
  subscribes?: string[];
  consumes?: { component: string; interaction: string; operations?: string[] }[];
  data?: { store: string; access: 'OWNER' | 'READ_WRITE' | 'READ' }[];
  platformCapabilities?: { id: string; version?: string }[];
  integrations?: string[];
  runtime?: { preferences?: string[]; constraints?: string[] };
  experience?: { designContext: string; designSystem?: ExternalRef; accessibilityProfile?: string; offline?: boolean };
  ownership: { class: 'COMPILER_OWNED' | 'OWNER_MANAGED' | 'SHARED_CONTROLLED' | 'EXTERNAL'; team: string };
  environments?: string[];
}

export interface SystemDefinitionSpec {
  system: string;
  purpose: string;
  inputs: {
    requirementBaseline: ContractRef;
    decisionSet: ContractRef;
    organizationContext: ContractRef;
    domainContracts: ContractRef[];
  };
  components: Component[];
  integrations: { id: string; kind: string; direction: string; purpose: string; provider?: string }[];
  environments: { id: string; kind: string; deploymentMode: string }[];
}
export type SystemDefinition = ContractDocument<'SystemDefinition', SystemDefinitionSpec, DecidedStatus>;

// ── A5 Domain Contract ────────────────────────────────────────────────────
export interface DomainType {
  id: string;
  kind: 'ENTITY' | 'VALUE' | 'ENUM';
  description?: string;
  fields?: { name: string; type: string; required: boolean; sensitive?: boolean; description?: string }[];
  values?: string[];
}

export interface DomainOperation {
  id: string;
  kind: 'COMMAND' | 'QUERY';
  summary: string;
  input?: string;
  output?: string;
  errors?: string[];
  authorization: { intent: string; roles?: string[] };
  emits?: string[];
  invariants?: string[];
  idempotent?: boolean;
}

export interface DomainContractSpec {
  system: string;
  boundedContext: string;
  requirementBaseline: ContractRef;
  types: DomainType[];
  operations: DomainOperation[];
  invariants: { id: string; statement: string; appliesTo: string[]; enforcement: 'DETERMINISTIC' | 'OWNER_WORK' }[];
  events: { id: string; version: number; payload: string; description?: string }[];
  acceptance: { id: string; scenario: string; operations: string[]; requirements: string[] }[];
  facets: { id: string; version: string; appliesTo: string[]; configuration?: Record<string, unknown> }[];
}
export type DomainContract = ContractDocument<'DomainContract', DomainContractSpec, DecidedStatus>;

// ── A6 Change Request ─────────────────────────────────────────────────────
export type ChangeClassification = 'SAFE_AUTOMATIC' | 'REVIEW_REQUIRED' | 'MIGRATION_REQUIRED' | 'MANUAL_ONLY' | 'UNSUPPORTED';

export interface ChangeRequestSpec {
  system: string;
  base: ContractRef;
  proposed?: ContractRef;
  trigger: string;
  summary: string;
  justifiedBy: ContractRef[];
  changes: { op: 'ADD' | 'REPLACE' | 'REMOVE'; path: string; value?: unknown; rationale: string }[];
  classification: ChangeClassification;
  impact: {
    components: string[];
    evidenceToInvalidate: ContractRef[];
    ownerWork: { id: string; description: string; component?: string }[];
    migration?: { strategy: string; reversible: boolean; rollback?: string };
  };
}
export type ChangeRequest = ContractDocument<
  'ChangeRequest',
  ChangeRequestSpec,
  'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'APPLIED' | 'WITHDRAWN'
>;

// ── A7 EvidenceRecord ─────────────────────────────────────────────────────
export type EvidenceResult = 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_APPLICABLE' | 'UNSUPPORTED' | 'ERROR';

export interface EvidenceRecordSpec {
  system: string;
  subject: { contract: ContractRef; component?: string };
  obligation: { id: string; statement: string; source: ContractRef };
  checker: { id: string; version: string; mode: 'AUTOMATED' | 'HUMAN_REVIEW' };
  producedBy: Actor;
  environment: { id: string; kind: string; attributes?: Record<string, string> };
  result: EvidenceResult;
  summary?: string;
  observedAt: string;
  expiresAt?: string;
  inputs: ContractRef[];
  artifacts: { uri: string; mediaType: string; digest?: Digest }[];
  waiver?: { context: ContractRef; waiver: string };
  invalidation?: { reason: string; by: ContractRef };
}
export type EvidenceRecord = ContractDocument<'EvidenceRecord', EvidenceRecordSpec, 'VALID' | 'EXPIRED' | 'INVALIDATED'>;

export type AnyContract =
  | RequirementBaseline
  | DecisionSet
  | EffectiveOrganizationContext
  | SystemDefinition
  | DomainContract
  | ChangeRequest
  | EvidenceRecord;
