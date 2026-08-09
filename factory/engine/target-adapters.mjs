/**
 * Versioned target-adapter registry.
 *
 * The composition engine owns ordering, conflicts, files, dependencies and
 * locks. Target adapters declare the integration operations they accept AND how
 * their known integration kinds are rendered into composition files
 * (`composition`): each group binds a set of kinds to a destination path and a
 * pure renderer. The engine stays framework-agnostic — it iterates adapters and
 * never switches on a starter id. No adapter executes arbitrary manifest code.
 */

import {
  renderNestjsComposition,
  renderPrismaSeedRegistry,
  renderSpringComposition,
  renderNextjsCapabilityProviders,
  renderNextjsPublicNav,
  renderNextjsDashboardNav,
  renderNextjsStatusSections,
  renderExpoCapabilityProviders,
  renderAngularCapabilityProviders,
  renderAngularCapabilityRoutes,
  renderAngularCapabilityInterceptors,
  renderFlutterCapabilityOverrides,
  renderFlutterCapabilityRoutes,
  renderFlutterCapabilityInterceptors,
  renderFastapiCapabilityModels,
  renderFastapiCapabilityRouters,
  renderFastapiCapabilityLifespans,
  renderFastapiCapabilityExceptionHandlers,
  renderExpoHomeActions,
  renderExpoQueryRetryGuards,
} from './overlay-renderers.mjs';
import { renderNestjsDomain } from './domain-renderers/nestjs.mjs';

const STRING = 'string';
const INTEGER = 'integer';

export const COMMON_OPERATIONS = Object.freeze([
  'files', 'dependencies', 'environment', 'integrations', 'contract', 'verification',
]);

/** Deep-freezes a composition descriptor list (kinds bound to a destination + renderer). */
function freezeComposition(composition) {
  return Object.freeze((composition ?? []).map((group) => Object.freeze({
    ...group,
    kinds: Object.freeze([...group.kinds]),
  })));
}

/** Deep-freezes the declarative operational descriptor owned by an adapter. */
function freezeDelivery(delivery) {
  if (!delivery) return null;
  return Object.freeze({
    ...delivery,
    artifacts: Object.freeze(delivery.artifacts.map((artifact) => Object.freeze({
      ...artifact,
      build: Object.freeze({
        ...artifact.build,
        command: Object.freeze([...artifact.build.command]),
        outputs: Object.freeze([...artifact.build.outputs]),
      }),
      distribution: Object.freeze({ ...artifact.distribution }),
      evidence: Object.freeze([...artifact.evidence]),
      blockers: Object.freeze([...artifact.blockers]),
    }))),
    configuration: Object.freeze({
      nonSecret: Object.freeze([...delivery.configuration.nonSecret]),
      secrets: Object.freeze([...delivery.configuration.secrets]),
    }),
    health: Object.freeze({ ...delivery.health }),
    migrations: Object.freeze({
      ...delivery.migrations,
      command: delivery.migrations.command ? Object.freeze([...delivery.migrations.command]) : null,
    }),
  });
}

const secretNames = (...names) => names;
const build = (context, command, outputs, definition) => ({
  context,
  ...(definition ? { definition } : {}),
  command,
  outputs,
});

