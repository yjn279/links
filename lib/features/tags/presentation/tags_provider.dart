import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/features/tags/domain/tag_repository.dart';

final tagRepositoryProvider = Provider<TagRepository>((ref) {
  throw UnimplementedError(
    'tagRepositoryProvider must be overridden with a concrete '
    'TagRepository in ProviderScope.',
  );
});

final allTagsProvider = StreamProvider<List<String>>((ref) {
  final repo = ref.watch(tagRepositoryProvider);
  return repo.watchAllTags();
});
