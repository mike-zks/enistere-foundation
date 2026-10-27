/**
 * Stable references. A reference always names one exact revision of a contract
 * (`Kind/id@revision`), may pin its digest and may narrow to one item inside it
 * (`#item`). There is deliberately no "latest" form: an alias can move, a
 * reproducible compilation or proof cannot.
 */

import type { Digest } from './digest.ts';

export const CONTRACT_KINDS = [
  'RequirementBaseline',
  'DecisionSet',
  'EffectiveOrganizationContext',
  'SystemDefinition',
  'DomainContract',
  'ChangeRequest',
  'EvidenceRecord',
  'MaterializationRecord',
  'DesignSystem',
] as const;

export type ContractKind = (typeof CONTRACT_KINDS)[number];

export interface ContractRef {
  kind: ContractKind;
  id: string;
  revision: number;
  digest?: Digest;
  item?: string;
}

const REF_PATTERN = /^([A-Za-z]+)\/([a-z][a-z0-9]*(?:[-.][a-z0-9]+)*)@([1-9][0-9]*)(?:#([A-Za-z][A-Za-z0-9]*(?:[-_.][A-Za-z0-9]+)*))?$/;

export function isContractKind(value: unknown): value is ContractKind {
  return typeof value === 'string' && (CONTRACT_KINDS as readonly string[]).includes(value);
}

/** `Kind/id@revision` — identity of one revision, without digest nor item. */
export function refKey(ref: Pick<ContractRef, 'kind' | 'id' | 'revision'>): string {
  return `${ref.kind}/${ref.id}@${ref.revision}`;
}

/** `Kind/id@revision[#item]` — human-readable stable form. The digest is not part of the text form. */
export function formatRef(ref: ContractRef): string {
  return ref.item ? `${refKey(ref)}#${ref.item}` : refKey(ref);
}

/** Parses the text form. Returns null when the text is not a valid stable reference. */
export function parseRef(text: string): ContractRef | null {
  const match = REF_PATTERN.exec(text);
  if (!match) return null;
  const [, kind, id, revision, item] = match;
  if (!isContractKind(kind)) return null;
  const ref: ContractRef = { kind, id: id as string, revision: Number(revision) };
  if (item !== undefined) ref.item = item;
  return ref;
}

/** Builds the reference of a contract document, pinned by its digest. */
export function refTo(
  document: { kind: ContractKind; metadata: { id: string; revision: number } },
  digest: Digest,
  item?: string,
): ContractRef {
  const ref: ContractRef = { kind: document.kind, id: document.metadata.id, revision: document.metadata.revision, digest };
  if (item !== undefined) ref.item = item;
  return ref;
}

/** Splits a `'<contract id>#<item id>'` domain item reference. */
export function parseDomainItemRef(text: string): { contract: string; item: string } | null {
  const index = text.indexOf('#');
  if (index <= 0 || index === text.length - 1) return null;
  return { contract: text.slice(0, index), item: text.slice(index + 1) };
}
