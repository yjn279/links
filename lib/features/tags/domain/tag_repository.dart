abstract class TagRepository {
  Future<List<String>> getAllTags();
  Stream<List<String>> watchAllTags();
}
