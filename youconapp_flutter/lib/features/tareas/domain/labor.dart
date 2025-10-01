class Labor {
  final String id;
  final String agricultorId;   // scope del dueño
  final String trabajadorId;
  final String cultivoId;
  final String fechaISO;       // 'YYYY-MM-DD'
  final num horas;             // decimal posible
  final num tarifa;            // $ por hora o por labor
  final String estado;         // 'activo'|'inactivo'
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? updatedByDeviceId;

  Labor({
    required this.id,
    required this.agricultorId,
    required this.trabajadorId,
    required this.cultivoId,
    required this.fechaISO,
    required this.horas,
    required this.tarifa,
    required this.estado,
    this.createdAt,
    this.updatedAt,
    this.updatedByDeviceId,
  });

  Map<String, dynamic> toMap() => {
    'agricultorId': agricultorId,
    'trabajadorId': trabajadorId,
    'cultivoId': cultivoId,
    'fechaISO': fechaISO,
    'horas': horas,
    'tarifa': tarifa,
    'estado': estado,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
    'updatedByDeviceId': updatedByDeviceId,
  };

  factory Labor.fromMap(String id, Map<String, dynamic> m) => Labor(
    id: id,
    agricultorId: m['id_agricultor'] ?? m['agricultorId'] ??'',
    trabajadorId:  m['id_trabajador'] ?? m['trabajadorId'] ?? '',
    cultivoId: m['id_cultivo'] ?? m['cultivoId'] ?? '',
    fechaISO: m['fecha'] ??m['fechaISO'] ?? '',
    horas: (m['horas'] ?? 0) as num,
    tarifa: (m['tarifa'] ?? 0) as num,
    estado: m['estado'] ?? 'activo',
    createdAt: (m['createdAt'] as dynamic)?.toDate(),
    updatedAt: (m['updatedAt'] as dynamic)?.toDate(),
    updatedByDeviceId: m['updatedByDeviceId'],
  );
}
