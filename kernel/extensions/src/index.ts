/**
 * @enistere/foundation-kernel-extensions — E2 Adapter Protocol v0: manifest
 * schema and validation, RuntimeAdapter contract, artifact planning and the
 * ownership rule of materialization. No I/O beyond reading its own schema; no
 * framework (TA-04).
 */

export {
  isSafeArtifactPath,
  planArtifacts,
  type AdapterContext,
  type Artifact,
  type ArtifactOwnership,
  type ArtifactPlan,
  type PlannedArtifact,
  type RuntimeAdapter,
  type ToolchainCheck,
  type ToolchainCommand,
  type ToolchainProbe,
} from './adapter.ts';
export {
  ADAPTER_PROTOCOL,
  catalogFromManifests,
  MANIFEST_SCHEMA,
  validateManifest,
  type AdapterManifest,
  type ExecutionMode,
  type VerificationCheck,
  type VerificationLevel,
} from './manifest.ts';
export { decideWrite, WRITES, type WriteDecision } from './ownership.ts';
