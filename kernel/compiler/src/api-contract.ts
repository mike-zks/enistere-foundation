/**
 * API contract — the projection of a Domain Contract onto a shared,
 * runtime-neutral interface contract (mission E5, ADR-099).
 *
 * One OpenAPI 3.1 document is derived per (domain, provider component): the
 * operations the provider implements (E3 bindings), the schemas of every type
 * of the contract and the payloads of its events. The provider's runtime
 * adapter embeds the document as is; every consumer of those operations cites
 * the same digest: one contract, shared, never re-described.
 *
 * Derivation rules (no REST convention is invented):
 * - COMMAND → `POST /<bounded-context>/<operation>`; QUERY without input →
 *   `GET`; QUERY with input → `POST`; `operationId` is the operation id;
 * - responses: 200 (output), 400 (input does not match the contract), 422
 *   (declared domain errors), 501 (not implemented yet by the owner);
 * - ENTITY/VALUE → closed objects, ENUM → `enum`, `list<X>` → `array`;
 *   primitives carry a pattern, so a consumer can validate without format
 *   plugins; `decimal` is a string (precision is never lost).
 *
 * The domain stays distinct from platform capabilities: authorization is
 * carried as domain intent (`x-foundation-authorization`), not as a security
 * scheme; files are `file-ref` values. Whether a capability provider exists
 * never changes the contract. Facets are not interpreted here (they stay
 * listed as unsupported intent).
 */

import { digestOf, elementType, type Digest } from '@enistere/foundation-kernel-contracts';

import type { DomainIR, DomainTypeRef } from './domain-ir.ts';
import type { SystemIR } from './ir.ts';

export const API_CONTRACT_PROJECTION = 'foundation.enistere.com/api-contract/v1';

export type JsonSchema = { [key: string]: unknown };

export interface ApiContract {
  /** `<provider>.<bounded-context>` */
  id: string;
  domain: { ref: string; digest: Digest };
  boundedContext: string;
  provider: string;
  consumers: string[];
  operations: string[];
  document: JsonSchema;
  digest: Digest;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const UUID = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
const DATE = '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
const DATE_TIME = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})$';
const DECIMAL = '^-?[0-9]+(?:\\.[0-9]+)?$';

const PRIMITIVE_SCHEMAS: Readonly<Record<string, JsonSchema>> = Object.freeze({
  string: { type: 'string' },
  text: { type: 'string' },
  integer: { type: 'integer' },
  decimal: { type: 'string', format: 'decimal', pattern: DECIMAL },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date', pattern: DATE },
  datetime: { type: 'string', format: 'date-time', pattern: DATE_TIME },
  uuid: { type: 'string', format: 'uuid', pattern: UUID },
  'file-ref': { type: 'string', format: 'file-ref', minLength: 1 },
});

const PROBLEM: JsonSchema = {
  description: 'Problem Details (RFC 9457).',
  type: 'object',
  required: ['title', 'status'],
  properties: {
    type: { type: 'string' },
    title: { type: 'string' },
    status: { type: 'integer' },
    detail: { type: 'string' },
    code: { type: 'string' },
  },
};

function typeSchema(type: DomainTypeRef): JsonSchema {
  const element = elementType(type.expression);
  const item: JsonSchema = type.primitive !== null ? { ...PRIMITIVE_SCHEMAS[type.primitive] } : { $ref: `#/components/schemas/${element}` };
  return type.list ? { type: 'array', items: item } : item;
}

function schemas(domain: DomainIR): Record<string, JsonSchema> {
  const result: Record<string, JsonSchema> = {};
  for (const type of domain.types) {
    if (type.kind === 'ENUM') {
      result[type.id] = { type: 'string', enum: [...type.values], 'x-foundation-type': type.ref };
      continue;
    }
    const properties: Record<string, JsonSchema> = {};
    for (const field of type.fields) properties[field.name] = field.sensitive ? { ...typeSchema(field.type), 'x-foundation-sensitive': true } : typeSchema(field.type);
    const required = type.fields.filter((field) => field.required).map((field) => field.name);
    result[type.id] = { type: 'object', ...(required.length > 0 ? { required } : {}), properties, additionalProperties: false, 'x-foundation-type': type.ref };
  }
  result.Problem = PROBLEM;
  return result;
}

