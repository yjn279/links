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
  late BookmarkRepositoryImpl repo;

  setUp(() {
    db = buildTestDatabase();
    repo = BookmarkRepositoryImpl(db);
  });

  tearDown(() async {
    await db.close();
  });

  // R-01
  test('add then getAll returns bookmark', () async {
    final bookmark = makeBookmark('https://example.com');
    await repo.add(bookmark);

    final all = await repo.getAll();

    expect(all.length, equals(1));
    expect(all.first.url, equals('https://example.com'));
  });

  // R-02
  test('getAll orders by createdAt descending', () async {
    final older = makeBookmark(
      'https://older.example.com',
      createdAt: DateTime.utc(2024, 1, 1),
    );
    final newer = makeBookmark(
      'https://newer.example.com',
      createdAt: DateTime.utc(2024, 6, 1),
    );

    // Insert older first, then newer, to verify ordering is not insertion order.
    await repo.add(older);
    await repo.add(newer);

    final all = await repo.getAll();

    expect(all.length, equals(2));
    expect(all.first.url, equals('https://newer.example.com'));
    expect(all.last.url, equals('https://older.example.com'));
  });

  // R-03
  test('duplicate URL allowed', () async {
    final b1 = makeBookmark('https://example.com');
    final b2 = makeBookmark('https://example.com');

    await repo.add(b1);
    await repo.add(b2);

    final all = await repo.getAll();

    expect(all.length, equals(2));
  });

  // R-04
  test('delete removes bookmark', () async {
    final bookmark = makeBookmark('https://example.com');
    await repo.add(bookmark);

    await repo.delete(bookmark.id);

    final all = await repo.getAll();
    expect(all, isEmpty);
  });

  // R-05
  test('delete non-existent id is no-op', () async {
    await expectLater(
      repo.delete('non-existent-id'),
      completes,
    );
    final all = await repo.getAll();
    expect(all, isEmpty);
  });

  // R-06
  test('watchAll emits on add', () async {
    final stream = repo.watchAll();
    final bookmark = makeBookmark('https://example.com');

    // Expect: first an empty list (initial state), then a list with one entry.
    final expectation = expectLater(
      stream,
      emitsInOrder([
        isEmpty,
        hasLength(1),
      ]),
    );

    await repo.add(bookmark);
    await expectation;
  });

  // R-07
  test('watchAll emits on delete', () async {
    final bookmark = makeBookmark('https://example.com');
    await repo.add(bookmark);

    final stream = repo.watchAll();

    // Expect: first a list with one entry, then an empty list after deletion.
    final expectation = expectLater(
      stream,
      emitsInOrder([
        hasLength(1),
        isEmpty,
      ]),
    );

    await repo.delete(bookmark.id);
    await expectation;
  });

  // R-08
  test('update persists url and recomputes faviconUrl', () async {
    final original = makeBookmark('https://example.com');
    await repo.add(original);

    final newUrl = 'https://updated.example.com';
    final newFaviconUrl =
        'https://www.google.com/s2/favicons?domain=updated.example.com&sz=64';
    final updated = original.copyWith(url: newUrl, faviconUrl: newFaviconUrl);
    await repo.update(updated);

    final all = await repo.getAll();
    expect(all.length, equals(1));
    expect(all.first.url, equals(newUrl));
    expect(all.first.faviconUrl, equals(newFaviconUrl));
  });

  // R-09
  test('update persists summary', () async {
    final original = makeBookmark('https://example.com');
    await repo.add(original);

    final updated = original.copyWith(summary: 'my note');
    await repo.update(updated);

    final all = await repo.getAll();
    expect(all.first.summary, equals('my note'));
  });

  // R-10
  test('update replaces tags atomically', () async {
    final original = makeBookmark(
      'https://example.com',
      tags: ['a', 'b'],
    );
    await repo.add(original);

    final updated = original.copyWith(tags: ['c']);
    await repo.update(updated);

    final all = await repo.getAll();
    expect(all.first.tags, equals(['c']));

    // Verify via TagRepository that old tags 'a' and 'b' are gone.
    final tagRepo = TagRepositoryImpl(db);
    final tags = await tagRepo.getAllTags();
    expect(tags, equals(['c']));
    expect(tags, isNot(contains('a')));
    expect(tags, isNot(contains('b')));
  });

  // R-11
  test('delete bookmark cascades to bookmark_tags', () async {
    final bookmark = makeBookmark(
      'https://example.com',
      tags: ['flutter'],
    );
    await repo.add(bookmark);

    await repo.delete(bookmark.id);

    // bookmark_tags must be empty (ON DELETE CASCADE).
    final btRows = await db.select(db.bookmarkTags).get();
    expect(btRows, isEmpty);

    // tags must be empty (orphan cleanup ran in delete).
    final tagRows = await db.select(db.tags).get();
    expect(tagRows, isEmpty);
  });
}
