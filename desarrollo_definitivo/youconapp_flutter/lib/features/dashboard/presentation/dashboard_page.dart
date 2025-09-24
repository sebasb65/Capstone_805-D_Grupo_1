import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';               
import '../../auth/data/auth_repo.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authRepoProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
          tooltip: 'Salir',
          icon: const Icon(Icons.logout),
          onPressed: () async {
            await auth.signOut();
            if (context.mounted) context.go('/login'); 
          },
        ),

        ],
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('KPIs vendrán aquí'),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.push('/labores'), 
              icon: const Icon(Icons.work),
              label: const Text('Ir a Labores'),
            ),
          ],
        ),
      ),
    );
  }
}
