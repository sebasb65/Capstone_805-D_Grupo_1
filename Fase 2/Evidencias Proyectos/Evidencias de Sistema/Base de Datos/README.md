# Evidencias de Base de Datos — YouConApp (REAL)

**Ubicación sugerida en repo:** `/Fase 2/Evidencias Proyectos/Base de datos/`

## Contenido
- `schema.md` — Modelo real de colecciones y campos (extraído del código).
- `rules/firestore.rules` — Reglas basadas en `id_agricultor`.
- `seed/seed.json` — Datos mínimos coherentes para demo.
- `modelo_bd.mmd` — Diagrama Mermaid del modelo.

## Pasos rápidos
1. **Reglas**: en Firebase Console → Firestore → Rules → pegar contenido de `rules/firestore.rules` y publicar.
2. **Datos de demo**: usar una función/cli para cargar `seed.json` o crear manualmente.
3. **Índices**: crear índices compuestos sugeridos en `schema.md` (id_agricultor + fecha / estado).
4. **App**: configurar `environment.ts` con tu proyecto Firebase y ejecutar.

## Notas
- Si cambias nombres de campos en el código (p.ej. `saldo_deudor`), **actualiza aquí** también.
- Las consultas en el `DataService` asumen `id_agricultor = uid` del usuario autenticado.
