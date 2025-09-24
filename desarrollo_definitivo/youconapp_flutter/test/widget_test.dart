import 'package:flutter_test/flutter_test.dart';
import 'package:youconapp_flutter/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('smoke test: app builds', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: YouConApp()));
    expect(find.text('YouConApp'), findsOneWidget, reason: 'Título o estructura base debería existir');
  });
}
