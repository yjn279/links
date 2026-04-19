import 'dart:convert';
import 'package:http/http.dart' as http;

class SummaryResult {
  const SummaryResult({required this.summary, required this.title});
  final String summary;
  final String? title;
}

class BackendException implements Exception {
  const BackendException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => 'BackendException($statusCode): $message';
}

class BackendClient {
  BackendClient({
    required this.baseUrl,
    required this.bearerToken,
    http.Client? httpClient,
  }) : _client = httpClient ?? http.Client();

  final String baseUrl;
  final String bearerToken;
  final http.Client _client;

  Future<SummaryResult> summarize(String url) async {
    if (baseUrl.isEmpty || bearerToken.isEmpty) {
      throw const BackendException(
        'Backend is not configured. Pass LINKS_BACKEND_URL and LINKS_BACKEND_TOKEN via --dart-define.',
      );
    }

    final endpoint = Uri.parse('$baseUrl/summarize');
    final response = await _client.post(
      endpoint,
      headers: {
        'authorization': 'Bearer $bearerToken',
        'content-type': 'application/json',
      },
      body: jsonEncode({'url': url}),
    );

    if (response.statusCode != 200) {
      throw BackendException(
        'Summarize request failed: ${response.body}',
        statusCode: response.statusCode,
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return SummaryResult(
      summary: decoded['summary'] as String,
      title: decoded['title'] as String?,
    );
  }

  void close() => _client.close();
}
