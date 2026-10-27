# Tareas 002 — Objetivo semanal de estudio

- **Spec:** `specs/002-objetivo-semanal/spec.md` (aprobada)
- **Plan:** `specs/002-objetivo-semanal/plan.md`
- **Estado:** aprobadas (26/10/2026); implementación en curso

Cada tarea se hace en orden, empieza por sus tests (cuando aplica) y no se cierra con `node --test` en rojo. Ninguna tarea modifica el formato de `diarioDeEstudio.sesiones`.

> **Antes de T1:** creación de `goal.js` y `tests/goal.test.js` aprobada por el usuario el 26/10/2026 (spec §10 y `AGENTS.md`, «Pregunta antes: crear archivos nuevos»).

## T1. Lógica pura: fechas, sesiones y total semanal — [x]

**Objetivo:** crear `goal.js` con `textToDate`/`dateToText` internos, `addDays`, `startOfWeek`, `isValidSession` y `sumWeekMinutes`, con el guardián `module.exports` y el global `Goal`.

**Archivos:** `goal.js` (crear), `tests/goal.test.js` (crear).

**Tests (primero):**
- Semana con `today = "2026-10-26"`: 19/10 (120) + 21/10 (60) + 26/10 (45) → 45; añadir 28/10 (30) → 45.
- `today = "2026-10-29"`: dos sesiones el 26/10 (30 y 45) → 75.
- Ignorar: anterior al lunes, futura, `null`, texto, array, `{}`, `2026-02-31`, minutos `"45"`, `0`, `-5`, `1.5`; lista no-array y `today` inválido → 0.
- Semana que cruza el año (lunes 28/12/2026) y cambio de hora (25/10/2026 y 29/03/2026).
- Equivalencia con `Heatmap.startOfWeek`/`Heatmap.addDays` en una matriz de ~20 fechas (incluye 29/02/2028).

**Hecho cuando:** `node --test` en verde (19 tests anteriores + los nuevos), `goal.js` no menciona `document`, `localStorage` ni `new Date()` sin argumentos, y `node --check goal.js` no da errores.

**Depende de:** nada. **RF:** RF-2. **RNF:** RNF-9, RNF-12.

## T2. Lógica pura: validación del campo, lectura de lo guardado y estado de progreso — [x]

**Objetivo:** añadir `parseGoalInput`, `parseStoredGoal` y `buildGoalState` (porcentaje truncado, `percentValue`, `percentOverCap`, `isComplete`, `ratio`).

**Archivos:** `goal.js`, `tests/goal.test.js`.

**Tests (primero):**
- Validación: `"300"`, `" 300 "`, `"0300"`→300, `"1"`, `"10080"`; `""` y `"   "` → `empty`; `abc`, `1,5`, `1.5`, `1e3`, `+300`, `-30`, `300 min`, `1 000`, `0`, `10081`, cifras enormes → `invalid`.
- Lectura: `null`→`none`; `""`, `"{"`, `"null"`, `"[]"`, `"42"`, `'"300"'`, `{"minutos":"300"}`, `0`, `-30`, `1.5`, `10081`, `{}`→`invalid`; `{"minutos":1}`, `300`, `10080` y con claves extra → `valid`.
- Tabla completa de RF-4: (0,300), (1,10080), (1,1), (299,300), (300,300), (301,300), (450,300), (9,1), (10,1), (999,1).
- `ratio`: 0 con 0 min, `1/10080` mayor que 0 y menor que 0,001, 299/300 ≈ 0,9967, 300/300 = 1, 450/300 = 1.
- Sin objetivo (`null`, `0`, `1.5`, `"300"`, `10081`) → `hasGoal: false` con `studiedMinutes` correcto.
- Sin mutaciones: `Object.freeze` en sesiones.

**Hecho cuando:** `node --test` en verde con los casos de la tabla de RF-4 y la de validación completos.

**Depende de:** T1. **RF:** RF-3, RF-4, RF-5, RF-6, RF-8. **RNF:** RNF-7, RNF-12.

