import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<ProviderContainer> pumpScreen(
  WidgetTester tester,
  Widget widget, {
  List<Override> overrides = const [],
}) async {
  final container = ProviderContainer(overrides: overrides);
  addTearDown(container.dispose);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp(home: widget),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}

Future<ProviderContainer> pumpRouterApp(
  WidgetTester tester,
  RouterConfig<Object> routerConfig, {
  List<Override> overrides = const [],
}) async {
  final container = ProviderContainer(overrides: overrides);
  addTearDown(container.dispose);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp.router(routerConfig: routerConfig),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}
