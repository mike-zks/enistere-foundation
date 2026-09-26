/**
 * @enistere/foundation-kernel-compiler — E1 Kernel Façade and native
 * compilation chain: System Closure → System IR → ResolvedSystem →
 * ExecutionPlan, resolved against an extension catalog declared as data.
 * Framework-independent (TA-04): runtime names exist only in catalog data.
 */

export { EMPTY_CATALOG, validateCatalog, type CapabilityProviderDescriptor, type CatalogValidation, type ExtensionCatalog, type RuntimeAdapterDescriptor } from './catalog.ts';
export { buildClosure, COMPILER, type ClosureEntry, type SystemClosure } from './closure.ts';
export { createKernelFacade, FACADE_VERSION, type CompileOptions, type KernelFacade, type PlanResult, type ResolveResult, type ValidateResult } from './facade.ts';
export { buildDomainIR, type DomainIR, type DomainTypeRef } from './domain-ir.ts';
export { buildSystemIR, type IRComponent, type IRInteraction, type SystemIR } from './ir.ts';
export { planSystem, type ExecutionPlan, type PlanStep } from './plan.ts';
export { exportProofChain, PROOF_CHAIN_FORMAT, verifyProofChain, type ProofChain, type ProofChainInput } from './proof-chain.ts';
export { resolveSystem, type ExtensionRef, type ResolvedCapability, type ResolvedComponent, type ResolvedSystem, type UnsupportedItem } from './resolve.ts';
