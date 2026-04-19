import 'package:uuid/uuid.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';

// Sentinel object used in copyWith to distinguish "not provided" from null.
final _sentinel = Object();

class Bookmark {
  Bookmark({
    required this.id,
    required this.url,
    required this.title,
    required this.summary,
    required this.faviconUrl,
    required this.createdAt,
    required List<String> tags,
  }) : tags = List.unmodifiable(tags);

  final String id;
  final String url;
  final String? title;
  final String? summary;
  final String faviconUrl;
  final DateTime createdAt;
  final List<String> tags;

  factory Bookmark.create(
    String url, {
    List<String> tags = const [],
  }) {
    if (url.isEmpty) {
      throw const InvalidUrlException('URL must not be empty');
    }

    final uri = Uri.tryParse(url);
    if (uri == null) {
      throw InvalidUrlException('Invalid URL: $url');
    }

    if (!uri.hasScheme) {
      throw InvalidUrlException('URL has no scheme: $url');
    }

    final scheme = uri.scheme; // Dart always lowercases the scheme
    if (scheme != 'http' && scheme != 'https') {
      throw InvalidUrlException(
        'URL scheme must be http or https, got: $scheme',
      );
    }

    if (uri.host.isEmpty) {
      throw InvalidUrlException('URL host must not be empty: $url');
    }

    final faviconUrl =
        'https://www.google.com/s2/favicons?domain=${uri.host}&sz=64';

    final normalizedTags = tags
        .map((t) => t.trim().toLowerCase())
        .where((t) => t.isNotEmpty)
        .toList(growable: false);

    final id = const Uuid().v4();
    final createdAt = DateTime.now().toUtc();

    return Bookmark(
      id: id,
      url: url,
      title: null,
      summary: null,
      faviconUrl: faviconUrl,
      createdAt: createdAt,
      tags: normalizedTags,
    );
  }

  Bookmark copyWith({
    Object? id = _sentinel,
    Object? url = _sentinel,
    Object? title = _sentinel,
    Object? summary = _sentinel,
    Object? faviconUrl = _sentinel,
    Object? createdAt = _sentinel,
    Object? tags = _sentinel,
  }) {
    return Bookmark(
      id: id == _sentinel ? this.id : id as String,
      url: url == _sentinel ? this.url : url as String,
      title: title == _sentinel ? this.title : title as String?,
      summary: summary == _sentinel ? this.summary : summary as String?,
      faviconUrl:
          faviconUrl == _sentinel ? this.faviconUrl : faviconUrl as String,
      createdAt:
          createdAt == _sentinel ? this.createdAt : createdAt as DateTime,
      tags: tags == _sentinel ? this.tags : tags as List<String>,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! Bookmark) return false;
    if (id != other.id) return false;
    if (url != other.url) return false;
    if (title != other.title) return false;
    if (summary != other.summary) return false;
    if (faviconUrl != other.faviconUrl) return false;
    if (createdAt != other.createdAt) return false;
    if (tags.length != other.tags.length) return false;
    for (var i = 0; i < tags.length; i++) {
      if (tags[i] != other.tags[i]) return false;
    }
    return true;
  }

  @override
  int get hashCode => Object.hash(
        id,
        url,
        title,
        summary,
        faviconUrl,
        createdAt,
        Object.hashAll(tags),
      );
}
