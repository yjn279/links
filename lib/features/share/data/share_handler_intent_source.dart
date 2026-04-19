import 'dart:async';
import 'package:share_handler/share_handler.dart';
import 'package:links/features/share/domain/share_intent_source.dart';

// NOTE: The exact shape of SharedMedia depends on the share_handler version.
// This adapter targets the common API where:
//   - media.content holds a URL/text string payload, and
//   - media.attachments holds a list of SharedAttachment with a `path` field.
// If the installed version differs (e.g. uses `url` instead of `path`, or
// `text` instead of `content`), adapt _extractUrl accordingly.
class ShareHandlerIntentSource implements ShareIntentSource {
  ShareHandlerIntentSource([ShareHandlerPlatform? platform])
      : _platform = platform ?? ShareHandlerPlatform.instance;

  final ShareHandlerPlatform _platform;
  final StreamController<String> _controller =
      StreamController<String>.broadcast();
  StreamSubscription<SharedMedia>? _sub;
  bool _initialized = false;

  @override
  Future<String?> getInitialUrl() async {
    _ensureStream();
    final initial = await _platform.getInitialSharedMedia();
    return _extractUrl(initial);
  }

  @override
  Stream<String> get urlStream {
    _ensureStream();
    return _controller.stream;
  }

  void _ensureStream() {
    if (_initialized) return;
    _initialized = true;
    _sub = _platform.sharedMediaStream.listen((media) {
      final url = _extractUrl(media);
      if (url != null) _controller.add(url);
    });
  }

  String? _extractUrl(SharedMedia? media) {
    if (media == null) return null;
    // share_handler surfaces the URL/text payload in `content` or `attachments`.
    final content = media.content?.trim();
    if (content != null && content.isNotEmpty && _looksLikeUrl(content)) {
      return content;
    }
    final attachments = media.attachments ?? const [];
    for (final a in attachments) {
      if (a == null) continue;
      final path = a.path;
      if (_looksLikeUrl(path)) return path;
    }
    return null;
  }

  bool _looksLikeUrl(String s) {
    final lower = s.toLowerCase();
    return lower.startsWith('http://') || lower.startsWith('https://');
  }

  @override
  Future<void> reset() async {
    await _sub?.cancel();
    _sub = null;
    _initialized = false;
    await _controller.close();
  }
}
