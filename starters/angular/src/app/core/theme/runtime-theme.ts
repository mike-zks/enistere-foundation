import { resolveDesignTheme, type DesignThemeMode } from './design-contract.generated';

export interface ThemeHost {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

export function applyDesignTheme(
  host: ThemeHost,
  systemMode: DesignThemeMode = 'light',
): { readonly packId: string; readonly mode: DesignThemeMode; readonly contextId: string } {
  const contextId = host.getAttribute('data-theme-context') ?? 'default';
  const requestedMode = host.getAttribute('data-theme');
  const resolved = resolveDesignTheme({
    requestedId: host.getAttribute('data-enistere-theme') ?? undefined,
    institutionId: host.getAttribute('data-enistere-institution') ?? 'enistere',
    contextId,
    requestedMode: requestedMode === 'light' || requestedMode === 'dark' ? requestedMode : undefined,
    systemMode,
  });
  host.setAttribute('data-enistere-theme', resolved.pack.id);
  host.setAttribute('data-theme', resolved.mode);
  host.setAttribute('data-theme-context', contextId);
  return { packId: resolved.pack.id, mode: resolved.mode, contextId };
}