## T3. Total semanal compartido y carga del módulo — [x]

**Objetivo:** que `calcularMinutosSemana()` delegue en `Goal.sumWeekMinutes(sesiones, fechaATexto(new Date()))` y que `index.html` cargue `goal.js` antes de `app.js`.

**Archivos:** `app.js`, `index.html`, `tests/goal.test.js`.

**Tests (primero):** test de referencia que reproduce la fórmula antigua con `Heatmap.startOfWeek`/`addDays` y compara con `Goal.sumWeekMinutes` sobre cinco fixtures realistas.

**Verificación manual:** en Chrome, con el mismo `localStorage`, anotar "Esta semana" antes y después del cambio, y repetir tras guardar, editar, borrar y deshacer una sesión; consola limpia.

**Hecho cuando:** `node --test` en verde, `node --check app.js` limpio y la cifra de "Esta semana" coincide exactamente con la anterior en todos los casos probados.

**Depende de:** T1. **RF:** RF-2. **RNF:** RNF-10.

## T4. Sección HTML y estilos base — [x]

**Objetivo:** añadir la sección "Objetivo semanal" entre "Tu constancia" y el mapa con el esquema del plan (§8.1), y los estilos mínimos para que no rompa la página.

**Archivos:** `index.html`, `styles.css`.

**Tests:** no hay tests de DOM en el proyecto; se valida con `node --test` (sin cambios) y con Chrome.

**Hecho cuando:** la sección se ve en su sitio con textos en español, ids en inglés, `label`/ayuda/error asociados y marca `role="progressbar"` con sus atributos; a 375 y 320 px no hay desplazamiento horizontal ni errores en consola; el resto de la página no cambia.

**Depende de:** T3. **RF:** RF-1, RF-10. **RNF:** RNF-1, RNF-3, RNF-11.

## T5. Render de estados y barra accesible — [x]

**Objetivo:** `readStoredGoal()`, `renderGoal()` (sin objetivo, válido, valor guardado inválido, progreso, porcentaje visible, tope `999 %+`, `Objetivo cumplido`, barra con `aria-*` y `aria-valuetext`) y `syncGoalField()`, integrados en `renderizarTodo()`.

**Archivos:** `app.js`, `styles.css` (relleno y estados).

**Tests:** los de `buildGoalState` ya cubren los números; la interfaz se verifica en Chrome manipulando la clave.

**Hecho cuando:** con la clave ausente, `{"minutos":300}`, `{"minutos":"300"}`, `{"minutos":0}` y JSON roto se ven exactamente los estados de la tabla del plan (§6); la barra no supera el 100 % y `aria-valuenow` se recorta al objetivo mientras `aria-valuetext` mantiene el progreso real; `node --test` sigue en verde.

**Depende de:** T4. **RF:** RF-1, RF-3, RF-4, RF-5, RF-10. **RNF:** RNF-2, RNF-7.

## T6. Fijar y cambiar el objetivo — [x]

**Objetivo:** `handleGoalSubmit` con validación (`parseGoalInput`), `aria-invalid`, error asociado, foco en el campo, normalización del valor, persistencia con `saveStoredGoal`, actualización inmediata y confirmación anunciada.

**Archivos:** `app.js`.

**Tests:** validación ya cubierta en T2; en Chrome se comprueban los mensajes literales y el orden pintar → anunciar.

**Hecho cuando:** con `abc`, `1,5`, `-30`, `0`, `10 081`, vacío y solo espacios aparece el mensaje de la spec, el campo queda marcado y enfocado y no se guarda nada; con `0300` se guarda 300 y el campo muestra `300`; el anuncio dice `Objetivo semanal guardado: 5 h por semana.` una sola vez; al fallar `setItem` se mantiene el objetivo anterior, el texto escrito y el foco, y el aviso sale en `#goal-alert`.

**Depende de:** T5. **RF:** RF-6, RF-9, RF-10. **RNF:** RNF-12.

## T7. Quitar el objetivo y fallos de almacenamiento — [x]

