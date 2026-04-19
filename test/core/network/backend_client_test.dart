import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:links/core/network/backend_client.dart';

void main() {
  group('BackendClient.summarize', () {
    test('returns SummaryResult on 200', () async {
      final mock = MockClient((req) async {
        return http.Response(
          '{"summary":"A summary.","title":"Title"}',
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = BackendClient(
        baseUrl: 'https://api.example.com',
        bearerToken: 'secret',
        httpClient: mock,
      );
      final result = await client.summarize('https://target.com');
      expect(result.summary, equals('A summary.'));
      expect(result.title, equals('Title'));
    });

    test('sends bearer token and url in body', () async {
      http.Request? captured;
      final mock = MockClient((req) async {
        captured = req;
        return http.Response('{"summary":"ok","title":null}', 200);
      });
      final client = BackendClient(
        baseUrl: 'https://api.example.com',
        bearerToken: 'my-token',
        httpClient: mock,
      );
      await client.summarize('https://page.com');
      expect(captured!.headers['authorization'], equals('Bearer my-token'));
      expect(captured!.body, contains('"url":"https://page.com"'));
    });

    test('throws BackendException on non-200', () async {
      final mock = MockClient((req) async {
        return http.Response('{"error":"bad"}', 500);
      });
      final client = BackendClient(
        baseUrl: 'https://api.example.com',
        bearerToken: 'secret',
        httpClient: mock,
      );
      expect(
        () => client.summarize('https://x.com'),
        throwsA(isA<BackendException>()),
      );
    });

    test('throws when baseUrl is empty', () async {
      final client = BackendClient(
        baseUrl: '',
        bearerToken: 'secret',
        httpClient: MockClient((_) async => http.Response('', 200)),
      );
      expect(
        () => client.summarize('https://x.com'),
        throwsA(isA<BackendException>()),
      );
    });
  });
}
