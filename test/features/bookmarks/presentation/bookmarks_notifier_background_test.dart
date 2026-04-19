import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/core/network/backend_client.dart';
import 'package:links/core/network/backend_providers.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import '../../../helpers/fake_bookmark_repository.dart';

class _FakeSummarizeService implements SummarizeService {
  _FakeSummarizeService(this.result);
  final SummaryResult result;
  int calls = 0;
  @override
  Future<SummaryResult> summarize(String url) async {
    calls++;
    return result;
  }
}

class _FailingSummarizeService implements SummarizeService {
  @override
  Future<SummaryResult> summarize(String url) async {
    throw Exception('boom');
  }
}

void main() {
  group('BookmarksNotifier add with summarize', () {
    test('updates bookmark with summary and title after background call',
        () async {
      final fake = FakeBookmarkRepository();
      final summarizer = _FakeSummarizeService(
        const SummaryResult(summary: 'Auto summary', title: 'Auto title'),
      );
      final container = ProviderContainer(overrides: [
        bookmarkRepositoryProvider.overrideWithValue(fake),
        summarizeServiceProvider.overrideWithValue(summarizer),
      ]);
      addTearDown(container.dispose);

      await container.read(bookmarksNotifierProvider.future);
      await container
          .read(bookmarksNotifierProvider.notifier)
          .add('https://example.com');

      // Let the background summarize + update call chain complete.
      for (var i = 0; i < 10; i++) {
        await Future<void>.delayed(Duration.zero);
      }

      final list = container.read(bookmarksNotifierProvider).value!;
      expect(list.length, equals(1));
      expect(list.first.title, equals('Auto title'));
      expect(list.first.summary, equals('Auto summary'));
      expect(summarizer.calls, equals(1));
    });

    test('still saves bookmark when summarize fails', () async {
      final fake = FakeBookmarkRepository();
      final container = ProviderContainer(overrides: [
        bookmarkRepositoryProvider.overrideWithValue(fake),
        summarizeServiceProvider.overrideWithValue(_FailingSummarizeService()),
      ]);
      addTearDown(container.dispose);

      await container.read(bookmarksNotifierProvider.future);
      await container
          .read(bookmarksNotifierProvider.notifier)
          .add('https://ok.com');

      for (var i = 0; i < 10; i++) {
        await Future<void>.delayed(Duration.zero);
      }

      final list = container.read(bookmarksNotifierProvider).value!;
      expect(list.length, equals(1));
      expect(list.first.url, equals('https://ok.com'));
      expect(list.first.title, isNull);
      expect(list.first.summary, isNull);
    });
  });
}
