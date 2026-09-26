/**
 * Kernel Façade — the single headless entry point of the compiler (mission E1,
 * TA-02): the same calls serve the CLI, tests and, later, the API and SDK.
 *
 *   validate(documents)            closed contract set
 *   resolve(documents, options)    + System Closure → System IR → ResolvedSystem
 *   plan(documents, options)       + ExecutionPlan
 *
 * Invariants:
 * - an invalid contract set or an invalid catalog is never resolved;
 * - only the System Definition in force (ACCEPTED) is compiled;
 * - UNSUPPORTED components or capabilities, and unrealized domain intent
 *   (operation without implementer, event without publisher, facet not
 *   interpreted), make the result PARTIAL and stay listed; never dropped;
 * - results are plain JSON: the same inputs give the same bytes, whatever the
 *   order of the documents.
 */

import {
  CONTRACT_REGISTRY,
  contractDigest,
  diagnostic,
  documentRef,
  hasErrors,
  indexContracts,
  sortDiagnostics,
  validateContractSet,
  type AnyContract,
  type ContractIndex,
  type Diagnostic,
  type Digest,
  type DesignSystem,
  type DomainContract,
  type EffectiveOrganizationContext,
  type SystemDefinition,
} from '@enistere/foundation-kernel-contracts';

import { projectApiContracts, type ApiContract } from './api-contract.ts';
import { EMPTY_CATALOG, validateCatalog } from './catalog.ts';
import { buildClosure, COMPILER, type ClosureEntry, type SystemClosure } from './closure.ts';
import { buildSystemIR, type SystemIR } from './ir.ts';
import { planSystem, type ExecutionPlan } from './plan.ts';
import { evaluatePolicies, type PolicyReport } from './policy.ts';
import { resolveSystem, type ResolvedSystem } from './resolve.ts';

export const FACADE_VERSION = '0.1.0';

export interface CompileOptions {
  /** Extension catalog, as data; the empty catalog when absent. */
  catalog?: unknown;
  /** Id of the System Definition to compile when several are in force. */
  definition?: string;
}

export interface ValidateResult {
  stage: 'validate';
  facade: string;
  status: 'VALID' | 'INVALID';
  system: string | null;
  contracts: ClosureEntry[];
  diagnostics: Diagnostic[];
}

export interface ResolveResult {
  stage: 'resolve';
  facade: string;
  compiler: { id: string; version: string };
  status: 'RESOLVED' | 'PARTIAL' | 'INVALID';
  system: string | null;
  definition: ClosureEntry | null;
  closure: SystemClosure | null;
  ir: SystemIR | null;
  resolved: ResolvedSystem | null;
  /** The organization policies applied to this compilation (E6); present even when a violation blocks it. */
  policy: PolicyReport | null;
  diagnostics: Diagnostic[];
}

export interface PlanResult extends Omit<ResolveResult, 'stage' | 'status'> {
  stage: 'plan';
  status: 'PLANNED' | 'PARTIAL' | 'INVALID';
  /** Shared API contracts projected from the Domain IR (E5); the plan cites their digests. */
  apiContracts: ApiContract[];
  plan: ExecutionPlan | null;
}

export interface KernelFacade {
  readonly version: string;
  validate(documents: readonly unknown[]): ValidateResult;
  resolve(documents: readonly unknown[], options?: CompileOptions): ResolveResult;
  plan(documents: readonly unknown[], options?: CompileOptions): PlanResult;
}

const FACADE_LAYER = { layer: 'kernel.facade' } as const;

const IR_REASONS: Readonly<Record<SystemIR['unsupported'][number]['code'], string>> = {
  IR_OPERATION_UNIMPLEMENTED: 'no component implements this operation',
  IR_EVENT_UNPUBLISHED: 'no component publishes this event',
  IR_FACET_NOT_INTERPRETED: 'domain facets are not interpreted by the compiler; no facet is realized as a platform capability',
};

function selectDefinition(documents: readonly AnyContract[], index: ContractIndex, wanted: string | undefined): SystemDefinition | Diagnostic {
  const ids = [...new Set(documents.filter((document) => document.kind === 'SystemDefinition').map((document) => document.metadata.id))]
    .filter((id) => index.inForceRevision('SystemDefinition', id) !== undefined)
    .filter((id) => wanted === undefined || id === wanted)
    .sort();
  if (ids.length === 0) {
    const scope = wanted === undefined ? '' : ` with id '${wanted}'`;
    return diagnostic('FACADE_NO_SYSTEM_DEFINITION', `no System Definition${scope} is in force (${CONTRACT_REGISTRY.SystemDefinition.inForce.join(', ')})`, FACADE_LAYER);
  }
  if (ids.length > 1) {
    return diagnostic('FACADE_AMBIGUOUS_SYSTEM_DEFINITION', `several System Definitions are in force: ${ids.join(', ')}`, { ...FACADE_LAYER, details: { definitions: ids } });
  }
  const id = ids[0] as string;
  return index.get({ kind: 'SystemDefinition', id, revision: index.inForceRevision('SystemDefinition', id) as number }) as SystemDefinition;
}

