import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../auth/data/auth_repo.dart';
import '../domain/labor.dart';
import '../data/labores_repo.dart';

// Trabajador
import '../../trabajadores/data/trabajadores_repo.dart';
import '../../trabajadores/domain/trabajador.dart';

// Cultivo
import '../../cultivos/data/cultivos_repo.dart';
import '../../cultivos/domain/cultivo.dart';

class LaborFormPage extends ConsumerStatefulWidget {
  const LaborFormPage({super.key, this.id});
  final String? id;

  @override
  ConsumerState<LaborFormPage> createState() => _LaborFormPageState();
}

class _LaborFormPageState extends ConsumerState<LaborFormPage> {
  final _formKey = GlobalKey<FormState>();

  // CONTROLES
  final _trabCtrl = TextEditingController();      // ID trabajador (oculto)
  final _trabNameCtrl = TextEditingController();  // Nombre trabajador visible

  final _cultCtrl = TextEditingController();      // ID cultivo (oculto)
  final _cultNameCtrl = TextEditingController();  // Nombre cultivo visible

  final _fechaCtrl = TextEditingController();
  final _horasCtrl = TextEditingController();
  final _tarifaCtrl = TextEditingController();

  bool _loading = false;
  Labor? _before;
  Trabajador? _trabSel;
  Cultivo? _cultSel;

  @override
  void initState() {
    super.initState();
    _fechaCtrl.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
    if (widget.id != null) _load();
  }

  Future<void> _load() async {
    final repo = ref.read(laboresRepoProvider);
    final l = await repo.getById(widget.id!);
    if (l != null) {
      setState(() {
        _before = l;

        // Trabajador (dejamos ID y mostramos ID hasta que elijan en el selector)
        _trabCtrl.text = l.trabajadorId;
        _trabNameCtrl.text = l.trabajadorId;

        // Cultivo (igual que arriba)
        _cultCtrl.text = l.cultivoId;
        _cultNameCtrl.text = l.cultivoId;

        _fechaCtrl.text = l.fechaISO;
        _horasCtrl.text = l.horas.toString();
        _tarifaCtrl.text = l.tarifa.toString();
      });
    }
  }

  @override
  void dispose() {
    _trabCtrl.dispose();
    _trabNameCtrl.dispose();
    _cultCtrl.dispose();
    _cultNameCtrl.dispose();
    _fechaCtrl.dispose();
    _horasCtrl.dispose();
    _tarifaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(firebaseAuthProvider);
    final repo = ref.watch(laboresRepoProvider);
    final agricultorId = auth.currentUser?.uid ?? 'unknown'; // TODO: claims

    return Scaffold(
      appBar: AppBar(title: Text(widget.id == null ? 'Nueva labor' : 'Editar labor')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ======== TRABAJADOR (selector) ========
            TextFormField(
              controller: _trabNameCtrl,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Trabajador',
                hintText: 'Selecciona un trabajador',
                suffixIcon: Icon(Icons.expand_more),
              ),
              validator: (_) =>
                  (_trabSel == null && _trabCtrl.text.trim().isEmpty)
                      ? 'Selecciona un trabajador'
                      : null,
              onTap: () async {
                final picked = await showModalBottomSheet<Trabajador>(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => const _TrabajadorPickerSheet(),
                );
                if (picked != null) {
                  setState(() {
                    _trabSel = picked;
                    _trabCtrl.text = picked.id;                 // guardamos id
                    _trabNameCtrl.text = picked.nombreCompleto; // mostramos nombre
                  });
                }
              },
            ),
            const SizedBox(height: 8),

            // ======== CULTIVO (selector) ========
            TextFormField(
              controller: _cultNameCtrl,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Cultivo',
                hintText: 'Selecciona un cultivo',
                suffixIcon: Icon(Icons.expand_more),
              ),
              validator: (_) =>
                  (_cultSel == null && _cultCtrl.text.trim().isEmpty)
                      ? 'Selecciona un cultivo'
                      : null,
              onTap: () async {
                final picked = await showModalBottomSheet<Cultivo>(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => const _CultivoPickerSheet(),
                );
                if (picked != null) {
                  setState(() {
                    _cultSel = picked;
                    _cultCtrl.text = picked.id;            // guardamos id
                    _cultNameCtrl.text = picked.nombre;    // mostramos nombre
                  });
                }
              },
            ),
            const SizedBox(height: 8),

            // ======== FECHA (con date-picker) ========
            TextFormField(
              controller: _fechaCtrl,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Fecha (YYYY-MM-DD)',
                suffixIcon: Icon(Icons.calendar_today),
              ),
              onTap: () async {
                final now = DateTime.now();
                final initial = _parseISO(_fechaCtrl.text) ?? now;
                final picked = await showDatePicker(
                  context: context,
                  initialDate: initial,
                  firstDate: DateTime(now.year - 2),
                  lastDate: DateTime(now.year + 2),
                );
                if (picked != null) {
                  _fechaCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
                }
              },
              validator: (v) =>
                  (v == null || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(v))
                      ? 'Formato inválido'
                      : null,
            ),
            const SizedBox(height: 8),

