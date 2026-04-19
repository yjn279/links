import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import 'package:links/features/tags/presentation/tags_provider.dart';

class EditBookmarkScreen extends ConsumerStatefulWidget {
  const EditBookmarkScreen({required this.bookmarkId, super.key});

  final String bookmarkId;

  @override
  ConsumerState<EditBookmarkScreen> createState() => _EditBookmarkScreenState();
}

class _EditBookmarkScreenState extends ConsumerState<EditBookmarkScreen> {
  TextEditingController? _urlController;
  TextEditingController? _summaryController;
  final TextEditingController _newTagController = TextEditingController();
  Set<String> _selectedTags = {};
  bool _initialized = false;

  void _initFromBookmark(Bookmark bm) {
    if (_initialized) return;
    _initialized = true;
    _urlController = TextEditingController(text: bm.url);
    _summaryController = TextEditingController(text: bm.summary ?? '');
    _selectedTags = {...bm.tags};
  }

  @override
  void dispose() {
    _urlController?.dispose();
    _summaryController?.dispose();
    _newTagController.dispose();
    super.dispose();
  }

  void _addNewTag() {
    final tag = _newTagController.text.trim().toLowerCase();
    if (tag.isNotEmpty) {
      setState(() {
        _selectedTags.add(tag);
      });
      _newTagController.clear();
    }
  }

  Future<void> _save() async {
    final bookmarks = ref.read(bookmarksNotifierProvider).value ?? const [];
    final Bookmark? original = bookmarks.cast<Bookmark?>().firstWhere(
      (b) => b?.id == widget.bookmarkId,
      orElse: () => null,
    );
    if (original == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bookmark not found')),
        );
      }
      return;
    }
    final bookmark = original;
    final newUrl = _urlController!.text;

    final Bookmark updated;
    try {
      final rebuilt = Bookmark.create(newUrl, tags: _selectedTags.toList());
      updated = bookmark.copyWith(
        url: rebuilt.url,
        faviconUrl: rebuilt.faviconUrl,
        tags: rebuilt.tags,
        summary: _summaryController!.text.isEmpty
            ? null
            : _summaryController!.text,
      );
    } on InvalidUrlException {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid URL')),
      );
      return;
    }

    await ref.read(bookmarksNotifierProvider.notifier).save(updated);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final bookmarksAsync = ref.watch(bookmarksNotifierProvider);

    return bookmarksAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        key: const Key('edit_error_state'),
        appBar: AppBar(
          leading: BackButton(onPressed: () => context.pop()),
        ),
        body: Center(
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
                  err.toString().replaceFirst('Exception: ', ''),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Go back'),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (bookmarks) {
        final bmList = bookmarks.where((b) => b.id == widget.bookmarkId).toList();
        if (bmList.isEmpty) {
          return const Scaffold(
            body: Center(child: Text('Bookmark not found')),
          );
        }
        final bm = bmList.first;
        _initFromBookmark(bm);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Edit bookmark'),
            leading: IconButton(
              icon: const Icon(Icons.close),
              key: const Key('cancel_button'),
              onPressed: () => context.pop(),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.save),
                key: const Key('save_button'),
                onPressed: _save,
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  key: const Key('url_field'),
                  controller: _urlController,
                  decoration: const InputDecoration(labelText: 'URL'),
                ),
                const SizedBox(height: 16.0),
                TextField(
                  key: const Key('summary_field'),
                  controller: _summaryController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Summary'),
                ),
                const SizedBox(height: 16.0),
                const Text(
                  'Tags',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8.0),
                Consumer(
                  builder: (context, ref, _) {
                    final tagsAsync = ref.watch(allTagsProvider);
                    return tagsAsync.when(
                      loading: () => const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      error: (err, _) => Text('Error loading tags: $err'),
                      data: (existingTags) {
                        final allTags = {
                          ...existingTags,
                          ..._selectedTags,
                        }.toList()
                          ..sort();
                        return Wrap(
                          spacing: 8.0,
                          runSpacing: 4.0,
                          children: allTags.map((tag) {
                            return FilterChip(
                              key: Key('tag_chip_$tag'),
                              label: Text(tag),
                              selected: _selectedTags.contains(tag),
                              onSelected: (selected) {
                                setState(() {
                                  if (selected) {
                                    _selectedTags.add(tag);
                                  } else {
                                    _selectedTags.remove(tag);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 8.0),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        key: const Key('new_tag_field'),
                        controller: _newTagController,
                        decoration: const InputDecoration(
                          labelText: 'New tag',
                          hintText: 'Add a tag...',
                        ),
                        onSubmitted: (_) => _addNewTag(),
                      ),
                    ),
                    IconButton(
                      key: const Key('add_tag_button'),
                      icon: const Icon(Icons.add),
                      onPressed: _addNewTag,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
