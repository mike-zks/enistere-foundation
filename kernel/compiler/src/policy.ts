/**
 * Policy evaluation — applies the Effective Organization Context (A3) to a
 * compilation (mission E6, ADR-100).
 *
 * The kernel interprets a closed catalog of rules, each bound to what it
 * constrains in the System IR and the resolution:
 *
 * - `runtime.<family>.allowed` — the resolved runtime of every component whose
 *   kind starts with `<family>-` (api-service → `runtime.api.allowed`);
 * - `security.identity.provider` — the provider of every `oidc-provider`
 *   integration;
 * - `data.residency` — the region of every environment that declares one (a
 *   region matches a value or extends it: `eu` covers `eu-west`);
 * - `quality.accessibility.level` — the WCAG 2.2 level guaranteed by the Design
 *   System of every surface (A < AA < AAA).
 *
 * Every other rule is listed NOT_EVALUATED, never ignored. A subject that
 * satisfies the effective value only thanks to a waiver is WAIVED (the waiver
 * and its expiry are reported); one that does not satisfy it is VIOLATED and
 * blocks the compilation (POLICY_VIOLATION). The evaluation is timeless:
 * waiver expiry is checked when a plan is applied (MATERIALIZE), at an
 * injected instant.
 */

import { diagnostic, digestOf, documentRef, type Diagnostic, type Digest, type EffectiveOrganizationContext, type EffectiveRule } from '@enistere/foundation-kernel-contracts';

import type { SystemIR } from './ir.ts';
import type { ResolvedSystem } from './resolve.ts';

export type PolicyOutcome = 'SATISFIED' | 'WAIVED' | 'VIOLATED' | 'NOT_APPLICABLE' | 'NOT_EVALUATED';

export interface PolicyEvaluation {
  rule: string;
  category: string;
  subject: string | null;
  outcome: PolicyOutcome;
  expected: unknown;
  actual: unknown;
  waiver: { id: string; expiresAt: string } | null;
  reason: string | null;
}

export interface PolicyReport {
  context: string;
  evaluations: PolicyEvaluation[];
  digest: Digest;
}

interface Subject {
  subject: string;
  actual: unknown;
  /** null when the rule does not apply to this subject. */
  check: ((value: unknown) => boolean) | null;
  reason?: string;
}

type Evaluator = (rule: string, ir: SystemIR, resolved: ResolvedSystem) => Subject[] | null;

const values = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);
const LEVELS = ['A', 'AA', 'AAA'];

/** The closed catalog: rule id pattern → subjects and their check. */
const CATALOG: readonly { pattern: RegExp; evaluate: Evaluator }[] = [
  {
    pattern: /^runtime\.([a-z0-9]+)\.allowed$/,
    evaluate: (rule, ir, resolved) => {
      const family = /^runtime\.([a-z0-9]+)\.allowed$/.exec(rule)?.[1] as string;
      return ir.components
        .filter((component) => component.kind.startsWith(`${family}-`))
        .map((component) => {
          const runtime = resolved.components.find((candidate) => candidate.id === component.id)?.runtime ?? null;
          return runtime === null
            ? { subject: component.id, actual: null, check: null, reason: 'no runtime is resolved for this component' }
            : { subject: component.id, actual: runtime, check: (value) => values(value).includes(runtime) };
        });
    },
  },
  {
    pattern: /^security\.identity\.provider$/,
    evaluate: (_rule, ir) =>
      ir.integrations
        .filter((integration) => integration.kind === 'oidc-provider')
        .map((integration) => ({ subject: integration.id, actual: integration.provider, check: (value) => integration.provider !== null && values(value).includes(integration.provider) })),
  },
  {
    pattern: /^data\.residency$/,
    evaluate: (_rule, ir) =>
      ir.environments.map((environment) => {
        const region = environment.region;
        return region === null
          ? { subject: environment.id, actual: null, check: null, reason: 'the environment declares no region' }
          : { subject: environment.id, actual: region, check: (value) => values(value).some((allowed) => typeof allowed === 'string' && (region === allowed || region.startsWith(`${allowed}-`))) };
      }),
  },
  {
    pattern: /^quality\.accessibility\.level$/,
    evaluate: (_rule, ir) =>
      ir.designBindings.map((binding) => {
        const actual = `${binding.accessibility.standard}-${binding.accessibility.level}`;
        return {
          subject: binding.component,
          actual,
          check: (value) => {
            const required = typeof value === 'string' ? /^WCAG-2\.2-(A|AA|AAA)$/.exec(value)?.[1] : undefined;
            return required !== undefined && binding.accessibility.standard === 'WCAG-2.2' && LEVELS.indexOf(binding.accessibility.level) >= LEVELS.indexOf(required);
          },
        };
      }),
  },
];

