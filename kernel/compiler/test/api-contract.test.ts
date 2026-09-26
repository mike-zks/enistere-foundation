import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { AnyContract } from '@enistere/foundation-kernel-contracts';

import { API_CONTRACT_PROJECTION, createKernelFacade, projectApiContract, EMPTY_CATALOG, type ApiContract, type JsonSchema, type PlanResult } from '../src/index.ts';

const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));

function loadAsteria(): AnyContract[] {
  return ['contracts/', 'evidence/'].flatMap((directory) =>
    readdirSync(`${GOLDEN}${directory}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as AnyContract),
  );
}
const catalog = (): unknown => JSON.parse(readFileSync(`${GOLDEN}sources/catalog.json`, 'utf8'));
const planOf = (documents: readonly AnyContract[], options: { catalog?: unknown } = { catalog: catalog() }): PlanResult => createKernelFacade().plan(documents, options);
const only = (result: PlanResult): ApiContract => {
  assert.equal(result.apiContracts.length, 1);
  return result.apiContracts[0]!;
};
type Operation = JsonSchema & { operationId: string; requestBody?: JsonSchema; responses: Record<string, JsonSchema> };
const operations = (contract: ApiContract): [string, string, Operation][] =>
  Object.entries(contract.document.paths as Record<string, Record<string, Operation>>).flatMap(([path, methods]) => Object.entries(methods).map(([method, operation]) => [method, path, operation] as [string, string, Operation]));

test('the Authority API contract projects the ten implemented operations with derived routes', () => {
  const contract = only(planOf(loadAsteria()));
  assert.equal(contract.id, 'authority-api.service-requests');
  assert.equal(contract.document.openapi, '3.1.0');
  assert.equal((contract.document['x-foundation'] as { projection: string }).projection, API_CONTRACT_PROJECTION);
  const routes = operations(contract).map(([method, path, operation]) => `${method} ${path} ${operation.operationId}`);
  assert.equal(routes.length, 10);
  assert.ok(routes.includes('post /service-requests/submit-request submit-request'), 'COMMAND → POST');
  assert.ok(routes.includes('get /service-requests/list-requests list-requests'), 'QUERY without input → GET');
  for (const [, , operation] of operations(contract)) {
    assert.ok(operation.responses['501'], 'every operation may answer 501 until the owner implements it');
    assert.equal(operation.requestBody !== undefined, operation.responses['400'] !== undefined, 'an input can be rejected with 400');
  }
});

test('schemas follow the Domain IR: closed objects, enums, lists, precise primitives', () => {
  const schemas = (only(planOf(loadAsteria())).document.components as { schemas: Record<string, JsonSchema> }).schemas;
  const request = schemas.ServiceRequest as { required: string[]; additionalProperties: boolean; properties: Record<string, JsonSchema> };
  assert.equal(request.additionalProperties, false);
  assert.ok(request.required.includes('status') && !request.required.includes('priority'));
  assert.deepEqual(request.properties.status, { $ref: '#/components/schemas/RequestStatus' });
  assert.deepEqual(request.properties.attachments, { type: 'array', items: { $ref: '#/components/schemas/Attachment' } });
  assert.equal((schemas.RequestStatus as { enum: string[] }).enum.length, 7);
  const location = schemas.GeoLocation as { properties: Record<string, JsonSchema> };
  assert.equal(location.properties.latitude?.type, 'string', 'decimal keeps its precision');
  assert.equal(location.properties.address?.['x-foundation-sensitive'], true);
  assert.ok(schemas.Problem);
});

test('the domain stays distinct from platform capabilities (E5 gate)', () => {
  const documents = loadAsteria();
  const digests = [planOf(documents, {}), planOf(documents, { catalog: EMPTY_CATALOG }), planOf(documents)].map((result) => only(result).digest);
  assert.equal(new Set(digests).size, 1, 'the contract does not depend on which capability providers exist');
  const contract = only(planOf(documents));
  const text = JSON.stringify(contract.document);
  assert.ok(!text.includes('securitySchemes'), 'authorization is domain intent, not a security scheme');
  const submit = operations(contract).find(([, , operation]) => operation.operationId === 'submit-request')![2];
  assert.deepEqual((submit['x-foundation-authorization'] as { roles: string[] }).roles, ['requester']);
  for (const facet of ['offline-sync', 'scheduling', 'workflow']) assert.ok(!text.includes(`"${facet}"`), `facet ${facet} is not projected as a capability`);
  assert.ok(planOf(documents).plan!.unsupportedIntent.some((item) => item.code === 'IR_FACET_NOT_INTERPRETED'), 'facets stay listed');
});

test('one contract is shared: the provider and every consumer cite the same digest (E5 gate)', () => {
  const result = planOf(loadAsteria());
  const contract = only(result);
  assert.deepEqual(result.plan!.sharedContracts, [
    { id: contract.id, domain: 'DomainContract/asteria-service-requests@1', provider: 'authority-api', consumers: ['async-worker', 'field-mobile', 'ops-web', 'requester-web'], digest: contract.digest },
  ]);
  const step = result.plan!.steps.find((candidate) => candidate.action === 'MATERIALIZE' && candidate.component === 'authority-api');
  assert.ok(step && 'contracts' in step);
  assert.deepEqual(step.contracts, [contract.id]);
});

test('owner work lists every projected operation and the invariants the provider enforces', () => {
  const work = planOf(loadAsteria()).plan!.ownerWork;
  assert.equal(work.filter((item) => item.work === 'IMPLEMENT_OPERATION' && item.component === 'authority-api').length, 10);
  assert.deepEqual(work.filter((item) => item.work === 'ENFORCE_INVARIANT').map((item) => ('item' in item ? item.item.split('#')[1] : '')), ['INV-001', 'INV-002', 'INV-003', 'INV-004']);
});

test('the projection is deterministic and follows only the implemented operations and the domain content', () => {
  const documents = loadAsteria();
  const result = planOf(documents);
  assert.deepEqual(result.apiContracts, planOf([...documents].reverse()).apiContracts);
  const ir = result.ir!;
  const domain = ir.domains[0]!;
  const submit = domain.operations.find((operation) => operation.id === 'submit-request')!.ref;
  const unbound = { operationBindings: ir.operationBindings.map((binding) => (binding.item === submit ? { ...binding, implementedBy: [] } : binding)) };
  const narrowed = projectApiContract(domain, 'authority-api', unbound)!;
  assert.equal(narrowed.operations.length, 9, 'an operation nobody implements is not projected');
  assert.notEqual(narrowed.digest, only(result).digest);
  assert.equal(projectApiContract(domain, 'ops-web', ir), null, 'a component implementing nothing provides no contract');
  const renamed = { ...domain, boundedContext: 'requests' };
  assert.notEqual(projectApiContract(renamed, 'authority-api', ir)!.digest, only(result).digest, 'the domain content drives the digest');
});
