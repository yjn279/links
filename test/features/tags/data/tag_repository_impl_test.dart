// NOTE: This test file depends on generated Drift code (app_database.g.dart).
// Run `dart run build_runner build --delete-conflicting-outputs` before
// executing `flutter test`.

import 'package:flutter_test/flutter_test.dart';
import 'package:links/core/database/app_database.dart';
import 'package:links/features/bookmarks/data/bookmark_repository_impl.dart';
import 'package:links/features/tags/data/tag_repository_impl.dart';

import '../../../helpers/bookmark_factory.dart';
import '../../../helpers/test_database.dart';

void main() {
  late AppDatabase db;
  late TagRepositoryImpl tagRepo;
  late BookmarkRepositoryImpl bookmarkRepo;

  setUp(() {
    db = buildTestDatabase();
    tagRepo = TagRepositoryImpl(db);
    bookmarkRepo = BookmarkRepositoryImpl(db);
  });

  tearDown(() async {
    await db.close();
  });

  // T-01
  test('getAllTags returns empty list when no bookmarks', () async {
    final tags = await tagRepo.getAllTags();
    expect(tags, isEmpty);
  });

  // T-02
  test('getAllTags returns distinct names sorted alphabetically', () async {
    final b1 = makeBookmark('https://one.example.com', tags: ['go', 'rust']);
    final b2 = makeBookmark('https://two.example.com', tags: ['go', 'swift']);
    await bookmarkRepo.add(b1);
    await bookmarkRepo.add(b2);

    final tags = await tagRepo.getAllTags();

    expect(tags, equals(['go', 'rust', 'swift']));
  });

  // T-03
  test('tag removed when no bookmark references it', () async {
    final bookmark = makeBookmark(
      'https://example.com',
      tags: ['orphan'],
    );
    await bookmarkRepo.add(bookmark);

    // Remove the only tag by updating with empty tag list.
    final updated = bookmark.copyWith(tags: <String>[]);
    await bookmarkRepo.update(updated);

    final tags = await tagRepo.getAllTags();
    expect(tags, isEmpty);
  });

  // T-04
  test('tag survives if another bookmark still uses it', () async {
    final b1 = makeBookmark('https://one.example.com', tags: ['shared']);
    final b2 = makeBookmark('https://two.example.com', tags: ['shared']);
    await bookmarkRepo.add(b1);
    await bookmarkRepo.add(b2);

    // Remove the tag from the first bookmark only.
    final updatedB1 = b1.copyWith(tags: <String>[]);
    await bookmarkRepo.update(updatedB1);

    final tags = await tagRepo.getAllTags();
    expect(tags, contains('shared'));
  });
}