const problem = (description: string, schema: JsonSchema = { $ref: '#/components/schemas/Problem' }): JsonSchema => ({
  description,
  content: { 'application/problem+json': { schema } },
});

function operationPath(domain: DomainIR, operation: DomainIR['operations'][number]): { path: string; method: 'get' | 'post' } {
  return { path: `/${domain.boundedContext}/${operation.id}`, method: operation.kind === 'QUERY' && operation.input === null ? 'get' : 'post' };
}

function operationObject(operation: DomainIR['operations'][number]): JsonSchema {
  const responses: Record<string, JsonSchema> = {
    '200': operation.output === null ? { description: 'Done.' } : { description: 'Done.', content: { 'application/json': { schema: typeSchema(operation.output) } } },
  };
  if (operation.input !== null) responses['400'] = problem('The input does not match the contract.');
  if (operation.errors.length > 0) {
    responses['422'] = problem('A declared domain error.', {
      allOf: [{ $ref: '#/components/schemas/Problem' }, { type: 'object', required: ['code'], properties: { code: { enum: [...operation.errors] } } }],
    });
  }
  responses['501'] = problem('The operation is not implemented yet by the owning team.');
  return {
    operationId: operation.id,
    'x-foundation-operation': operation.ref,
    'x-foundation-kind': operation.kind,
    'x-foundation-authorization': { intent: operation.authorization.intent, roles: [...operation.authorization.roles] },
    'x-foundation-idempotent': operation.idempotent,
    'x-foundation-emits': [...operation.emits],
    'x-foundation-invariants': [...operation.invariants],
    ...(operation.input === null ? {} : { requestBody: { required: true, content: { 'application/json': { schema: typeSchema(operation.input) } } } }),
    responses,
  };
}

/** The API contract of the operations of `domain` that `provider` implements. */
export function projectApiContract(domain: DomainIR, provider: string, ir: Pick<SystemIR, 'operationBindings'>): ApiContract | null {
  const bindings = new Map(ir.operationBindings.map((binding) => [binding.item, binding]));
  const operations = domain.operations.filter((operation) => bindings.get(operation.ref)?.implementedBy.includes(provider));
  if (operations.length === 0) return null;
  const consumers = [...new Set(operations.flatMap((operation) => bindings.get(operation.ref)?.consumedBy ?? []))].filter((id) => id !== provider).sort(byText);
  const paths: Record<string, JsonSchema> = {};
  for (const operation of operations) {
    const { path, method } = operationPath(domain, operation);
    paths[path] = { [method]: operationObject(operation) };
  }
  const document: JsonSchema = {
    openapi: '3.1.0',
    info: { title: `${domain.boundedContext} — ${provider}`, version: domain.contract.ref.split('@')[1] as string },
    'x-foundation': { projection: API_CONTRACT_PROJECTION, contract: { ...domain.contract }, provider, consumers },
    paths,
    components: { schemas: schemas(domain) },
    'x-foundation-events': domain.events.map((event) => ({ id: event.id, ref: event.ref, version: event.version, payload: typeSchema(event.payload) })),
  };
  const content = {
    id: `${provider}.${domain.boundedContext}`,
    domain: { ...domain.contract },
    boundedContext: domain.boundedContext,
    provider,
    consumers,
    operations: operations.map((operation) => operation.ref),
    document,
  };
  return { ...content, digest: digestOf(document) };
}

/** Every API contract of the system: one per (domain, implementing component). */
export function projectApiContracts(ir: Pick<SystemIR, 'domains' | 'operationBindings'>): ApiContract[] {
  const contracts: ApiContract[] = [];
  for (const domain of ir.domains) {
    const providers = [...new Set(ir.operationBindings.filter((binding) => domain.operations.some((operation) => operation.ref === binding.item)).flatMap((binding) => binding.implementedBy))].sort(byText);
    for (const provider of providers) {
      const contract = projectApiContract(domain, provider, ir);
      if (contract) contracts.push(contract);
    }
  }
  return contracts.sort((a, b) => byText(a.id, b.id));
}
