import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

/// Abstraction over opening external URLs.
///
/// Extracted from [url_launcher] so widget tests can inject a fake without
/// tripping over platform channels.
abstract class UrlOpener {
  Future<bool> open(String url);
}

class DefaultUrlOpener implements UrlOpener {
  const DefaultUrlOpener();

  @override
  Future<bool> open(String url) async {
    final uri = Uri.parse(url);
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

final urlOpenerProvider = Provider<UrlOpener>((ref) {
  return const DefaultUrlOpener();
});
