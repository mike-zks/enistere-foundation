/**
 * Asteria golden — checker, legacy compatibility probe and golden build.
 *
 * The checker `asteria-golden-contract-check` runs the kernel contract
 * validation on the contract set as it stood at a given (injected) instant and
 * records the outcome as EvidenceRecords (VERIFY by a CHECKER, never by an AI).
 * The legacy probe reads the laboratory factory registry (Canonical System
 * Model) and states, per component, whether the historical pipeline can
 * represent it — without ever feeding it: the golden is not a generation input
 * and creates no competing source of truth.
 *
 * `buildAsteriaGolden()` is pure and deterministic: same sources, same kernel,
 * same bytes. `goldens/asteria/update.ts` writes its output; the kernel test
 * suite rebuilds it and compares byte for byte.
 */

import {
  CURRENT_API_VERSION,
  CONTRACT_REGISTRY,
  contractDigest,
  documentRef,
  formatRef,
  pinnedRef,
  validateContractSet,
  type Actor,
  type AnyContract,
  type ContractRef,
  type ContractSetValidation,
  type Diagnostic,
  type EvidenceRecord,
  type EvidenceResult,
  type SystemDefinition,
} from '../../kernel/contracts/src/index.ts';
import {
  decisionSet,
  domainContract,
  organizationContext,
  peerSyncChangeRequest,
  requirementBaseline,
  scanningChangeRequest,
  SYSTEM,
  systemDefinition,
} from './source.ts';

export const CHECKER = Object.freeze({ id: 'asteria-golden-contract-check', version: '0.1.0', mode: 'AUTOMATED' as const });
export const CHECKER_ACTOR: Actor = { type: 'CHECKER', id: 'asteria-golden-harness' };

/** The five mandatory surfaces of the Asteria golden (Async Worker included). */
export const SURFACES = Object.freeze(['requester-web', 'ops-web', 'field-mobile', 'authority-api', 'async-worker']);

// ── Legacy compatibility seam (read-only) ─────────────────────────────────
interface LegacyRegistry {
  APPLICATION_KINDS: readonly string[];
  RUNTIMES: readonly string[];
}

const LEGACY_MODULE = new URL('../../factory/model/canonical-system.mjs', import.meta.url).href;
const legacy = (await import(LEGACY_MODULE)) as LegacyRegistry;

/**
 * Seam declaration: how a System Definition component kind reads in the
 * laboratory Canonical System Model. Absent kinds have no legacy equivalent.
 */
export const LEGACY_KIND_SEAM: Readonly<Record<string, string>> = Object.freeze({
  'web-application': 'web',
  'mobile-application': 'mobile',
  'api-service': 'api',
});

export interface LegacyProbe {
  component: string;
  kind: string;
  legacyKind: string | null;
  runtime: string | null;
  representable: boolean;
  reason: string;
}

export function probeLegacy(definition: SystemDefinition): LegacyProbe[] {
  return definition.spec.components.map((component) => {
    const legacyKind = LEGACY_KIND_SEAM[component.kind] ?? null;
    const runtime = component.runtime?.preferences?.[0] ?? null;
    let reason: string;
    let representable = false;
    if (!legacyKind) {
      reason = component.audience
        ? `UNSUPPORTED: kind '${component.kind}' has no equivalent among legacy application kinds [${legacy.APPLICATION_KINDS.join(', ')}]`
        : `NOT_APPLICABLE: '${component.kind}' is infrastructure, not an application of the legacy model`;
    } else if (!legacy.APPLICATION_KINDS.includes(legacyKind)) {
      reason = `UNSUPPORTED: legacy kind '${legacyKind}' is not registered`;
    } else if (!runtime || !legacy.RUNTIMES.includes(runtime)) {
      reason = `UNSUPPORTED: runtime '${String(runtime)}' is not a legacy runtime`;
    } else {
      representable = true;
      reason = `REPRESENTABLE as legacy ${legacyKind}/${runtime}`;
    }
    return { component: component.id, kind: component.kind, legacyKind, runtime, representable, reason };
  });
}

