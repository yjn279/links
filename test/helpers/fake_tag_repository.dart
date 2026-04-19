import 'dart:async';
import 'package:links/features/tags/domain/tag_repository.dart';

class FakeTagRepository implements TagRepository {
  FakeTagRepository({List<String> initial = const []})
      : _tags = List.of(initial);

  final List<String> _tags;
  final StreamController<List<String>> _controller =
      StreamController<List<String>>.broadcast();

  void setTags(List<String> tags) {
    _tags
      ..clear()
      ..addAll(tags);
    _controller.add(List.unmodifiable(_tags));
  }

  @override
  Future<List<String>> getAllTags() async =>
      List.unmodifiable(_tags..sort());

  @override
  Stream<List<String>> watchAllTags() {
    Future<void>.microtask(() {
      if (!_controller.isClosed) {
        _controller.add(List.unmodifiable(_tags..sort()));
      }
    });
    return _controller.stream;
  }

  Future<void> close() async => _controller.close();
}
