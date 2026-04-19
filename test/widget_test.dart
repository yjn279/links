import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:links/app.dart';

void main() {
  testWidgets('smoke test: LinksApp renders MaterialApp', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: LinksApp()),
    );

    // Verify a MaterialApp is present in the widget tree.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
