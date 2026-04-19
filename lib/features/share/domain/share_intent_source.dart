import 'dart:async';

/// Abstract source of inbound share-sheet URLs.
///
/// Two streams are important:
/// - [initialUrl] resolves to the URL that launched the app from a cold start,
///   or null if the app was started normally. Should be checked exactly once.
/// - [urlStream] emits URLs the user shares while the app is already running.
abstract class ShareIntentSource {
  Future<String?> getInitialUrl();
  Stream<String> get urlStream;
  Future<void> reset();
}