/** The value a rule had before its waiver, when the waiver decided it. */
function beforeWaiver(rule: EffectiveRule): { value: unknown } | null {
  if (rule.source.type !== 'WAIVER') return null;
  const layers = rule.trace.filter((entry) => entry.from === 'LAYER' && entry.outcome !== 'REFUSED_LOCKED');
  const last = layers.at(-1);
  return last ? { value: last.value } : null;
}

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export function evaluatePolicies(context: EffectiveOrganizationContext, ir: SystemIR, resolved: ResolvedSystem): { report: PolicyReport; diagnostics: Diagnostic[] } {
  const ref = documentRef(context);
  const evaluations: PolicyEvaluation[] = [];
  const found: Diagnostic[] = [];
  for (const rule of context.spec.effective) {
    const entry = CATALOG.find((candidate) => candidate.pattern.test(rule.rule));
    const base = { rule: rule.rule, category: rule.category, expected: rule.value };
    if (!entry) {
      evaluations.push({ ...base, subject: null, outcome: 'NOT_EVALUATED', actual: null, waiver: null, reason: 'the compiler does not interpret this rule' });
      found.push(diagnostic('POLICY_NOT_EVALUATED', `rule '${rule.rule}' is not evaluated by the compiler`, { layer: 'kernel.compiler', ref, details: { rule: rule.rule } }));
      continue;
    }
    const waiver = rule.source.type === 'WAIVER' ? context.spec.waivers.find((candidate) => candidate.id === rule.source.id) : undefined;
    const previous = beforeWaiver(rule);
    for (const subject of entry.evaluate(rule.rule, ir, resolved) ?? []) {
      if (subject.check === null) {
        evaluations.push({ ...base, subject: subject.subject, outcome: 'NOT_APPLICABLE', actual: subject.actual, waiver: null, reason: subject.reason ?? null });
        continue;
      }
      if (!subject.check(rule.value)) {
        evaluations.push({ ...base, subject: subject.subject, outcome: 'VIOLATED', actual: subject.actual, waiver: null, reason: null });
        found.push(
          diagnostic('POLICY_VIOLATION', `'${subject.subject}' violates rule '${rule.rule}': ${JSON.stringify(subject.actual)} is not allowed by ${JSON.stringify(rule.value)}`, {
            layer: 'kernel.compiler',
            ref,
            details: { rule: rule.rule, subject: subject.subject, actual: subject.actual as never, expected: rule.value as never },
          }),
        );
        continue;
      }
      const waived = waiver !== undefined && previous !== null && !subject.check(previous.value);
      evaluations.push({
        ...base,
        subject: subject.subject,
        outcome: waived ? 'WAIVED' : 'SATISFIED',
        actual: subject.actual,
        waiver: waived ? { id: waiver.id, expiresAt: waiver.expiresAt } : null,
        reason: waived ? waiver.reason : null,
      });
    }
  }
  evaluations.sort((a, b) => byText(a.rule, b.rule) || byText(a.subject ?? '', b.subject ?? ''));
  const content = { context: ref, evaluations };
  return { report: { ...content, digest: digestOf(content as never) }, diagnostics: found };
}

/** Waivers a plan relies on that have expired at `at` (checked before any write). */
export function expiredWaivers(report: PolicyReport | null, at: string): PolicyEvaluation[] {
  if (!report) return [];
  const instant = Date.parse(at);
  return report.evaluations.filter((evaluation) => evaluation.outcome === 'WAIVED' && evaluation.waiver !== null && Date.parse(evaluation.waiver.expiresAt) < instant);
}
