/**
 * Validation of a closed set of contracts describing one system.
 *
 * A contract set is closed under references: every stable reference resolves
 * to a revision of the set, every pinned digest matches, every `#item` exists.
 * On top of the per-document rules, the set checks what only several documents
 * can tell: traceability (requirement → decision → component → operation),
 * acceptance of dependencies, Change Request bases and Evidence staleness.
 *
 * The set is a validation view, not a new source of truth: it reads contracts,
 * it never merges them into an omniscient model.
 */

import { crossValidateChangeRequest, verifyChangeConsistency } from './contracts/change-request.ts';
import { crossValidateDecisionSet } from './contracts/decision-set.ts';
import { crossValidateDomainContract } from './contracts/domain-contract.ts';
import { evidenceStaleness } from './contracts/evidence-record.ts';
import { crossValidateSystemDefinition } from './contracts/system-definition.ts';
import { contractDigest, documentKey, documentRef } from './identity.ts';
import { diagnostic, hasErrors, sortDiagnostics, type Diagnostic } from './primitives/diagnostics.ts';
import type { Digest } from './primitives/digest.ts';
import { CONTRACT_KINDS, formatRef, refKey, type ContractKind, type ContractRef } from './primitives/refs.ts';
import { CONTRACT_REGISTRY } from './registry.ts';
import type {
  AnyContract,
  ChangeRequest,
  DecisionSet,
  DomainContract,
  EvidenceRecord,
  MaterializationRecord,
  RequirementBaseline,
  SystemDefinition,
} from './types.ts';
import { validateContract, type ValidateOptions } from './validate.ts';

export interface ContractSetEntry {
  ref: string;
  digest: Digest;
  document: AnyContract;
}

export interface ContractSetValidation {
  system: string | null;
  entries: ContractSetEntry[];
  diagnostics: Diagnostic[];
  valid: boolean;
}

export interface ContractIndex {
  get(ref: Pick<ContractRef, 'kind' | 'id' | 'revision'>): AnyContract | undefined;
  /** Highest revision of a contract whose status is in force. */
  inForceRevision(kind: string, id: string): number | undefined;
  /** Highest revision of a contract, whatever its status. */
  latest(kind: string, id: string): AnyContract | undefined;
}

export function indexContracts(documents: readonly AnyContract[]): ContractIndex {
  const byKey = new Map(documents.map((document) => [documentKey(document), document]));
  const latestOf = (kind: string, id: string, filter: (document: AnyContract) => boolean): AnyContract | undefined =>
    documents
      .filter((document) => document.kind === kind && document.metadata.id === id && filter(document))
      .reduce<AnyContract | undefined>((best, document) => (!best || document.metadata.revision > best.metadata.revision ? document : best), undefined);
  return {
    get: (ref) => byKey.get(refKey(ref)),
    inForceRevision: (kind, id) =>
      latestOf(kind, id, (document) => CONTRACT_REGISTRY[document.kind].inForce.includes(document.metadata.status))?.metadata.revision,
    latest: (kind, id) => latestOf(kind, id, () => true),
  };
}

interface FoundRef {
  ref: ContractRef;
  path: string;
}

/** Every stable reference held by a document, with its JSON Pointer. */
export function collectRefs(value: unknown, path = ''): FoundRef[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => collectRefs(item, `${path}/${index}`));
  if (value === null || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const found: FoundRef[] = [];
  if ((CONTRACT_KINDS as readonly unknown[]).includes(record.kind) && typeof record.id === 'string' && typeof record.revision === 'number') {
    found.push({ ref: record as unknown as ContractRef, path });
  }
  for (const key of Object.keys(record).sort()) {
    found.push(...collectRefs(record[key], `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`));
  }
  return found;
}

function expectKind(
  ref: ContractRef,
  expected: ContractKind,
  path: string,
  owner: string,
  index: ContractIndex,
  found: Diagnostic[],
): AnyContract | undefined {
  if (ref.kind !== expected) {
    found.push(diagnostic('REF_KIND_MISMATCH', `expected a ${expected}, got ${formatRef(ref)}`, { ref: owner, path }));
    return undefined;
  }
  return index.get(ref);
}