**Objetivo:** `handleGoalRemove` y `deleteStoredGoal`, incluido el caso de limpiar un valor guardado inválido y el fallo de borrado.

**Archivos:** `app.js`.

**Tests:** de lógica ya cubiertos; en Chrome se simula el fallo sobrescribiendo `Storage.prototype.removeItem`.

**Hecho cuando:** quitar deja el campo vacío, el foco en el campo, la sección en estado sin objetivo, el aviso de valor inválido desaparece y se anuncia `Objetivo semanal quitado.`; si el borrado falla, se mantiene el estado anterior (también el inválido) y sale el aviso de RF-7; las sesiones siguen intactas.

**Depende de:** T6. **RF:** RF-3, RF-7, RF-10. **RNF:** RNF-6.

## T8. Vuelta a la pestaña y actualización silenciosa — [x]

**Objetivo:** `refreshGoalOnVisible()` dentro del `visibilitychange` existente, con la regla de no pisar cambios sin guardar ni el campo enfocado.

**Archivos:** `app.js`.

**Tests:** de lógica ya cubiertos; el comportamiento es de interfaz y se comprueba en Chrome.

**Hecho cuando:** al volver a la pestaña sin cambios se relee el objetivo guardado (incluido uno cambiado en otra pestaña); con texto escrito sin guardar o con el foco en el campo, el texto y el objetivo mostrado no cambian y solo se recalcula el progreso; no se anuncia nada; guardar una sesión, editar, borrar o deshacer actualiza el progreso sin recargar; no hay temporizadores nuevos.

**Depende de:** T7. **RF:** RF-9, RF-1. **RNF:** RNF-10.

## T9. Estilos finales y accesibilidad visual — [x]

**Objetivo:** afinar `styles.css`: línea de progreso, barra, relleno sin mínimo, resaltado de `Objetivo cumplido`, apilado a 320 px, zoom, `forced-colors`, contraste y áreas táctiles.

**Archivos:** `styles.css` (y ajustes mínimos de marcado si hiciera falta, sin cambiar textos).

**Tests:** `node --test` sin cambios en verde.

**Hecho cuando:** a 375 y 320 px la sección no desborda y el editor se apila si hace falta; a 200 % de zoom sobre 1280 px y sobre 375 px no hay scroll horizontal ni recortes; con `forced-colors` la pista conserva borde y el porcentaje y el estado siguen en texto; textos ≥ 4,5:1, foco ≥ 3:1 y relleno ≥ 3:1; botones ≥ 24 px de alto; al 0 % la pista se ve vacía y la barra no inventa relleno.

**Depende de:** T8. **RF:** RF-5, RF-10. **RNF:** RNF-1, RNF-2, RNF-3, RNF-11.

## T10. Documentación y verificación final — [x]

**Objetivo:** actualizar `AGENTS.md` y `MEMORY.md`, y ejecutar la verificación completa del plan (§12).

**Archivos:** `AGENTS.md`, `MEMORY.md`.

**Tests y comprobaciones:**
- `node --test` completo en verde y `node --check` de `goal.js` y `app.js`.
- Chrome: los 15 puntos de la verificación manual del plan, incluidos los dos estados de error de almacenamiento, el lector de pantalla, `forced-colors`, la matriz de zoom y 2.000 sesiones con CPU 4× midiendo `renderGoal()` por debajo de 50 ms.
- Datos: `diarioDeEstudio.sesiones` intacto y clave nueva solo con `{"minutos":…}`; racha, mejor racha, total semanal, días del mes, mapa, alta, edición, borrado y deshacer sin cambios.

**Hecho cuando:** `AGENTS.md` incluye `diarioDeEstudio.objetivoSemanal` en Datos y la regla del total semanal compartido; `MEMORY.md` recoge estado, decisiones y deuda de los ayudantes de fecha; la lista de criterios de finalización de la spec (§10) se puede marcar entera.

**Depende de:** T9. **RF:** todos. **RNF:** todos.
