import 'package:flutter/material.dart';

import 'enistere_theme_extension.dart';
import 'enistere_tokens.dart';

abstract final class EnistereTheme {
  static ThemeData light({EnistereThemeSelection selection = const EnistereThemeSelection()}) =>
      _build(Brightness.light, selection);

  static ThemeData dark({EnistereThemeSelection selection = const EnistereThemeSelection()}) =>
      _build(Brightness.dark, selection);

  static ThemeData _build(Brightness brightness, EnistereThemeSelection selection) {
    final resolved = EnistereTokens.resolve(brightness, selection: selection);
    Color color(String key) => resolved.colors[key]!;
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: color('action.primary'),
      onPrimary: color('foreground.inverse'),
      secondary: color('action.primary'),
      onSecondary: color('foreground.inverse'),
      error: color('status.danger'),
      onError: color('foreground.inverse'),
      surface: color('background.default'),
      onSurface: color('foreground.default'),
      onSurfaceVariant: color('foreground.muted'),
      outline: color('border.default'),
      outlineVariant: color('border.strong'),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _buildTextTheme(color('foreground.default')),
      extensions: [EnistereThemeExtension.fromResolved(resolved)],
    );
  }

  static TextTheme _buildTextTheme(Color textColor) {
    return TextTheme(
      headlineLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeHeading,
        fontWeight: EnistereTokens.fontWeightHeading,
        color: textColor,
      ),
      headlineMedium: TextStyle(
        fontSize: EnistereTokens.fontSizeHeading,
        fontWeight: EnistereTokens.fontWeightHeading,
        color: textColor,
      ),
      titleLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeTitle,
        fontWeight: EnistereTokens.fontWeightTitle,
        color: textColor,
      ),
      bodyLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeBody,
        fontWeight: EnistereTokens.fontWeightBody,
        color: textColor,
      ),
      bodyMedium: TextStyle(
        fontSize: EnistereTokens.fontSizeBody,
        fontWeight: EnistereTokens.fontWeightBody,
        color: textColor,
      ),
      labelSmall: TextStyle(
        fontSize: EnistereTokens.fontSizeCaption,
        fontWeight: EnistereTokens.fontWeightCaption,
        color: textColor,
      ),
    );
  }
}
