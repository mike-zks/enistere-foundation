/**
 * Structural validation against the published JSON Schemas.
 *
 * The schema documents under `schemas/v1alpha1/` are the single source of the
 * contracts' shape: this module interprets them (Ajv, draft 2020-12) and turns
 * every violation into a CONTRACT_SCHEMA_VIOLATION diagnostic. It restates no
 * rule. Semantic rules that a schema cannot express live in `contracts/`.
 */

import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv/dist/2020.js';
import { diagnostic, type Diagnostic, type DiagnosticCode, type DiagnosticLayer } from './primitives/diagnostics.ts';
import type { ContractKind } from './primitives/refs.ts';

export const SCHEMA_DIRECTORY = new URL('../schemas/v1alpha1/', import.meta.url);

/** One schema file per contract kind (plus the shared primitives). */
export const SCHEMA_FILES: Readonly<Record<ContractKind, string>> = Object.freeze({
  RequirementBaseline: 'requirement-baseline.schema.json',
  DecisionSet: 'decision-set.schema.json',
  EffectiveOrganizationContext: 'effective-organization-context.schema.json',
  SystemDefinition: 'system-definition.schema.json',
  DomainContract: 'domain-contract.schema.json',
  ChangeRequest: 'change-request.schema.json',
  EvidenceRecord: 'evidence-record.schema.json',
  MaterializationRecord: 'materialization-record.schema.json',
  DesignSystem: 'design-system.schema.json',
});

export const COMMON_SCHEMA_FILE = 'common.schema.json';

export function readSchema(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(file, SCHEMA_DIRECTORY), 'utf8')) as Record<string, unknown>;
}

let compiled: Map<ContractKind, ValidateFunction> | null = null;

function validators(): Map<ContractKind, ValidateFunction> {
  if (compiled) return compiled;
  const ajv = new Ajv2020.default({ allErrors: true, strict: true, strictTypes: false });
  ajv.addSchema(readSchema(COMMON_SCHEMA_FILE));
  const map = new Map<ContractKind, ValidateFunction>();
  for (const [kind, file] of Object.entries(SCHEMA_FILES) as [ContractKind, string][]) {
    map.set(kind, ajv.compile(readSchema(file)));
  }
  compiled = map;
  return map;
}

function describe(error: ErrorObject): string {
  const params = error.params as Record<string, unknown>;
  if (error.keyword === 'additionalProperties') return `unknown property '${String(params.additionalProperty)}'`;
  if (error.keyword === 'required') return `missing required property '${String(params.missingProperty)}'`;
  if (error.keyword === 'enum') return `must be one of ${JSON.stringify(params.allowedValues)}`;
  if (error.keyword === 'const') return `must equal ${JSON.stringify(params.allowedValue)}`;
  return `${error.keyword}: ${error.message ?? 'invalid'}`;
}

/** Validates a document against the schema of its kind. */
export function schemaDiagnostics(kind: ContractKind, document: unknown, ref?: string): Diagnostic[] {
  const validate = validators().get(kind);
  if (!validate) throw new Error(`No schema registered for ${kind}`);
  if (validate(document)) return [];
  return (validate.errors ?? []).map((error) =>
    diagnostic('CONTRACT_SCHEMA_VIOLATION', describe(error), {
      ref,
      path: error.instancePath || '/',
      details: { keyword: error.keyword, schemaPath: error.schemaPath },
    }),
  );
}

/**
 * Validates a value against any other published JSON Schema of the Foundation
 * (for instance the adapter manifest), with the same interpreter and the same
 * diagnostic shape as the contract schemas. Compiled schemas are cached by
 * their `$id`.
 */
const extraValidators = new Map<string, ValidateFunction>();

export function jsonSchemaDiagnostics(
  schema: Record<string, unknown>,
  value: unknown,
  options: { code: DiagnosticCode; layer?: DiagnosticLayer; ref?: string },
): Diagnostic[] {
  const id = schema.$id;
  if (typeof id !== 'string') throw new Error('schema must declare an $id');
  let validate = extraValidators.get(id);
  if (!validate) {
    validate = new Ajv2020.default({ allErrors: true, strict: true, strictTypes: false }).compile(schema);
    extraValidators.set(id, validate);
  }
  if (validate(value)) return [];
  return (validate.errors ?? []).map((error) =>
    diagnostic(options.code, describe(error), {
      ref: options.ref,
      layer: options.layer,
      path: error.instancePath || '/',
      details: { keyword: error.keyword, schemaPath: error.schemaPath },
    }),
  );
}
