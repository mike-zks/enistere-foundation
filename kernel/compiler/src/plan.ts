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
 *
 * Shared API contracts (E5) are listed with their provider, their consumers
 * and their digest; the provider's MATERIALIZE step names them. Owner work
 * lists, besides owner-managed components, every projected operation the
 * owning team implements and every invariant it enforces: visible
 * obligations, not executed by the compiler.
 */

import { digestOf, type Digest } from '@enistere/foundation-kernel-contracts';

import type { ApiContract } from './api-contract.ts';
import type { SystemClosure } from './closure.ts';
import type { SystemIR } from './ir.ts';
import type { ExtensionRef, ResolvedSystem, UnsupportedItem } from './resolve.ts';

export type PlanStep =
  | { action: 'MATERIALIZE' | 'CONNECT_EXTERNAL'; component: string; adapter: ExtensionRef; runtime: string; ownership: string; environments: string[]; contracts: string[] }
  | { action: 'BIND_CAPABILITY'; component: string; capability: string; provider: ExtensionRef };

export interface ExecutionPlan {
  system: string;
  inputs: { closure: Digest; ir: Digest; resolved: Digest };
  steps: PlanStep[];
  unsupported: UnsupportedItem[];
  /** Domain intent the IR cannot realize (E3): carried over, never hidden. */
  unsupportedIntent: SystemIR['unsupported'];
  /** Shared API contracts (E5): one per (domain, provider), cited by digest. */
  sharedContracts: { id: string; domain: string; provider: string; consumers: string[]; digest: Digest }[];
  /** What the owning teams keep: owner-managed components, projected operations to implement, invariants to enforce. */
  ownerWork: OwnerWork[];
  /** Requirements allocated to planned components: what Evidence must later prove. */
  proofObligations: { component: string; requirement: string }[];
  digest: Digest;
}

export type OwnerWork =
  | { work: 'COMPONENT'; component: string; ownership: string; team: string }
  | { work: 'IMPLEMENT_OPERATION'; component: string; team: string; item: string; contract: string }
  | { work: 'ENFORCE_INVARIANT'; component: string; team: string; item: string; enforcement: string };

function ownerWork(ir: SystemIR, contracts: readonly ApiContract[]): OwnerWork[] {
  const team = (id: string): string => ir.components.find((component) => component.id === id)?.ownership.team ?? '';
  const work: OwnerWork[] = ir.components
    .filter((component) => component.ownership.class !== 'COMPILER_OWNED')
    .map((component) => ({ work: 'COMPONENT', component: component.id, ownership: component.ownership.class, team: component.ownership.team }));
  for (const contract of contracts) {
    for (const item of contract.operations) work.push({ work: 'IMPLEMENT_OPERATION', component: contract.provider, team: team(contract.provider), item, contract: contract.id });
    const domain = ir.domains.find((candidate) => candidate.contract.ref === contract.domain.ref);
    const operations = new Set(domain?.operations.map((operation) => operation.ref));
    for (const invariant of domain?.invariants ?? []) {
      // An invariant on a projected operation, or on a type of the domain, is enforced by the provider.
      if (invariant.appliesTo.some((item) => contract.operations.includes(item) || !operations.has(item))) {
        work.push({ work: 'ENFORCE_INVARIANT', component: contract.provider, team: team(contract.provider), item: invariant.ref, enforcement: invariant.enforcement });
      }
    }
  }
  return work;
}

export function planSystem(closure: SystemClosure, ir: SystemIR, resolved: ResolvedSystem, contracts: readonly ApiContract[] = []): ExecutionPlan {
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
      contracts: contracts.filter((contract) => contract.provider === component.id).map((contract) => contract.id),
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
    unsupportedIntent: ir.unsupported.map((item) => ({ ...item })),
    sharedContracts: contracts.map((contract) => ({ id: contract.id, domain: contract.domain.ref, provider: contract.provider, consumers: [...contract.consumers], digest: contract.digest })),
    ownerWork: ownerWork(ir, contracts),
    proofObligations,
  };
  return { ...content, digest: digestOf(content) };
}
