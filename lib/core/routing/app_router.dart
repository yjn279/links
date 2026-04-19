import 'package:go_router/go_router.dart';
import 'package:links/features/bookmarks/presentation/bookmark_list_screen.dart';
import 'package:links/features/bookmarks/presentation/edit_bookmark_screen.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const BookmarkListScreen(),
    ),
    GoRoute(
      path: '/edit/:id',
      builder: (context, state) => EditBookmarkScreen(
        bookmarkId: state.pathParameters['id']!,
      ),
    ),
  ],
);
