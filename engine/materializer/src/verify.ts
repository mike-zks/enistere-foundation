/**
 * VERIFY — runs the checks an adapter manifest declares and records each
 * outcome as an EvidenceRecord (A7), produced by a CHECKER, never by an AI.
 *
 * - STRUCTURAL checks run in-process: the component directory must match its
 *   inventory (every compiler-owned file present and unchanged, every seeded
 *   file present).
 * - TOOLCHAIN checks run the commands the adapter declares, without shell, in
 *   the component directory, with a timeout and a minimal environment (no
 *   variable of the caller other than the allowlist below). A check that
 *   cannot run because an earlier one failed is INCONCLUSIVE, not FAIL: the
 *   manifest orders its checks from prerequisite to dependent.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';

import {
  CURRENT_API_VERSION,
  diagnostic,
  fileDigest,
  parseRef,
  sortDiagnostics,
  validateContract,
  type ContractRef,
  type Diagnostic,
  type EvidenceRecord,
  type EvidenceResult,
} from '@enistere/foundation-kernel-contracts';
import type { ToolchainCommand, ToolchainProbe, VerificationCheck } from '@enistere/foundation-kernel-extensions';

import type { ExtensionHost, LoadedExtension } from './host.ts';
import { INVENTORY_PATH, type Inventory } from './materialize.ts';

export const VERIFIER = Object.freeze({ id: 'foundation-engine-materializer', version: '0.1.0' });
const LAYER = { layer: 'engine.materializer' } as const;

/** Variables passed to toolchain commands; nothing else of the caller's environment. */
export const ENVIRONMENT_ALLOWLIST = Object.freeze([
  'PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'CI',
  'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy',
  'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'npm_config_cache', 'npm_config_registry', 'npm_config_cafile',
]);

export interface VerifyOptions {
  toolchain: boolean;
  /** RFC 3339 instant of the observation (injected: verification is replayable). */
  observedAt: string;
  environment: { id: string; kind: 'LOCAL' | 'CI' | 'STAGING' | 'PRODUCTION' };
}

interface Outcome {
  result: EvidenceResult;
  summary: string;
}

function minimalEnvironment(extra: Record<string, string> = {}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of ENVIRONMENT_ALLOWLIST) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return { ...env, ...extra };
}

function structural(directory: string, inventory: Inventory): { outcome: Outcome; mismatches: string[] } {
  const mismatches: string[] = [];
  for (const file of inventory.files) {
    const path = join(directory, file.path);
    if (!existsSync(path)) mismatches.push(`${file.path}: missing`);
    else if (file.ownership === 'COMPILER_OWNED' && fileDigest(readFileSync(path)) !== file.digest) mismatches.push(`${file.path}: changed`);
  }
  return {
    outcome: mismatches.length === 0
      ? { result: 'PASS', summary: `${inventory.files.length} files match the inventory.` }
      : { result: 'FAIL', summary: `${mismatches.length} of ${inventory.files.length} files differ from the inventory: ${mismatches.join('; ')}` },
    mismatches,
  };
}

const freePort = (): Promise<number> =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => (typeof address === 'object' && address ? resolvePort(address.port) : reject(new Error('no port'))));
    });
  });