            // ======== HORAS ========
            TextFormField(
              controller: _horasCtrl,
              decoration: const InputDecoration(labelText: 'Horas'),
              keyboardType: TextInputType.number,
              validator: (v) {
                final n = num.tryParse(v ?? '');
                if (n == null || n <= 0) return 'Horas inválidas';
                return null;
              },
            ),
            const SizedBox(height: 8),

            // ======== TARIFA ========
            TextFormField(
              controller: _tarifaCtrl,
              decoration: const InputDecoration(labelText: 'Tarifa'),
              keyboardType: TextInputType.number,
              validator: (v) {
                final n = num.tryParse(v ?? '');
                if (n == null || n < 0) return 'Tarifa inválida';
                return null;
              },
            ),
            const SizedBox(height: 16),

            FilledButton(
              onPressed: _loading
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      setState(() => _loading = true);
                      try {
                        final labor = Labor(
                          id: widget.id ?? '',
                          agricultorId: agricultorId,
                          trabajadorId:
                              _trabSel?.id ?? _trabCtrl.text.trim(),
                          cultivoId:
                              _cultSel?.id ?? _cultCtrl.text.trim(),
                          fechaISO: _fechaCtrl.text.trim(),
                          horas: num.parse(_horasCtrl.text.trim()),
                          tarifa: num.parse(_tarifaCtrl.text.trim()),
                          estado: 'activo',
                          createdAt: _before?.createdAt,
                          updatedAt: DateTime.now(),
                          updatedByDeviceId: 'device-unknown',
                        );

                        if (widget.id == null) {
                          await repo.createLabor(labor);
                          if (mounted) context.pop(); // vuelve a lista
                        } else {
                          await repo.updateLabor(_before!, labor,
                              reason: 'Edición manual');
                          if (mounted) context.pop();
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      } finally {
                        if (mounted) setState(() => _loading = false);
                      }
                    },
              child: Text(_loading ? 'Guardando…' : 'Guardar'),
            ),
          ],
        ),
      ),
    );
  }

  DateTime? _parseISO(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    try {
      final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(iso);
      if (m == null) return null;
      return DateTime(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!));
    } catch (_) {
      return null;
    }
  }
}

// ======== BottomSheet selector de Trabajador ========
class _TrabajadorPickerSheet extends ConsumerWidget {
  const _TrabajadorPickerSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stream = ref.watch(trabajadoresRepoProvider).streamActivos();

    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: StreamBuilder<List<Trabajador>>(
          stream: stream,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final list = snap.data ?? const <Trabajador>[];
            if (list.isEmpty) {
              return const Center(child: Text('No hay trabajadores activos'));
            }
            return ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final t = list[i];
                return ListTile(
                  title: Text(t.nombreCompleto),
                  subtitle: Text('Saldo: \$${t.saldoAcumulado}'),
                  onTap: () => Navigator.pop(context, t),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

// ======== BottomSheet selector de Cultivo ========
class _CultivoPickerSheet extends ConsumerWidget {
  const _CultivoPickerSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stream = ref.watch(cultivosRepoProvider).streamActivos();

    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: StreamBuilder<List<Cultivo>>(
          stream: stream,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final list = snap.data ?? const <Cultivo>[];
            if (list.isEmpty) {
              return const Center(child: Text('No hay cultivos activos'));
            }
            return ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final c = list[i];
                return ListTile(
                  title: Text(c.nombre),
                  subtitle: Text(c.descripcion),
                  trailing: Text('Área: ${c.area}'),
                  onTap: () => Navigator.pop(context, c),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
