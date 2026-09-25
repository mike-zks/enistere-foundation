import 'dart:ui' show Brightness;

import 'package:flutter/painting.dart';

import 'design_contract.generated.dart';

final class EnistereThemeSelection {
  const EnistereThemeSelection({
    this.requestedId,
    this.institutionId = 'enistere',
    this.contextId = 'default',
  });

  final String? requestedId;
  final String institutionId;
  final String contextId;
}

final class EnistereResolvedTheme {
  const EnistereResolvedTheme({
    required this.packId,
    required this.institutionId,
    required this.mode,
    required this.colors,
    required this.spacing,
    required this.radius,
    required this.minimumTouchTarget,
  });

  final String packId;
  final String institutionId;
  final Brightness mode;
  final Map<String, Color> colors;
  final Map<String, double> spacing;
  final Map<String, double> radius;
  final double minimumTouchTarget;
}

abstract final class EnistereTokens {
  static EnistereResolvedTheme resolve(
    Brightness mode, {
    EnistereThemeSelection selection = const EnistereThemeSelection(),
  }) {
    final packs = (enistereDesignContract['themePacks']! as List<Object?>)
        .cast<Map<String, Object?>>();
    Map<String, Object?>? byId(String? id) {
      if (id == null) return null;
      for (final pack in packs) {
        if (pack['id'] == id) return pack;
      }
      return null;
    }

    Map<String, Object?>? contextual;
    Map<String, Object?>? institutionalDefault;
    for (final pack in packs) {
      final institution = pack['institution']! as Map<String, Object?>;
      final rules = pack['selection']! as Map<String, Object?>;
      final contexts = (rules['contexts']! as List<Object?>).cast<String>();
      if (institution['id'] == selection.institutionId) {
        if (contexts.contains(selection.contextId)) contextual = pack;
        if (contexts.contains('default')) institutionalDefault = pack;
      }
    }
    final pack =
        byId(selection.requestedId) ??
        contextual ??
        institutionalDefault ??
        byId('enistere-default');
    if (pack == null) throw StateError('default theme is not registered');
    final modes = pack['modes']! as Map<String, Object?>;
    final modeName = mode == Brightness.dark ? 'dark' : 'light';
    final modeData = modes[modeName]! as Map<String, Object?>;
    final rawColors = modeData['colors']! as Map<String, Object?>;
    final shared = pack['shared']! as Map<String, Object?>;
    return EnistereResolvedTheme(
      packId: pack['id']! as String,
      institutionId:
          (pack['institution']! as Map<String, Object?>)['id']! as String,
      mode: mode,
      colors: rawColors.map(
        (key, value) => MapEntry(key, _color(value! as String)),
      ),
      spacing: _numbers(shared['spacing']! as Map<String, Object?>),
      radius: _numbers(shared['radius']! as Map<String, Object?>),
      minimumTouchTarget: (shared['minimumTouchTarget']! as num).toDouble(),
    );
  }

  static Map<String, double> _numbers(Map<String, Object?> values) =>
      values.map((key, value) => MapEntry(key, (value! as num).toDouble()));

  static Color _color(String value) {
    final rgb = int.parse(value.substring(1, 7), radix: 16);
    final alpha = value.length == 9
        ? int.parse(value.substring(7, 9), radix: 16)
        : 0xff;
    return Color((alpha << 24) | rgb);
  }

  static final EnistereResolvedTheme _light = resolve(Brightness.light);
  static final EnistereResolvedTheme _dark = resolve(Brightness.dark);

  static Color get lightPrimary => _light.colors['action.primary']!;
  static Color get lightBackground => _light.colors['background.default']!;
  static Color get lightSurface => _light.colors['background.muted']!;
  static Color get lightSurfaceElevated =>
      _light.colors['background.elevated']!;
  static Color get lightBorder => _light.colors['border.default']!;
  static Color get lightText => _light.colors['foreground.default']!;
  static Color get lightTextMuted => _light.colors['foreground.muted']!;
  static Color get lightPrimaryText => _light.colors['foreground.inverse']!;
  static Color get lightDanger => _light.colors['status.danger']!;
  static Color get lightSuccess => _light.colors['status.success']!;
  static Color get darkPrimary => _dark.colors['action.primary']!;
  static Color get darkBackground => _dark.colors['background.default']!;
  static Color get darkSurface => _dark.colors['background.muted']!;
  static Color get darkSurfaceElevated => _dark.colors['background.elevated']!;
  static Color get darkBorder => _dark.colors['border.default']!;
  static Color get darkText => _dark.colors['foreground.default']!;
  static Color get darkTextMuted => _dark.colors['foreground.muted']!;
  static Color get darkPrimaryText => _dark.colors['foreground.inverse']!;
  static Color get darkDanger => _dark.colors['status.danger']!;
  static Color get darkSuccess => _dark.colors['status.success']!;

  static double get spacingXs => _light.spacing['xs']!;
  static double get spacingSm => _light.spacing['sm']!;
  static double get spacingMd => _light.spacing['md']!;
  static double get spacingLg => _light.spacing['lg']!;
  static double get spacingXl => _light.spacing['xl']!;
  static double get spacingXxl => _light.spacing['xxl']!;
  static double get radiusSm => _light.radius['sm']!;
  static double get radiusMd => _light.radius['md']!;
  static double get radiusLg => _light.radius['lg']!;
  static double get radiusPill => _light.radius['xxl']!;
  static double get minTouchTarget => _light.minimumTouchTarget;

  // Typography is a Flutter binding extension; it is not duplicated theme data.
  static const double fontSizeHeading = 30;
  static const double fontSizeTitle = 20;
  static const double fontSizeBody = 16;
  static const double fontSizeCaption = 12;
  static const FontWeight fontWeightHeading = FontWeight.w700;
  static const FontWeight fontWeightTitle = FontWeight.w600;
  static const FontWeight fontWeightBody = FontWeight.w400;
  static const FontWeight fontWeightCaption = FontWeight.w400;
}
