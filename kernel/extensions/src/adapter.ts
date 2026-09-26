/**
 * Runtime Adapter contract (Adapter Protocol v0, document 03 §6.11).
 *
 * Phases and who owns them:
 * - DESCRIBE — the manifest (static) and `describe()` (the loaded code must
 *   match the manifest identity);
 * - VALIDATE INTENT — `validateIntent()`: reasons the adapter cannot realize a
 *   component as declared;
 * - RESOLVE — the kernel compiler, from catalog descriptors;
 * - PLAN — `plan()`: the artifacts of a component, as pure data;
 * - MATERIALIZE — the Engine writes the artifacts, under the ownership rules;
 * - VERIFY — structural checks by the Engine, toolchain checks declared by the
 *   adapter (`toolchainChecks()`) and executed by the Engine.
 *
 * An adapter performs no I/O and holds no secret. `planArtifacts()` is the only
 * way an adapter's output enters a plan: it rejects unsafe paths, fixes the
 * ownership of every artifact and computes the digests.
 */

import type { DomainIR, IRComponent } from '@enistere/foundation-kernel-compiler';
import { digestOf, fileDigest, type Digest } from '@enistere/foundation-kernel-contracts';

/** Ownership of a generated file (document 02 FR-OWN). */
export type ArtifactOwnership = 'COMPILER_OWNED' | 'OWNER_SEEDED';

export interface Artifact {
  /** POSIX path relative to the component directory. */
  path: string;
  content: string;
  ownership: ArtifactOwnership;
}

export interface PlannedArtifact {
  path: string;
  ownership: ArtifactOwnership;
  digest: Digest;
}

export interface AdapterContext {
  system: string;
  /** Reference of the compiled System Definition. */
  definition: string;
  /** Domain IR of the pinned Domain Contracts (E3, read-only; additive to protocol v0). */
  domains?: readonly DomainIR[];
}

/** A command run without shell, in the component directory. */
export interface ToolchainCommand {
  run: string[];
  timeoutMs: number;
}

/** Start a process, then probe it over HTTP on the loopback interface. */
export interface ToolchainProbe {
  start: string[];
  env: Record<string, string>;
  portVariable: string;
  path: string;
  expectStatus: number;
  timeoutMs: number;
}

export interface ToolchainCheck {
  /** Id of a TOOLCHAIN check declared in the manifest. */
  check: string;
  steps: (ToolchainCommand | ToolchainProbe)[];
}

export interface RuntimeAdapter {
  describe(): { id: string; version: string };
  validateIntent(component: IRComponent, context: AdapterContext): string[];
  plan(component: IRComponent, context: AdapterContext): Artifact[];
  /** Steps of the TOOLCHAIN checks the manifest declares (same for every component). */
  toolchainChecks(): ToolchainCheck[];
}

export interface ArtifactPlan {
  component: string;
  adapter: { id: string; version: string };
  ownership: string;
  artifacts: PlannedArtifact[];
  digest: Digest;
}

const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9_.@-][A-Za-z0-9_.@/-]*$/;

export function isSafeArtifactPath(path: string): boolean {
  return SAFE_PATH.test(path) && !path.endsWith('/') && !path.startsWith('.foundation/');
}

/**
 * Turns an adapter's output into a plan. The component's ownership class
 * bounds the artifacts: an OWNER_MANAGED component is only ever seeded.
 * Throws on a protocol violation (unsafe or duplicate path): the caller
 * reports it as ADAPTER_CONTRACT_VIOLATION.
 */
export function planArtifacts(
  adapter: { id: string; version: string },
  component: IRComponent,
  artifacts: readonly Artifact[],
): { plan: ArtifactPlan; contents: Map<string, string> } {
  const contents = new Map<string, string>();
  const planned: PlannedArtifact[] = [];
  for (const artifact of artifacts) {
    if (!isSafeArtifactPath(artifact.path)) throw new Error(`unsafe artifact path '${artifact.path}'`);
    if (contents.has(artifact.path)) throw new Error(`duplicate artifact path '${artifact.path}'`);
    if (artifact.ownership !== 'COMPILER_OWNED' && artifact.ownership !== 'OWNER_SEEDED') throw new Error(`unknown ownership for '${artifact.path}'`);
    contents.set(artifact.path, artifact.content);
    const ownership: ArtifactOwnership = component.ownership.class === 'OWNER_MANAGED' ? 'OWNER_SEEDED' : artifact.ownership;
    planned.push({ path: artifact.path, ownership, digest: fileDigest(artifact.content) });
  }
  planned.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const content = { component: component.id, adapter: { id: adapter.id, version: adapter.version }, ownership: component.ownership.class, artifacts: planned };
  return { plan: { ...content, digest: digestOf(content) }, contents };
}