function requireReliable(dependent: AnyContract, dependency: AnyContract | undefined, path: string, found: Diagnostic[]): void {
  if (!dependency || !['ACCEPTED', 'APPLIED'].includes(dependent.metadata.status)) return;
  if (!CONTRACT_REGISTRY[dependency.kind].reliable.includes(dependency.metadata.status)) {
    found.push(
      diagnostic('REF_NOT_ACCEPTED', `${documentRef(dependent)} depends on ${documentRef(dependency)} which is ${dependency.metadata.status}`, {
        ref: documentRef(dependent),
        path,
      }),
    );
  }
}

function crossValidate(document: AnyContract, index: ContractIndex): Diagnostic[] {
  const found: Diagnostic[] = [];
  const owner = documentRef(document);
  switch (document.kind) {
    case 'DecisionSet': {
      const baseline = expectKind(document.spec.requirementBaseline, 'RequirementBaseline', '/spec/requirementBaseline', owner, index, found);
      requireReliable(document, baseline, '/spec/requirementBaseline', found);
      if (baseline) found.push(...crossValidateDecisionSet(document as DecisionSet, owner, baseline as RequirementBaseline));
      break;
    }
    case 'DomainContract': {
      const baseline = expectKind(document.spec.requirementBaseline, 'RequirementBaseline', '/spec/requirementBaseline', owner, index, found);
      requireReliable(document, baseline, '/spec/requirementBaseline', found);
      if (baseline) found.push(...crossValidateDomainContract(document as DomainContract, owner, baseline as RequirementBaseline));
      break;
    }
    case 'SystemDefinition': {
      const { inputs } = document.spec;
      const baseline = expectKind(inputs.requirementBaseline, 'RequirementBaseline', '/spec/inputs/requirementBaseline', owner, index, found);
      const decisions = expectKind(inputs.decisionSet, 'DecisionSet', '/spec/inputs/decisionSet', owner, index, found);
      const context = expectKind(inputs.organizationContext, 'EffectiveOrganizationContext', '/spec/inputs/organizationContext', owner, index, found);
      requireReliable(document, baseline, '/spec/inputs/requirementBaseline', found);
      requireReliable(document, decisions, '/spec/inputs/decisionSet', found);
      requireReliable(document, context, '/spec/inputs/organizationContext', found);
      const domains = new Map<string, DomainContract>();
      inputs.domainContracts.forEach((ref, position) => {
        const path = `/spec/inputs/domainContracts/${position}`;
        const domain = expectKind(ref, 'DomainContract', path, owner, index, found);
        requireReliable(document, domain, path, found);
        if (domain) domains.set(domain.metadata.id, domain as DomainContract);
      });
      found.push(
        ...crossValidateSystemDefinition(document as SystemDefinition, owner, {
          baseline: baseline as RequirementBaseline | undefined,
          decisions: decisions as DecisionSet | undefined,
          domains,
        }),
      );
      break;
    }
    case 'ChangeRequest': {
      const change = document as ChangeRequest;
      const base = index.get(change.spec.base);
      if (base) found.push(...crossValidateChangeRequest(change, owner, base));
      const proposed = change.spec.proposed ? index.get(change.spec.proposed) : undefined;
      if (base && proposed) found.push(...verifyChangeConsistency(change, base, proposed));
      const inForce = index.inForceRevision(change.spec.base.kind, change.spec.base.id);
      if (['DRAFT', 'PROPOSED', 'ACCEPTED'].includes(change.metadata.status) && inForce !== undefined && inForce > change.spec.base.revision) {
        found.push(
          diagnostic('CHANGE_BASE_STALE', `base ${formatRef(change.spec.base)} was superseded by revision ${inForce}`, {
            ref: owner,
            path: '/spec/base',
          }),
        );
      }
      break;
    }
    case 'EvidenceRecord': {
      const record = document as EvidenceRecord;
      if (record.spec.waiver) expectKind(record.spec.waiver.context, 'EffectiveOrganizationContext', '/spec/waiver/context', owner, index, found);
      const context = record.spec.waiver ? index.get(record.spec.waiver.context) : undefined;
      if (context && context.kind === 'EffectiveOrganizationContext' && !context.spec.waivers.some((waiver) => waiver.id === record.spec.waiver?.waiver)) {
        found.push(diagnostic('REF_ITEM_UNRESOLVED', `unknown waiver '${record.spec.waiver?.waiver}'`, { ref: owner, path: '/spec/waiver/waiver' }));
      }
      const subject = index.get(record.spec.subject.contract);
      if (record.spec.subject.component !== undefined && subject && !CONTRACT_REGISTRY[subject.kind].items(subject).has(record.spec.subject.component)) {
        found.push(diagnostic('REF_ITEM_UNRESOLVED', `unknown component '${record.spec.subject.component}'`, { ref: owner, path: '/spec/subject/component' }));
      }
      const latest = index.latest(record.kind, record.metadata.id);
      if (record.metadata.status === 'VALID' && latest === record) {
        const staleness = evidenceStaleness(record, (kind, id) => index.inForceRevision(kind, id));
        for (const outdated of staleness.outdated) {
          found.push(
            diagnostic('EVIDENCE_STALE', `checked ${formatRef(outdated.pinned)}, revision ${outdated.currentRevision} is now in force`, {
              ref: owner,
              path: '/spec/inputs',
              details: { pinned: formatRef(outdated.pinned), currentRevision: outdated.currentRevision },
            }),
          );
        }
      }
      break;
    }
    case 'MaterializationRecord': {
      const record = document as MaterializationRecord;
      const subject = expectKind(record.spec.subject.contract, 'SystemDefinition', '/spec/subject/contract', owner, index, found);
      if (subject && subject.kind === 'SystemDefinition' && !subject.spec.components.some((component) => component.id === record.spec.subject.component)) {
        found.push(diagnostic('REF_ITEM_UNRESOLVED', `unknown component '${record.spec.subject.component}'`, { ref: owner, path: '/spec/subject/component' }));
      }
      break;
    }
    default:
      break;
  }
  return found;
}

