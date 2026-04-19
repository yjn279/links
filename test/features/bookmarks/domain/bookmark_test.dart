import 'package:flutter_test/flutter_test.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';

void main() {
  group('Bookmark.create', () {
    test('Bookmark.create returns bookmark with correct url', () {
      final bookmark = Bookmark.create('https://example.com');
      expect(bookmark.url, equals('https://example.com'));
    });

    test('Bookmark.create throws on empty string', () {
      expect(
        () => Bookmark.create(''),
        throwsA(isA<InvalidUrlException>()),
      );
    });

    test('Bookmark.create throws on non-URL string', () {
      expect(
        () => Bookmark.create('not a url'),
        throwsA(isA<InvalidUrlException>()),
      );
    });

    test('Bookmark.create throws on javascript scheme', () {
      expect(
        () => Bookmark.create('javascript:alert(1)'),
        throwsA(isA<InvalidUrlException>()),
      );
    });

    test('Bookmark.create throws on ftp scheme', () {
      expect(
        () => Bookmark.create('ftp://files.example.com'),
        throwsA(isA<InvalidUrlException>()),
      );
    });

    test('Bookmark.create accepts uppercase HTTP scheme', () {
      final bookmark = Bookmark.create('HTTP://EXAMPLE.COM/PATH');
      expect(bookmark.url, equals('HTTP://EXAMPLE.COM/PATH'));
    });

    test('Bookmark.create computes faviconUrl from host only', () {
      final bookmark = Bookmark.create(
        'https://user:pass@sub.example.com:8080/path?q=1#frag',
      );
      expect(
        bookmark.faviconUrl,
        equals(
          'https://www.google.com/s2/favicons?domain=sub.example.com&sz=64',
        ),
      );
    });

    test('Bookmark.create computes faviconUrl for simple domain', () {
      final bookmark = Bookmark.create('https://example.com');
      expect(
        bookmark.faviconUrl,
        equals(
          'https://www.google.com/s2/favicons?domain=example.com&sz=64',
        ),
      );
    });

    test('Bookmark.create produces unique ids matching UUID v4 format', () {
      final b1 = Bookmark.create('https://example.com');
      final b2 = Bookmark.create('https://example.com');
      expect(b1.id, isNot(equals(b2.id)));
      final uuidV4Regex = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      );
      expect(uuidV4Regex.hasMatch(b1.id), isTrue);
      expect(uuidV4Regex.hasMatch(b2.id), isTrue);
    });

    test('Bookmark.create sets createdAt in UTC', () {
      final bookmark = Bookmark.create('https://example.com');
      expect(bookmark.createdAt.isUtc, isTrue);
    });

    test('Bookmark.create normalizes tags to lowercase trimmed', () {
      final bookmark = Bookmark.create(
        'https://example.com',
        tags: ['  Rust ', 'GO'],
      );
      expect(bookmark.tags, equals(['rust', 'go']));
    });

    test('Bookmark.create accepts URL longer than 2048 characters', () {
      final longUrl = 'https://example.com/${'a' * 2048}';
      final bookmark = Bookmark.create(longUrl);
      expect(bookmark.url, equals(longUrl));
    });
  });
}
