import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/routing/app_router.dart';
import 'features/share/presentation/share_providers.dart';

class LinksApp extends ConsumerWidget {
  const LinksApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Keep the share-intent listener alive for the lifetime of the app.
    ref.watch(shareIntentListenerProvider);

    return MaterialApp.router(
      title: 'Links',
      theme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        useMaterial3: true,
      ),
      routerConfig: appRouter,
    );
  }
}