const BUILT_IN = [
  {
    id: 'nestjs', version: '1.0.0', migrations: 'prisma/migrations/', integrationKinds: {
      'nestjs.module': { importPath: STRING, symbol: STRING },
      'nestjs.global-guard': { importPath: STRING, symbol: STRING, order: INTEGER },
      'nestjs.throttler': { name: STRING, limitEnv: STRING, defaultLimit: INTEGER, ttlSecondsEnv: STRING, defaultTtlSeconds: INTEGER },
      'nestjs.prisma-schema': { source: STRING },
      'nestjs.prisma-seed': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    // `nestjs.prisma-schema` is intentionally absent: prisma fragments compose
    // into the typed schema in the engine's main loop, not as a rendered file.
    composition: [
      { kinds: ['nestjs.prisma-seed'], destination: 'prisma/seed/capability-seeds.ts', render: renderPrismaSeedRegistry },
      { kinds: ['nestjs.module', 'nestjs.global-guard', 'nestjs.throttler'], destination: 'src/composition/capabilities.ts', render: renderNestjsComposition },
    ],
    // Domain compiler (R9): entities -> Prisma model + CRUD service + module.
    renderDomain: renderNestjsDomain,
    delivery: {
      schemaVersion: '1',
      artifacts: [{
        id: 'server-image', kind: 'oci-image', status: 'blocked',
        build: build('application', ['docker', 'build', '--file', '{definition}', '{context}'], ['oci:{project}-{application}'], 'Dockerfile'),
        distribution: { channel: 'oci-registry', immutable: true }, evidence: [],
        blockers: ['DERIVED_BUILD_LOCKFILE_MISSING'],
      }],
      configuration: {
        nonSecret: ['NODE_ENV', 'PORT', 'CORS_ORIGINS', 'JSON_BODY_LIMIT', 'URL_ENCODED_BODY_LIMIT', 'TRUST_PROXY_HOPS', 'SERVICE_NAME', 'LOG_LEVEL', 'LOG_PRETTY', 'LOG_HTTP_ENABLED', 'LOG_HEALTH_SUCCESS_ENABLED'],
        secrets: secretNames('DATABASE_URL'),
      },
      health: { kind: 'http', path: '/health' },
      migrations: { kind: 'command', command: ['npm', 'run', 'prisma:migrate:deploy'], reversible: false },
      rollbackStrategy: 'restore-and-redeploy',
    },
  },
  {
    id: 'nextjs', version: '1.0.0', integrationKinds: {
      'nextjs.provider': { importPath: STRING, symbol: STRING },
      'nextjs.public-nav-link': { href: STRING, label: STRING },
      'nextjs.dashboard-nav-link': { href: STRING, label: STRING, order: INTEGER },
      'nextjs.status-section': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['nextjs.provider'], destination: 'src/app/providers/capability-providers.tsx', render: renderNextjsCapabilityProviders },
      { kinds: ['nextjs.public-nav-link'], destination: 'src/core/composition/public-nav.ts', render: renderNextjsPublicNav },
      { kinds: ['nextjs.dashboard-nav-link'], destination: 'src/core/composition/dashboard-nav.ts', render: renderNextjsDashboardNav },
      { kinds: ['nextjs.status-section'], destination: 'src/core/composition/status-sections.tsx', render: renderNextjsStatusSections },
    ],
    delivery: {
      schemaVersion: '1',
      artifacts: [{
        id: 'server-image', kind: 'oci-image', status: 'blocked',
        build: build('project', ['docker', 'build', '--file', '{definition}', '{context}'], ['oci:{project}-{application}'], 'Dockerfile'),
        distribution: { channel: 'oci-registry', immutable: true }, evidence: [],
        blockers: ['DERIVED_BUILD_STARTER_PATH_LEAK'],
      }],
      configuration: {
        nonSecret: ['APP_ENV', 'NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL', 'API_INTERNAL_URL'],
        secrets: [],
      },
      health: { kind: 'http', path: '/status' },
      migrations: { kind: 'none', command: null, reversible: false },
      rollbackStrategy: 'redeploy-previous-artifact',
    },
  },
  {
    id: 'react-native', version: '1.0.0', integrationKinds: {
      'expo.provider': { importPath: STRING, symbol: STRING },
      'expo.home-action': { href: STRING, label: STRING, order: INTEGER },
      'expo.query-retry-guard': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['expo.provider'], destination: 'src/composition/capability-providers.tsx', render: renderExpoCapabilityProviders },
      { kinds: ['expo.home-action'], destination: 'src/composition/home-actions.ts', render: renderExpoHomeActions },
      { kinds: ['expo.query-retry-guard'], destination: 'src/composition/capability-query-retry.ts', render: renderExpoQueryRetryGuards },
    ],
    delivery: {
      schemaVersion: '1',
      artifacts: [
        {
          id: 'update-bundle', kind: 'mobile-update-bundle', status: 'ready',
          build: build('application', ['npx', 'expo', 'export', '-p', 'ios'], ['{appDir}/dist']),
          distribution: { channel: 'local-file', immutable: false },
          evidence: ['factory:golden-runtime:react-native:expo-export'], blockers: [],
        },
        {
          id: 'android-release', kind: 'android-package', status: 'blocked',
          build: build('application', ['npx', 'expo', 'run:android', '--variant', 'release'], ['{appDir}/android/app/build/outputs']),
          distribution: { channel: 'app-store', immutable: true }, evidence: [],
          blockers: ['SIGNED_RELEASE_PIPELINE_MISSING'],
        },
        {
          id: 'ios-release', kind: 'ios-package', status: 'blocked',
          build: build('application', ['npx', 'expo', 'run:ios', '--configuration', 'Release'], ['{appDir}/ios/build']),
          distribution: { channel: 'app-store', immutable: true }, evidence: [],
          blockers: ['SIGNED_RELEASE_PIPELINE_MISSING'],
        },
      ],
      configuration: {
        nonSecret: ['EXPO_PUBLIC_APP_ENV', 'EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_API_TIMEOUT_MS'],
        secrets: [],
      },
      health: { kind: 'none', path: null },
      migrations: { kind: 'none', command: null, reversible: false },
      rollbackStrategy: 'store-rollback',
    },
  },
  { id: 'spring', version: '1.0.0', dependencyManager: 'maven',
    migrations: 'src/main/resources/db/migration/', integrationKinds: {
    'spring.module': { importPath: STRING, symbol: STRING },
  }, composition: [
    { kinds: ['spring.module'], destination: 'src/main/java/com/enistere/core/composition/CapabilityConfiguration.java', render: renderSpringComposition },
  ], delivery: {
    schemaVersion: '1',
    artifacts: [{
      id: 'application-jar', kind: 'jvm-jar', status: 'ready',
      build: build('application', ['./mvnw', 'package', '--no-transfer-progress'], ['{appDir}/target/*.jar']),
      distribution: { channel: 'artifact-registry', immutable: true },
      evidence: ['golden-runtime:spring-files:mvn-verify:2026-08-02'], blockers: [],
    }],
    configuration: {
      nonSecret: ['SERVICE_NAME', 'SHUTDOWN_TIMEOUT_SECONDS', 'CORS_ALLOWED_ORIGINS'],
      secrets: secretNames('DATABASE_URL', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'SPRING_DATASOURCE_URL', 'SPRING_DATASOURCE_USERNAME', 'SPRING_DATASOURCE_PASSWORD'),
    },
    health: { kind: 'http', path: '/actuator/health' },
    migrations: { kind: 'startup', command: null, reversible: false },
    rollbackStrategy: 'restore-and-redeploy',
  } },
  {
    id: 'fastapi', version: '1.0.0', dependencyManager: 'python',
    migrations: 'migrations/versions/', integrationKinds: {
      'fastapi.router': { importPath: STRING, symbol: STRING, order: INTEGER },
      'fastapi.lifespan': { importPath: STRING, symbol: STRING, order: INTEGER },
      'fastapi.exception-handler': { importPath: STRING, exception: STRING, handler: STRING, order: INTEGER },
      'fastapi.model-module': { importPath: STRING },
    },
    composition: [
      { kinds: ['fastapi.router'], destination: 'app/composition/capability_routers.py', render: renderFastapiCapabilityRouters },
      { kinds: ['fastapi.lifespan'], destination: 'app/composition/capability_lifespan.py', render: renderFastapiCapabilityLifespans },
      { kinds: ['fastapi.exception-handler'], destination: 'app/composition/capability_exception_handlers.py', render: renderFastapiCapabilityExceptionHandlers },
      { kinds: ['fastapi.model-module'], destination: 'app/composition/capability_models.py', render: renderFastapiCapabilityModels },
    ],
    delivery: {
      schemaVersion: '1',
      artifacts: [{
        id: 'server-image', kind: 'oci-image', status: 'ready',
        build: build('application', ['docker', 'build', '--file', '{definition}', '{context}'], ['oci:{project}-{application}'], 'Dockerfile'),
        distribution: { channel: 'oci-registry', immutable: true },
        evidence: ['golden-runtime:fastapi-files:oci-build:2026-08-02'], blockers: [],
      }],
      configuration: {
        nonSecret: ['ENISTERE_SERVICE_NAME', 'ENISTERE_CORS_ALLOWED_ORIGINS', 'ENISTERE_RATE_LIMIT_PER_MINUTE', 'ENISTERE_DATABASE_POOL_SIZE', 'ENISTERE_DATABASE_POOL_MAX_OVERFLOW', 'ENISTERE_DATABASE_STATEMENT_TIMEOUT_MS'],
        secrets: secretNames('ENISTERE_DATABASE_URL'),
      },
      health: { kind: 'http', path: '/health' },
      migrations: { kind: 'command', command: ['python', '-m', 'alembic', 'upgrade', 'head'], reversible: false },
      rollbackStrategy: 'restore-and-redeploy',
    },
  },
  {
    id: 'angular', version: '1.0.0', integrationKinds: {
      'angular.provider': { importPath: STRING, symbol: STRING },
      'angular.route': { path: STRING, importPath: STRING, symbol: STRING, title: STRING, order: INTEGER },
      'angular.http-interceptor': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['angular.provider'], destination: 'src/app/core/composition/capability-providers.ts', render: renderAngularCapabilityProviders },
      { kinds: ['angular.route'], destination: 'src/app/core/composition/capability-routes.ts', render: renderAngularCapabilityRoutes },
      { kinds: ['angular.http-interceptor'], destination: 'src/app/core/composition/capability-interceptors.ts', render: renderAngularCapabilityInterceptors },
    ],
    delivery: {
      schemaVersion: '1',
      artifacts: [{
        id: 'static-bundle', kind: 'web-static-bundle', status: 'ready',
        build: build('application', ['npm', 'run', 'build'], ['{appDir}/dist/web-angular']),
        distribution: { channel: 'artifact-registry', immutable: true },
        evidence: ['factory:golden-runtime:angular:build'], blockers: [],
      }],
      configuration: { nonSecret: [], secrets: [] },
      health: { kind: 'http', path: '/' },
      migrations: { kind: 'none', command: null, reversible: false },
      rollbackStrategy: 'redeploy-previous-artifact',
    },
  },
  {
    id: 'flutter', version: '1.0.0', dependencyManager: 'pub', integrationKinds: {
      'flutter.provider-override': { importPath: STRING, symbol: STRING },
      'flutter.route': { path: STRING, name: STRING, importPath: STRING, symbol: STRING, order: INTEGER },
      'flutter.interceptor': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['flutter.provider-override'], destination: 'lib/src/core/composition/capability_overrides.dart', render: renderFlutterCapabilityOverrides },
      { kinds: ['flutter.route'], destination: 'lib/src/core/composition/capability_routes.dart', render: renderFlutterCapabilityRoutes },
      { kinds: ['flutter.interceptor'], destination: 'lib/src/core/composition/capability_interceptors.dart', render: renderFlutterCapabilityInterceptors },
    ],
    delivery: {
      schemaVersion: '1',
      artifacts: [
        {
          id: 'android-release', kind: 'android-package', status: 'blocked',
          build: build('application', ['flutter', 'build', 'apk', '--release'], ['{appDir}/build/app/outputs/flutter-apk/app-release.apk']),
          distribution: { channel: 'app-store', immutable: true }, evidence: [],
          blockers: ['SIGNED_RELEASE_PIPELINE_MISSING'],
        },
        {
          id: 'ios-release', kind: 'ios-package', status: 'blocked',
          build: build('application', ['flutter', 'build', 'ipa', '--release'], ['{appDir}/build/ios/ipa']),
          distribution: { channel: 'app-store', immutable: true }, evidence: [],
          blockers: ['SIGNED_RELEASE_PIPELINE_MISSING'],
        },
      ],
      configuration: { nonSecret: ['APP_ENV', 'API_BASE_URL', 'API_TIMEOUT_MS'], secrets: [] },
      health: { kind: 'none', path: null },
      migrations: { kind: 'none', command: null, reversible: false },
      rollbackStrategy: 'store-rollback',
    },
  },
].map((adapter) => Object.freeze({
  ...adapter,
  operations: Object.freeze([...(adapter.operations ?? COMMON_OPERATIONS)]),
  integrationKinds: Object.freeze(Object.fromEntries(
    Object.entries(adapter.integrationKinds).map(([kind, fields]) => [kind, Object.freeze({ ...fields })]),
  )),
  composition: freezeComposition(adapter.composition),
  delivery: freezeDelivery(adapter.delivery),
}));