function runCommand(step: ToolchainCommand, cwd: string): Outcome {
  const [command, ...args] = step.run as [string, ...string[]];
  const run = spawnSync(command, args, { cwd, env: minimalEnvironment(), timeout: step.timeoutMs, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (run.error && (run.error as NodeJS.ErrnoException).code === 'ENOENT') return { result: 'ERROR', summary: `tool '${command}' is not available` };
  if (run.error) return { result: 'ERROR', summary: `'${step.run.join(' ')}' did not complete: ${run.error.message}` };
  if (run.status !== 0) {
    const tail = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim().split('\n').slice(-5).join(' | ');
    return { result: 'FAIL', summary: `'${step.run.join(' ')}' exited with ${String(run.status)}: ${tail}`.slice(0, 1000) };
  }
  return { result: 'PASS', summary: `'${step.run.join(' ')}' succeeded.` };
}

async function runProbe(step: ToolchainProbe, cwd: string): Promise<Outcome> {
  const port = await freePort();
  const [command, ...args] = step.start as [string, ...string[]];
  const child = spawn(command, args, { cwd, env: minimalEnvironment({ ...step.env, [step.portVariable]: String(port) }), stdio: 'ignore' });
  let spawnError: Error | null = null;
  child.once('error', (error) => (spawnError = error));
  const deadline = Date.now() + step.timeoutMs;
  let last = 'no answer';
  try {
    while (Date.now() < deadline) {
      if (spawnError) return { result: 'ERROR', summary: `'${step.start.join(' ')}' could not start: ${(spawnError as Error).message}` };
      if (child.exitCode !== null) return { result: 'FAIL', summary: `'${step.start.join(' ')}' exited with ${child.exitCode} before answering` };
      try {
        const response = await fetch(`http://127.0.0.1:${port}${step.path}`, { signal: AbortSignal.timeout(2_000) });
        if (response.status === step.expectStatus) return { result: 'PASS', summary: `GET ${step.path} answered ${response.status}.` };
        last = `status ${response.status}`;
      } catch (error) {
        last = error instanceof Error ? error.message : String(error);
      }
      await new Promise((wait) => setTimeout(wait, 250));
    }
    return { result: 'FAIL', summary: `GET ${step.path} did not answer ${step.expectStatus} within ${step.timeoutMs} ms (${last})` };
  } finally {
    child.kill('SIGTERM');
  }
}

async function toolchain(extension: LoadedExtension, check: VerificationCheck, directory: string): Promise<Outcome> {
  const declared = extension.adapter.toolchainChecks().find((candidate) => candidate.check === check.id);
  if (!declared) return { result: 'ERROR', summary: `adapter '${extension.manifest.id}' declares no steps for check '${check.id}'` };
  for (const step of declared.steps) {
    const outcome = 'run' in step ? runCommand(step, directory) : await runProbe(step, directory);
    if (outcome.result !== 'PASS') return outcome;
  }
  return { result: 'PASS', summary: check.statement };
}

function addDays(instant: string, days: number): string {
  return new Date(Date.parse(instant) + days * 86_400_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function evidence(inventory: Inventory, definition: ContractRef, check: VerificationCheck, outcome: Outcome, options: VerifyOptions): EvidenceRecord {
  const actor = { type: 'CHECKER' as const, id: VERIFIER.id };
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'EvidenceRecord',
    metadata: {
      id: `${inventory.system}-${inventory.component}-${check.id}`,
      revision: 1,
      title: `${inventory.component} — ${check.id} (${inventory.adapter.id}@${inventory.adapter.version})`,
      status: 'VALID',
      provenance: { origin: 'CHECKER', actor, tool: { name: '@enistere/foundation-engine-materializer', version: VERIFIER.version } },
    },
    spec: {
      system: inventory.system,
      subject: { contract: definition, component: inventory.component },
      obligation: { id: check.id, statement: check.statement, source: definition },
      checker: { id: `${inventory.adapter.id}.${check.id}`, version: inventory.adapter.version, mode: 'AUTOMATED' },
      producedBy: actor,
      environment: { id: options.environment.id, kind: options.environment.kind, attributes: { level: check.level } },
      result: outcome.result,
      summary: outcome.summary,
      observedAt: options.observedAt,
      expiresAt: addDays(options.observedAt, 90),
      inputs: [definition],
      artifacts: [{ uri: `workspace:${inventory.component}/${INVENTORY_PATH}`, mediaType: 'application/json', digest: inventory.artifactPlan }],
    },
  };
}

/** Verifies every materialized component of `workspace`. */
export async function verifyWorkspace(workspace: string, host: ExtensionHost, options: VerifyOptions): Promise<{ evidence: EvidenceRecord[]; diagnostics: Diagnostic[] }> {
  const root = resolve(workspace);
  const found: Diagnostic[] = [];
  const records: EvidenceRecord[] = [];
  const components = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, INVENTORY_PATH)))
    .map((entry) => entry.name)
    .sort();
  for (const name of components) {
    const directory = join(root, name);
    const inventory = JSON.parse(readFileSync(join(directory, INVENTORY_PATH), 'utf8')) as Inventory;
    const parsed = parseRef(inventory.definition.ref);
    if (!parsed) throw new Error(`inventory of '${name}' names an invalid definition reference`);
    const definition: ContractRef = { ...parsed, digest: inventory.definition.digest };
    const extension = host.get(inventory.adapter.id);
    if (!extension || extension.manifest.version !== inventory.adapter.version) {
      found.push(diagnostic('MATERIALIZE_ADAPTER_MISSING', `adapter '${inventory.adapter.id}@${inventory.adapter.version}' is not loaded: '${name}' cannot be verified`, { ...LAYER, details: { component: name } }));
      continue;
    }
    let blocked = false;
    for (const check of extension.manifest.verification) {
      let outcome: Outcome;
      if (check.level === 'STRUCTURAL') {
        const { outcome: structuralOutcome, mismatches } = structural(directory, inventory);
        outcome = structuralOutcome;
        if (mismatches.length > 0) {
          found.push(diagnostic('VERIFY_INVENTORY_MISMATCH', `'${name}' differs from its inventory`, { ...LAYER, ref: inventory.definition.ref, details: { component: name, mismatches } }));
        }
      } else if (!options.toolchain) {
        continue;
      } else if (blocked) {
        outcome = { result: 'INCONCLUSIVE', summary: 'Not run: an earlier toolchain check did not pass.' };
      } else {
        outcome = await toolchain(extension, check, directory);
        if (outcome.result === 'ERROR' && outcome.summary.includes('is not available')) {
          found.push(diagnostic('VERIFY_TOOLCHAIN_UNAVAILABLE', outcome.summary, { ...LAYER, details: { component: name, check: check.id } }));
        }
      }
      if (outcome.result !== 'PASS' && check.level === 'TOOLCHAIN') blocked = true;
      const record = evidence(inventory, definition, check, outcome, options);
      const validation = validateContract(record);
      if (validation.diagnostics.some((item) => item.severity === 'error')) {
        throw new Error(`verifier produced an invalid EvidenceRecord: ${validation.diagnostics.map((item) => item.message).join('; ')}`);
      }
      records.push(record);
    }
  }
  return { evidence: records, diagnostics: sortDiagnostics(found) };
}
