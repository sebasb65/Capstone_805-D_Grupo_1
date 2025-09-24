import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repo.dart';
import '../domain/labor.dart';

final laboresRepoProvider = Provider<LaboresRepo>((ref) {
  final fs = FirebaseFirestore.instance;
  final auth = ref.watch(firebaseAuthProvider);
  return LaboresRepo(fs, () => auth.currentUser?.uid);
});

class LaboresRepo {
  LaboresRepo(this._fs, this._uid);
  final FirebaseFirestore _fs;
  final String? Function() _uid;

  CollectionReference<Map<String, dynamic>> get _col =>
      _fs.collection('tareas');

  /// Listado por agricultor (dueño) y rango de fechas opcional
  Stream<List<Labor>> streamLabores({String? agricultorId, String? fromISO, String? toISO}) {
    Query<Map<String, dynamic>> q = _col.where('id_agricultor', isEqualTo: agricultorId);
    
    if (fromISO != null) q = q.where('fecha', isGreaterThanOrEqualTo: fromISO);
    if (toISO != null)   q = q.where('fecha', isLessThanOrEqualTo: toISO);
    
    q = q.orderBy('fecha', descending: true);

    return q.snapshots().map((s) => s.docs.map((d) => Labor.fromMap(d.id, d.data())).toList());
  }

  Future<String> createLabor(Labor l) async {
    final ref = await _col.add({
      ...l.toMap(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'updatedByDeviceId': 'device-unknown', // TODO: set real device id si quieres
    });
    return ref.id;
  }

  Future<void> updateLabor(Labor before, Labor after, {String reason = 'Edición'}) async {
    final docRef = _col.doc(after.id);
    // auditoría: guarda snapshot antes/después
    final batch = _fs.batch();
    batch.update(docRef, {
      ...after.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    final auditRef = docRef.collection('auditoria').doc();
    batch.set(auditRef, {
      'reason': reason,
      'at': FieldValue.serverTimestamp(),
      'before': before.toMap(),
      'after': after.toMap(),
      'by': _uid(),
    });
    await batch.commit();
  }

  Future<void> archive(String id) async {
    await _col.doc(id).update({
      'estado': 'inactivo',
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<Labor?> getById(String id) async {
    final snap = await _col.doc(id).get();
    if (!snap.exists) return null;
    return Labor.fromMap(snap.id, snap.data()!);
  }
}
