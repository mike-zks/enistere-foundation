#!/usr/bin/env node
/**
 * CI scope detection (ADR-094).
 *
 * Decides which CI scopes a change touches, from `factory/quality/ci-scopes.json`.
 * Jobs whose scope is not touched are skipped with `if:` — a skipped job counts
 * as passing for a required status check, so check names stay stable for the
 * `protect-main` ruleset. Outside pull requests (push on main, schedule, manual
 * dispatch) every scope is active: the full CI still runs on every merge.
 *
 *   node factory/quality/scripts/ci-scope.mjs <event-name> [--golden-matrix]   # writes to $GITHUB_OUTPUT
 *
 * On a pull request the checkout is the merge commit (fetch-depth: 2): its first
 * parent is the base branch, so `git diff HEAD^1 HEAD` is exactly the PR's change.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export function loadScopes(root = ROOT) {
  return JSON.parse(readFileSync(resolve(root, 'factory/quality/ci-scopes.json'), 'utf8'));
}

/** Pure decision: `{ scope: boolean }` for a list of changed paths. */
export function decideScopes(config, changedFiles, eventName) {
  const names = Object.keys(config.scopes).sort();
  const all = (value) => Object.fromEntries(names.map((name) => [name, value]));
  if (eventName !== 'pull_request') return all(true);
  // An unknown diff is never read as "nothing changed": run everything.
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return all(true);
  const touches = (prefixes) => changedFiles.some((file) => prefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
  if (touches(config.always)) return all(true);
  return Object.fromEntries(names.map((name) => [name, touches(config.scopes[name])]));
}

export function loadGoldenMatrix(root = ROOT) {
  return JSON.parse(readFileSync(resolve(root, 'factory/quality/golden-runtime-matrix.json'), 'utf8'));
}

/** Golden runtime compositions to run: representative subset on pull requests, full elsewhere. */
export function goldenMatrix(matrix, eventName) {
  return eventName === 'pull_request' ? [...matrix.pullRequest] : [...matrix.full];
}

function changedFilesOfMergeCommit() {
  try {
    const out = execFileSync('git', ['diff', '--name-only', 'HEAD^1', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

async function main() {
  const eventName = process.argv[2] ?? process.env.GITHUB_EVENT_NAME ?? 'push';
  const files = eventName === 'pull_request' ? changedFilesOfMergeCommit() : [];
  const decision = decideScopes(loadScopes(), files, eventName);
  const lines = Object.entries(decision).map(([name, value]) => `${name}=${value}`);
  if (process.argv.includes('--golden-matrix')) lines.push(`goldenMatrix=${JSON.stringify(goldenMatrix(loadGoldenMatrix(), eventName))}`);
  console.log(`event=${eventName} files=${files === null ? 'unknown' : files.length}`);
  for (const line of lines) console.log(line);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
