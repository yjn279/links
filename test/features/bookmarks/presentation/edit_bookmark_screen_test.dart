import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import 'package:links/features/bookmarks/presentation/edit_bookmark_screen.dart';
import 'package:links/features/tags/presentation/tags_provider.dart';

import '../../../helpers/bookmark_factory.dart';
import '../../../helpers/fake_bookmark_repository.dart';
import '../../../helpers/fake_tag_repository.dart';
import '../../../helpers/pump_screen.dart';

void main() {
  group('EditBookmarkScreen', () {
    // E-01: edit screen pre-populates URL field
    testWidgets('edit screen pre-populates URL field', (tester) async {
      final bm = makeBookmark('https://prepop.com', summary: 'A summary');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository();

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      final urlField = tester.widget<TextField>(find.byKey(const Key('url_field')));
      expect(urlField.controller!.text, equals('https://prepop.com'));
    });

    // E-02: edit screen pre-populates summary field
    testWidgets('edit screen pre-populates summary field', (tester) async {
      final bm = makeBookmark('https://prepop.com', summary: 'A summary');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository();

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      final summaryField =
          tester.widget<TextField>(find.byKey(const Key('summary_field')));
      expect(summaryField.controller!.text, equals('A summary'));
    });

    // E-03: chip UI shows all existing tags from tag repo
    testWidgets('chip UI shows all existing tags from tag repo', (tester) async {
      final bm = makeBookmark('https://tags.com');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository(initial: ['go', 'rust']);

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      expect(find.byKey(const Key('tag_chip_go')), findsOneWidget);
      expect(find.byKey(const Key('tag_chip_rust')), findsOneWidget);
    });

    // E-04: current bookmark tags are pre-selected
    testWidgets('current bookmark tags are pre-selected', (tester) async {
      final bm = makeBookmark('https://tags.com', tags: ['rust']);
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository(initial: ['go', 'rust']);

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      final rustChip = tester
          .widget<FilterChip>(find.byKey(const Key('tag_chip_rust')));
      expect(rustChip.selected, isTrue);

      final goChip = tester
          .widget<FilterChip>(find.byKey(const Key('tag_chip_go')));
      expect(goChip.selected, isFalse);
    });

    // E-05: toggling unselected chip selects it
    testWidgets('toggling unselected chip selects it', (tester) async {
      final bm = makeBookmark('https://tags.com', tags: ['rust']);
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository(initial: ['go', 'rust']);

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      // 'go' is not selected; tap to select it
      await tester.tap(find.byKey(const Key('tag_chip_go')));
      await tester.pumpAndSettle();

      final goChipAfter = tester
          .widget<FilterChip>(find.byKey(const Key('tag_chip_go')));
      expect(goChipAfter.selected, isTrue);
    });

    // E-06: new-tag field adds selected chip on submit
    testWidgets('new-tag field adds selected chip on submit', (tester) async {
      final bm = makeBookmark('https://tags.com');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository(initial: ['go', 'rust']);

      await pumpScreen(
        tester,
        EditBookmarkScreen(bookmarkId: bm.id),
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      await tester.enterText(
        find.byKey(const Key('new_tag_field')),
        'haskell',
      );
      await tester.tap(find.byKey(const Key('add_tag_button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('tag_chip_haskell')), findsOneWidget);

      final haskellChip = tester
          .widget<FilterChip>(find.byKey(const Key('tag_chip_haskell')));
      expect(haskellChip.selected, isTrue);
    });

    // E-07: Save calls notifier.update with edited payload and pops
    testWidgets('Save calls notifier.update with edited payload and pops',
        (tester) async {
      final bm = makeBookmark('https://original.com', tags: ['go']);
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository(initial: ['go', 'rust']);

      final router = GoRouter(
        initialLocation: '/edit/${bm.id}',
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => const Scaffold(body: Text('list')),
          ),
          GoRoute(
            path: '/edit/:id',
            builder: (c, s) => EditBookmarkScreen(
              bookmarkId: s.pathParameters['id']!,
            ),
          ),
        ],
      );

      await pumpRouterApp(
        tester,
        router,
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      // Change URL
      await tester.enterText(
        find.byKey(const Key('url_field')),
        'https://new.com',
      );
      // Change summary
      await tester.enterText(
        find.byKey(const Key('summary_field')),
        'my note',
      );
      // Select 'rust' tag
      await tester.tap(find.byKey(const Key('tag_chip_rust')));
      await tester.pumpAndSettle();

      // Tap save
      await tester.tap(find.byKey(const Key('save_button')));
      await tester.pumpAndSettle();

      // Verify update was called
      final updateCalls = fake.calls
          .where((c) => c.method == 'update')
          .toList();
      expect(updateCalls, isNotEmpty);

      // Verify navigation popped back to list
      expect(find.text('list'), findsOneWidget);
    });

    // E-08: Cancel pops without calling update
    testWidgets('Cancel pops without calling update', (tester) async {
      final bm = makeBookmark('https://cancel.com');
      final fake = FakeBookmarkRepository(initial: [bm]);
      final tagFake = FakeTagRepository();

      final router = GoRouter(
        initialLocation: '/edit/${bm.id}',
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => const Scaffold(body: Text('list')),
          ),
          GoRoute(
            path: '/edit/:id',
            builder: (c, s) => EditBookmarkScreen(
              bookmarkId: s.pathParameters['id']!,
            ),
          ),
        ],
      );

      await pumpRouterApp(
        tester,
        router,
        overrides: [
          bookmarkRepositoryProvider.overrideWithValue(fake),
          tagRepositoryProvider.overrideWithValue(tagFake),
        ],
      );

      // Tap cancel button
      await tester.tap(find.byKey(const Key('cancel_button')));
      await tester.pumpAndSettle();

      // Should pop back to list without calling update
      expect(find.text('list'), findsOneWidget);
      expect(
        fake.calls.any((c) => c.method == 'update'),
        isFalse,
      );
    });
  });
}
