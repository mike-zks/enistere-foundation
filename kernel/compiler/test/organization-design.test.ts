import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  deriveEffectiveRules,
  pinnedRef,
  type AnyContract,
  type ContractRef,
  type DesignSystem,
  type DomainContract,
  type EffectiveOrganizationContext,
  type SystemDefinition,
} from '@enistere/foundation-kernel-contracts';

import { createKernelFacade, expiredWaivers, type PlanResult } from '../src/index.ts';

const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));

function loadAsteria(): AnyContract[] {
  return ['contracts/', 'evidence/'].flatMap((directory) =>
    readdirSync(`${GOLDEN}${directory}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as AnyContract),
  );
}
const catalog = (): unknown => JSON.parse(readFileSync(`${GOLDEN}sources/catalog.json`, 'utf8'));
const planOf = (documents: readonly unknown[]): PlanResult => createKernelFacade().plan(documents, { catalog: catalog() });
const codes = (result: PlanResult): string[] => [...new Set(result.diagnostics.filter((item) => item.severity === 'error').map((item) => item.code))];

/**
 * The compiled closure only (A1, A2, A3, A4 in force, A5, A9), without history:
 * a modified input stays a closed set once the definition is re-pinned.
 */
function compiledSet(edit: { context?: (context: EffectiveOrganizationContext) => void; design?: (design: DesignSystem) => void; domain?: (domain: DomainContract) => void; definition?: (definition: SystemDefinition) => void } = {}): AnyContract[] {
  const documents = loadAsteria();
  const find = <T extends AnyContract>(kind: T['kind'], revision?: number): T =>
    structuredClone(documents.find((document) => document.kind === kind && (revision === undefined || document.metadata.revision === revision))) as T;
  const context = find<EffectiveOrganizationContext>('EffectiveOrganizationContext');
  const design = find<DesignSystem>('DesignSystem');
  const domain = find<DomainContract>('DomainContract');
  const definition = find<SystemDefinition>('SystemDefinition', 2);
  edit.context?.(context);
  context.spec.effective = deriveEffectiveRules(context.spec.layers, context.spec.waivers).effective as EffectiveOrganizationContext['spec']['effective'];
  edit.design?.(design);
  edit.domain?.(domain);
  const repin = (ref: ContractRef, target: AnyContract): ContractRef => (ref.id === target.metadata.id && ref.kind === target.kind ? pinnedRef(target) : ref);
  definition.spec.inputs.organizationContext = pinnedRef(context);
  definition.spec.inputs.domainContracts = definition.spec.inputs.domainContracts.map((ref) => repin(ref, domain));
  definition.metadata.provenance.derivedFrom = definition.metadata.provenance.derivedFrom?.map((ref) => repin(ref, domain));
  for (const component of definition.spec.components) if (component.experience?.designSystem) component.experience.designSystem = pinnedRef(design);
  delete definition.metadata.supersedes;
  edit.definition?.(definition);
  const others = documents.filter((document) => ['RequirementBaseline', 'DecisionSet'].includes(document.kind));
  return [...others, context, design, domain, definition];
}

test('the golden policies: satisfied, waived by W-001, not applicable, not evaluated — never ignored', () => {
  const result = planOf(loadAsteria());
  const outcome = (rule: string, subject: string | null) => result.policy!.evaluations.find((item) => item.rule === rule && item.subject === subject)?.outcome;
  assert.equal(outcome('runtime.api.allowed', 'authority-api'), 'SATISFIED');
  assert.equal(outcome('security.identity.provider', 'enistere-oidc'), 'SATISFIED', 'the locked organization provider wins over the client');
  assert.equal(outcome('data.residency', 'production'), 'SATISFIED');
  assert.equal(outcome('data.residency', 'staging'), 'WAIVED');
  assert.equal(outcome('data.residency', 'local'), 'NOT_APPLICABLE');
  assert.equal(outcome('quality.accessibility.level', 'requester-web'), 'SATISFIED');
  for (const rule of ['ai.decide.allowed', 'deployment.image.reference', 'evidence.retention.days']) assert.equal(outcome(rule, null), 'NOT_EVALUATED', rule);
  const waived = result.policy!.evaluations.find((item) => item.outcome === 'WAIVED')!;
  assert.deepEqual(waived.waiver, { id: 'W-001', expiresAt: '2027-03-31T23:59:59Z' });
  assert.deepEqual(result.plan!.policy, result.policy, 'the plan carries the policy report (covered by its digest)');
});

test('a policy blocks: without its waiver, the staging region violates data residency (E6 gate)', () => {
  const blocked = planOf(compiledSet({ context: (context) => (context.spec.waivers = []) }));
  assert.equal(blocked.status, 'INVALID');
  assert.equal(blocked.plan, null, 'no plan is produced');
  assert.deepEqual(codes(blocked), ['POLICY_VIOLATION']);
  assert.equal(blocked.policy!.evaluations.find((item) => item.subject === 'staging')?.outcome, 'VIOLATED', 'the report stays visible');
  assert.equal(planOf(compiledSet()).status, 'PARTIAL', 'the same set with its waiver compiles');
});

test('a disallowed runtime, a foreign identity provider or a weaker design system are violations', () => {
  const runtime = planOf(compiledSet({ context: (context) => (context.spec.layers[0]!.rules.find((rule) => rule.id === 'runtime.api.allowed')!.value = ['spring']) }));
  assert.ok(runtime.policy!.evaluations.some((item) => item.rule === 'runtime.api.allowed' && item.outcome === 'VIOLATED'));
  const identity = planOf(compiledSet({ definition: (definition) => (definition.spec.integrations.find((integration) => integration.kind === 'oidc-provider')!.provider = 'client-directory') }));
  assert.deepEqual(codes(identity), ['POLICY_VIOLATION']);
  const accessibility = planOf(compiledSet({ design: (design) => (design.spec.accessibility.level = 'A') }));
  assert.equal(accessibility.policy!.evaluations.filter((item) => item.rule === 'quality.accessibility.level' && item.outcome === 'VIOLATED').length, 3);
});

test('an expired waiver is refused when the plan is applied, not when it is compiled', () => {
  const result = planOf(loadAsteria());
  assert.deepEqual(expiredWaivers(result.policy, '2026-09-26T12:00:00Z'), []);
  assert.deepEqual(expiredWaivers(result.policy, '2027-04-01T00:00:00Z').map((item) => item.waiver?.id), ['W-001']);
});

test('design bindings resolve each surface context from the pinned design system', () => {
  const result = planOf(loadAsteria());
  const bindings = result.ir!.designBindings;
  assert.deepEqual(bindings.map((binding) => [binding.component, binding.context]), [
    ['field-mobile', 'field'],
    ['ops-web', 'back-office'],
    ['requester-web', 'public-portal'],
  ]);
  assert.equal(bindings.find((binding) => binding.component === 'requester-web')!.tokens['font.size.body']?.value, '18px');
  assert.deepEqual(result.plan!.designBindings.map((binding) => binding.digest), bindings.map((binding) => binding.digest));
});

test('theme ≠ domain: a token change moves only the bindings; a domain change moves no binding (E6 gate)', () => {
  const base = planOf(compiledSet());
  const retheme = planOf(compiledSet({ design: (design) => ((design.spec.tokens.color as { brand: { primary: { $value: string } } }).brand.primary.$value = '#223344') }));
  assert.notDeepEqual(retheme.ir!.designBindings.map((binding) => binding.digest), base.ir!.designBindings.map((binding) => binding.digest));
  assert.deepEqual(retheme.ir!.domains.map((domain) => domain.digest), base.ir!.domains.map((domain) => domain.digest));
  assert.deepEqual(retheme.apiContracts.map((contract) => contract.digest), base.apiContracts.map((contract) => contract.digest));

  const redomain = planOf(compiledSet({ domain: (domain) => (domain.spec.operations[0]!.summary = `${domain.spec.operations[0]!.summary} Revised.`) }));
  assert.notDeepEqual(redomain.ir!.domains.map((domain) => domain.digest), base.ir!.domains.map((domain) => domain.digest));
  assert.deepEqual(redomain.ir!.designBindings.map((binding) => binding.digest), base.ir!.designBindings.map((binding) => binding.digest));
});
