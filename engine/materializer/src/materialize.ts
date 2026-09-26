/**
 * MATERIALIZE — applies the MATERIALIZE steps of an execution plan with the
 * adapters of the host, under the ownership rule of the kernel
 * (`decideWrite`).
 *
 * Every component is written into `<workspace>/<component>/`. Each applied
 * materialization is recorded as a MaterializationRecord (A8) under
 * `.foundation/records/`, one revision per materialization, the newest
 * superseding the previous one: the latest record is the component's
 * ownership inventory — there is no other. A component with any conflict is
 * not written at all (its CONFLICT record is returned, not stored): nothing is
 * overwritten silently, nothing is half-applied. No network access happens
 * here.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

import type { IRComponent, PlanResult } from '@enistere/foundation-kernel-compiler';
import {
  CURRENT_API_VERSION,
  diagnostic,
  fileDigest,
  parseRef,
  pinnedRef,
  sortDiagnostics,
  type ContractRef,
  type Diagnostic,
  type Digest,
  type MaterializationRecord,
  type WriteDecision,
} from '@enistere/foundation-kernel-contracts';
import { decideWrite, planArtifacts, WRITES, type ArtifactPlan } from '@enistere/foundation-kernel-extensions';

import type { ExtensionHost } from './host.ts';

export const RECORDS_DIRECTORY = '.foundation/records';
export const MATERIALIZER = Object.freeze({ id: 'foundation-engine-materializer', version: '0.2.0' });
const LAYER = { layer: 'engine.materializer' } as const;
const COMPILER_ACTOR = Object.freeze({ type: 'COMPILER' as const, id: MATERIALIZER.id });

export interface PlannedComponent {
  component: IRComponent;
  plan: ArtifactPlan;
  contents: Map<string, string>;
}

/**
 * PLAN of the adapters, without I/O: the artifacts every MATERIALIZE step of
 * the execution plan would produce.
 */
export function planMaterialization(result: PlanResult, host: ExtensionHost): { components: PlannedComponent[]; diagnostics: Diagnostic[] } {
  const found: Diagnostic[] = [];
  const components: PlannedComponent[] = [];
  if (!result.plan || !result.ir || !result.definition) return { components, diagnostics: [] };
  const context = { system: result.ir.system, definition: result.definition.ref, domains: result.ir.domains };
  for (const step of result.plan.steps) {
    if (step.action !== 'MATERIALIZE') continue;
    const ref = result.definition.ref;
    const loaded = host.get(step.adapter.id);
    if (!loaded || loaded.manifest.version !== step.adapter.version) {
      found.push(diagnostic('MATERIALIZE_ADAPTER_MISSING', `adapter '${step.adapter.id}@${step.adapter.version}' is not loaded`, { ...LAYER, ref, details: { component: step.component } }));
      continue;
    }
    const component = result.ir.components.find((candidate) => candidate.id === step.component);
    if (!component) continue;
    const reasons = loaded.adapter.validateIntent(component, context);
    if (reasons.length > 0) {
      for (const reason of reasons) {
        found.push(diagnostic('ADAPTER_INTENT_REJECTED', `adapter '${loaded.manifest.id}' rejects '${component.id}': ${reason}`, { ...LAYER, ref, details: { component: component.id } }));
      }
      continue;
    }
    try {
      const { plan, contents } = planArtifacts(loaded.adapter.describe(), component, loaded.adapter.plan(component, context));
      components.push({ component, plan, contents });
    } catch (error) {
      found.push(
        diagnostic('ADAPTER_CONTRACT_VIOLATION', `adapter '${loaded.manifest.id}' produced an invalid plan for '${component.id}': ${error instanceof Error ? error.message : String(error)}`, {
          ...LAYER,
          ref,
          details: { component: component.id },
        }),
      );
    }
  }
  return { components, diagnostics: sortDiagnostics(found) };
}

const recordFile = (record: MaterializationRecord): string =>
  `materialization-record--${record.metadata.id}--r${record.metadata.revision}.json`;

/** Every stored record of a component directory, oldest first. */
export function readRecords(directory: string): MaterializationRecord[] {
  const path = join(directory, RECORDS_DIRECTORY);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.startsWith('materialization-record--') && name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(path, name), 'utf8')) as MaterializationRecord)
    .sort((a, b) => a.metadata.revision - b.metadata.revision);
}

/** The latest record of a component directory: its ownership inventory. */
export function latestRecord(directory: string): MaterializationRecord | null {
  return readRecords(directory).at(-1) ?? null;
}