/** Creates the Kernel Façade. It holds no state: every call is a pure function of its inputs. */
export function createKernelFacade(): KernelFacade {
  function validate(documents: readonly unknown[]): ValidateResult {
    const validation = validateContractSet(documents);
    return {
      stage: 'validate',
      facade: FACADE_VERSION,
      status: validation.valid ? 'VALID' : 'INVALID',
      system: validation.system,
      contracts: validation.entries.map((entry) => ({ ref: entry.ref, digest: entry.digest })),
      diagnostics: validation.diagnostics,
    };
  }

  function compile(documents: readonly unknown[], options: CompileOptions): { result: ResolveResult; plan: ExecutionPlan | null; contracts: ApiContract[] } {
    const validation = validateContractSet(documents);
    const catalog = validateCatalog(options.catalog === undefined ? EMPTY_CATALOG : options.catalog);
    const base: ResolveResult = {
      stage: 'resolve',
      facade: FACADE_VERSION,
      compiler: { ...COMPILER },
      status: 'INVALID',
      system: validation.system,
      definition: null,
      closure: null,
      ir: null,
      resolved: null,
      policy: null,
      diagnostics: sortDiagnostics([...validation.diagnostics, ...catalog.diagnostics]),
    };
    if (!validation.valid || !catalog.catalog || !catalog.digest) return { result: base, plan: null, contracts: [] };

    const contracts = validation.entries.map((entry) => entry.document);
    const index = indexContracts(contracts);
    const selected = selectDefinition(contracts, index, options.definition);
    if (!('kind' in selected) || selected.kind !== 'SystemDefinition') {
      return { result: { ...base, diagnostics: sortDiagnostics([...base.diagnostics, selected as Diagnostic]) }, plan: null, contracts: [] };
    }
    const definition = selected;
    const { closure, documents: inputs } = buildClosure(definition, index, catalog.digest as Digest);
    const ir = buildSystemIR(
      definition,
      inputs.filter((document): document is DomainContract => document.kind === 'DomainContract'),
      inputs.filter((document): document is DesignSystem => document.kind === 'DesignSystem'),
    );
    const intent = ir.unsupported.map((item) =>
      diagnostic(item.code, `${item.item} is not realized: ${IR_REASONS[item.code]}`, { layer: 'kernel.compiler', ref: ir.definition, details: { item: item.item } }),
    );
    const { resolved, diagnostics } = resolveSystem(ir, catalog.catalog, catalog.digest);
    const context = inputs.find((document): document is EffectiveOrganizationContext => document.kind === 'EffectiveOrganizationContext');
    const policy = context ? evaluatePolicies(context, ir, resolved) : null;
    const apiContracts = projectApiContracts(ir);
    const plan = planSystem(closure, ir, resolved, apiContracts, policy?.report ?? null);
    const all = sortDiagnostics([...base.diagnostics, ...intent, ...diagnostics, ...(policy?.diagnostics ?? [])]);
    const result: ResolveResult = {
      ...base,
      status: hasErrors(all) ? 'INVALID' : resolved.unsupported.length > 0 || ir.unsupported.length > 0 ? 'PARTIAL' : 'RESOLVED',
      definition: { ref: documentRef(definition), digest: contractDigest(definition) },
      closure,
      ir,
      resolved,
      policy: policy?.report ?? null,
      diagnostics: all,
    };
    const valid = result.status !== 'INVALID';
    return { result, plan: valid ? plan : null, contracts: valid ? apiContracts : [] };
  }

  function resolve(documents: readonly unknown[], options: CompileOptions = {}): ResolveResult {
    return compile(documents, options).result;
  }

  function plan(documents: readonly unknown[], options: CompileOptions = {}): PlanResult {
    const { result, plan: executionPlan, contracts } = compile(documents, options);
    const status = result.status === 'RESOLVED' ? 'PLANNED' : result.status;
    return { ...result, stage: 'plan', status, apiContracts: contracts, plan: executionPlan };
  }

  return Object.freeze({ version: FACADE_VERSION, validate, resolve, plan });
}