// ── Checker ───────────────────────────────────────────────────────────────
function addDays(instant: string, days: number): string {
  return new Date(Date.parse(instant) + days * 86_400_000).toISOString().replace('.000Z', 'Z');
}

interface Obligation {
  key: string;
  statement: string;
  source: ContractRef;
  component?: string;
  result: EvidenceResult;
  summary: string;
}

function obligations(subject: SystemDefinition, checked: readonly AnyContract[], validation: ContractSetValidation): Obligation[] {
  const baseline = checked.find((document) => document.kind === 'RequirementBaseline') as AnyContract;
  const decisions = checked.find((document) => document.kind === 'DecisionSet') as AnyContract;
  const subjectRef = documentRef(subject);
  const errors = validation.diagnostics.filter((item) => item.severity === 'error');
  const warnings = validation.diagnostics.filter((item) => item.severity === 'warning');
  const ofSubject = (code: string) => validation.diagnostics.filter((item) => item.ref === subjectRef && item.code === code);
  const workerIndex = subject.spec.components.findIndex((component) => component.id === 'async-worker');
  const worker = subject.spec.components[workerIndex];
  const workerFindings = validation.diagnostics.filter(
    (item: Diagnostic) => item.ref === subjectRef && item.severity === 'error' && (item.path ?? '').startsWith(`/spec/components/${workerIndex}/`),
  );
  // A finding on another contract makes the obligation undecidable, not failed.
  const workerOk = worker !== undefined && worker.kind === 'async-worker' && (worker.subscribes ?? []).length > 0 && workerFindings.length === 0;
  const legacyWorker = probeLegacy(subject).find((probe) => probe.component === 'async-worker');
  return [
    {
      key: 'closure',
      statement: 'The contract set is closed: every reference resolves, every pinned digest matches and every contract is valid.',
      source: pinnedRef(subject),
      result: validation.valid ? 'PASS' : 'FAIL',
      summary: `${checked.length} contracts checked; ${errors.length} errors; ${warnings.length} warnings.`,
    },
    {
      key: 'requirement-allocation',
      statement: 'Every accepted functional requirement is allocated to at least one component.',
      source: pinnedRef(baseline),
      result: ofSubject('SYSTEM_REQUIREMENT_UNCOVERED').length > 0 ? 'FAIL' : validation.valid ? 'PASS' : 'INCONCLUSIVE',
      summary: `${ofSubject('SYSTEM_REQUIREMENT_UNCOVERED').length} unallocated accepted functional requirements.`,
    },
    {
      key: 'worker-extensibility',
      statement: 'The Async Worker is a first-class component: it subscribes to published domain events and calls operations the Authority API implements.',
      source: pinnedRef(decisions, 'AD-002'),
      component: 'async-worker',
      result: !workerOk ? 'FAIL' : validation.valid ? 'PASS' : 'INCONCLUSIVE',
      summary: `${(worker?.subscribes ?? []).length} subscriptions; ${workerFindings.length} errors on the worker.`,
    },
    {
      key: 'legacy-materialization',
      statement: 'The laboratory factory pipeline can materialize the Async Worker.',
      source: pinnedRef(decisions, 'AD-002'),
      component: 'async-worker',
      result: legacyWorker?.representable ? 'PASS' : 'UNSUPPORTED',
      summary: legacyWorker?.reason ?? 'async-worker absent',
    },
  ];
}

