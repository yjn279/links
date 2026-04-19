import 'package:drift/drift.dart';
import 'package:links/core/database/app_database.dart';
import 'package:links/features/tags/domain/tag_repository.dart';

class TagRepositoryImpl implements TagRepository {
  TagRepositoryImpl(this._db);

  final AppDatabase _db;

  /// Returns distinct tag names referenced by at least one bookmark,
  /// sorted alphabetically ascending.
  ///
  /// The JOIN against bookmark_tags guarantees that orphaned tag rows
  /// (which should not exist after orphan-cleanup, but might exist during
  /// a delayed cleanup window) are excluded from the result.
  @override
  Future<List<String>> getAllTags() async {
    final rows = await (_db.select(_db.tags).join([
      innerJoin(
        _db.bookmarkTags,
        _db.bookmarkTags.tagId.equalsExp(_db.tags.id),
      ),
    ])
          ..orderBy([OrderingTerm.asc(_db.tags.name)]))
        .get();

    // The JOIN produces one row per (tag, bookmark) pair — a tag shared by
    // multiple bookmarks yields multiple rows. We deduplicate into a Set and
    // return a sorted List<String>.
    final seen = <String>{};
    final result = <String>[];
    for (final row in rows) {
      final name = row.readTable(_db.tags).name;
      if (seen.add(name)) result.add(name);
    }
    return result;
  }

  /// Watches tag names referenced by at least one bookmark (sorted A→Z).
  ///
  /// Uses the same JOIN as [getAllTags]. Emits a new list whenever the tags
  /// or bookmark_tags tables change.
  @override
  Stream<List<String>> watchAllTags() {
    return (_db.select(_db.tags).join([
      innerJoin(
        _db.bookmarkTags,
        _db.bookmarkTags.tagId.equalsExp(_db.tags.id),
      ),
    ])
          ..orderBy([OrderingTerm.asc(_db.tags.name)]))
        .watch()
        .map((rows) {
      final seen = <String>{};
      final result = <String>[];
      for (final row in rows) {
        final name = row.readTable(_db.tags).name;
        if (seen.add(name)) result.add(name);
      }
      return result;
    });
  }
}
