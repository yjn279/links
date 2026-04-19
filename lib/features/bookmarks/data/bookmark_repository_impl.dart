import 'package:drift/drift.dart';
import 'package:links/core/database/app_database.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart' as domain;
import 'package:links/features/bookmarks/domain/bookmark_repository.dart';
import 'package:uuid/uuid.dart';

class BookmarkRepositoryImpl implements BookmarkRepository {
  BookmarkRepositoryImpl(this._db);

  final AppDatabase _db;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  @override
  Future<List<domain.Bookmark>> getAll() async {
    final rows = await (_db.select(_db.bookmarks)
          ..orderBy([(b) => OrderingTerm.desc(b.createdAt)]))
        .get();
    return Future.wait(rows.map(_rowToDomain));
  }

  /// watchAll streams the list of bookmarks ordered by createdAt DESC.
  ///
  /// Strategy: watch the bookmarks table for any change, then re-fetch tags
  /// for each row in the new snapshot. This is simple and fully reactive —
  /// any write to bookmarks (add/update/delete) triggers a new emission.
  @override
  Stream<List<domain.Bookmark>> watchAll() {
    return (_db.select(_db.bookmarks)
          ..orderBy([(b) => OrderingTerm.desc(b.createdAt)]))
        .watch()
        .asyncMap((rows) => Future.wait(rows.map(_rowToDomain)));
  }

  @override
  Future<void> add(domain.Bookmark bookmark) async {
    await _db.transaction(() async {
      await _db.into(_db.bookmarks).insert(
            BookmarksCompanion.insert(
              id: bookmark.id,
              url: bookmark.url,
              title: Value(bookmark.title),
              summary: Value(bookmark.summary),
              faviconUrl: bookmark.faviconUrl,
              createdAt: bookmark.createdAt.toUtc(),
            ),
          );
      await _insertTagLinks(bookmark.id, bookmark.tags);
    });
  }

  @override
  Future<void> update(domain.Bookmark bookmark) async {
    await _db.transaction(() async {
      // Update the bookmark row.
      await (_db.update(_db.bookmarks)
            ..where((b) => b.id.equals(bookmark.id)))
          .write(
        BookmarksCompanion(
          url: Value(bookmark.url),
          title: Value(bookmark.title),
          summary: Value(bookmark.summary),
          faviconUrl: Value(bookmark.faviconUrl),
          createdAt: Value(bookmark.createdAt.toUtc()),
        ),
      );

      // Replace tag associations atomically.
      await (_db.delete(_db.bookmarkTags)
            ..where((bt) => bt.bookmarkId.equals(bookmark.id)))
          .go();
      await _insertTagLinks(bookmark.id, bookmark.tags);

      // AC-21: remove tags no longer referenced by any bookmark.
      await _cleanupOrphanTags();
    });
  }

  @override
  Future<void> delete(String id) async {
    await (_db.delete(_db.bookmarks)..where((b) => b.id.equals(id))).go();
    // ON DELETE CASCADE already removed bookmark_tags rows for this id.
    // AC-21: clean up any tags now unreferenced by any bookmark.
    await _cleanupOrphanTags();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /// Ensures a [Tags] row exists for each name and inserts [BookmarkTags] links.
  ///
  /// Tags are normalised (lowercase + trim) defensively here in case a
  /// [domain.Bookmark] was constructed without going through [domain.Bookmark.create].
  Future<void> _insertTagLinks(String bookmarkId, List<String> tags) async {
    for (final rawName in tags) {
      final name = rawName.trim().toLowerCase();
      if (name.isEmpty) continue;

      // Resolve or create the tag row.
      final existing = await (_db.select(_db.tags)
            ..where((t) => t.name.equals(name)))
          .getSingleOrNull();

      final tagId = existing?.id ?? const Uuid().v4();

      if (existing == null) {
        await _db.into(_db.tags).insert(
              TagsCompanion.insert(id: tagId, name: name),
            );
      }

      // Upsert the join row (idempotent in case of duplicates in the input).
      await _db.into(_db.bookmarkTags).insertOnConflictUpdate(
            BookmarkTagsCompanion.insert(
              bookmarkId: bookmarkId,
              tagId: tagId,
            ),
          );
    }
  }

  /// Removes tags no longer referenced by any bookmark (AC-21 orphan cleanup).
  ///
  /// Raw SQL is used so that the Drift-generated snake_case column name
  /// `tag_id` (from the Dart field `tagId` in [BookmarkTags]) is referenced
  /// correctly.
  Future<void> _cleanupOrphanTags() async {
    await _db.customStatement(
      'DELETE FROM tags WHERE id NOT IN '
      '(SELECT DISTINCT tag_id FROM bookmark_tags)',
    );
  }

  /// Converts a Drift [Bookmark] data class row to the domain [domain.Bookmark]
  /// entity by loading associated tag names from the join tables.
  Future<domain.Bookmark> _rowToDomain(Bookmark row) async {
    final tagRows = await (_db.select(_db.tags).join([
      innerJoin(
        _db.bookmarkTags,
        _db.bookmarkTags.tagId.equalsExp(_db.tags.id),
      ),
    ])
          ..where(_db.bookmarkTags.bookmarkId.equals(row.id))
          ..orderBy([OrderingTerm.asc(_db.tags.name)]))
        .get();

    final tagNames = tagRows.map((r) => r.readTable(_db.tags).name).toList();

    return domain.Bookmark(
      id: row.id,
      url: row.url,
      title: row.title,
      summary: row.summary,
      faviconUrl: row.faviconUrl,
      // Drift stores DateTime as Unix seconds INTEGER; toUtc() enforces the
      // UTC invariant expected by the domain layer.
      createdAt: row.createdAt.toUtc(),
      tags: tagNames,
    );
  }
}
