import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repo.dart';
import '../domain/labor.dart';
import '../data/labores_repo.dart';
import 'package:intl/intl.dart';

class LaborFormPage extends ConsumerStatefulWidget {
  const LaborFormPage({super.key, this.id});
  final String? id;

  @override
  ConsumerState<LaborFormPage> createState() => _LaborFormPageState();
}

class _LaborFormPageState extends ConsumerState<LaborFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _trabCtrl = TextEditingController();
  final _cultCtrl = TextEditingController();
  final _fechaCtrl = TextEditingController();
  final _horasCtrl = TextEditingController();
  final _tarifaCtrl = TextEditingController();
  bool _loading = false;
  Labor? _before;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _load();
    _fechaCtrl.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
  }

  Future<void> _load() async {
    final repo = ref.read(laboresRepoProvider);
    final l = await repo.getById(widget.id!);
    if (l != null) {
      setState(() {
        _before = l;
        _trabCtrl.text = l.trabajadorId;
        _cultCtrl.text = l.cultivoId;
        _fechaCtrl.text = l.fechaISO;
        _horasCtrl.text = l.horas.toString();
        _tarifaCtrl.text = l.tarifa.toString();
      });
    }
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
            TextFormField(
              controller: _trabCtrl,
              decoration: const InputDecoration(labelText: 'Trabajador ID'),
              validator: (v) => (v==null || v.isEmpty) ? 'Requerido' : null,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _cultCtrl,
              decoration: const InputDecoration(labelText: 'Cultivo ID'),
              validator: (v) => (v==null || v.isEmpty) ? 'Requerido' : null,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _fechaCtrl,
              decoration: const InputDecoration(labelText: 'Fecha (YYYY-MM-DD)'),
              validator: (v) => (v==null || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(v)) ? 'Formato inválido' : null,
            ),
            const SizedBox(height: 8),
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
              onPressed: _loading ? null : () async {
                if (!_formKey.currentState!.validate()) return;
                setState(() => _loading = true);
                try {
                  final labor = Labor(
                    id: widget.id ?? '',
                    agricultorId: agricultorId,
                    trabajadorId: _trabCtrl.text.trim(),
                    cultivoId: _cultCtrl.text.trim(),
                    fechaISO: _fechaCtrl.text.trim(),
                    horas: num.parse(_horasCtrl.text.trim()),
                    tarifa: num.parse(_tarifaCtrl.text.trim()),
                    estado: 'activo',
                    createdAt: _before?.createdAt,
                    updatedAt: DateTime.now(),
                    updatedByDeviceId: 'device-unknown',
                  );
                  if (widget.id == null) {
                    final id = await repo.createLabor(labor);
                    if (mounted) Navigator.pop(context); // vuelve a lista
                  } else {
                    await repo.updateLabor(_before!, labor, reason: 'Edición manual');
                    if (mounted) Navigator.pop(context);
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
}
