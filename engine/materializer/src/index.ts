/**
 * @enistere/foundation-engine-materializer — E2 Engine: extension host,
 * MATERIALIZE under the kernel ownership rule and VERIFY producing
 * EvidenceRecords (A7). Framework-agnostic: adapters are reached only through
 * their manifests (TA-04).
 */

export { loadExtensions, type ExtensionHost, type LoadedExtension } from './host.ts';
export { INVENTORY_PATH, materialize, planMaterialization, type Inventory, type MaterializationRecord, type PlannedComponent } from './materialize.ts';
export { ENVIRONMENT_ALLOWLIST, VERIFIER, verifyWorkspace, type VerifyOptions } from './verify.ts';
