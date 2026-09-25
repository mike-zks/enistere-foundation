/**
 * Runtime-neutral operational resolution (ADR-089).
 *
 * Adapters declare mechanisms; this module only substitutes canonical project
 * and application identities, connects resolved dependencies, and validates the
 * resulting deployment-unit/v1 contract. It contains no runtime switch.
 */

import { assertDeploymentUnit } from './deployment-unit-schema.mjs';

function replaceToken(value, replacements) {
  return Object.entries(replacements)
    .reduce((result, [token, replacement]) => result.replaceAll(`{${token}}`, replacement), value);
}

/** Copies an adapter descriptor into the ResolvedSystem without shared mutable references. */
export function copyDeliveryDescriptor(delivery) {
  if (!delivery) return null;
  return {
    ...delivery,
    artifacts: delivery.artifacts.map((artifact) => ({
      ...artifact,
      build: {
        ...artifact.build,
        command: [...artifact.build.command],
        outputs: [...artifact.build.outputs],
      },
      distribution: { ...artifact.distribution },
      evidence: [...artifact.evidence],
      blockers: [...artifact.blockers],
    })),
    configuration: {
      nonSecret: [...delivery.configuration.nonSecret],
      secrets: [...delivery.configuration.secrets],
    },
    health: { ...delivery.health },
    migrations: {
      ...delivery.migrations,
      command: delivery.migrations.command ? [...delivery.migrations.command] : null,
    },
  };
}

function resolveBuild(build, application, project) {
  const context = build.context === 'application' ? application.appDir : '.';
  const definition = build.definition ? `${application.appDir}/${build.definition}` : null;
  const replacements = {
    project,
    application: application.id,
    appDir: application.appDir,
    context,
    definition: definition ?? '',
  };
  return {
    context,
    ...(definition ? { definition } : {}),
    command: build.command.map((part) => replaceToken(part, replacements)),
    outputs: build.outputs.map((output) => replaceToken(output, replacements)),
  };
}

function primitiveDependencies(application) {
  return [...new Set(application.resolvedCapabilities.flatMap((capability) =>
    (capability.primitives ?? []).map((primitive) => primitive.id)))].sort();
}

function capabilityConfiguration(application) {
  return [...new Set(application.resolvedCapabilities.flatMap((capability) =>
    capability.configuration ?? []))].sort();
}

/** Resolves and validates exactly one deployment unit per application. */
export function resolveDeploymentUnits({ project, applications, deploymentPlan }) {
  const rolloutIndex = new Map(deploymentPlan.order.map((id, index) => [id, index]));
  const rollbackIndex = new Map(deploymentPlan.rollbackOrder.map((id, index) => [id, index]));

  return applications.map((application) => {
    const descriptor = application.delivery;
    if (!descriptor) throw new Error(`${application.runtime}: runtime adapter has no operational delivery descriptor`);
    const capabilitySecrets = capabilityConfiguration(application);
    const secretNames = [...new Set([
      ...descriptor.configuration.secrets,
      ...capabilitySecrets,
    ])].sort();
    const unit = {
      schemaVersion: descriptor.schemaVersion,
      id: application.id,
      application: application.id,
      runtime: application.runtime,
      family: application.kind,
      owner: application.ownership?.team ?? null,
      artifacts: descriptor.artifacts.map((artifact) => ({
        id: artifact.id,
        kind: artifact.kind,
        status: artifact.status,
        build: resolveBuild(artifact.build, application, project),
        distribution: { ...artifact.distribution },
        evidence: [...artifact.evidence],
        blockers: [...artifact.blockers],
      })),
      configuration: {
        nonSecret: descriptor.configuration.nonSecret
          .filter((name) => !secretNames.includes(name))
          .sort(),
        secrets: secretNames.map((name) => ({
          name,
          reference: { kind: 'environment', key: name },
        })),
      },
      health: { ...descriptor.health },
      migrations: {
        ...descriptor.migrations,
        command: descriptor.migrations.command ? [...descriptor.migrations.command] : null,
      },
      dependencies: {
        units: application.consumes.filter((dependency) =>
          applications.some((candidate) => candidate.id === dependency)),
        primitives: primitiveDependencies(application),
      },
      rollout: {
        order: rolloutIndex.get(application.id),
        rollbackOrder: rollbackIndex.get(application.id),
        rollbackStrategy: descriptor.rollbackStrategy,
      },
    };
    assertDeploymentUnit(unit);
    return unit;
  });
}
