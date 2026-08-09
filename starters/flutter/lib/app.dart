import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/navigation/router.dart';
import 'src/theme/enistere_theme.dart';
import 'src/theme/enistere_tokens.dart';

const _themeId = String.fromEnvironment('ENISTERE_THEME_ID');

class EnistereApp extends ConsumerWidget {
  const EnistereApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selection = EnistereThemeSelection(
      requestedId: _themeId.isEmpty ? null : _themeId,
      institutionId: const String.fromEnvironment(
        'ENISTERE_INSTITUTION_ID',
        defaultValue: 'enistere',
      ),
      contextId: const String.fromEnvironment(
        'ENISTERE_THEME_CONTEXT',
        defaultValue: 'default',
      ),
    );
    return MaterialApp.router(
      title: 'Enistere',
      theme: EnistereTheme.light(selection: selection),
      darkTheme: EnistereTheme.dark(selection: selection),
      themeMode: ThemeMode.system,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
