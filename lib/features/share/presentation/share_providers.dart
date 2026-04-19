import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/features/share/domain/share_intent_source.dart';
import 'package:links/features/share/data/share_handler_intent_source.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';

final shareIntentSourceProvider = Provider<ShareIntentSource>((ref) {
  final source = ShareHandlerIntentSource();
  ref.onDispose(source.reset);
  return source;
});

/// Activates the listener. Call `ref.watch(shareIntentListenerProvider);` from
/// a top-level widget on startup to subscribe.
final shareIntentListenerProvider = Provider<void>((ref) {
  final source = ref.watch(shareIntentSourceProvider);

  // Pump the cold-start URL through on first build.
  Future<void>.microtask(() async {
    final initial = await source.getInitialUrl();
    if (initial != null) {
      await ref.read(bookmarksNotifierProvider.notifier).add(initial);
    }
  });

  final sub = source.urlStream.listen((url) {
    ref.read(bookmarksNotifierProvider.notifier).add(url);
  });
  ref.onDispose(sub.cancel);
});
