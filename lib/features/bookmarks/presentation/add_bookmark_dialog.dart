import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';

class AddBookmarkDialog extends ConsumerStatefulWidget {
  const AddBookmarkDialog({super.key});

  @override
  ConsumerState<AddBookmarkDialog> createState() => _AddBookmarkDialogState();
}

class _AddBookmarkDialogState extends ConsumerState<AddBookmarkDialog> {
  final _formKey = GlobalKey<FormState>();
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String? _validateUrl(String? value) {
    if (value == null || value.isEmpty) {
      return 'URL is required';
    }
    try {
      Bookmark.create(value);
      return null;
    } on InvalidUrlException {
      return 'Invalid URL';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final notifier = ref.read(bookmarksNotifierProvider.notifier);
    await notifier.add(_controller.text);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add bookmark'),
      content: Form(
        key: _formKey,
        child: TextFormField(
          key: const Key('url_input'),
          controller: _controller,
          decoration: const InputDecoration(
            labelText: 'URL',
            hintText: 'https://...',
          ),
          validator: _validateUrl,
          autofocus: true,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          key: const Key('add_confirm'),
          onPressed: _submit,
          child: const Text('Add'),
        ),
      ],
    );
  }
}
