import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';
import 'package:links/features/bookmarks/presentation/add_bookmark_dialog.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';

String _formatError(Object err) {
  if (err is InvalidUrlException) return err.message;
  return err.toString().replaceFirst('Exception: ', '');
}

class BookmarkListScreen extends ConsumerWidget {
  const BookmarkListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookmarksNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Links')),
      floatingActionButton: FloatingActionButton(
        key: const Key('add_bookmark_fab'),
        onPressed: () => showDialog<void>(
          context: context,
          builder: (_) => const AddBookmarkDialog(),
        ),
        child: const Icon(Icons.add),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          key: const Key('error_state'),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48),
                const SizedBox(height: 12),
                const Text('Something went wrong'),
                const SizedBox(height: 8),
                Text(
                  _formatError(err),
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => ref.invalidate(bookmarksNotifierProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (bookmarks) {
          if (bookmarks.isEmpty) {
            return const _EmptyState(key: Key('empty_state'));
          }
          return ListView.builder(
            itemCount: bookmarks.length,
            itemBuilder: (context, index) {
              return _BookmarkListItem(
                bookmark: bookmarks[index],
              );
            },
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('No bookmarks yet'),
    );
  }
}

class _BookmarkListItem extends ConsumerWidget {
  const _BookmarkListItem({required this.bookmark});

  final Bookmark bookmark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Dismissible(
      key: ValueKey(bookmark.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) =>
          ref.read(bookmarksNotifierProvider.notifier).delete(bookmark.id),
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: ListTile(
        leading: _FaviconAvatar(url: bookmark.faviconUrl, id: bookmark.id),
        title: Text(bookmark.title ?? bookmark.url),
        subtitle: bookmark.tags.isEmpty
            ? null
            : Text(bookmark.tags.join(', ')),
        onTap: () => context.push('/edit/${bookmark.id}'),
      ),
    );
  }
}

class _FaviconAvatar extends StatelessWidget {
  const _FaviconAvatar({required this.url, required this.id});

  final String url;
  final String id;

  static const double _size = 32;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      key: Key('favicon_$id'),
      borderRadius: BorderRadius.circular(4),
      child: Image.network(
        url,
        width: _size,
        height: _size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _fallback,
        loadingBuilder: (context, child, progress) =>
            progress == null ? child : _fallback,
      ),
    );
  }

  static const Widget _fallback = SizedBox(
    width: _size,
    height: _size,
    child: Icon(Icons.link, size: 20, color: Colors.grey),
  );
}
