import 'package:intl/intl.dart';
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


  Stream<List<Labor>> streamLabores({String? agricultorId, String? fromISO, String? toISO}) {
    final owner = agricultorId ?? _uid();
    if (owner == null) {
      return const Stream<List<Labor>>.empty();
    }

    Query<Map<String, dynamic>> q = _col
        .where('id_agricultor', isEqualTo: owner);

   
    if (fromISO != null) q = q.where('fechaISO', isGreaterThanOrEqualTo: fromISO);
    if (toISO != null)   q = q.where('fechaISO', isLessThanOrEqualTo: toISO);

    q = q.orderBy('fechaISO', descending: true);

    return q.snapshots().map((s) => s.docs.map((d) => Labor.fromMap(d.id, d.data())).toList());
  }

  Future<String> createLabor(Labor l) async {
    final uid = _uid();
    if (uid == null) throw 'No auth';

    final ref = await _col.add({
      ...l.toMap(),
      'id_agricultor': uid,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'updatedByDeviceId': 'device-unknown', 
    });
    return ref.id;
  }

  Future<void> updateLabor(Labor before, Labor after, {String reason = 'Edición'}) async {
  final targetId = after.id.isNotEmpty ? after.id : before.id;
  if (targetId.isEmpty) {
    throw 'Falta id de documento para actualizar';
  }

  final docRef = _col.doc(targetId);
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

  Future<List<Labor>> getByRangoFecha({
    required DateTime desde,
    required DateTime hasta,
  }) async {
    final uid = _uid();
    if (uid == null) throw 'No auth';

    final s = await _col
        .where('id_agricultor', isEqualTo: uid)
        .where('estado', isEqualTo: 'activo')
        .where('fechaISO', isGreaterThanOrEqualTo: DateFormat('yyyy-MM-dd').format(desde))
        .where('fechaISO', isLessThanOrEqualTo: DateFormat('yyyy-MM-dd').format(hasta))
        .orderBy('fechaISO')
        .get();

    return s.docs.map((d) => Labor.fromMap(d.id, d.data())).toList();
  }

  Future<void> archive(String id) async {
    await _col.doc(id).update({
      'estado': 'inactivo',
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<List<Labor>> listBy({
    required String desdeISO,
    required String hastaISO,
    String? trabajadorId,
    String? cultivoId,
  }) async {
    final uid = _uid();
    if (uid == null) return [];

    Query<Map<String, dynamic>> q = _col
        .where('id_agricultor', isEqualTo: uid)
        .where('estado', isEqualTo: 'activo')
        .where('fechaISO', isGreaterThanOrEqualTo: desdeISO)
        .where('fechaISO', isLessThanOrEqualTo: hastaISO);

    if (trabajadorId != null && trabajadorId.isNotEmpty) {
      q = q.where('trabajador_id', isEqualTo: trabajadorId);
    }
    if (cultivoId != null && cultivoId.isNotEmpty) {
      q = q.where('cultivo_id', isEqualTo: cultivoId);
    }

    q = q.orderBy('fechaISO', descending: true);

    final s = await q.get();
    return s.docs.map((d) => Labor.fromMap(d.id, d.data())).toList();
  }

  Future<Labor?> getById(String id) async {
    final snap = await _col.doc(id).get();
    if (!snap.exists) return null;
    return Labor.fromMap(snap.id, snap.data()!);
  }
}
