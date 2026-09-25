/**
 * NestJS runtime adapter — Adapter Protocol v0 (mission E2, ADR-096).
 *
 * Materializes an `api-service` component as a native NestJS project (ESM,
 * TypeScript) that runs without Foundation: health endpoint, configuration by
 * environment variables, container image running as a non-root user. Written
 * from scratch (ADR-094). Domain operations (E5) and platform capabilities are
 * not generated yet: resolution lists them as UNSUPPORTED.
 *
 * Every file is compiler-owned except `src/extension/extension.module.ts`, the
 * extension point seeded once and then owned by the component's team.
 */

import type { IRComponent } from '@enistere/foundation-kernel-compiler';
import type { AdapterContext, Artifact, RuntimeAdapter, ToolchainCheck } from '@enistere/foundation-kernel-extensions';

export const ADAPTER = Object.freeze({ id: 'nestjs', version: '0.1.0' });

/** Exact versions: a materialization is reproducible. */
export const DEPENDENCIES = Object.freeze({
  '@nestjs/common': '12.1.0',
  '@nestjs/core': '12.1.0',
  '@nestjs/platform-express': '12.1.0',
  'reflect-metadata': '0.2.2',
  rxjs: '7.8.2',
});
export const DEV_DEPENDENCIES = Object.freeze({
  '@types/node': '24.13.6',
  typescript: '5.9.3',
});

const SUPPORTED_KINDS = ['api-service'];
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const lines = (...content: string[]): string => `${content.join('\n')}\n`;

function packageJson(component: IRComponent, context: AdapterContext): string {
  return json({
    name: component.id,
    version: '0.1.0',
    private: true,
    description: `${component.name} — ${context.system} (materialized by Enistere Foundation)`,
    type: 'module',
    engines: { node: '>=22' },
    scripts: { build: 'tsc -p tsconfig.json', start: 'node dist/main.js' },
    dependencies: { ...DEPENDENCIES },
    devDependencies: { ...DEV_DEPENDENCIES },
  });
}

const TSCONFIG = json({
  compilerOptions: {
    target: 'ES2022',
    module: 'nodenext',
    moduleResolution: 'nodenext',
    lib: ['ES2023'],
    types: ['node'],
    strict: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    outDir: 'dist',
    rootDir: 'src',
    skipLibCheck: true,
  },
  include: ['src/**/*.ts'],
});

const MAIN = lines(
  "import 'reflect-metadata';",
  "import { NestFactory } from '@nestjs/core';",
  "import { AppModule } from './app.module.js';",
  '',
  '// Configuration comes from the environment only; no secret is generated.',
  'const port = Number(process.env.PORT ?? 3000);',
  'const app = await NestFactory.create(AppModule);',
  'app.enableShutdownHooks();',
  'await app.listen(port);',
);

const APP_MODULE = lines(
  "import { Module } from '@nestjs/common';",
  "import { ExtensionModule } from './extension/extension.module.js';",
  "import { HealthController } from './health/health.controller.js';",
  '',
  '@Module({ imports: [ExtensionModule], controllers: [HealthController] })',
  'export class AppModule {}',
);

const healthController = (component: IRComponent): string =>
  lines(
    "import { Controller, Get } from '@nestjs/common';",
    '',
    "@Controller('health')",
    'export class HealthController {',
    '  @Get()',
    "  health(): { status: 'ok'; component: string } {",
    `    return { status: 'ok', component: ${JSON.stringify(component.id)} };`,
    '  }',
    '}',
  );

const EXTENSION_MODULE = lines(
  '// Owner-managed extension point: seeded once by Enistere Foundation, never overwritten.',
  '// Register your own controllers and providers here.',
  "import { Module } from '@nestjs/common';",
  '',
  '@Module({})',
  'export class ExtensionModule {}',
);

const DOCKERFILE = lines(
  'FROM node:24-alpine AS build',
  'WORKDIR /app',
  'COPY package.json tsconfig.json ./',
  'RUN npm install --no-audit --no-fund',
  'COPY src ./src',
  'RUN npm run build && npm prune --omit=dev',
  '',
  'FROM node:24-alpine',
  'ENV NODE_ENV=production PORT=3000',
  'WORKDIR /app',
  'COPY --from=build --chown=node:node /app/package.json ./',
  'COPY --from=build --chown=node:node /app/node_modules ./node_modules',
  'COPY --from=build --chown=node:node /app/dist ./dist',
  'USER node',
  'EXPOSE 3000',
  'CMD ["node", "dist/main.js"]',
);

const DOCKERIGNORE = lines('node_modules', 'dist', '.foundation', '*.log');
const GITIGNORE = lines('node_modules/', 'dist/', '*.log');

function readme(component: IRComponent, context: AdapterContext): string {
  return lines(
    `# ${component.name}`,
    '',
    `Component \`${component.id}\` of system \`${context.system}\`, materialized by Enistere Foundation`,
    `(adapter \`${ADAPTER.id}@${ADAPTER.version}\`) from \`${context.definition}\`. The project is native NestJS`,
    'and runs without Foundation.',
    '',
    '```sh',
    'npm install',
    'npm run build',
    'PORT=3000 npm start   # GET /health',
    '```',
    '',
    '## Ownership',
    '',
    '| Files | Owner |',
    '|---|---|',
    '| `src/extension/**` | Your team: seeded once, never overwritten by Foundation. |',
    '| Everything else | Foundation (compiler-owned): a local change is reported as a conflict, never overwritten. |',
  );
}

export const nestjsAdapter: RuntimeAdapter = {
  describe: () => ({ ...ADAPTER }),

  validateIntent(component) {
    return SUPPORTED_KINDS.includes(component.kind) ? [] : [`kind '${component.kind}' is not realized by this adapter (supported: ${SUPPORTED_KINDS.join(', ')})`];
  },

  plan(component, context): Artifact[] {
    return [
      { path: 'package.json', content: packageJson(component, context), ownership: 'COMPILER_OWNED' },
      { path: 'tsconfig.json', content: TSCONFIG, ownership: 'COMPILER_OWNED' },
      { path: 'src/main.ts', content: MAIN, ownership: 'COMPILER_OWNED' },
      { path: 'src/app.module.ts', content: APP_MODULE, ownership: 'COMPILER_OWNED' },
      { path: 'src/health/health.controller.ts', content: healthController(component), ownership: 'COMPILER_OWNED' },
      { path: 'src/extension/extension.module.ts', content: EXTENSION_MODULE, ownership: 'OWNER_SEEDED' },
      { path: 'Dockerfile', content: DOCKERFILE, ownership: 'COMPILER_OWNED' },
      { path: '.dockerignore', content: DOCKERIGNORE, ownership: 'COMPILER_OWNED' },
      { path: '.gitignore', content: GITIGNORE, ownership: 'COMPILER_OWNED' },
      { path: 'README.md', content: readme(component, context), ownership: 'COMPILER_OWNED' },
    ];
  },

  toolchainChecks(): ToolchainCheck[] {
    return [
      { check: 'install', steps: [{ run: ['npm', 'install', '--no-audit', '--no-fund'], timeoutMs: 300_000 }] },
      { check: 'build', steps: [{ run: ['npm', 'run', 'build'], timeoutMs: 120_000 }] },
      { check: 'audit', steps: [{ run: ['npm', 'audit', '--audit-level=high'], timeoutMs: 120_000 }] },
      { check: 'boot', steps: [{ start: ['node', 'dist/main.js'], env: {}, portVariable: 'PORT', path: '/health', expectStatus: 200, timeoutMs: 30_000 }] },
    ];
  },
};

export default nestjsAdapter;
