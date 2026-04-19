import 'package:drift/drift.dart';

part 'app_database.g.dart';

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

/// Stores bookmark records.
///
/// Drift 2.x maps a Dart `DateTimeColumn` to an INTEGER column containing
/// Unix seconds (UTC) by default. We call `.toUtc()` in the mapper on read
/// to enforce the invariant that all DateTime values are UTC.
class Bookmarks extends Table {
  TextColumn get id => text()();
  TextColumn get url => text()();
  TextColumn get title => text().nullable()();
  TextColumn get summary => text().nullable()();
  TextColumn get faviconUrl => text()();
  // Drift stores DateTime as Unix seconds (INTEGER) by default.
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Stores unique, normalised (lowercase-trimmed) tag names.
class Tags extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().unique()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Join table linking bookmarks to tags.
///
/// `ON DELETE CASCADE` for both FKs is expressed via `customConstraint` so
/// that the FK + cascade is included in the CREATE TABLE statement emitted by
/// Drift. The composite primary key is declared via `primaryKey`.
class BookmarkTags extends Table {
  TextColumn get bookmarkId => text().customConstraint(
        'NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE',
      )();
  TextColumn get tagId => text().customConstraint(
        'NOT NULL REFERENCES tags(id) ON DELETE CASCADE',
      )();

  @override
  Set<Column> get primaryKey => {bookmarkId, tagId};
}

// ---------------------------------------------------------------------------
// Database class
// ---------------------------------------------------------------------------

@DriftDatabase(tables: [Bookmarks, Tags, BookmarkTags])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        beforeOpen: (details) async {
          // Enable SQLite foreign key support so ON DELETE CASCADE fires.
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );
}
