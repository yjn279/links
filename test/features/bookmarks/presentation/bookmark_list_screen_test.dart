import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/bookmark_repository.dart';
import 'package:links/features/bookmarks/presentation/bookmark_list_screen.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';

import '../../../helpers/bookmark_factory.dart';
import '../../../helpers/fake_bookmark_repository.dart';
import '../../../helpers/pump_screen.dart';

class _SlowFakeRepository implements BookmarkRepository {
  final _completer = Completer<List<Bookmark>>();

  @override
  Future<List<Bookmark>> getAll() => _completer.future;

  @override
  Stream<List<Bookmark>> watchAll() => const Stream.empty();

  @override
  Future<void> add(Bookmark _) async {}

  @override
  Future<void> update(Bookmark _) async {}

  @override
  Future<void> delete(String _) async {}
}

class _FailingFakeRepository implements BookmarkRepository {
  @override
  Future<List<Bookmark>> getAll() async => throw Exception('boom');

  @override
  Stream<List<Bookmark>> watchAll() => const Stream.empty();

  @override
  Future<void> add(Bookmark _) async {}

  @override
  Future<void> update(Bookmark _) async {}

  @override
  Future<void> delete(String _) async {}
}

void main() {
  group('BookmarkListScreen', () {
    // W-01: shows empty state widget when list is empty
    testWidgets('shows empty state widget when list is empty', (tester) async {
      final fake = FakeBookmarkRepository();
      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      expect(find.byKey(const Key('empty_state')), findsOneWidget);
      expect(find.text('No bookmarks yet'), findsOneWidget);
    });

    // W-02: shows one row per bookmark
    testWidgets('shows one row per bookmark', (tester) async {
      final bm1 = makeBookmark('https://one.com');
      final bm2 = makeBookmark('https://two.com');
      final fake = FakeBookmarkRepository(initial: [bm1, bm2]);

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      expect(find.byType(ListTile), findsNWidgets(2));
    });

    // W-03: row displays title when non-null
    testWidgets('row displays title when non-null', (tester) async {
      final bm = makeBookmark('https://mysite.com', title: 'My Site');
      final fake = FakeBookmarkRepository(initial: [bm]);

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      expect(find.text('My Site'), findsOneWidget);
    });

    // W-04: row displays url when title is null
    testWidgets('row displays url when title is null', (tester) async {
      final bm = makeBookmark('https://x.com');
      final fake = FakeBookmarkRepository(initial: [bm]);

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      expect(find.text('https://x.com'), findsOneWidget);
    });

    // W-05: tapping row navigates to edit screen
    testWidgets('tapping row navigates to edit screen', (tester) async {
      final bm = makeBookmark('https://nav.com');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final expectedId = bm.id;

      final router = GoRouter(
        initialLocation: '/',
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => const BookmarkListScreen(),
          ),
          GoRoute(
            path: '/edit/:id',
            builder: (c, s) => Scaffold(
              appBar: AppBar(),
              body: Text('edit-${s.pathParameters['id']}'),
            ),
          ),
        ],
      );

      await pumpRouterApp(
        tester,
        router,
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      await tester.tap(find.byType(ListTile).first);
      await tester.pumpAndSettle();

      expect(find.text('edit-$expectedId'), findsOneWidget);
    });

    // W-06: FAB opens add-bookmark dialog
    testWidgets('FAB opens add-bookmark dialog', (tester) async {
      final fake = FakeBookmarkRepository();

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      await tester.tap(find.byKey(const Key('add_bookmark_fab')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('url_input')), findsOneWidget);
    });

    // W-07: valid URL in dialog adds row and closes dialog
    testWidgets('valid URL in dialog adds row and closes dialog', (tester) async {
      final fake = FakeBookmarkRepository();

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      // Open dialog
      await tester.tap(find.byKey(const Key('add_bookmark_fab')));
      await tester.pumpAndSettle();

      // Enter URL
      await tester.enterText(
        find.byKey(const Key('url_input')),
        'https://added.com',
      );
      await tester.tap(find.byKey(const Key('add_confirm')));
      await tester.pumpAndSettle();

      // Dialog should be gone and row should appear
      expect(find.byKey(const Key('url_input')), findsNothing);
      expect(find.text('https://added.com'), findsOneWidget);
    });

    // W-08: invalid URL in dialog shows validation error
    testWidgets('invalid URL in dialog shows validation error', (tester) async {
      final fake = FakeBookmarkRepository();

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      // Open dialog
      await tester.tap(find.byKey(const Key('add_bookmark_fab')));
      await tester.pumpAndSettle();

      // Enter invalid URL
      await tester.enterText(
        find.byKey(const Key('url_input')),
        'not a url',
      );
      await tester.tap(find.byKey(const Key('add_confirm')));
      await tester.pumpAndSettle();

      // Error text visible, dialog still open
      expect(find.text('Invalid URL'), findsOneWidget);
      expect(find.byKey(const Key('url_input')), findsOneWidget);
    });

    // W-09: swipe dismiss calls delete and removes row
    testWidgets('swipe dismiss calls delete and removes row', (tester) async {
      final bm = makeBookmark('https://dismiss.com');
      final fake = FakeBookmarkRepository(initial: [bm]);

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
        ],
      );

      // Confirm row is there
      expect(find.byType(Dismissible), findsOneWidget);

      // Swipe left to dismiss
      await tester.drag(
        find.byType(Dismissible).first,
        const Offset(-500, 0),
      );
      await tester.pumpAndSettle();

      // Row should be gone
      expect(find.byType(ListTile), findsNothing);
      // Verify delete was called
      expect(
        fake.calls.any((c) => c.method == 'delete' && c.arg == bm.id),
        isTrue,
      );
    });

    // W-10: shows loading indicator while notifier is loading
    testWidgets('shows loading indicator while notifier is loading',
        (tester) async {
      final slow = _SlowFakeRepository();

      final container = ProviderContainer(
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(slow),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: BookmarkListScreen()),
        ),
      );
      // Do NOT pumpAndSettle — the future never completes.
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    // W-11: shows error state when notifier errors during load
    testWidgets('shows error state when notifier errors during load',
        (tester) async {
      final failing = _FailingFakeRepository();

      await pumpScreen(
        tester,
        const BookmarkListScreen(),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(failing),
        ],
      );

      expect(find.byKey(const Key('error_state')), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });
}
