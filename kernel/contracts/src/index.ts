/**
 * @enistere/foundation-kernel-contracts — E0 Contract Foundation.
 *
 * Seven first-class contracts (A1 Requirement Baseline, A2 Decision Set,
 * A3 Effective Organization Context, A4 System Definition, A5 Domain Contract,
 * A6 Change Request, A7 EvidenceRecord) and their shared primitives: version,
 * stable reference, provenance, acceptance/status, diagnostics, digest and the
 * migration seam. Framework-independent: no runtime, cloud or LLM knowledge.
 */

export * from './primitives/canonical-json.ts';
export * from './primitives/digest.ts';
export * from './primitives/refs.ts';
export * from './primitives/diagnostics.ts';
export * from './primitives/versioning.ts';
export * from './types.ts';
export * from './identity.ts';
export { authorityDiagnostics, type StateClass } from './authority.ts';
export { CONTRACT_REGISTRY, type KindDefinition } from './registry.ts';
export { COMMON_SCHEMA_FILE, SCHEMA_DIRECTORY, SCHEMA_FILES, readSchema, schemaDiagnostics } from './schema-validation.ts';
export { validateContract, type ContractValidation, type ValidateOptions } from './validate.ts';
export {
  collectRefs,
  indexContracts,
  validateContractSet,
  type ContractIndex,
  type ContractSetEntry,
  type ContractSetValidation,
} from './contract-set.ts';
export { DERIVATION, deriveEffectiveRules, type DerivationResult } from './contracts/effective-organization-context.ts';
export { DOMAIN_PRIMITIVES, elementType } from './contracts/domain-contract.ts';
export { applyChanges, verifyChangeBase, verifyChangeConsistency } from './contracts/change-request.ts';
export { evidenceStaleness, type Staleness } from './contracts/evidence-record.ts';
