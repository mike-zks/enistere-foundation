import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileSchema } from './json-schema.mjs';

const SCHEMA_PATH = join(
  dirname(fileURLToPath(import.meta.url)), '..', 'schema', 'deployment-unit.schema.json',
);

export const deploymentUnitSchema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const compiled = compileSchema(deploymentUnitSchema);

/** Validates one resolved operational delivery unit against the normative v1 schema. */
export function validateDeploymentUnit(unit) {
  compiled(unit);
  return (compiled.errors ?? [])
    .filter((error) => !['if', 'allOf'].includes(error.keyword))
    .map((error) => ({
      path: error.instancePath || '/',
      keyword: error.keyword,
      message: error.message,
    }));
}

export function assertDeploymentUnit(unit) {
  const issues = validateDeploymentUnit(unit);
  if (issues.length > 0) {
    throw new Error(`Invalid deployment unit:\n${issues.map((issue) => `- ${issue.path} ${issue.message}`).join('\n')}`);
  }
  return unit;
}
