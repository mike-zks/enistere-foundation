/**
 * NestJS files derived from a shared API contract (mission E5, ADR-099).
 *
 * The adapter never reads the Domain IR to generate code: it embeds the
 * OpenAPI document projected by the kernel as is, and derives from that
 * document the TypeScript types, the handler interface, the controller (input
 * validated against the contract's own schemas with Ajv) and the
 * owner-seeded handler implementation that answers 501 until the team writes
 * the business logic. Authorization and files stay platform capabilities:
 * nothing here simulates them.
 */

import type { ApiContract, JsonSchema } from '@enistere/foundation-kernel-compiler';
import type { Artifact } from '@enistere/foundation-kernel-extensions';

type Operation = JsonSchema & {
  operationId: string;
  'x-foundation-kind': string;
  'x-foundation-invariants': string[];
  'x-foundation-authorization': { intent: string; roles: string[] };
  requestBody?: { content: { 'application/json': { schema: JsonSchema } } };
  responses: Record<string, { content?: Record<string, { schema: JsonSchema }> }>;
};

export interface ProjectedOperation {
  id: string;
  method: 'get' | 'post';
  path: string;
  pointer: string;
  input: JsonSchema | null;
  output: JsonSchema | null;
  kind: string;
  roles: string[];
  invariants: string[];
}

const lines = (...content: string[]): string => `${content.join('\n')}\n`;
const words = (id: string): string[] => id.split(/[-_.]/).filter(Boolean);
export const pascal = (id: string): string => words(id).map((word) => word[0]!.toUpperCase() + word.slice(1)).join('');
export const camel = (id: string): string => pascal(id).replace(/^./, (first) => first.toLowerCase());
const constant = (id: string): string => words(id).map((word) => word.toUpperCase()).join('_');
const pointerEscape = (segment: string): string => segment.replace(/~/g, '~0').replace(/\//g, '~1');
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const property = (name: string): string => (IDENTIFIER.test(name) ? name : JSON.stringify(name));

export function contractFile(contract: ApiContract): string {
  return `contract/${contract.boundedContext}.openapi.json`;
}

export function operationsOf(contract: ApiContract): ProjectedOperation[] {
  const paths = contract.document.paths as Record<string, Record<string, Operation>>;
  return Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      id: operation.operationId,
      method: method as 'get' | 'post',
      path,
      pointer: `/paths/${pointerEscape(path)}/${method}/requestBody/content/application~1json/schema`,
      input: operation.requestBody?.content['application/json'].schema ?? null,
      output: operation.responses['200']?.content?.['application/json']?.schema ?? null,
      kind: operation['x-foundation-kind'],
      roles: operation['x-foundation-authorization'].roles,
      invariants: operation['x-foundation-invariants'],
    })),
  );
}

/** The TypeScript type of a contract schema (refs name the generated types). */
export function tsType(schema: JsonSchema): string {
  if (typeof schema.$ref === 'string') return schema.$ref.split('/').at(-1) as string;
  if (Array.isArray(schema.enum)) return (schema.enum as string[]).map((value) => JSON.stringify(value)).join(' | ');
  switch (schema.type) {
    case 'array':
      return `${tsType(schema.items as JsonSchema)}[]`;
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    default:
      return 'unknown';
  }
}

function typesFile(contract: ApiContract): string {
  const schemas = (contract.document.components as { schemas: Record<string, JsonSchema> }).schemas;
  const declarations = Object.entries(schemas).map(([name, schema]) => {
    if (Array.isArray(schema.enum)) return `export type ${name} = ${tsType(schema)};`;
    const required = new Set((schema.required as string[] | undefined) ?? []);
    const fields = Object.entries((schema.properties as Record<string, JsonSchema> | undefined) ?? {}).map(
      ([field, value]) => `  ${property(field)}${required.has(field) ? '' : '?'}: ${tsType(value)};`,
    );
    return [`export interface ${name} {`, ...fields, '}'].join('\n');
  });
  return lines(`// Derived from ${contractFile(contract)} (compiler-owned). Do not edit: change the Domain Contract.`, '', declarations.join('\n\n'));
}

function referencedTypes(operations: readonly ProjectedOperation[]): string[] {
  const names = new Set<string>();
  const collect = (schema: JsonSchema | null): void => {
    if (!schema) return;
    if (typeof schema.$ref === 'string') names.add(schema.$ref.split('/').at(-1) as string);
    if (schema.items) collect(schema.items as JsonSchema);
  };
  for (const operation of operations) {
    collect(operation.input);
    collect(operation.output);
  }
  return [...names].sort();
}

