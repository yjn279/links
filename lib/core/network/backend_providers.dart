import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:links/core/constants.dart';
import 'package:links/core/network/backend_client.dart';

final backendClientProvider = Provider<BackendClient>((ref) {
  final client = BackendClient(
    baseUrl: AppConfig.backendUrl,
    bearerToken: AppConfig.backendToken,
  );
  ref.onDispose(client.close);
  return client;
});

abstract class SummarizeService {
  Future<SummaryResult> summarize(String url);
}

class BackendSummarizeService implements SummarizeService {
  BackendSummarizeService(this._client);
  final BackendClient _client;

  @override
  Future<SummaryResult> summarize(String url) => _client.summarize(url);
}

final summarizeServiceProvider = Provider<SummarizeService>((ref) {
  return BackendSummarizeService(ref.watch(backendClientProvider));
});
