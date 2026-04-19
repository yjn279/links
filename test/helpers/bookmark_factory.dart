import 'package:links/features/bookmarks/domain/bookmark.dart';

/// Creates a [Bookmark] for tests, delegating to [Bookmark.create] so that
/// all domain invariants (UUID, favicon URL, UTC createdAt, normalised tags)
/// are satisfied, then applies any overrides via [copyWith].
///
/// Note on the sentinel pattern: passing `title: null` explicitly to this
/// helper calls `copyWith(title: null)`, which the sentinel logic interprets
/// as "set title to null" — the same as the base value from [Bookmark.create].
/// Both paths produce `title == null`, so the behaviour is correct for Slice 1.
Bookmark makeBookmark(
  String url, {
  DateTime? createdAt,
  List<String> tags = const [],
  String? title,
  String? summary,
}) {
  final base = Bookmark.create(url, tags: tags);
  return base.copyWith(
    createdAt: createdAt ?? base.createdAt,
    title: title,
    summary: summary,
  );
}
