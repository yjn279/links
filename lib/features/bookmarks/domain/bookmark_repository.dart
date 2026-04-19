import 'package:links/features/bookmarks/domain/bookmark.dart';

abstract class BookmarkRepository {
  Future<List<Bookmark>> getAll();
  Stream<List<Bookmark>> watchAll();
  Future<void> add(Bookmark bookmark);
  Future<void> update(Bookmark bookmark);
  Future<void> delete(String id);
}
