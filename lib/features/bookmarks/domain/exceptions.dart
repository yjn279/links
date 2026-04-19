class InvalidUrlException implements Exception {
  const InvalidUrlException(this.message);

  final String message;

  @override
  String toString() => 'InvalidUrlException: $message';
}
