import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/presentation/add_bookmark_dialog.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';

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
        error: (err, _) => Center(child: Text('Error: $err')),
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
        title: Text(bookmark.title ?? bookmark.url),
        subtitle: bookmark.tags.isEmpty
            ? null
            : Text(bookmark.tags.join(', ')),
        onTap: () => context.push('/edit/${bookmark.id}'),
      ),
    );
  }
}