const signature = (operation: ProjectedOperation): string =>
  `${camel(operation.id)}(${operation.input ? `input: ${tsType(operation.input)}` : ''}): Promise<${operation.output ? tsType(operation.output) : 'void'}>`;

function handlersFile(contract: ApiContract, operations: readonly ProjectedOperation[]): string {
  const name = pascal(contract.boundedContext);
  const types = referencedTypes(operations);
  return lines(
    `// Derived from ${contractFile(contract)} (compiler-owned). Implement it in src/extension/${contract.boundedContext}.handlers.ts.`,
    ...(types.length > 0 ? [`import type { ${types.join(', ')} } from './types.js';`] : []),
    '',
    `export const ${constant(contract.boundedContext)}_HANDLERS = Symbol('${contract.id}');`,
    '',
    "export { DomainError } from '../../contract/domain-error.js';",
    '',
    `export interface ${name}Handlers {`,
    ...operations.map((operation) => `  ${signature(operation)};`),
    '}',
  );
}

function controllerFile(contract: ApiContract, operations: readonly ProjectedOperation[]): string {
  const name = pascal(contract.boundedContext);
  const token = `${constant(contract.boundedContext)}_HANDLERS`;
  const types = referencedTypes(operations);
  const methods = operations.flatMap((operation) => {
    const route = operation.path.split('/').at(-1) as string;
    const decorator = operation.method === 'get' ? `@Get('${route}')` : `@Post('${route}')`;
    const output = operation.output ? tsType(operation.output) : 'void';
    const call = operation.input
      ? `this.handlers.${camel(operation.id)}(validateInput<${tsType(operation.input)}>(CONTRACT, '${operation.pointer}', body))`
      : `this.handlers.${camel(operation.id)}()`;
    return [
      `  ${decorator}`,
      ...(operation.method === 'post' ? ['  @HttpCode(200)'] : []),
      `  ${camel(operation.id)}(${operation.input ? '@Body() body: unknown' : ''}): Promise<${output}> {`,
      `    return ${call};`,
      '  }',
      '',
    ];
  });
  methods.pop();
  return lines(
    `// Derived from ${contractFile(contract)} (compiler-owned).`,
    `import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';`,
    "import { validateInput } from '../../contract/validation.js';",
    `import { ${token}, type ${name}Handlers } from './handlers.js';`,
    ...(types.length > 0 ? [`import type { ${types.join(', ')} } from './types.js';`] : []),
    '',
    `const CONTRACT = '${contract.boundedContext}';`,
    '',
    `@Controller('${contract.boundedContext}')`,
    `export class ${name}Controller {`,
    `  constructor(@Inject(${token}) private readonly handlers: ${name}Handlers) {}`,
    '',
    ...methods,
    '}',
  );
}

function moduleFile(contract: ApiContract): string {
  const name = pascal(contract.boundedContext);
  const token = `${constant(contract.boundedContext)}_HANDLERS`;
  return lines(
    `// Compiler-owned: binds the ${contract.boundedContext} controller to the owner's handlers.`,
    "import { Module } from '@nestjs/common';",
    "import { ExtensionModule } from '../../extension/extension.module.js';",
    `import { ${name}HandlersImpl } from '../../extension/${contract.boundedContext}.handlers.js';`,
    `import { ${name}Controller } from './${contract.boundedContext}.controller.js';`,
    `import { ${token} } from './handlers.js';`,
    '',
    '@Module({',
    '  imports: [ExtensionModule],',
    `  controllers: [${name}Controller],`,
    `  providers: [{ provide: ${token}, useClass: ${name}HandlersImpl }],`,
    '})',
    `export class ${name}Module {}`,
  );
}

function seededHandlers(contract: ApiContract, operations: readonly ProjectedOperation[]): string {
  const name = pascal(contract.boundedContext);
  const types = referencedTypes(operations);
  const methods = operations.flatMap((operation) => [
    `  // ${operation.id} (${operation.kind}) — roles: ${operation.roles.join(', ') || 'none'}${operation.invariants.length > 0 ? `; invariants: ${operation.invariants.map((ref) => ref.split('#')[1]).join(', ')}` : ''}`,
    `  async ${signature(operation).replace(/\(input: /, '(_input: ')} {`,
    `    throw new NotImplementedException('${operation.id} is not implemented yet (owner work).');`,
    '  }',
    '',
  ]);
  methods.pop();
  return lines(
    '// Owner-managed: seeded once by Enistere Foundation, never overwritten.',
    `// Implement each operation of ${contractFile(contract)}. Throw DomainError(code) for a declared`,
    '// domain error (422). Authorization and files are platform capabilities: do not simulate them here.',
    "import { Injectable, NotImplementedException } from '@nestjs/common';",
    `import type { ${name}Handlers } from '../domain/${contract.boundedContext}/handlers.js';`,
    ...(types.length > 0 ? [`import type { ${types.join(', ')} } from '../domain/${contract.boundedContext}/types.js';`] : []),
    '',
    '@Injectable()',
    `export class ${name}HandlersImpl implements ${name}Handlers {`,
    ...methods,
    '}',
  );
}