/** Runs the checker on a contract set as it stood at `observedAt`. */
export function check(subject: SystemDefinition, checked: readonly AnyContract[], observedAt: string): EvidenceRecord[] {
  const validation = validateContractSet(checked);
  const inputs = [...checked].map((document) => pinnedRef(document)).sort((a, b) => (formatRef(a) < formatRef(b) ? -1 : 1));
  return obligations(subject, checked, validation).map((obligation) => {
    const record: EvidenceRecord = {
      apiVersion: CURRENT_API_VERSION,
      kind: 'EvidenceRecord',
      metadata: {
        id: `${SYSTEM}-sd${subject.metadata.revision}-${obligation.key}`,
        revision: 1,
        title: `Asteria — ${obligation.key} of system definition revision ${subject.metadata.revision}`,
        status: 'VALID',
        provenance: { origin: 'CHECKER', actor: CHECKER_ACTOR, tool: { name: CHECKER.id, version: CHECKER.version } },
      },
      spec: {
        system: SYSTEM,
        subject: obligation.component ? { contract: pinnedRef(subject), component: obligation.component } : { contract: pinnedRef(subject) },
        obligation: { id: obligation.key, statement: obligation.statement, source: obligation.source },
        checker: { ...CHECKER },
        producedBy: CHECKER_ACTOR,
        environment: { id: 'kernel-contracts-golden', kind: 'CI', attributes: { suite: 'goldens/asteria' } },
        result: obligation.result,
        summary: obligation.summary,
        observedAt,
        expiresAt: addDays(observedAt, 90),
        inputs,
        artifacts: [],
      },
    };
    return record;
  });
}

/** A new revision of a record, invalidated by a change. The original revision is never rewritten. */
export function invalidate(record: EvidenceRecord, by: ContractRef, reason: string): EvidenceRecord {
  const next = structuredClone(record);
  next.metadata.revision = record.metadata.revision + 1;
  next.metadata.status = 'INVALIDATED';
  next.metadata.supersedes = pinnedRef(record);
  next.spec.invalidation = { reason, by };
  return next;
}

// ── Golden build ──────────────────────────────────────────────────────────
export const CLOCK = Object.freeze({ sd1Check: '2026-09-17T12:00:00Z', sd2Check: '2026-09-22T12:00:00Z' });

export interface AsteriaGolden {
  documents: AnyContract[];
  validation: ContractSetValidation;
  files: Record<string, string>;
}

const KEBAB: Readonly<Record<string, string>> = Object.freeze({
  RequirementBaseline: 'requirement-baseline',
  DecisionSet: 'decision-set',
  EffectiveOrganizationContext: 'effective-organization-context',
  SystemDefinition: 'system-definition',
  DomainContract: 'domain-contract',
  ChangeRequest: 'change-request',
  EvidenceRecord: 'evidence-record',
});

export function fileName(document: AnyContract): string {
  const folder = document.kind === 'EvidenceRecord' ? 'evidence' : 'contracts';
  return `${folder}/${KEBAB[document.kind]}--${document.metadata.id}--r${document.metadata.revision}.json`;
}

