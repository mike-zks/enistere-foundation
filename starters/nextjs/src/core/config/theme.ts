/**
 * Thème UI (Web 1).
 *
 * Le UI Kit résout le thème via l'attribut `data-theme` sur `<html>` :
 * - `:root` (UI Kit) porte les valeurs du thème **clair** (défaut) ;
 * - `[data-theme="dark"]` porte les surcharges **sombres**.
 *
 * Le contrat design généré résout un pack enregistré par institution/contexte.
 * Les variables publiques sont de la configuration visuelle non sensible.
 */
import { resolveDesignTheme } from "@enistere/ui-kit/tokens";

export type Theme = "light" | "dark";

/** Thème par défaut du socle (clair). */
export const DEFAULT_THEME: Theme = "light";

/** Attribut HTML porteur du thème, lu par le UI Kit. */
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_PACK_ATTRIBUTE = "data-enistere-theme";

export interface WebThemeAttributes {
  readonly "data-theme": Theme;
  readonly "data-enistere-theme": string;
  readonly "data-theme-context": string;
}

export function resolveWebTheme(
  input: Readonly<Record<string, string | undefined>> = process.env,
): WebThemeAttributes {
  const requestedMode = input.NEXT_PUBLIC_ENISTERE_THEME_MODE;
  const contextId = input.NEXT_PUBLIC_ENISTERE_THEME_CONTEXT ?? "default";
  const resolved = resolveDesignTheme({
    requestedId: input.NEXT_PUBLIC_ENISTERE_THEME_ID,
    institutionId: input.NEXT_PUBLIC_ENISTERE_INSTITUTION_ID ?? "enistere",
    contextId,
    requestedMode: requestedMode === "light" || requestedMode === "dark" ? requestedMode : undefined,
    systemMode: DEFAULT_THEME,
  });
  return {
    "data-theme": resolved.mode,
    "data-enistere-theme": resolved.pack.id,
    "data-theme-context": contextId,
  };
}
