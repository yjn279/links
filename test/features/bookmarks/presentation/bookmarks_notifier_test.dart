import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/exceptions.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart'
    show bookmarkRepositoryProvider;
import 'package:links/features/bookmarks/domain/bookmark_repository.dart';
import '../../../../test/helpers/fake_bookmark_repository.dart';

ProviderContainer makeContainer(FakeBookmarkRepository fake) =>
    ProviderContainer(
      overrides: [
        bookmarkRepositoryProvider.overrideWithValue(fake),
      ],
    );

void main() {
  group('BookmarksNotifier', () {
    // N-01: initial state transitions from loading to data
    test('initial state transitions from loading to data', () async {
      final fake = FakeBookmarkRepository();
      final container = makeContainer(fake);
      addTearDown(() async {
        container.dispose();
        await fake.close();
      });

      // First read should be AsyncLoading before build() resolves.
      final initialState = container.read(bookmarksNotifierProvider);
      expect(initialState, isA<AsyncLoading<List<Bookmark>>>());

      // After awaiting the future, state should be AsyncData with empty list.
      final result = await container.read(bookmarksNotifierProvider.future);
      expect(result, isEmpty);

      final finalState = container.read(bookmarksNotifierProvider);
      expect(finalState, isA<AsyncData<List<Bookmark>>>());
      expect(finalState.value, isEmpty);
    });

    // N-02: add valid URL prepends bookmark to list
    test('add valid URL prepends bookmark to list', () async {
      final fake = FakeBookmarkRepository();
      final container = makeContainer(fake);
      addTearDown(() async {
        container.dispose();
        await fake.close();
      });

      // Wait for initial load to complete.
      await container.read(bookmarksNotifierProvider.future);

      // Act: add a valid URL.
      await container
          .read(bookmarksNotifierProvider.notifier)
          .add('https://a.com');

      // Flush microtasks / stream events.
      await Future<void>.delayed(Duration.zero);

      final state = container.read(bookmarksNotifierProvider);
      expect(state, isA<AsyncData<List<Bookmark>>>());
      expect(state.value, hasLength(1));
      expect(state.value!.first.url, equals('https://a.com'));
    });

    // N-03: add invalid URL sets error state
    test('add invalid URL sets error state', () async {
      final fake = FakeBookmarkRepository();
      final container = makeContainer(fake);
      addTearDown(() async {
        container.dispose();
        await fake.close();
      });

      // Wait for initial load to complete.
      await container.read(bookmarksNotifierProvider.future);

      // Act: add an invalid URL.
      await container
          .read(bookmarksNotifierProvider.notifier)
          .add('bad url');

      await Future<void>.delayed(Duration.zero);

      final state = container.read(bookmarksNotifierProvider);
      expect(state, isA<AsyncError<List<Bookmark>>>());
      expect(
        (state as AsyncError<List<Bookmark>>).error,
        isA<InvalidUrlException>(),
      );
    });

    // N-04: delete removes bookmark from state
    test('delete removes bookmark from state', () async {
      final seed = Bookmark.create('https://seed.com');
      final fake = FakeBookmarkRepository(initial: [seed]);
      final container = makeContainer(fake);
      addTearDown(() async {
        container.dispose();
        await fake.close();
      });

      // Wait for initial load.
      await container.read(bookmarksNotifierProvider.future);

      // Confirm one bookmark in initial state.
      expect(container.read(bookmarksNotifierProvider).value, hasLength(1));

      // Act: delete the bookmark.
      await container
          .read(bookmarksNotifierProvider.notifier)
          .delete(seed.id);

      await Future<void>.delayed(Duration.zero);

      final state = container.read(bookmarksNotifierProvider);
      expect(state, isA<AsyncData<List<Bookmark>>>());
      expect(state.value, isEmpty);
    });

    // N-05: update persists changes and refreshes state
    test('update persists changes and refreshes state', () async {
      final original = Bookmark.create('https://original.com');
      final fake = FakeBookmarkRepository(initial: [original]);
      final container = makeContainer(fake);
      addTearDown(() async {
        container.dispose();
        await fake.close();
      });

      // Wait for initial load.
      await container.read(bookmarksNotifierProvider.future);

      // Act: update the bookmark title.
      final edited = original.copyWith(title: 'Updated Title');
      await container
          .read(bookmarksNotifierProvider.notifier)
          .update(edited);

      await Future<void>.delayed(Duration.zero);

      final state = container.read(bookmarksNotifierProvider);
      expect(state, isA<AsyncData<List<Bookmark>>>());
      expect(state.value!.first.title, equals('Updated Title'));
    });
  });
}
