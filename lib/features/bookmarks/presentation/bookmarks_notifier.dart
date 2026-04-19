import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/bookmark_repository.dart';

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  throw UnimplementedError(
    'bookmarkRepositoryProvider must be overridden with a concrete '
    'BookmarkRepository in ProviderScope (use override in main.dart or tests).',
  );
});

final bookmarksNotifierProvider =
    AsyncNotifierProvider<BookmarksNotifier, List<Bookmark>>(
  BookmarksNotifier.new,
);

class BookmarksNotifier extends AsyncNotifier<List<Bookmark>> {
  @override
  Future<List<Bookmark>> build() async {
    final repo = ref.watch(bookmarkRepositoryProvider);
    // Subscribe to the repository's stream so any write triggers a rebuild.
    final sub = repo.watchAll().listen((list) {
      state = AsyncData(list);
    });
    ref.onDispose(sub.cancel);
    return repo.getAll();
  }

  Future<void> add(String url) async {
    // Attempt to construct the domain entity. If URL is invalid, surface as
    // AsyncError without mutating the current list.
    try {
      final bookmark = Bookmark.create(url);
      await ref.read(bookmarkRepositoryProvider).add(bookmark);
      // The stream subscription in build() will update state.
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> update(Bookmark bookmark) async {
    try {
      await ref.read(bookmarkRepositoryProvider).update(bookmark);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> delete(String id) async {
    try {
      await ref.read(bookmarkRepositoryProvider).delete(id);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
