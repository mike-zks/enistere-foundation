/**
 * Structured diagnostics of the contract layer.
 *
 * Every finding carries a stable, prefixed code registered below, the failure
 * class of the Foundation failure model (document 03 §6.18), a severity, the
 * stable reference of the contract concerned, a JSON Pointer into it and whether
 * a retry could change the outcome. Free text alone is never the contract: the
 * message explains, the code decides.
 *
 * Ordering is deterministic (ref, path, code, message) so that two runs over the
 * same inputs produce byte-identical diagnostic lists.
 */

export const DIAGNOSTIC_LAYER = 'kernel.contracts';

/**
 * Layers allowed to emit diagnostics: the contract layer (default), the
 * compiler (closure, IR, catalog, resolution, plan), the Kernel Façade, the
 * extension protocol and the Engine materializer.
 */
export const DIAGNOSTIC_LAYERS = ['kernel.contracts', 'kernel.compiler', 'kernel.facade', 'kernel.extensions', 'engine.materializer'] as const;
export type DiagnosticLayer = (typeof DIAGNOSTIC_LAYERS)[number];

/** Failure classes of document 03 §6.18 used by the contract layer. */
export const FAILURE_CLASSES = [
  'INVALID_INPUT',
  'POLICY_DENIED',
  'UNSUPPORTED',
  'RESOLUTION_CONFLICT',
  'MIGRATION_REQUIRED',
  'VERIFICATION_FAILED',
  'EVIDENCE_INCONCLUSIVE',
  'EXTENSION_FAILURE',
  'MATERIALIZATION_CONFLICT',
  'WORKER_ENV_FAILURE',
] as const;
export type FailureClass = (typeof FAILURE_CLASSES)[number];

export type Severity = 'error' | 'warning';

interface CodeSpec {
  readonly class: FailureClass;
  readonly severity: Severity;
  readonly remediation: string;
}

const spec = (failureClass: FailureClass, severity: Severity, remediation: string): CodeSpec =>
  Object.freeze({ class: failureClass, severity, remediation });