const VALIDATION = lines(
  '// Compiler-owned: validates inputs against the shared API contracts in contract/.',
  "import { readFileSync } from 'node:fs';",
  "import { BadRequestException } from '@nestjs/common';",
  "import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';",
  '',
  '// Formats are enforced by the patterns the contract carries; extension keywords are ignored.',
  'const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });',
  'const loaded = new Set<string>();',
  'const validators = new Map<string, ValidateFunction>();',
  '',
  'export function contractDocument(name: string): unknown {',
  "  return JSON.parse(readFileSync(new URL(`../../contract/${name}.openapi.json`, import.meta.url), 'utf8')) as unknown;",
  '}',
  '',
  'export function validateInput<T>(contract: string, pointer: string, body: unknown): T {',
  '  if (!loaded.has(contract)) {',
  '    ajv.addSchema(contractDocument(contract) as object, contract);',
  '    loaded.add(contract);',
  '  }',
  '  const key = `${contract}#${pointer}`;',
  '  let validate = validators.get(key);',
  '  if (!validate) {',
  '    validate = ajv.compile({ $ref: key });',
  '    validators.set(key, validate);',
  '  }',
  '  if (!validate(body)) {',
  "    throw new BadRequestException({ title: 'Bad Request', detail: 'The input does not match the contract.', errors: (validate.errors ?? []).map((error) => ({ path: error.instancePath, message: error.message })) });",
  '  }',
  '  return body as T;',
  '}',
);

const DOMAIN_ERROR = lines(
  '// Compiler-owned: a declared domain error of the contract, answered 422 with its code.',
  'export class DomainError extends Error {',
  '  constructor(',
  '    readonly code: string,',
  '    detail?: string,',
  '  ) {',
  '    super(detail ?? code);',
  '  }',
  '}',
);

const PROBLEM_FILTER = lines(
  '// Compiler-owned: every error is answered as Problem Details (RFC 9457), without internals.',
  "import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';",
  "import { DomainError } from './domain-error.js';",
  '',
  'interface HttpResponse {',
  '  status(code: number): HttpResponse;',
  '  type(contentType: string): HttpResponse;',
  '  send(body: string): void;',
  '}',
  '',
  'const TITLES: Record<number, string> = { 400: \'Bad Request\', 404: \'Not Found\', 422: \'Unprocessable Content\', 500: \'Internal Server Error\', 501: \'Not Implemented\' };',
  '',
  '@Catch()',
  'export class ProblemFilter implements ExceptionFilter {',
  '  catch(exception: unknown, host: ArgumentsHost): void {',
  '    const response = host.switchToHttp().getResponse<HttpResponse>();',
  '    let problem: Record<string, unknown> = { status: 500, title: TITLES[500] };',
  '    if (exception instanceof DomainError) {',
  '      problem = { status: 422, title: TITLES[422], code: exception.code, detail: exception.message };',
  '    } else if (exception instanceof HttpException) {',
  '      const status = exception.getStatus();',
  '      const body = exception.getResponse();',
  "      const extra = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : { detail: String(body) };",
  "      problem = { status, title: TITLES[status] ?? 'Error', ...(typeof extra.detail === 'string' ? { detail: extra.detail } : typeof extra.message === 'string' ? { detail: extra.message } : {}), ...(Array.isArray(extra.errors) ? { errors: extra.errors } : {}) };",
  '    }',
  "    response.status(problem.status as number).type('application/problem+json').send(JSON.stringify({ type: 'about:blank', ...problem }));",
  '  }',
  '}',
);

function contractsController(contracts: readonly ApiContract[]): string {
  return lines(
    '// Compiler-owned: serves the shared API contracts this service provides.',
    "import { Controller, Get } from '@nestjs/common';",
    "import { contractDocument } from './validation.js';",
    '',
    "@Controller('contracts')",
    'export class ContractsController {',
    ...contracts.flatMap((contract, index) => [
      ...(index > 0 ? [''] : []),
      `  @Get('${contract.boundedContext}.openapi.json')`,
      `  ${camel(contract.boundedContext)}(): unknown {`,
      `    return contractDocument('${contract.boundedContext}');`,
      '  }',
    ]),
    '}',
  );
}

