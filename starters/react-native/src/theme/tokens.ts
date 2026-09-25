/**
 * React Native binding of the generated neutral design contract.
 *
 * Governance: `contracts/design/` is canonical (ADR-090). ADR-010 keeps the
 * ThemeProvider and components idiomatic to React Native; no DOM dependency is
 * introduced. Typography remains an adapter extension in this contract version.
 *
 * This file maps neutral semantic slots to the idiomatic RN theme shape. The
 * generated data contains no DOM or React dependency.
 */
import {
  resolveDesignTheme,
  type DesignThemeSelection,
} from './design-contract.generated';

const defaultDesign = resolveDesignTheme({ requestedId: 'enistere-default', requestedMode: 'light' });

/** Numeric spacing scale in density-independent pixels (dp). */
export const spacing = defaultDesign.shared.spacing;

/** Corner radius scale (dp) — aligned to UI Kit primitives.radius. */
export const radius = {
  sm: defaultDesign.shared.radius.sm,
  md: defaultDesign.shared.radius.md,
  lg: defaultDesign.shared.radius.lg,
  pill: defaultDesign.shared.radius.xxl,
} as const;

/**
 * Typography styles (RN-compatible: numeric sizes, string weights).
 * Aligned to UI Kit semanticTypography; lineHeight = ratio × fontSize (dp).
 * heading: 30 × 1.2 = 36 · title: 20 × 1.5 = 30 · body: 16 × 1.5 = 24 ·
 * caption: 12 × 1.5 = 18
 */
export const typography = {
  heading: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 30, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
} as const;

/** Minimum touch target (dp) — accessibility floor per ADR-010 §16/§19. */
export const a11y = {
  minTouchTarget: defaultDesign.shared.minimumTouchTarget,
} as const;

/** The set of semantic color slots a theme must provide. */
export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly primaryText: string;
  readonly danger: string;
  readonly success: string;
}

function mapColors(colors: Readonly<Record<string, string>>): ThemeColors {
  return {
    background: colors['background.default'] as string,
    surface: colors['background.muted'] as string,
    surfaceElevated: colors['background.elevated'] as string,
    border: colors['border.default'] as string,
    text: colors['foreground.default'] as string,
    textMuted: colors['foreground.muted'] as string,
    primary: colors['action.primary'] as string,
    primaryText: colors['foreground.inverse'] as string,
    danger: colors['status.danger'] as string,
    success: colors['status.success'] as string,
  };
}

export type ColorScheme = 'light' | 'dark';

/** A fully resolved theme handed to components via `useTheme()`. */
export interface Theme {
  readonly scheme: ColorScheme;
  readonly packId: string;
  readonly institutionId: string;
  readonly colors: ThemeColors;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly typography: typeof typography;
  readonly a11y: typeof a11y;
}

function buildTheme(scheme: ColorScheme, selection: Omit<DesignThemeSelection, 'requestedMode'>): Theme {
  const resolved = resolveDesignTheme({ ...selection, requestedMode: scheme });
  const isDefault = resolved.pack.id === 'enistere-default';
  return {
    scheme: resolved.mode,
    packId: resolved.pack.id,
    institutionId: resolved.pack.institution.id,
    colors: mapColors(resolved.colors),
    spacing: isDefault ? spacing : resolved.shared.spacing,
    radius: isDefault ? radius : {
      sm: resolved.shared.radius.sm,
      md: resolved.shared.radius.md,
      lg: resolved.shared.radius.lg,
      pill: resolved.shared.radius.xxl,
    },
    typography,
    a11y: isDefault ? a11y : { minTouchTarget: resolved.shared.minimumTouchTarget },
  };
}

export const lightTheme: Theme = buildTheme('light', {});
export const darkTheme: Theme = buildTheme('dark', {});

export function resolveTheme(scheme: ColorScheme, selection: Omit<DesignThemeSelection, 'requestedMode'> = {}): Theme {
  return Object.keys(selection).length === 0
    ? scheme === 'dark' ? darkTheme : lightTheme
    : buildTheme(scheme, selection);
}

export type SpacingToken = keyof typeof spacing;
export type TypographyVariant = keyof typeof typography;
