import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:links/app.dart';
import 'package:links/core/database/app_database.dart';
import 'package:links/features/bookmarks/data/bookmark_repository_impl.dart';
import 'package:links/features/bookmarks/presentation/bookmarks_notifier.dart';
import 'package:links/features/tags/data/tag_repository_impl.dart';
import 'package:links/features/tags/presentation/tags_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final dbFolder = await getApplicationDocumentsDirectory();
  final dbFile = File(p.join(dbFolder.path, 'links.sqlite'));
  final database = AppDatabase(NativeDatabase.createInBackground(dbFile));

  runApp(
    ProviderScope(
      overrides: [
        bookmarkRepositoryProvider.overrideWithValue(
          BookmarkRepositoryImpl(database),
        ),
        tagRepositoryProvider.overrideWithValue(
          TagRepositoryImpl(database),
        ),
      ],
      child: const LinksApp(),
    ),
  );
}
