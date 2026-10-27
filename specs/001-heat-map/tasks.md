# Tareas 001 — Mapa de calor de constancia

- **Spec:** `specs/001-heat-map/spec.md`
- **Plan:** `specs/001-heat-map/plan.md`
- **Estado:** T1–T7 completadas; mapa implementado y verificado

## T1. Lógica pura y tests — [x]

Crear `heatmap.js` con las funciones puras del plan y `tests/heatmap.test.js` con `node --test`. Los tests se escriben antes que el código.

- [x] Tests de periodo, minutos, niveles, futuros, inválidos, vacío, etiquetas y no mutación.
- [x] Implementar `heatmap.js` hasta poner `node --test` en verde.

Resultado: 16 tests, 16 en verde.

**RF:** RF-2, RF-3, RF-4, RF-5, RF-8, RF-11. **RNF:** RNF-12.

## T2. Estructura HTML y estilos base — [x]

Añadir la sección del mapa entre la racha y el formulario, la leyenda, el detalle, el estado vacío, la región de anuncios y la carga de `heatmap.js` antes de `app.js`. Estilos base de tabla y celdas.

**RF:** RF-1, RF-6, RF-9, RF-12.

## T3. Dibujado de la cuadrícula — [x]

Implementar `renderHeatmap`, `buildHeatmapTable` y la integración en `renderizarTodo()`: 12 × 7 celdas, botones, roving tabindex, etiquetas de mes y estado vacío.

**RF:** RF-1, RF-4, RF-8, RF-11, RF-12.

## T4. Detalle, fijado y teclado — [x]

Detalle bajo la cuadrícula, hover de ratón, foco, clic/toque, `Escape`, clic fuera y flechas. Anuncios del detalle.

**RF:** RF-6, RF-7, RF-12.

## T5. Guardado, visibilidad y anuncios — [x]

Redibujar al guardar con anuncio del resumen, releer al volver a la pestaña y mantener el foco del formulario.

**RF:** RF-10, RF-12.

## T6. Estilos finales — [x]

Relleno por nivel, contraste, foco, `forced-colors`, 375/320 px y zoom al 200 %.

**RF:** RF-4, RF-8, RF-9. **RNF:** RNF-1, RNF-2, RNF-3, RNF-11.

## T7. Verificación manual en Chrome — [x]

Consola, ratón, teclado, toque, 375 y 320 px, 2.000 sesiones con CPU 4× y datos intactos.

Resultado: 16 tests en verde; consola limpia; 24,7 px de celda a 375 y 20,1 px a 320 sin desbordar; mapa con 2.000 sesiones y CPU 4× en 52 ms como máximo (límite 100 ms); `localStorage` intacto tras la interacción.

**RF:** todos. **RNF:** RNF-4, RNF-6, RNF-7.
