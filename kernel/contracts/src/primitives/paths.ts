/**
 * Paths of generated files. A path is POSIX, relative to its component
 * directory, and can never leave it; `.foundation/` is reserved for the
 * compiler's own records. Shared by the MaterializationRecord (A8) and the
 * Adapter Protocol: one rule, one implementation.
 */

const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9_.@-][A-Za-z0-9_.@/-]*$/;

export function isSafeArtifactPath(path: string): boolean {
  return SAFE_PATH.test(path) && !path.endsWith('/') && !path.startsWith('.foundation/');
}
