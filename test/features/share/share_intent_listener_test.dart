import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import 'package:links/features/share/domain/share_intent_source.dart';
import 'package:links/features/share/presentation/share_providers.dart';
import '../../helpers/fake_bookmark_repository.dart';

class _FakeShareIntentSource implements ShareIntentSource {
  _FakeShareIntentSource({this.initial});
  final String? initial;
  final StreamController<String> _controller =
      StreamController<String>.broadcast();

  void emit(String url) => _controller.add(url);

  @override
  Future<String?> getInitialUrl() async => initial;

  @override
  Stream<String> get urlStream => _controller.stream;

  @override
  Future<void> reset() async => _controller.close();
}

void main() {
  group('share intent listener', () {
    test('cold-start URL is added to bookmarks on activation', () async {
      final fakeRepo = FakeBookmarkRepository();
      final source = _FakeShareIntentSource(initial: 'https://cold.com');
      final container = ProviderContainer(overrides: [
        bookmarkRepositoryProvider.overrideWithValue(fakeRepo),
        shareIntentSourceProvider.overrideWithValue(source),
      ],
    );
      addTearDown(container.dispose);

      await container.read(bookmarksNotifierProvider.future);
      container.read(shareIntentListenerProvider);

      for (var i = 0; i < 10; i++) {
        await Future<void>.delayed(Duration.zero);
      }

      final list = container.read(bookmarksNotifierProvider).value!;
      expect(list.length, equals(1));
      expect(list.first.url, equals('https://cold.com'));
    });

    test('warm URLs emitted on the stream are added to bookmarks', () async {
      final fakeRepo = FakeBookmarkRepository();
      final source = _FakeShareIntentSource();
      final container = ProviderContainer(overrides: [
        bookmarkRepositoryProvider.overrideWithValue(fakeRepo),
        shareIntentSourceProvider.overrideWithValue(source),
      ],
    );
      addTearDown(container.dispose);

      await container.read(bookmarksNotifierProvider.future);
      container.read(shareIntentListenerProvider);

      source.emit('https://first.com');
      source.emit('https://second.com');

      for (var i = 0; i < 10; i++) {
        await Future<void>.delayed(Duration.zero);
      }

      final urls = container
          .read(bookmarksNotifierProvider)
          .value!
          .map((b) => b.url)
          .toList();
      expect(urls, containsAll(['https://first.com', 'https://second.com']));
    });
  });
}
