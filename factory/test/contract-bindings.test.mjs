import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const SCHEMA = 'contracts/schemas/api-error-response.v1.schema.json';

function blueprint(slug, stack) {
  const value = createDefaultBlueprint(slug);
  value.stack = stack;
  value.capabilities = [];
  value.deployment = { environments: ['local'] };
  return value;
}

describe('neutral contract bindings', () => {
  let scratch;
  before(async () => { scratch = await mkdtemp(join(tmpdir(), 'enistere-contract-bindings-')); });
  after(async () => { if (scratch) await rm(scratch, { recursive: true, force: true }); });

  it('tracks every generated language binding against one schema digest', async () => {
    const raw = await readFile(join(REPO_ROOT, SCHEMA), 'utf8');
    const digest = createHash('sha256').update(raw).digest('hex');
    const paths = [
      'packages/api-contracts/src/generated/api-error-response.ts',
      'starters/spring/src/main/java/com/enistere/core/contracts/ApiErrorResponse.java',
      'starters/fastapi/app/contracts/api_error_response.py',
      'starters/flutter/lib/src/contracts/api_error_response.dart',
    ];
    for (const path of paths) {
      const content = await readFile(join(REPO_ROOT, path), 'utf8');
      assert.match(content, /GENERATED FROM contracts\/schemas\/api-error-response\.v1\.schema\.json/u);
      assert.ok(content.includes(digest), `${path} does not carry the schema digest`);
    }
  });

  it('classifies the full OpenAPI document as NestJS transport, not a neutral contract', async () => {
    const document = JSON.parse(await readFile(
      join(REPO_ROOT, 'packages/api-contracts/contract/openapi.json'),
      'utf8',
    ));
    assert.match(document.info.title, /NestJS/u);
    assert.match(document.info.description, /contracts\//u);
    assert.doesNotMatch(JSON.stringify(document.info), /canonique/u);
    assert.doesNotMatch(JSON.stringify(document), /api-nestjs-core/u);
    assert.equal(
      document.components.schemas.ApiErrorResponseDto.$ref,
      './generated/api-error-response.v1.openapi.json',
    );
  });

  it('delivers and consumes the idiomatic binding in representative derived projects', async () => {
    const springDir = join(scratch, 'spring');
    const springPlan = await generateProject(
      blueprint('contracts-spring', { api: 'spring', web: null, mobile: null }),
      springDir,
    );
    const spring = springPlan.applications.find((application) => application.runtime === 'spring');
    const javaRoot = spring.identity.maven.packageName.replaceAll('.', '/');
    assert.match(
      await readFile(join(springDir, `apps/api/src/main/java/${javaRoot}/contracts/ApiErrorResponse.java`), 'utf8'),
      /record ApiErrorResponse/u,
    );
    assert.match(
      await readFile(join(springDir, `apps/api/src/main/java/${javaRoot}/common/exception/GlobalExceptionHandler.java`), 'utf8'),
      /ApiErrorResponse\.create/u,
    );

    const fastapiDir = join(scratch, 'fastapi');
    await generateProject(
      blueprint('contracts-fastapi', { api: 'fastapi', web: null, mobile: null }),
      fastapiDir,
    );
    assert.match(
      await readFile(join(fastapiDir, 'apps/api/app/contracts/api_error_response.py'), 'utf8'),
      /class ApiErrorResponse/u,
    );
    assert.match(
      await readFile(join(fastapiDir, 'apps/api/app/main.py'), 'utf8'),
      /ApiErrorResponse\.create/u,
    );

    const flutterDir = join(scratch, 'flutter');
    await generateProject(
      blueprint('contracts-flutter', { api: 'nestjs', web: 'nextjs', mobile: 'flutter' }),
      flutterDir,
    );
    assert.match(
      await readFile(join(flutterDir, 'apps/mobile/lib/src/contracts/api_error_response.dart'), 'utf8'),
      /class ApiErrorResponse/u,
    );
    assert.match(
      await readFile(join(flutterDir, 'apps/mobile/lib/src/core/platform/runtime_contract.dart'), 'utf8'),
      /ApiErrorResponse\.tryParse/u,
    );
    assert.match(
      await readFile(join(flutterDir, 'packages/api-contracts/src/index.ts'), 'utf8'),
      /generated\/api-error-response/u,
    );
  });
});