/** The registry of stable diagnostic codes. Adding a code is additive; renaming one is a breaking change. */
export const DIAGNOSTIC_CODES = Object.freeze({
  // Envelope, schema and versioning.
  CONTRACT_NOT_AN_OBJECT: spec('INVALID_INPUT', 'error', 'Provide a JSON object with apiVersion, kind, metadata and spec.'),
  CONTRACT_UNKNOWN_KIND: spec('UNSUPPORTED', 'error', 'Use one of the eight contract kinds (A1–A8).'),
  CONTRACT_UNSUPPORTED_API_VERSION: spec('UNSUPPORTED', 'error', 'Migrate the document with a registered migration; unknown versions are never read by fallback.'),
  CONTRACT_SCHEMA_VIOLATION: spec('INVALID_INPUT', 'error', 'Fix the document so that it satisfies the published JSON Schema.'),
  CONTRACT_NOT_CANONICAL_JSON: spec('INVALID_INPUT', 'error', 'Remove non-JSON values (undefined, non-finite numbers, class instances).'),
  CONTRACT_INVALID_TIMESTAMP: spec('INVALID_INPUT', 'error', 'Provide a real RFC 3339 date-time.'),
  CONTRACT_DUPLICATE_ITEM_ID: spec('INVALID_INPUT', 'error', 'Give every item of a collection a unique identifier.'),
  CONTRACT_INVALID_SUPERSESSION: spec('INVALID_INPUT', 'error', 'A revision may only supersede an older revision of the same kind and id.'),
  CONTRACT_MIGRATION_FAILED: spec('MIGRATION_REQUIRED', 'error', 'Repair the registered migration chain for this contract kind.'),
  // Authority classes (OBSERVE, PROPOSE, DECIDE, COMPILE_APPLY, VERIFY).
  AUTHORITY_ACCEPTANCE_MISSING: spec('POLICY_DENIED', 'error', 'Record the explicit DECIDE transition (acceptance) before marking the contract ACCEPTED or REJECTED.'),
  AUTHORITY_ACCEPTANCE_INCONSISTENT: spec('POLICY_DENIED', 'error', 'Align metadata.status with acceptance.decision.'),
  AUTHORITY_AI_CANNOT_DECIDE: spec('POLICY_DENIED', 'error', 'An AI agent may propose; a human (or an approval policy) must decide.'),
  AUTHORITY_ACTOR_CANNOT_DECIDE: spec('POLICY_DENIED', 'error', 'Only a human, or the system under an explicit approval policy, may exercise DECIDE.'),
  AUTHORITY_SYSTEM_DECISION_WITHOUT_POLICY: spec('POLICY_DENIED', 'error', 'An automatic decision must reference the approval policy that allows it.'),
  AUTHORITY_AI_CANNOT_VERIFY: spec('POLICY_DENIED', 'error', 'Evidence must be produced by a checker or a human reviewer, never by an AI answer.'),
  AUTHORITY_ACTOR_CANNOT_VERIFY: spec('POLICY_DENIED', 'error', 'Only a checker or a human reviewer may exercise VERIFY.'),
  AUTHORITY_AI_CANNOT_APPLY: spec('POLICY_DENIED', 'error', 'Only the compiler exercises COMPILE_APPLY; an AI agent may propose, never apply.'),
  AUTHORITY_ACTOR_CANNOT_APPLY: spec('POLICY_DENIED', 'error', 'A materialization record is produced by the compiler (origin and actor COMPILER).'),
  AUTHORITY_DERIVED_NOT_COMPILED: spec('POLICY_DENIED', 'error', 'A derived contract is produced by the deterministic compiler, not edited by hand.'),
  // References between contracts.
  REF_UNRESOLVED: spec('INVALID_INPUT', 'error', 'Add the referenced revision to the contract set or fix the reference.'),
  REF_DIGEST_MISMATCH: spec('INVALID_INPUT', 'error', 'The referenced revision changed after it was pinned: re-pin it through a Change Request.'),
  REF_ITEM_UNRESOLVED: spec('INVALID_INPUT', 'error', 'Reference an item that exists in the referenced revision.'),
  REF_KIND_MISMATCH: spec('INVALID_INPUT', 'error', 'Reference a contract of the expected kind.'),
  REF_DUPLICATE_CONTRACT: spec('INVALID_INPUT', 'error', 'A contract set holds each revision once.'),
  REF_NOT_ACCEPTED: spec('POLICY_DENIED', 'error', 'An accepted contract may only depend on accepted (or current derived) inputs.'),
  REF_SYSTEM_MISMATCH: spec('INVALID_INPUT', 'error', 'All contracts of a set describe the same system.'),
  // A1 Requirement Baseline.
  REQUIREMENT_UNKNOWN_SOURCE: spec('INVALID_INPUT', 'error', 'Declare the source artifact in spec.sources.'),
  REQUIREMENT_UNKNOWN_REFERENCE: spec('INVALID_INPUT', 'error', 'Reference goals, actors and requirements declared in the baseline.'),
  REQUIREMENT_WITHOUT_PROVENANCE: spec('INVALID_INPUT', 'error', 'An inferred or proposed requirement must cite at least one source.'),
  REQUIREMENT_NOT_DECIDED: spec('POLICY_DENIED', 'error', 'Accept, reject or defer every requirement before accepting the baseline.'),
  REQUIREMENT_BLOCKING_AMBIGUITY_OPEN: spec('POLICY_DENIED', 'error', 'Resolve blocking ambiguities before accepting the baseline.'),
  REQUIREMENT_DEPENDENCY_CYCLE: spec('INVALID_INPUT', 'error', 'Break the dependency cycle between requirements.'),
  REQUIREMENT_ACCEPTED_WITHOUT_CRITERIA: spec('INVALID_INPUT', 'warning', 'Give accepted functional requirements verifiable acceptance criteria.'),
  // A2 Decision Set.
  DECISION_UNKNOWN_OPTION: spec('INVALID_INPUT', 'error', 'The chosen option must be one of the evaluated options.'),
  DECISION_CHOSEN_OPTION_MISSING: spec('INVALID_INPUT', 'error', 'An accepted decision names its chosen option and rationale.'),
  DECISION_NO_ALTERNATIVE: spec('INVALID_INPUT', 'warning', 'Record at least one evaluated alternative to keep the decision re-evaluable.'),
  DECISION_UNKNOWN_REQUIREMENT: spec('INVALID_INPUT', 'error', 'Drivers and satisfied requirements must exist in the pinned Requirement Baseline.'),
  DECISION_UNKNOWN_SUPERSEDED: spec('INVALID_INPUT', 'error', 'A decision may only supersede another decision of the set.'),
  DECISION_NOT_DECIDED: spec('POLICY_DENIED', 'error', 'Accept, reject or supersede every decision before accepting the set.'),
  // A3 Effective Organization Context.
  CONTEXT_DUPLICATE_PRECEDENCE: spec('RESOLUTION_CONFLICT', 'error', 'Give every layer a distinct precedence.'),
  CONTEXT_RULE_CATEGORY_CONFLICT: spec('RESOLUTION_CONFLICT', 'error', 'A rule keeps the same category across layers.'),
  CONTEXT_UNKNOWN_RULE: spec('INVALID_INPUT', 'error', 'A waiver can only except a rule defined by a layer.'),
  CONTEXT_NOT_REPRODUCIBLE: spec('VERIFICATION_FAILED', 'error', 'Recompute the effective context with the kernel derivation; it is never edited by hand.'),
  // A4 System Definition.
  SYSTEM_UNKNOWN_COMPONENT: spec('INVALID_INPUT', 'error', 'Reference a component declared in spec.components.'),
  SYSTEM_SELF_DEPENDENCY: spec('INVALID_INPUT', 'error', 'A component cannot consume itself.'),
  SYSTEM_DATA_OWNER_CONFLICT: spec('RESOLUTION_CONFLICT', 'error', 'A data store has exactly one owning component.'),
  SYSTEM_DATA_STORE_WITHOUT_OWNER: spec('INVALID_INPUT', 'warning', 'Declare which component owns the data store.'),
  SYSTEM_UNKNOWN_REQUIREMENT: spec('INVALID_INPUT', 'error', 'Reference requirements of the pinned Requirement Baseline.'),
  SYSTEM_UNKNOWN_DECISION: spec('INVALID_INPUT', 'error', 'Reference decisions of the pinned Decision Set.'),
  SYSTEM_UNKNOWN_DOMAIN_ITEM: spec('INVALID_INPUT', 'error', 'Reference operations and events of a pinned Domain Contract.'),
  SYSTEM_OPERATION_WITHOUT_PROVIDER: spec('INVALID_INPUT', 'error', 'Every consumed operation is implemented by the consumed component.'),
  SYSTEM_EVENT_WITHOUT_PRODUCER: spec('INVALID_INPUT', 'error', 'A subscribed event must be published by a component of the system.'),
  SYSTEM_UNKNOWN_ENVIRONMENT: spec('INVALID_INPUT', 'error', 'Reference an environment declared in spec.environments.'),
  SYSTEM_UNKNOWN_INTEGRATION: spec('INVALID_INPUT', 'error', 'Reference an integration declared in spec.integrations.'),
  SYSTEM_REQUIREMENT_UNCOVERED: spec('INVALID_INPUT', 'warning', 'Allocate each accepted functional requirement to at least one component.'),
  // A5 Domain Contract.
  DOMAIN_UNKNOWN_TYPE: spec('INVALID_INPUT', 'error', 'Use a primitive or a type declared in spec.types.'),
  DOMAIN_UNKNOWN_EVENT: spec('INVALID_INPUT', 'error', 'Emit events declared in spec.events.'),
  DOMAIN_UNKNOWN_INVARIANT: spec('INVALID_INPUT', 'error', 'Reference invariants declared in spec.invariants.'),
  DOMAIN_UNKNOWN_OPERATION: spec('INVALID_INPUT', 'error', 'Reference operations declared in spec.operations.'),
  DOMAIN_UNKNOWN_REQUIREMENT: spec('INVALID_INPUT', 'error', 'Acceptance scenarios cite requirements of the pinned Requirement Baseline.'),
  DOMAIN_INVALID_TYPE_SHAPE: spec('INVALID_INPUT', 'error', 'ENUM types declare values only; ENTITY and VALUE types declare fields only.'),
  // A6 Change Request.
  CHANGE_BASE_STALE: spec('RESOLUTION_CONFLICT', 'error', 'Rebase the Change Request on the current revision of its target.'),
  CHANGE_TARGET_MISMATCH: spec('INVALID_INPUT', 'error', 'The proposed revision must be a newer revision of the same contract.'),
  CHANGE_UNSUPPORTED_CANNOT_PROCEED: spec('UNSUPPORTED', 'error', 'An UNSUPPORTED change is never accepted or applied by fallback.'),
  CHANGE_MIGRATION_MISSING: spec('MIGRATION_REQUIRED', 'error', 'Describe the migration strategy of a MIGRATION_REQUIRED change.'),
  CHANGE_OWNER_WORK_MISSING: spec('POLICY_DENIED', 'error', 'A MANUAL_ONLY change lists the owner work it requires.'),
  CHANGE_UNKNOWN_COMPONENT: spec('INVALID_INPUT', 'error', 'Impacted components must exist in the base System Definition.'),
  CHANGE_INCONSISTENT: spec('VERIFICATION_FAILED', 'error', 'The declared changes must transform the base spec into exactly the proposed spec.'),
  // A7 EvidenceRecord.
  EVIDENCE_EXPIRY_BEFORE_OBSERVATION: spec('INVALID_INPUT', 'error', 'expiresAt must be later than observedAt.'),
  EVIDENCE_INVALIDATION_MISSING: spec('INVALID_INPUT', 'error', 'An INVALIDATED record states why and by which change.'),
  EVIDENCE_SECRET_IN_URI: spec('POLICY_DENIED', 'error', 'Artifacts are referenced without credentials; secrets never enter Evidence.'),
  EVIDENCE_WAIVER_WITHOUT_FAILURE: spec('INVALID_INPUT', 'warning', 'A waiver only makes sense for a FAIL or INCONCLUSIVE result.'),
  EVIDENCE_STALE: spec('EVIDENCE_INCONCLUSIVE', 'warning', 'Re-run the checker against the current revision; the proof no longer describes it.'),
  // A8 MaterializationRecord.
  MATERIALIZATION_UNSAFE_PATH: spec('INVALID_INPUT', 'error', 'Record only paths relative to the component directory, outside the reserved .foundation/ directory.'),
  MATERIALIZATION_DUPLICATE_PATH: spec('INVALID_INPUT', 'error', 'Record each file once.'),
  MATERIALIZATION_OUTCOME_INCONSISTENT: spec('INVALID_INPUT', 'error', 'Align the outcome with the decisions: a conflict writes nothing, an applied materialization has no conflict, a seeded file is never updated.'),
  // E1 Extension catalog (descriptors of runtime adapters and capability providers, as data).
  CATALOG_INVALID: spec('INVALID_INPUT', 'error', 'Provide a catalog object with runtimeAdapters and capabilityProviders arrays of well-formed descriptors.'),
  CATALOG_DUPLICATE_ID: spec('INVALID_INPUT', 'error', 'Give every catalog descriptor a unique id.'),
  CATALOG_OVERLAPPING_COVERAGE: spec('RESOLUTION_CONFLICT', 'error', 'Keep a single descriptor per component kind and runtime (or per capability and runtime): resolution never picks one arbitrarily.'),
  // E1 Resolution against the catalog.
  RESOLVE_NO_RUNTIME_PREFERENCE: spec('UNSUPPORTED', 'warning', 'Declare at least one runtime preference for the component.'),
  RESOLVE_NO_ADAPTER: spec('UNSUPPORTED', 'warning', 'Add a runtime adapter for this component kind and one of its preferred runtimes, or change the preferences; the component is not planned.'),
  RESOLVE_PREFERENCE_FALLBACK: spec('UNSUPPORTED', 'warning', 'A preferred runtime has no adapter: a later preference was selected. Review the choice or add the missing adapter.'),
  RESOLVE_NO_CAPABILITY_PROVIDER: spec('UNSUPPORTED', 'warning', 'Add a provider of this platform capability for the selected runtime; the capability is not bound.'),
  // E2 Adapter Protocol v0: manifests, adapters, materialization, verification.
  MANIFEST_INVALID: spec('INVALID_INPUT', 'error', 'Fix the adapter manifest so that it satisfies the published adapter-manifest schema.'),
  MANIFEST_DUPLICATE_ID: spec('INVALID_INPUT', 'error', 'Give every extension a unique id.'),
  ADAPTER_UNSUPPORTED_EXECUTION_MODE: spec('UNSUPPORTED', 'warning', 'Only trusted in-process adapters run in v0; isolated, container and remote modes come with the Workers.'),
  ADAPTER_LOAD_FAILED: spec('EXTENSION_FAILURE', 'error', 'The adapter module could not be loaded or does not implement the protocol: fix the extension.'),
  ADAPTER_CONTRACT_VIOLATION: spec('EXTENSION_FAILURE', 'error', 'The adapter broke the protocol (identity, artifact path or content): fix the extension.'),
  ADAPTER_INTENT_REJECTED: spec('UNSUPPORTED', 'warning', 'The adapter cannot realize this component as declared; the component is not materialized.'),
  MATERIALIZE_ADAPTER_MISSING: spec('UNSUPPORTED', 'warning', 'The plan names an adapter that is not loaded; the component is not materialized.'),
  MATERIALIZE_CONFLICT: spec('MATERIALIZATION_CONFLICT', 'error', 'A compiler-owned file was changed outside the compiler: restore it or move the change into an owner-managed file; nothing was overwritten.'),
  VERIFY_INVENTORY_MISMATCH: spec('VERIFICATION_FAILED', 'error', 'The workspace no longer matches its latest MaterializationRecord: re-materialize or review the change.'),
  VERIFY_TOOLCHAIN_UNAVAILABLE: spec('WORKER_ENV_FAILURE', 'error', 'Install the tools the adapter manifest requires, then verify again.'),
  // E3 Domain IR: domain intent the IR cannot realize.
  IR_OPERATION_UNIMPLEMENTED: spec('UNSUPPORTED', 'warning', 'Allocate the operation to a component (implements) or remove it from the Domain Contract.'),
  IR_EVENT_UNPUBLISHED: spec('UNSUPPORTED', 'warning', 'Let a component publish the event, directly or by implementing an operation that emits it.'),
  IR_FACET_NOT_INTERPRETED: spec('UNSUPPORTED', 'warning', 'Domain facets are carried but not interpreted by the compiler, and never realized as a platform capability; review what they require.'),
  // E4 Proof chain (self-contained bundle, replayed on verification).
  PROOF_MALFORMED: spec('INVALID_INPUT', 'error', 'Provide a proof-chain bundle produced by the Foundation export.'),
  PROOF_DIGEST_MISMATCH: spec('VERIFICATION_FAILED', 'error', 'The bundle was altered after export: export it again from the trusted sources.'),
  PROOF_REPLAY_MISMATCH: spec('VERIFICATION_FAILED', 'error', 'Replaying the compilation gives other digests: the recorded compilation cannot be reproduced from the bundled contracts and catalog.'),
  PROOF_RECORD_MISMATCH: spec('VERIFICATION_FAILED', 'error', 'A current materialization record describes another compilation: re-materialize or export the matching bundle.'),
  PROOF_EVIDENCE_UNLINKED: spec('VERIFICATION_FAILED', 'error', 'Evidence about a component must cite the materialization record it verified.'),
  // E1 Kernel Façade.
  FACADE_NO_SYSTEM_DEFINITION: spec('INVALID_INPUT', 'error', 'Provide an accepted System Definition in the contract set (or name an existing one).'),
  FACADE_AMBIGUOUS_SYSTEM_DEFINITION: spec('INVALID_INPUT', 'error', 'Name the System Definition to compile: several are in force.'),
} as const);