/** Self-check run by the TOOLCHAIN check `contract`, against the built service. */
export const CONTRACT_CHECK = lines(
  '// Compiler-owned: checks the running service against its shared API contracts.',
  '// GET of each contract = 200 and identical; an input that does not match the contract = 400;',
  '// an operation without input answers 501 while the owner has not implemented it.',
  "import { spawn } from 'node:child_process';",
  "import { existsSync, readdirSync, readFileSync } from 'node:fs';",
  "import { createServer } from 'node:net';",
  "import { isDeepStrictEqual } from 'node:util';",
  '',
  'const port = await new Promise((resolve, reject) => {',
  '  const server = createServer();',
  "  server.once('error', reject);",
  "  server.listen(0, '127.0.0.1', () => {",
  '    const { port: free } = server.address();',
  '    server.close(() => resolve(free));',
  '  });',
  '});',
  "const files = existsSync('contract') ? readdirSync('contract').filter((name) => name.endsWith('.openapi.json')).sort() : [];",
  'if (files.length === 0) {',
  "  console.log('no shared API contract to check');",
  '  process.exit(0);',
  '}',
  "const child = spawn(process.execPath, ['dist/main.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });",
  'const base = `http://127.0.0.1:${port}`;',
  'const failures = [];',
  'let checked = 0;',
  'try {',
  '  const deadline = Date.now() + 30_000;',
  '  for (;;) {',
  "    if (Date.now() > deadline) throw new Error('the service did not start');",
  '    try {',
  '      if ((await fetch(`${base}/health`)).status === 200) break;',
  '    } catch {}',
  '    await new Promise((wait) => setTimeout(wait, 250));',
  '  }',
  '  for (const file of files) {',
  "    const document = JSON.parse(readFileSync(`contract/${file}`, 'utf8'));",
  '    const served = await fetch(`${base}/contracts/${file}`);',
  '    checked += 1;',
  '    if (served.status !== 200 || !isDeepStrictEqual(await served.json(), document)) failures.push(`GET /contracts/${file}: not served as committed`);',
  '    for (const [path, methods] of Object.entries(document.paths)) {',
  '      for (const [method, operation] of Object.entries(methods)) {',
  "        const invalid = { 'x-foundation-probe': true };",
  '        const response = operation.requestBody',
  "          ? await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(invalid) })",
  '          : await fetch(`${base}${path}`, { method: method.toUpperCase() });',
  '        const expected = operation.requestBody ? 400 : 501;',
  '        checked += 1;',
  "        const type = response.headers.get('content-type') ?? '';",
  "        if (response.status !== expected || !type.startsWith('application/problem+json')) failures.push(`${method.toUpperCase()} ${path}: ${response.status} ${type}, expected ${expected} problem+json`);",
  '      }',
  '    }',
  '  }',
  '} finally {',
  "  child.kill('SIGTERM');",
  '}',
  'if (failures.length > 0) {',
  "  console.error(failures.join('\\n'));",
  '  process.exit(1);',
  '}',
  'console.log(`${checked} contract checks passed`);',
);

/** Every artifact derived from the contracts the component provides. */
export function contractArtifacts(contracts: readonly ApiContract[]): Artifact[] {
  if (contracts.length === 0) return [];
  const artifacts: Artifact[] = [
    { path: 'src/contract/domain-error.ts', content: DOMAIN_ERROR, ownership: 'COMPILER_OWNED' },
    { path: 'src/contract/validation.ts', content: VALIDATION, ownership: 'COMPILER_OWNED' },
    { path: 'src/contract/problem.filter.ts', content: PROBLEM_FILTER, ownership: 'COMPILER_OWNED' },
    { path: 'src/contract/contracts.controller.ts', content: contractsController(contracts), ownership: 'COMPILER_OWNED' },
  ];
  for (const contract of contracts) {
    const operations = operationsOf(contract);
    const directory = `src/domain/${contract.boundedContext}`;
    artifacts.push(
      { path: contractFile(contract), content: `${JSON.stringify(contract.document, null, 2)}\n`, ownership: 'COMPILER_OWNED' },
      { path: `${directory}/types.ts`, content: typesFile(contract), ownership: 'COMPILER_OWNED' },
      { path: `${directory}/handlers.ts`, content: handlersFile(contract, operations), ownership: 'COMPILER_OWNED' },
      { path: `${directory}/${contract.boundedContext}.controller.ts`, content: controllerFile(contract, operations), ownership: 'COMPILER_OWNED' },
      { path: `${directory}/${contract.boundedContext}.module.ts`, content: moduleFile(contract), ownership: 'COMPILER_OWNED' },
      { path: `src/extension/${contract.boundedContext}.handlers.ts`, content: seededHandlers(contract, operations), ownership: 'OWNER_SEEDED' },
    );
  }
  return artifacts;
}
