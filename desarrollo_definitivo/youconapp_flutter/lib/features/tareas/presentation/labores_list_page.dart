import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import '../../auth/data/auth_repo.dart';
import '../data/labores_repo.dart';
import '../domain/labor.dart';
import 'labores_filters.dart';

final _laboresStreamProvider = StreamProvider.autoDispose<List<Labor>>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  final repo = ref.watch(laboresRepoProvider);
  final agricultorId = auth.currentUser?.uid ?? 'unknown';

  final filter = ref.watch(laboresDateRangeProvider);
  return repo.streamLabores(
    agricultorId: agricultorId,
    fromISO: filter.fromISO,
    toISO: filter.toISO,
  );
});

class LaboresListPage extends ConsumerWidget {
  const LaboresListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final laboresAsync = ref.watch(_laboresStreamProvider);
    final filter = ref.watch(laboresDateRangeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Labores'),
        actions: [
          IconButton(
            tooltip: 'Filtrar fechas',
            icon: const Icon(Icons.filter_alt),
            onPressed: () async {
              final now = DateTime.now();
              final initialFirst = _tryParseISO(filter.fromISO) ?? DateTime(now.year, now.month, 1);
              final initialLast  = _tryParseISO(filter.toISO)   ?? DateTime(now.year, now.month + 1, 0);

              final picked = await showDateRangePicker(
                context: context,
                firstDate: DateTime(now.year - 2),
                lastDate: DateTime(now.year + 2),
                initialDateRange: DateTimeRange(start: initialFirst, end: initialLast),
              );
              if (picked != null) {
                final fmt = DateFormat('yyyy-MM-dd');
                ref.read(laboresDateRangeProvider.notifier).state = DateRangeFilter(
                  fromISO: fmt.format(picked.start),
                  toISO:   fmt.format(picked.end),
                );
              }
            },
          ),
          if (filter.hasFilter)
            IconButton(
              tooltip: 'Limpiar filtro',
              icon: const Icon(Icons.clear),
              onPressed: () {
                ref.read(laboresDateRangeProvider.notifier).state = const DateRangeFilter();
              },
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/labores/new'),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          if (filter.hasFilter)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Filtro: ${filter.fromISO ?? '-'} → ${filter.toISO ?? '-'}',
                      style: const TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: laboresAsync.when(
              data: (items) {
                if (items.isEmpty) return const Center(child: Text('Sin registros'));
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final l = items[i];
                    return ListTile(
                      title: Text('${l.fechaISO} • Trab: ${l.trabajadorId} • Horas: ${l.horas}'),
                      subtitle: Text('Cultivo: ${l.cultivoId} • Tarifa: ${l.tarifa} • Estado: ${l.estado}'),
                      onTap: () => context.push('/labores/${l.id}'),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }

  DateTime? _tryParseISO(String? iso) {
    if (iso == null) return null;
    final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(iso);
    if (m == null) return null;
    return DateTime(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!));
    }
}
