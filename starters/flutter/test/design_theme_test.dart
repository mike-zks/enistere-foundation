import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

void main() {
  test(
    'resolves an institution and context from the generated Dart binding',
    () {
      final theme = EnistereTokens.resolve(
        Brightness.dark,
        selection: const EnistereThemeSelection(
          institutionId: 'sunrise',
          contextId: 'learning',
        ),
      );
      expect(theme.packId, 'sunrise-institute');
      expect(theme.colors['action.primary'], const Color(0xFFF59E0B));
      expect(theme.minimumTouchTarget, 48);
    },
  );

  test('falls back to Enistere for an unknown institution', () {
    final theme = EnistereTokens.resolve(
      Brightness.light,
      selection: const EnistereThemeSelection(institutionId: 'unknown'),
    );
    expect(theme.packId, 'enistere-default');
  });
}
