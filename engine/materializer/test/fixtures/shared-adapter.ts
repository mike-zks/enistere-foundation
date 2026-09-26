/** Test adapter: realizes `api-service` components with a tiny Node HTTP server (no dependency, no network). */
import type { RuntimeAdapter } from '@enistere/foundation-kernel-extensions';

export function makeAdapter(options: { id: string; version: string; runExit: number; describeAs?: string }): RuntimeAdapter {
  return {
    describe: () => ({ id: options.describeAs ?? options.id, version: options.version }),
    validateIntent: (component) => (component.kind === 'api-service' ? [] : [`kind ${component.kind} unsupported`]),
    plan: (component, context) => [
      { path: 'README.md', content: `# ${component.id}\n\nSystem ${context.system}, from ${context.definition}.\n`, ownership: 'COMPILER_OWNED' },
      {
        path: 'server.mjs',
        content: [
          "import { createServer } from 'node:http';",
          "createServer((request, response) => { response.statusCode = request.url === '/health' ? 200 : 404; response.end('ok'); })",
          '  .listen(Number(process.env.PORT), "127.0.0.1");',
          '',
        ].join('\n'),
        ownership: 'COMPILER_OWNED',
      },
      { path: 'src/owner.mjs', content: '// seeded once\n', ownership: 'OWNER_SEEDED' },
    ],
    toolchainChecks: () => [
      { check: 'run', steps: [{ run: [process.execPath, '-e', `process.exit(${options.runExit})`], timeoutMs: 10_000 }] },
      { check: 'probe', steps: [{ start: [process.execPath, 'server.mjs'], env: {}, portVariable: 'PORT', path: '/health', expectStatus: 200, timeoutMs: 10_000 }] },
    ],
  };
}
