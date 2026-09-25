/**
 * Execution plan — what a materialization would do, computed before any
 * write (document 03: the PLAN phase never writes to a repository).
 *
 * Framework-agnostic: a step names the component, the extension that would
 * realize it and the ownership class that bounds what may be written. An
 * EXTERNAL component is provided outside the system (for instance by the
 * shared production platform): it is connected, never materialized. File
 * artifacts come with the Adapter Protocol (E2). Unsupported items are carried
 * over unchanged: a plan never hides what it cannot do.
 */

import { digestOf, type Digest } from '@enistere/foundation-kernel-contracts';

import type { SystemClosure } from './closure.ts';
import type { SystemIR } from './ir.ts';
import type { ExtensionRef, ResolvedSystem, UnsupportedItem } from './resolve.ts';

export type PlanStep =
  | { action: 'MATERIALIZE' | 'CONNECT_EXTERNAL'; component: string; adapter: ExtensionRef; runtime: string; ownership: string; environments: string[] }
  | { action: 'BIND_CAPABILITY'; component: string; capability: string; provider: ExtensionRef };

export interface ExecutionPlan {
  system: string;
  inputs: { closure: Digest; ir: Digest; resolved: Digest };
  steps: PlanStep[];
  unsupported: UnsupportedItem[];
  /** Components whose code is not compiler-owned: the owner keeps the work. */
  ownerWork: { component: string; ownership: string; team: string }[];
  /** Requirements allocated to planned components: what Evidence must later prove. */
  proofObligations: { component: string; requirement: string }[];
  digest: Digest;
}

export function planSystem(closure: SystemClosure, ir: SystemIR, resolved: ResolvedSystem): ExecutionPlan {
  const byId = new Map(ir.components.map((component) => [component.id, component]));
  const steps: PlanStep[] = [];
  const proofObligations: ExecutionPlan['proofObligations'] = [];
  for (const component of resolved.components) {
    if (component.status !== 'RESOLVED' || !component.adapter || !component.runtime) continue;
    const source = byId.get(component.id);
    if (!source) continue;
    steps.push({
      action: source.ownership.class === 'EXTERNAL' ? 'CONNECT_EXTERNAL' : 'MATERIALIZE',
      component: component.id,
      adapter: component.adapter,
      runtime: component.runtime,
      ownership: source.ownership.class,
      environments: [...source.environments],
    });
    for (const capability of component.capabilities) {
      if (capability.status === 'BOUND' && capability.provider) {
        steps.push({ action: 'BIND_CAPABILITY', component: component.id, capability: capability.id, provider: capability.provider });
      }
    }
    for (const requirement of source.requirements) proofObligations.push({ component: component.id, requirement });
  }
  const content = {
    system: ir.system,
    inputs: { closure: closure.digest, ir: ir.digest, resolved: resolved.digest },
    steps,
    unsupported: resolved.unsupported.map((item) => ({ ...item })),
    ownerWork: ir.components
      .filter((component) => component.ownership.class !== 'COMPILER_OWNED')
      .map((component) => ({ component: component.id, ownership: component.ownership.class, team: component.ownership.team })),
    proofObligations,
  };
  return { ...content, digest: digestOf(content) };
}