export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

export interface Diagnostic {
  code: DiagnosticCode;
  class: FailureClass;
  severity: Severity;
  layer: DiagnosticLayer;
  message: string;
  ref?: string;
  path?: string;
  details?: Record<string, unknown>;
  remediation: string;
  retryable: false;
}

export interface DiagnosticInput {
  ref?: string | undefined;
  path?: string | undefined;
  details?: Record<string, unknown> | undefined;
  layer?: DiagnosticLayer | undefined;
}

/** Builds a frozen diagnostic from a registered code. */
export function diagnostic(code: DiagnosticCode, message: string, input: DiagnosticInput = {}): Diagnostic {
  const codeSpec = DIAGNOSTIC_CODES[code];
  if (!codeSpec) throw new Error(`Unknown diagnostic code: ${String(code)}`);
  const value: Diagnostic = {
    code,
    class: codeSpec.class,
    severity: codeSpec.severity,
    layer: input.layer ?? DIAGNOSTIC_LAYER,
    message,
    remediation: codeSpec.remediation,
    retryable: false,
  };
  if (input.ref !== undefined) value.ref = input.ref;
  if (input.path !== undefined) value.path = input.path;
  if (input.details !== undefined) value.details = input.details;
  return Object.freeze(value);
}

function compare(a: string | undefined, b: string | undefined): number {
  const left = a ?? '';
  const right = b ?? '';
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Deterministic order: ref, path, code, message. Duplicates are removed. */
export function sortDiagnostics(items: readonly Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const unique: Diagnostic[] = [];
  for (const item of items) {
    const key = `${item.ref ?? ''}\u0000${item.path ?? ''}\u0000${item.code}\u0000${item.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique.sort(
    (a, b) => compare(a.ref, b.ref) || compare(a.path, b.path) || compare(a.code, b.code) || compare(a.message, b.message),
  );
}

export function hasErrors(items: readonly Diagnostic[]): boolean {
  return items.some((item) => item.severity === 'error');
}

/** Compact, deterministic text rendering for CLIs and test failures. */
export function formatDiagnostics(items: readonly Diagnostic[]): string {
  return items
    .map((item) => `[${item.severity}] ${item.code}${item.ref ? ` ${item.ref}` : ''}${item.path ? ` ${item.path}` : ''}: ${item.message}`)
    .join('\n');
}
