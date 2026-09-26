/**
 * @enistere/foundation-engine-materializer — E2 Engine: extension host,
 * MATERIALIZE under the kernel ownership rule and VERIFY producing
 * EvidenceRecords (A7). Framework-agnostic: adapters are reached only through
 * their manifests (TA-04).
 */

export { loadExtensions, type ExtensionHost, type LoadedExtension } from './host.ts';
export {
  latestRecord,
  materialize,
  MATERIALIZER,
  materializationRecord,
  planMaterialization,
  readRecords,
  RECORDS_DIRECTORY,
  type MaterializeOptions,
  type PlannedComponent,
} from './materialize.ts';
export { ENVIRONMENT_ALLOWLIST, VERIFIER, verifyWorkspace, type VerifyOptions } from './verify.ts';
