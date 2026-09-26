import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CanonicalJsonError,
  DIAGNOSTIC_CODES,
  FAILURE_CLASSES,
  canonicalize,
  contractDigest,
  deepFreeze,
  diagnostic,
  digestOf,
  formatRef,
  isDigest,
  parseDomainItemRef,
  parseRef,
  refKey,
  sortDiagnostics,
  type AnyContract,
} from '../src/index.ts';

test('canonical JSON is independent of key order and follows RFC 8785 number rules', () => {
  assert.equal(canonicalize({ b: 1, a: [true, null, 'x'] }), '{"a":[true,null,"x"],"b":1}');
  assert.equal(canonicalize({ a: { d: 1, c: 2 } }), canonicalize({ a: { c: 2, d: 1 } }));
  assert.equal(canonicalize(1e21), '1e+21');
  assert.equal(canonicalize(-0), '0');
  assert.equal(canonicalize(0.1 + 0.2), '0.30000000000000004');
  assert.equal(canonicalize('é '), JSON.stringify('é '));
  // Keys are sorted by UTF-16 code units, as JCS mandates.
  assert.equal(canonicalize({ 'é': 1, z: 2, A: 3 }), '{"A":3,"z":2,"é":1}');
});

test('canonical JSON rejects lossy values loudly instead of dropping them', () => {
  for (const value of [{ a: undefined }, [undefined], { n: Number.NaN }, { n: Infinity }, { d: new Date(0) }, { m: new Map() }, { f: () => 1 }, { b: 1n }]) {
    assert.throws(() => canonicalize(value), CanonicalJsonError);
  }
  assert.throws(() => canonicalize({ a: { 'x/y': [0, Number.NaN] } }), (error: CanonicalJsonError) => error.path === '/a/x~1y/1');
});

test('digests are stable sha256 over the canonical form', () => {
  const digest = digestOf({ b: 2, a: 1 });
  assert.equal(digest, digestOf({ a: 1, b: 2 }));
  assert.ok(isDigest(digest));
  // Reference vector: sha256('{"a":1,"b":2}').
  assert.equal(digest, 'sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777');
  assert.notEqual(digestOf({ a: 1, b: 3 }), digest);
});

test('the content digest ignores the lifecycle status only', () => {
  const document = {
    apiVersion: 'foundation.enistere.com/v1alpha1',
    kind: 'DecisionSet',
    metadata: { id: 'd', revision: 1, title: 't', status: 'ACCEPTED', provenance: { origin: 'HUMAN', actor: { type: 'HUMAN', id: 'h' } } },
    spec: { x: 1 },
  } as unknown as AnyContract;
  const superseded = structuredClone(document);
  superseded.metadata.status = 'SUPERSEDED';
  assert.equal(contractDigest(superseded), contractDigest(document));
  const retitled = structuredClone(document);
  retitled.metadata.title = 'other';
  assert.notEqual(contractDigest(retitled), contractDigest(document));
});

test('stable references round-trip and never express "latest"', () => {
  const ref = parseRef('SystemDefinition/asteria@2#async-worker');
  assert.deepEqual(ref, { kind: 'SystemDefinition', id: 'asteria', revision: 2, item: 'async-worker' });
  assert.equal(formatRef(ref!), 'SystemDefinition/asteria@2#async-worker');
  assert.equal(refKey(ref!), 'SystemDefinition/asteria@2');
  for (const text of ['SystemDefinition/asteria@latest', 'SystemDefinition/asteria', 'Unknown/x@1', 'SystemDefinition/Asteria@1', 'SystemDefinition/x@0']) {
    assert.equal(parseRef(text), null, text);
  }
  assert.deepEqual(parseDomainItemRef('asteria-service-requests#submit-request'), { contract: 'asteria-service-requests', item: 'submit-request' });
  assert.equal(parseDomainItemRef('#x'), null);
});

test('every diagnostic code maps to a failure class of document 03 and has a remediation', () => {
  for (const [code, spec] of Object.entries(DIAGNOSTIC_CODES)) {
    assert.ok((FAILURE_CLASSES as readonly string[]).includes(spec.class), code);
    assert.ok(spec.remediation.length > 10, code);
    assert.match(code, /^(CONTRACT|AUTHORITY|REF|REQUIREMENT|DECISION|CONTEXT|SYSTEM|DOMAIN|CHANGE|EVIDENCE|CATALOG|RESOLVE|FACADE|MANIFEST|ADAPTER|MATERIALIZE|VERIFY)_[A-Z_]+$/);
  }
  assert.throws(() => diagnostic('NOT_A_CODE' as never, 'x'));
});

test('diagnostics are frozen, deduplicated and deterministically ordered', () => {
  const a = diagnostic('REF_UNRESOLVED', 'm', { ref: 'B/x@1', path: '/a' });
  const b = diagnostic('CONTRACT_SCHEMA_VIOLATION', 'm', { ref: 'A/x@1', path: '/z' });
  const c = diagnostic('CONTRACT_SCHEMA_VIOLATION', 'm', { ref: 'A/x@1', path: '/b' });
  assert.ok(Object.isFrozen(a));
  assert.equal(a.class, 'INVALID_INPUT');
  assert.equal(a.retryable, false);
  assert.deepEqual(sortDiagnostics([a, b, c, a]), [c, b, a]);
  assert.deepEqual(sortDiagnostics([c, a, b]), sortDiagnostics([b, c, a]));
});

test('deepFreeze freezes nested structures', () => {
  const value = deepFreeze({ a: { b: [1, { c: 2 }] } });
  assert.ok(Object.isFrozen(value.a.b[1]));
  assert.throws(() => {
    (value.a.b as unknown[]).push(3);
  });
});