const adapters = new Map(BUILT_IN.map((adapter) => [adapter.id, adapter]));

function assertAdapter(adapter) {
  if (!adapter || !/^[a-z][a-z0-9-]*$/.test(adapter.id ?? '')) throw new Error('target adapter id is invalid');
  if (!/^\d+\.\d+\.\d+$/.test(adapter.version ?? '')) throw new Error(`${adapter.id}: adapter version must be SemVer`);
  if (!adapter.integrationKinds || typeof adapter.integrationKinds !== 'object') throw new Error(`${adapter.id}: integrationKinds must be an object`);
  if (adapter.delivery !== undefined && adapter.delivery?.schemaVersion !== '1') throw new Error(`${adapter.id}: delivery schemaVersion must be 1`);
  if (adapter.operations !== undefined && (!Array.isArray(adapter.operations) || adapter.operations.some((operation) => typeof operation !== 'string' || operation === ''))) {
    throw new Error(`${adapter.id}: operations must be non-empty strings`);
  }
}

export function registerTargetAdapter(adapter) {
  assertAdapter(adapter);
  if (adapters.has(adapter.id)) throw new Error(`target adapter already registered: ${adapter.id}`);
  const frozen = Object.freeze({
    id: adapter.id,
    version: adapter.version,
    dependencyManager: adapter.dependencyManager ?? 'npm',
    integrationKinds: Object.freeze({ ...adapter.integrationKinds }),
    operations: Object.freeze([...(adapter.operations ?? COMMON_OPERATIONS)]),
    composition: freezeComposition(adapter.composition),
    renderDomain: adapter.renderDomain ?? null,
    delivery: freezeDelivery(adapter.delivery),
  });
  adapters.set(frozen.id, frozen);
  return frozen;
}

export function getTargetAdapter(id) {
  return adapters.get(id) ?? null;
}

export function listTargetAdapters() {
  return [...adapters.values()];
}

export function integrationKindsFor(id) {
  return getTargetAdapter(id)?.integrationKinds ?? null;
}

export function adapterVersionsFor(ids) {
  return Object.fromEntries(ids.map((id) => [id, getTargetAdapter(id)?.version ?? null]));
}

export function resetTargetAdaptersForTests() {
  for (const id of [...adapters.keys()]) if (!BUILT_IN.some((adapter) => adapter.id === id)) adapters.delete(id);
}
