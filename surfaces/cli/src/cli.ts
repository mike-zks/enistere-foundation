#!/usr/bin/env node
/**
 * enistere-foundation — headless CLI over the Kernel Façade (surface only:
 * reading files, printing JSON and choosing the exit code; every decision is
 * the façade's).
 *
 *   enistere-foundation <validate|resolve|plan> <file|directory>... [--catalog <file>] [--definition <id>]
 *
 * Exit codes: 0 VALID / RESOLVED / PLANNED · 1 INVALID · 2 PARTIAL (UNSUPPORTED
 * items are listed in the output) · 64 usage error.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { createKernelFacade } from '@enistere/foundation-kernel-compiler';

const USAGE = 'usage: enistere-foundation <validate|resolve|plan> <file|directory>... [--catalog <file>] [--definition <id>]';
const COMMANDS = ['validate', 'resolve', 'plan'] as const;
type Command = (typeof COMMANDS)[number];

export interface Invocation {
  command: Command;
  paths: string[];
  catalog?: string;
  definition?: string;
}

export function parseArguments(argv: readonly string[]): Invocation | string {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command as Command)) return USAGE;
  const invocation: Invocation = { command: command as Command, paths: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index] as string;
    if (argument === '--catalog' || argument === '--definition') {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith('--')) return `${argument} requires a value\n${USAGE}`;
      if (argument === '--catalog') invocation.catalog = value;
      else invocation.definition = value;
      index += 1;
    } else if (argument.startsWith('--')) {
      return `unknown option ${argument}\n${USAGE}`;
    } else {
      invocation.paths.push(argument);
    }
  }
  if (invocation.paths.length === 0) return `no contract file or directory given\n${USAGE}`;
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

export function run(argv: readonly string[]): { code: number; output: string } {
  const invocation = parseArguments(argv);
  if (typeof invocation === 'string') return { code: 64, output: invocation };
  let documents: unknown[];
  let catalog: unknown;
  try {
    documents = invocation.paths.flatMap(jsonFiles).map(readJson);
    catalog = invocation.catalog === undefined ? undefined : readJson(invocation.catalog);
  } catch (error) {
    return { code: 64, output: `cannot read input: ${error instanceof Error ? error.message : String(error)}` };
  }
  const facade = createKernelFacade();
  const options = { catalog, definition: invocation.definition };
  const result =
    invocation.command === 'validate' ? facade.validate(documents) : invocation.command === 'resolve' ? facade.resolve(documents, options) : facade.plan(documents, options);
  const code = result.status === 'INVALID' ? 1 : result.status === 'PARTIAL' ? 2 : 0;
  return { code, output: JSON.stringify(result, null, 2) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { code, output } = run(process.argv.slice(2));
  (code === 64 ? process.stderr : process.stdout).write(`${output}\n`);
  process.exitCode = code;
}
