import 'dart:async';
import 'package:links/features/bookmarks/domain/bookmark.dart';
import 'package:links/features/bookmarks/domain/bookmark_repository.dart';

class FakeBookmarkRepository implements BookmarkRepository {
  FakeBookmarkRepository({List<Bookmark> initial = const []})
      : _items = List.of(initial);

  final List<Bookmark> _items;
  final StreamController<List<Bookmark>> _controller =
      StreamController<List<Bookmark>>.broadcast();
  final List<({String method, Object? arg})> calls = [];
  Exception? _throwNext;

  void throwOnNextCall(Exception e) => _throwNext = e;

  List<Bookmark> _snapshot() {
    final sorted = List<Bookmark>.from(_items)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return List.unmodifiable(sorted);
  }

  void _maybeThrow() {
    if (_throwNext != null) {
      final e = _throwNext!;
      _throwNext = null;
      throw e;
    }
  }

  @override
  Future<List<Bookmark>> getAll() async {
    calls.add((method: 'getAll', arg: null));
    _maybeThrow();
    return _snapshot();
  }

  @override
  Stream<List<Bookmark>> watchAll() {
    calls.add((method: 'watchAll', arg: null));
    // Emit initial state on next tick; broadcast streams don't replay.
    Future<void>.microtask(() {
      if (!_controller.isClosed) _controller.add(_snapshot());
    });
    return _controller.stream;
  }

  @override
  Future<void> add(Bookmark bookmark) async {
    calls.add((method: 'add', arg: bookmark));
    _maybeThrow();
    _items.add(bookmark);
    _controller.add(_snapshot());
  }

  @override
  Future<void> update(Bookmark bookmark) async {
    calls.add((method: 'update', arg: bookmark));
    _maybeThrow();
    final idx = _items.indexWhere((b) => b.id == bookmark.id);
    if (idx >= 0) _items[idx] = bookmark;
    _controller.add(_snapshot());
  }

  @override
  Future<void> delete(String id) async {
    calls.add((method: 'delete', arg: id));
    _maybeThrow();
    _items.removeWhere((b) => b.id == id);
    _controller.add(_snapshot());
  }

  Future<void> close() async => _controller.close();
}