function definitionRef(result: PlanResult): ContractRef {
  const parsed = parseRef(result.definition?.ref ?? '');
  if (!parsed || !result.definition) throw new Error('a materialization needs the compiled System Definition');
  return { ...parsed, digest: result.definition.digest };
}

/**
 * Builds the A8 record of one component materialization (pure). `previous` is
 * the latest stored record, superseded by the new revision.
 */
export function materializationRecord(
  result: PlanResult,
  planned: Pick<PlannedComponent, 'component' | 'plan'>,
  decisions: ReadonlyMap<string, WriteDecision>,
  executedAt: string,
  previous: MaterializationRecord | null,
): MaterializationRecord {
  const outcome = [...decisions.values()].includes('CONFLICT') ? 'CONFLICT' : 'APPLIED';
  const record: MaterializationRecord = {
    apiVersion: CURRENT_API_VERSION,
    kind: 'MaterializationRecord',
    metadata: {
      id: `${result.ir?.system}-${planned.component.id}-materialization`,
      revision: (previous?.metadata.revision ?? 0) + 1,
      title: `${planned.component.id} — materialization by ${planned.plan.adapter.id}@${planned.plan.adapter.version}`,
      status: 'VALID',
      provenance: { origin: 'COMPILER', actor: { ...COMPILER_ACTOR }, tool: { name: '@enistere/foundation-engine-materializer', version: MATERIALIZER.version } },
    },
    spec: {
      system: result.ir?.system as string,
      subject: { contract: definitionRef(result), component: planned.component.id },
      closure: result.closure?.digest as Digest,
      plan: result.plan?.digest as Digest,
      adapter: { ...planned.plan.adapter },
      producedBy: { ...COMPILER_ACTOR },
      outcome,
      executedAt,
      files: planned.plan.artifacts.map(({ path, ownership, digest }) => ({ path, ownership, digest, decision: decisions.get(path) ?? 'CREATE' })),
    },
  };
  if (previous) record.metadata.supersedes = pinnedRef(previous);
  return record;
}

export interface MaterializeOptions {
  /** RFC 3339 instant recorded in the A8 records (injected: materialization is replayable). */
  executedAt: string;
}

/** Applies the plan in `workspace` and returns one A8 record per component. */
export function materialize(result: PlanResult, host: ExtensionHost, workspace: string, options: MaterializeOptions): { records: MaterializationRecord[]; diagnostics: Diagnostic[] } {
  const { components, diagnostics } = planMaterialization(result, host);
  const found = [...diagnostics];
  const records: MaterializationRecord[] = [];
  const root = resolve(workspace);
  for (const planned of components) {
    const { component, plan, contents } = planned;
    const directory = join(root, component.id);
    const previous = latestRecord(directory);
    const lastWritten = new Map((previous?.spec.files ?? []).map((file) => [file.path, file.digest]));
    const files = plan.artifacts.map((artifact) => {
      const target = resolve(directory, artifact.path);
      if (!target.startsWith(`${directory}${sep}`)) throw new Error(`artifact path escapes the component directory: ${artifact.path}`);
      const existing = existsSync(target) ? fileDigest(readFileSync(target)) : null;
      return { ...artifact, target, decision: decideWrite(artifact, existing, lastWritten.get(artifact.path) ?? null) };
    });
    const record = materializationRecord(result, planned, new Map(files.map((file) => [file.path, file.decision])), options.executedAt, previous);
    for (const conflict of files.filter((file) => file.decision === 'CONFLICT')) {
      found.push(
        diagnostic('MATERIALIZE_CONFLICT', `compiler-owned file '${component.id}/${conflict.path}' was changed outside the compiler`, {
          ...LAYER,
          ref: result.definition?.ref,
          details: { component: component.id, path: conflict.path },
        }),
      );
    }
    if (record.spec.outcome === 'APPLIED') {
      for (const file of files) {
        if (!WRITES.has(file.decision)) continue;
        mkdirSync(dirname(file.target), { recursive: true });
        writeFileSync(file.target, contents.get(file.path) as string);
      }
      const store = join(directory, RECORDS_DIRECTORY);
      mkdirSync(store, { recursive: true });
      if (previous) writeFileSync(join(store, recordFile(previous)), `${JSON.stringify({ ...previous, metadata: { ...previous.metadata, status: 'SUPERSEDED' } }, null, 2)}\n`);
      writeFileSync(join(store, recordFile(record)), `${JSON.stringify(record, null, 2)}\n`);
    }
    records.push(record);
  }
  return { records, diagnostics: sortDiagnostics(found) };
}