/** Validates a closed contract set for one system. */
export function validateContractSet(inputs: readonly unknown[], options: ValidateOptions = {}): ContractSetValidation {
  const found: Diagnostic[] = [];
  const entries: ContractSetEntry[] = [];
  const seen = new Set<string>();
  for (const input of inputs) {
    const validation = validateContract(input, options);
    found.push(...validation.diagnostics);
    if (!validation.document || !validation.ref || !validation.digest) continue;
    const key = documentKey(validation.document);
    if (seen.has(key)) {
      found.push(diagnostic('REF_DUPLICATE_CONTRACT', `${validation.ref} appears twice`, { ref: validation.ref }));
      continue;
    }
    seen.add(key);
    entries.push({ ref: validation.ref, digest: validation.digest, document: validation.document });
  }
  entries.sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));

  const documents = entries.map((entry) => entry.document);
  const index = indexContracts(documents);
  const systems = [...new Set(documents.map((document) => (document.spec as { system: string }).system))].sort();
  const system = systems.length === 1 ? (systems[0] as string) : null;
  if (systems.length > 1) {
    for (const document of documents) {
      found.push(
        diagnostic('REF_SYSTEM_MISMATCH', `set mixes systems ${systems.join(', ')}`, {
          ref: documentRef(document),
          path: '/spec/system',
          details: { system: (document.spec as { system: string }).system },
        }),
      );
    }
  }

  for (const document of documents) {
    const owner = documentRef(document);
    for (const { ref, path } of collectRefs(document)) {
      const target = index.get(ref);
      if (!target) {
        found.push(diagnostic('REF_UNRESOLVED', `${formatRef(ref)} is not in the contract set`, { ref: owner, path }));
        continue;
      }
      if (ref.digest !== undefined && ref.digest !== contractDigest(target)) {
        found.push(
          diagnostic('REF_DIGEST_MISMATCH', `${formatRef(ref)} was pinned at another content`, {
            ref: owner,
            path: `${path}/digest`,
            details: { pinned: ref.digest, actual: contractDigest(target) },
          }),
        );
      }
      if (ref.item !== undefined && !CONTRACT_REGISTRY[target.kind].items(target).has(ref.item)) {
        found.push(diagnostic('REF_ITEM_UNRESOLVED', `${formatRef(ref)} does not exist`, { ref: owner, path: `${path}/item` }));
      }
    }
    found.push(...crossValidate(document, index));
  }

  const diagnostics = sortDiagnostics(found);
  return { system, entries, diagnostics, valid: !hasErrors(diagnostics) };
}