function report(documents: AnyContract[], validation: ContractSetValidation, current: SystemDefinition): Record<string, unknown> {
  const byRef = (a: AnyContract, b: AnyContract) => (documentRef(a) < documentRef(b) ? -1 : 1);
  const baseline = documents.find((document) => document.kind === 'RequirementBaseline');
  const decisions = documents.find((document) => document.kind === 'DecisionSet');
  const domain = documents.find((document) => document.kind === 'DomainContract');
  const evidence = documents.filter((document): document is EvidenceRecord => document.kind === 'EvidenceRecord');
  const latestEvidence = evidence.filter((record) => !evidence.some((other) => other.metadata.id === record.metadata.id && other.metadata.revision > record.metadata.revision));
  const probes = probeLegacy(current);
  const traceability = baseline?.kind === 'RequirementBaseline'
    ? baseline.spec.requirements.map((requirement) => ({
        requirement: requirement.id,
        type: requirement.type,
        status: requirement.status,
        decisions: decisions?.kind === 'DecisionSet' ? decisions.spec.decisions.filter((decision) => decision.drivers.includes(requirement.id)).map((decision) => decision.id) : [],
        components: current.spec.components.filter((component) => (component.requirements ?? []).includes(requirement.id)).map((component) => component.id),
        acceptance: domain?.kind === 'DomainContract' ? domain.spec.acceptance.filter((scenario) => scenario.requirements.includes(requirement.id)).map((scenario) => scenario.id) : [],
      }))
    : [];
  return {
    golden: 'asteria',
    apiVersion: CURRENT_API_VERSION,
    checker: { ...CHECKER },
    set: { system: validation.system, valid: validation.valid, errors: validation.diagnostics.filter((d) => d.severity === 'error').length, warnings: validation.diagnostics.filter((d) => d.severity === 'warning').length },
    contracts: [...documents].sort(byRef).map((document) => ({
      ref: documentRef(document),
      code: CONTRACT_REGISTRY[document.kind].code,
      plane: CONTRACT_REGISTRY[document.kind].plane,
      status: document.metadata.status,
      digest: contractDigest(document),
      file: fileName(document),
    })),
    surfaces: SURFACES.map((id) => {
      const component = current.spec.components.find((candidate) => candidate.id === id);
      const probe = probes.find((candidate) => candidate.component === id);
      return {
        component: id,
        name: component?.name ?? null,
        kind: component?.kind ?? null,
        audience: component?.audience ?? null,
        runtimePreferences: component?.runtime?.preferences ?? [],
        legacy: probe ? { representable: probe.representable, reason: probe.reason } : null,
      };
    }),
    traceability,
    changeRequests: documents
      .filter((document) => document.kind === 'ChangeRequest')
      .sort(byRef)
      .map((document) => (document.kind === 'ChangeRequest' ? { ref: documentRef(document), status: document.metadata.status, classification: document.spec.classification, base: formatRef(document.spec.base), proposed: document.spec.proposed ? formatRef(document.spec.proposed) : null } : null)),
    evidence: latestEvidence.sort(byRef).map((record) => ({
      ref: documentRef(record),
      obligation: record.spec.obligation.id,
      subject: formatRef(record.spec.subject.contract) + (record.spec.subject.component ? `#${record.spec.subject.component}` : ''),
      result: record.spec.result,
      status: record.metadata.status,
    })),
    diagnostics: validation.diagnostics,
  };
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export function buildAsteriaGolden(): AsteriaGolden {
  const baseline = requirementBaseline();
  const decisions = decisionSet(baseline);
  const context = organizationContext();
  const domain = domainContract(baseline);
  const inputs = { baseline, decisions, context, domain };

  // Revision 1 as accepted on 2026-09-17, checked the same day.
  const sd1Accepted = systemDefinition(1, 'ACCEPTED', inputs);
  const sd1Evidence = check(sd1Accepted, [baseline, decisions, context, domain, sd1Accepted], CLOCK.sd1Check);

  // Day-2: change request asteria-cr-001 produces revision 2 and invalidates the SD1 evidence.
  const sd1 = systemDefinition(1, 'SUPERSEDED', inputs);
  const sd2 = systemDefinition(2, 'ACCEPTED', inputs, sd1);
  const cr1 = scanningChangeRequest(sd1, sd2, baseline, decisions, sd1Evidence.map((record) => pinnedRef(record)));
  const invalidated = sd1Evidence.map((record) => invalidate(record, pinnedRef(cr1), 'System definition revision 2 changes the checked components (asteria-cr-001).'));
  const sd2Evidence = check(sd2, [baseline, decisions, context, domain, sd1, cr1, sd2, ...sd1Evidence, ...invalidated], CLOCK.sd2Check);

  // An AI proposal classified UNSUPPORTED: recorded, never accepted by fallback.
  const cr2 = peerSyncChangeRequest(sd2, baseline);

  const documents = [baseline, decisions, context, domain, sd1, sd2, cr1, cr2, ...sd1Evidence, ...invalidated, ...sd2Evidence];
  const validation = validateContractSet(documents);
  const files: Record<string, string> = {};
  for (const document of documents) files[fileName(document)] = json(document);
  files['expected/report.json'] = json(report(documents, validation, sd2));
  return { documents, validation, files };
}
