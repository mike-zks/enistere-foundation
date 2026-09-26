#!/usr/bin/env node
/**
 * enistere-foundation — headless CLI over the Kernel Façade and the Engine
 * (surface only: reading files, printing JSON and choosing the exit code;
 * every decision belongs to the façade, the extension host and the
 * materializer).
 *
 *   enistere-foundation <validate|resolve|plan> <contracts>... [--catalog <file> | --extensions <dir>] [--definition <id>]
 *   enistere-foundation materialize <contracts>... --extensions <dir> --out <workspace> [--definition <id>]
 *   enistere-foundation verify <workspace> --extensions <dir> [--toolchain] [--evidence-out <dir>] [--environment local|ci]
 *   enistere-foundation export <contracts>... --extensions <dir> --workspace <workspace> [--evidence <dir>] --out <bundle> [--definition <id>]
 *   enistere-foundation verify-bundle <bundle>
 *
 * Exit codes: 0 VALID / RESOLVED / PLANNED / MATERIALIZED / PASS / EXPORTED · 1 INVALID or
 * FAIL · 2 PARTIAL (UNSUPPORTED items are listed) · 3 CONFLICT (nothing was
 * overwritten) · 64 usage error.
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { createKernelFacade, exportProofChain, verifyProofChain, type PlanResult } from '@enistere/foundation-kernel-compiler';
import { hasErrors, sortDiagnostics, type AnyContract, type Diagnostic, type EvidenceRecord } from '@enistere/foundation-kernel-contracts';
import { loadExtensions, materialize, readRecords, verifyWorkspace, type ExtensionHost } from '@enistere/foundation-engine-materializer';

const USAGE = [
  'usage: enistere-foundation <validate|resolve|plan> <contracts>... [--catalog <file> | --extensions <dir>] [--definition <id>]',
  '       enistere-foundation materialize <contracts>... --extensions <dir> --out <workspace> [--definition <id>]',
  '       enistere-foundation verify <workspace> --extensions <dir> [--toolchain] [--evidence-out <dir>] [--environment local|ci]',
  '       enistere-foundation export <contracts>... --extensions <dir> --workspace <workspace> [--evidence <dir>] --out <bundle> [--definition <id>]',
  '       enistere-foundation verify-bundle <bundle>',
].join('\n');
const COMMANDS = ['validate', 'resolve', 'plan', 'materialize', 'verify', 'export', 'verify-bundle'] as const;
type Command = (typeof COMMANDS)[number];
const VALUE_OPTIONS = ['--catalog', '--extensions', '--definition', '--out', '--evidence-out', '--environment', '--workspace', '--evidence'] as const;
type ValueOption = (typeof VALUE_OPTIONS)[number];

export interface Invocation {
  command: Command;
  paths: string[];
  catalog?: string;
  extensions?: string;
  definition?: string;
  out?: string;
  evidenceOut?: string;
  environment?: 'local' | 'ci';
  workspace?: string;
  evidence?: string;
  toolchain: boolean;
}

const FIELD: Readonly<Record<ValueOption, 'catalog' | 'extensions' | 'definition' | 'out' | 'evidenceOut' | 'environment' | 'workspace' | 'evidence'>> = {
  '--catalog': 'catalog',
  '--extensions': 'extensions',
  '--definition': 'definition',
  '--out': 'out',
  '--evidence-out': 'evidenceOut',
  '--environment': 'environment',
  '--workspace': 'workspace',
  '--evidence': 'evidence',
};

export function parseArguments(argv: readonly string[]): Invocation | string {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command as Command)) return USAGE;
  const invocation: Invocation = { command: command as Command, paths: [], toolchain: false };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index] as string;
    if ((VALUE_OPTIONS as readonly string[]).includes(argument)) {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith('--')) return `${argument} requires a value\n${USAGE}`;
      (invocation as unknown as Record<string, string>)[FIELD[argument as ValueOption]] = value;
      index += 1;
    } else if (argument === '--toolchain') {
      invocation.toolchain = true;
    } else if (argument.startsWith('--')) {
      return `unknown option ${argument}\n${USAGE}`;
    } else {
      invocation.paths.push(argument);
    }
  }
  if (invocation.paths.length === 0) return `no input given\n${USAGE}`;
  if (invocation.catalog !== undefined && invocation.extensions !== undefined) return `--catalog and --extensions are exclusive\n${USAGE}`;
  if (invocation.environment !== undefined && !['local', 'ci'].includes(invocation.environment)) return `--environment must be local or ci\n${USAGE}`;
  if (['materialize', 'verify', 'export'].includes(invocation.command) && invocation.extensions === undefined) return `${invocation.command} requires --extensions\n${USAGE}`;
  if (invocation.command === 'export' && (invocation.workspace === undefined || invocation.out === undefined)) return `export requires --workspace and --out\n${USAGE}`;
  if (invocation.command === 'verify-bundle' && invocation.paths.length !== 1) return `verify-bundle takes one bundle\n${USAGE}`;
  if (invocation.command === 'materialize' && invocation.out === undefined) return `materialize requires --out\n${USAGE}`;
  if (invocation.command === 'verify' && invocation.paths.length !== 1) return `verify takes one workspace\n${USAGE}`;
  return invocation;
}

/** JSON files under the given paths, in a stable order; the façade is order-independent anyway. */
function jsonFiles(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .flatMap((entry) => (entry.isDirectory() ? jsonFiles(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []));
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const now = (): string => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const print = (value: unknown): string => JSON.stringify(value, null, 2);
const statusCode = (status: string): number => ({ INVALID: 1, FAIL: 1, PARTIAL: 2, CONFLICT: 3 })[status] ?? 0;

/** Compiles with the given catalog, or with the catalog of the loaded extensions. */
function compile(invocation: Invocation, documents: unknown[], catalog: unknown, host: ExtensionHost | null, stage: 'resolve' | 'plan'): PlanResult | ReturnType<ReturnType<typeof createKernelFacade>['resolve']> {
  const facade = createKernelFacade();
  const options = { catalog: host ? (host.catalog ?? { invalid: true }) : catalog, definition: invocation.definition };
  const result = stage === 'plan' ? facade.plan(documents, options) : facade.resolve(documents, options);
  if (!host) return result;
  const diagnostics = sortDiagnostics([...result.diagnostics, ...host.diagnostics]);
  return { ...result, diagnostics, status: hasErrors(host.diagnostics) ? 'INVALID' : result.status } as typeof result;
}

export async function run(argv: readonly string[]): Promise<{ code: number; output: string }> {
  const invocation = parseArguments(argv);
  if (typeof invocation === 'string') return { code: 64, output: invocation };
  let documents: unknown[] = [];
  let catalog: unknown;
  let host: ExtensionHost | null = null;
  try {
    if (invocation.command !== 'verify' && invocation.command !== 'verify-bundle') documents = invocation.paths.flatMap(jsonFiles).map(readJson);
    catalog = invocation.catalog === undefined ? undefined : readJson(invocation.catalog);
    if (invocation.extensions !== undefined) host = await loadExtensions(invocation.extensions);
  } catch (error) {
    return { code: 64, output: `cannot read input: ${error instanceof Error ? error.message : String(error)}` };
  }

  if (invocation.command === 'validate') {
    const result = createKernelFacade().validate(documents);
    return { code: statusCode(result.status), output: print(result) };
  }
  if (invocation.command === 'resolve' || invocation.command === 'plan') {
    const result = compile(invocation, documents, catalog, host, invocation.command);
    return { code: statusCode(result.status), output: print(result) };
  }

  if (invocation.command === 'verify-bundle') {
    let bundle: unknown;
    try {
      bundle = readJson(invocation.paths[0] as string);
    } catch (error) {
      return { code: 64, output: `cannot read input: ${error instanceof Error ? error.message : String(error)}` };
    }
    const { valid, diagnostics } = verifyProofChain(bundle);
    return { code: valid ? 0 : 1, output: print({ stage: 'verify-bundle', status: valid ? 'VALID' : 'INVALID', diagnostics }) };
  }

  const extensionHost = host as ExtensionHost;
  if (invocation.command === 'export') {
    if (!extensionHost.catalog) return { code: 1, output: print({ stage: 'export', status: 'INVALID', diagnostics: extensionHost.diagnostics }) };
    const workspace = invocation.workspace as string;
    const materializations = readdirSync(workspace, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .flatMap((entry) => readRecords(join(workspace, entry.name)));
    const evidence = invocation.evidence === undefined ? [] : (jsonFiles(invocation.evidence).map(readJson) as EvidenceRecord[]);
    const { bundle, diagnostics } = exportProofChain({
      documents: documents as AnyContract[],
      catalog: extensionHost.catalog,
      definition: invocation.definition,
      materializations,
      evidence,
    });
    if (!bundle) return { code: 1, output: print({ stage: 'export', status: 'INVALID', diagnostics }) };
    writeFileSync(invocation.out as string, `${print(bundle)}\n`);
    return {
      code: 0,
      output: print({ stage: 'export', status: 'EXPORTED', bundle: invocation.out, digest: bundle.digest, contracts: bundle.contracts.length, materializations: materializations.length, evidence: evidence.length }),
    };
  }
  if (invocation.command === 'materialize') {
    const planned = compile(invocation, documents, catalog, extensionHost, 'plan') as PlanResult;
    if (planned.status === 'INVALID') return { code: 1, output: print({ stage: 'materialize', status: 'INVALID', definition: planned.definition, records: [], diagnostics: planned.diagnostics }) };
    const { records, diagnostics } = materialize(planned, extensionHost, invocation.out as string, { executedAt: now() });
    const all: Diagnostic[] = sortDiagnostics([...planned.diagnostics, ...diagnostics]);
    const status = records.some((record) => record.spec.outcome === 'CONFLICT')
      ? 'CONFLICT'
      : hasErrors(all)
        ? 'INVALID'
        : planned.status === 'PARTIAL' || diagnostics.length > 0
          ? 'PARTIAL'
          : 'MATERIALIZED';
    const output = { stage: 'materialize', status, definition: planned.definition, plan: planned.plan?.digest ?? null, unsupported: planned.plan?.unsupported ?? [], records, diagnostics: all };
    return { code: statusCode(status), output: print(output) };
  }

  // verify
  const observedAt = now();
  const environment = invocation.environment === 'ci' ? { id: 'ci', kind: 'CI' as const } : { id: 'local', kind: 'LOCAL' as const };
  const { evidence, diagnostics } = await verifyWorkspace(invocation.paths[0] as string, extensionHost, { toolchain: invocation.toolchain, observedAt, environment });
  if (invocation.evidenceOut !== undefined) {
    mkdirSync(invocation.evidenceOut, { recursive: true });
    for (const record of evidence) writeFileSync(join(invocation.evidenceOut, `evidence-record--${record.metadata.id}--r${record.metadata.revision}.json`), `${print(record)}\n`);
  }
  const all = sortDiagnostics([...extensionHost.diagnostics, ...diagnostics]);
  const passed = evidence.length > 0 && evidence.every((record) => record.spec.result === 'PASS') && !hasErrors(all);
  const output = {
    stage: 'verify',
    status: passed ? 'PASS' : 'FAIL',
    toolchain: invocation.toolchain,
    evidence: evidence.map((record) => ({
      id: record.metadata.id,
      component: record.spec.subject.component ?? null,
      obligation: record.spec.obligation.id,
      result: record.spec.result,
      summary: record.spec.summary ?? null,
    })),
    diagnostics: all,
  };
  return { code: passed ? 0 : 1, output: print(output) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { code, output } = await run(process.argv.slice(2));
  (code === 64 ? process.stderr : process.stdout).write(`${output}\n`);
  process.exitCode = code;
}
