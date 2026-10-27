# Plan técnico 001 — Mapa de calor de constancia

- **Spec de referencia:** `specs/001-heat-map/spec.md`
- **Constitución:** `docs/constitution.md`
- **Fecha:** 26/10/2026
- **Estado:** implementado y verificado

## 1. Resumen de la solución

La funcionalidad se resuelve con un módulo nuevo de **lógica pura** (`heatmap.js`) y la **capa de interfaz** en `app.js`, que ya es el archivo de dibujo de la página. Los datos guardados no cambian: `app.js` sigue leyendo `diarioDeEstudio.sesiones` y pasa el array a una función que devuelve la cuadrícula ya calculada.

Flujo de datos:

```
localStorage → sesiones (app.js) → Heatmap.buildHeatmap(sesiones, hoy)
             → { start, end, weeks[12][7], daysStudied, hasSessions }
             → renderHeatmap() en app.js → tabla + detalle + leyenda + estado vacío
```

**Cobertura:** RF-1 a RF-12. El reparto por pieza está en la sección 10.

## 2. Archivos

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `heatmap.js` | **Crear** | Cálculos puros del periodo, minutos por día, niveles, días futuros, etiquetas de mes y resumen. Sin DOM, sin localStorage, sin red y sin leer el reloj. | RF-2, RF-3, RF-4, RF-5, RF-8, RF-11 |
| `app.js` | **Modificar** | Dibujar la tabla, gestionar el detalle y el teclado, integrar el mapa en `renderizarTodo()` y reaccionar al guardado y a la visibilidad de la pestaña. | RF-1, RF-5, RF-6, RF-7, RF-9, RF-10, RF-11, RF-12 |
| `index.html` | **Modificar** | Sección del mapa entre la tarjeta de racha y el formulario; zona de detalle, mensaje vacío, leyenda, región de anuncios y carga de `heatmap.js` antes de `app.js`. | RF-1, RF-6, RF-9, RF-12 |
| `styles.css` | **Modificar** | Identidad visual del mapa, relleno por nivel, foco, leyenda, responsive a 375/320 px, zoom y `forced-colors`. | RF-4, RF-8, RF-9; RNF-1, RNF-2, RNF-3, RNF-11 |
| `tests/heatmap.test.js` | **Crear** | Pruebas de la lógica pura con `node --test`, sin dependencias ni DOM. | RF-2, RF-3, RF-4, RF-5, RF-8, RF-11; RNF-12 |
| `MEMORY.md` | **Actualizar** | Estado y decisiones al terminar. | — |

**No se tocan:** `calcularRacha`, `calcularMejorRacha`, `calcularMinutosSemana`, `calcularDiasDelMes`, el formulario, el formato de datos ni la lista de sesiones.

## 3. Contrato de `heatmap.js`

Reglas del módulo:

- Funciones puras: sin `document`, sin `localStorage`, sin `fetch` y sin `new Date()` sin argumentos. La fecha de hoy siempre llega como parámetro `today` en formato `AAAA-MM-DD`.
- `buildPeriod`, `collectDailyMinutes` y `buildHeatmap` reciben `today`; `addDays`, `startOfWeek`, `classifyMinutes`, `isValidSession` y `buildMonthLabels` son auxiliares deterministas sin reloj.
- Fechas como texto `AAAA-MM-DD` y construidas con `new Date(año, mes - 1, día)` (hora local). Nunca `new Date("AAAA-MM-DD")`.
- Se expone como `Heatmap` para el navegador (`<script>` clásico, sin módulos ES) y con un guardián `if (typeof module !== "undefined")` para que `node --test` pueda importarlo.

| Función | Firma | Devuelve | Uso |
|---|---|---|---|
| `isValidSession` | `(entry)` | `boolean` | Objeto no nulo, que no sea array, con fecha `AAAA-MM-DD` real y `minutos` entero ≥ 1. |
| `addDays` | `(dateText, days)` | texto | Suma días con fecha local, sin desplazamientos por UTC. |
| `startOfWeek` | `(dateText)` | texto | Lunes de la semana de una fecha. |
| `buildPeriod` | `(today)` | `{ start, end, weeks: 12, days: 84 }` | Inicio (lunes 11 semanas antes) y fin (domingo de la semana actual). |
| `collectDailyMinutes` | `(sessions, start, end, today)` | `Map<fecha, minutos>` | Suma sesiones válidas del periodo y descarta futuras y fuera de rango. |
| `classifyMinutes` | `(minutes)` | `0 \| 1 \| 2 \| 3 \| 4` | 0 = sin sesiones; 1 = 1–29; 2 = 30–59; 3 = 60–119; 4 = 120+. |
| `buildMonthLabels` | `(weeks)` | `Array<number \| null>` de 12 | Índice de mes (0–11) para cada columna, o `null` si no lleva etiqueta. |
| `buildHeatmap` | `(sessions, today)` | resultado completo | Orquesta todo y devuelve la cuadrícula lista para pintar. |

Forma del resultado:

```
{
  today: "AAAA-MM-DD",
  start: "AAAA-MM-DD",
  end: "AAAA-MM-DD",
  weeks: [ 12 columnas [ 7 días { date, minutes, level, isFuture } ] ],
  daysStudied: número de días con minutos > 0,
  hasSessions: daysStudied > 0
}
```

`buildMonthLabels` devuelve índices de mes, no abreviaturas: los textos (`ene`, `feb`…) son copia de interfaz y viven en `app.js`.

## 4. Algoritmo del mapa en pseudocódigo

```
FUNCIÓN buildPeriod(today):
  lunesActual = startOfWeek(today)
  start = addDays(lunesActual, -77)      // 11 semanas antes
  end   = addDays(lunesActual, 6)        // domingo de esta semana
  DEVOLVER { start, end, weeks: 12, days: 84 }

FUNCIÓN collectDailyMinutes(sessions, start, end, today):
  totales = nuevo Mapa()
  PARA CADA sesion EN sessions:
    SI NO isValidSession(sesion): continuar
    fecha = sesion.fecha
    SI fecha < start O fecha > end O fecha > today: continuar
    totales[fecha] = (totales[fecha] O 0) + sesion.minutos
  DEVOLVER totales

FUNCIÓN classifyMinutes(minutos):
  SI minutos = 0:            DEVOLVER 0
  SI minutos <= 29:          DEVOLVER 1
  SI minutos <= 59:          DEVOLVER 2
  SI minutos <= 119:         DEVOLVER 3
  DEVOLVER 4

FUNCIÓN buildHeatmap(sessions, today):
  periodo = buildPeriod(today)
  totales = collectDailyMinutes(sessions, periodo.start, periodo.end, today)

  weeks = []
  PARA semana DE 0 A 11:
    columna = []
    PARA dia DE 0 A 6:
      fecha = addDays(periodo.start, semana * 7 + dia)
      minutos = totales[fecha] O 0
      columna.agregar({
        date: fecha,
        minutes: minutos,
        level: classifyMinutes(minutos),
        isFuture: fecha > today
      })
    weeks.agregar(columna)

  daysStudied = contar días de weeks con minutes > 0
  DEVOLVER { today, start, end, weeks, daysStudied, hasSessions: daysStudied > 0 }

FUNCIÓN buildMonthLabels(weeks):
  etiquetas = 12 posiciones vacías
  PARA cada columna:
    si algún día de la columna cae en día 1 → etiquetas[columna] = mes de ese día
  SI la primera columna está vacía:
    etiquetas[0] = mes del primer día de esa columna
  DEVOLVER etiquetas
  // Dos etiquetas nunca caen en columnas consecutivas: un mes dura ≥ 28 días.
```

Notas del algoritmo:

- Las fechas `AAAA-MM-DD` se comparan como texto: el orden lexicográfico coincide con el cronológico.
- Una fecha es real si al construir `new Date(año, mes - 1, día)` coinciden año, mes y día; así se descartan `2026-02-31` o `2026-13-01`.
- Los días futuros se marcan en la cuadrícula, pero **nunca reciben minutos** (se filtran en `collectDailyMinutes`).
- El estado vacío se decide con `hasSessions`, que solo cuenta días con minutos > 0, no la mera existencia de registros.

## 5. Pintado en la interfaz

### 5.1 Estructura HTML (esquema)

```
<section class="tarjeta heatmap" aria-labelledby="heatmap-title">
  <h2 id="heatmap-title">Constancia de las últimas 12 semanas</h2>
  <p id="heatmap-empty" hidden>…mensaje de estado vacío…</p>
  <div id="heatmap-grid"></div>                  ← aquí se genera la tabla
  <p id="heatmap-detail" role="status">…texto de ayuda…</p>
  <ul class="heatmap__legend" aria-label="Leyenda de intensidad">…5 estados…</ul>
  <p id="heatmap-announce" class="visually-hidden" role="status"></p>
</section>
```

La tabla generada tiene esta forma:

```
<table class="heatmap__table">
  <caption class="visually-hidden">Mapa de calor de las últimas 12 semanas</caption>
  <thead aria-hidden="true">  fila de 12 etiquetas de mes + esquina vacía
  <tbody>                     7 filas
    <tr>
      <th class="heatmap__weekday" scope="row">L + «lunes» solo para lectores</th>
      <td><button class="heatmap__cell level-3" aria-label="viernes 23 de octubre de 2026, 45 minutos">
            <span class="heatmap__fill"></span>
          </button></td>
      <td>
        <span class="heatmap__cell heatmap__cell--future" aria-hidden="true"></span>
        <span class="visually-hidden">1 de noviembre de 2026, no disponible</span>
      </td>
    </tr>
```

Los días futuros no llevan botón: no son enfocables, no reciben clic y se anuncian como no disponibles. El hueco visual lo dibuja un `span` decorativo.

### 5.2 Pasos de `renderHeatmap()`

1. `today = fechaATexto(new Date())` (única lectura del reloj).
2. `result = Heatmap.buildHeatmap(sesiones, today)`.
3. Vaciar `#heatmap-grid` y construir la tabla con `document.createElement` (sin `innerHTML`), con el mismo patrón de `renderizarSesiones` (crear nodos y `append`).
4. Cada celda pasada o de hoy: botón con `aria-label` de fecha completa y minutos; `tabindex="0"` solo en el día de hoy (roving tabindex), `-1` en el resto.
5. Cada celda futura: un `span` visual con `aria-hidden` y un texto oculto «no disponible».
6. Filas con inicial visible (`L`, `M`, `X`, `J`, `V`, `S`, `D`) y nombre completo oculto.
7. `#heatmap-empty.hidden = result.hasSessions` (el mensaje solo se ve cuando no hay sesiones).
8. Volver al detalle de ayuda y limpiar el día fijado.
9. Si la llamada viene de un guardado, vaciar y escribir en `#heatmap-announce`: «Mapa actualizado: N días estudiados en las últimas 12 semanas.» (vaciar antes permite repetir el mismo anuncio).

`renderizarTodo()` añade `renderHeatmap(announce)` al final; el guardado llama a `renderizarTodo(true)` y el arranque, a `renderizarTodo()`. Así racha, lista y mapa se redibujan por un único camino.

Funciones nuevas de interfaz en `app.js` (nombres en inglés, según el principio 6):

| Función | Responsabilidad |
|---|---|
| `renderHeatmap(announce)` | Orquesta el dibujado completo y el estado vacío. |
| `buildHeatmapTable(result)` | Crea la tabla, sus cabeceras y sus celdas. |
| `formatHeatmapDetail(day)` | Compone `fecha · duración` o `fecha · Sin sesiones`. |
| `showHeatmapDetail(dateText)` | Escribe el detalle y lo anuncia. |
| `clearHeatmapDetail()` | Vuelve al texto de ayuda. |
| `moveHeatmapFocus(dateText)` | Mueve el foco y el `tabindex` con las flechas. |
| `handleHeatmapKeydown(event)` | Flechas y `Escape`. |

### 5.3 Integración con el resto de la página

- **Guardado:** el formulario ya llama a `renderizarTodo()`; pasa a `renderizarTodo(true)` para que el mapa anuncie el nuevo resumen. El foco se queda en el formulario.
- **Arranque y recarga:** `renderizarTodo()` al final del archivo dibuja el mapa que ya está en `localStorage`.
- **Vuelta a la pestaña:** en `visibilitychange`, si `document.visibilityState === "visible"`, se reasigna `sesiones = cargarSesiones()` y se llama a `renderizarTodo()`; así se recoge lo guardado en otra pestaña y el "hoy" actual.
- **Sin temporizador ni evento `storage`:** no hay actualización a medianoche ni sincronía en vivo.
- **Almacenamiento no disponible:** si `cargarSesiones` devuelve `[]` por un error, el mapa muestra el estado vacío y el resto de la página sigue funcionando.

### 5.4 Detalle y estados

- Copia del detalle con `formatearFechaLegible` y `formatearDuracion` (ya existen): `vie, 23 oct 2026 · 45 min`; con 0 minutos, `… · Sin sesiones`.
- Nombre accesible del botón: fecha larga en `es-ES` + minutos en formato largo (`45 minutos`), o `sin sesiones`.
- Estado: `pinnedDate` (fecha fijada o `null`). El detalle muestra, por prioridad, el día bajo el puntero o el foco (`activeDate`), luego `pinnedDate`, y si no hay ninguno, el texto de ayuda.
- Hover solo con `pointerType === "mouse"` para no disparar detalles al hacer scroll táctil.
- Clic o toque fija; volver a pulsar la misma celda desfija y muestra el detalle del puntero o del foco (o la ayuda si no hay ninguno); clic fuera de la tabla desfija; `Escape` desfija sin sacar el foco de la cuadrícula.
- Al salir el puntero o el foco de la tabla se vuelve al día fijado o a la ayuda.
- El detalle es solo texto: no hay enlaces, filtros, edición ni cambios de sesiones.

### 5.5 Teclado

- La cuadrícula es un único punto de tabulación.
- `←`/`→` mueven 7 días; `↑`/`↓` mueven 1 día.
- Si el destino cae fuera del periodo o es futuro, el foco no se mueve.
- Al mover el foco se actualiza `tabindex` (0 en el destino, -1 en el origen) y se muestra su detalle.

### 5.6 Leyenda y estado vacío

- Leyenda estática en el HTML: cinco muestras `.heatmap__swatch` con el mismo relleno que las celdas y su texto (`Sin sesiones`, `1–29 min`, `30–59 min`, `60–119 min`, `120+ min`).
- Estado vacío: mensaje literal de la spec, cuadrícula completa en neutro; la leyenda y el detalle siguen visibles.
- El anuncio de guardado va en una región aparte para no pisar el detalle abierto.

### 5.7 Estilos

- La sección reutiliza `.tarjeta` y añade `.heatmap`.
- Utilidad `.visually-hidden` para el `caption`, los nombres completos de los días y la región de anuncios.
- Tabla `.heatmap__table`: `table-layout: fixed`, `border-spacing: 2px`, 12 columnas iguales y una columna estrecha para los días.
- Celda `.heatmap__cell`: `aspect-ratio: 1`, fondo neutro, borde de 1 px; relleno interior `.heatmap__fill` desde abajo con `--fill` (25 / 50 / 75 / 100 %) y tono verde creciente. El relleno es el segundo canal, no el color.
- Niveles `.level-1` a `.level-4` fijan `--fill` y el tono; `.level-0` deja la celda vacía.
- Foco: contorno de 2 px con `outline-offset` y contraste ≥ 3:1.
- Texto de la sección: contraste ≥ 4,5:1 sobre el papel.
- La zona de detalle reserva una altura mínima de una línea y media para que el mapa no se mueva.
- En móvil, la cuadrícula se expande 8 px a cada lado con margen negativo dentro de la tarjeta, para que las celdas midan ≥ 24 px a 375 y ≥ 20 px a 320 sin desalinear el título.
- Etiquetas de mes `.heatmap__month` a 9 px (8 px por debajo de 340 px), centradas y sin solaparse: entre dos etiquetas hay al menos 4 columnas.
- `@media (forced-colors: active)`: borde visible en cada celda y relleno con `currentColor`; la información exacta sigue en el detalle y en el nombre accesible.

## 6. Decisiones técnicas y alternativas descartadas

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Módulo aparte `heatmap.js`, sin DOM | Permite probar la lógica con Node sin simular el navegador y cumple el principio 3. | Meter la lógica en `app.js`: al cargarlo en Node falla por `document.getElementById`. |
| Script clásico + guardián `module.exports` | Funciona con `file://` y con `node --test` sin build ni módulos ES. | `type="module"`: prohibido por `AGENTS.md` para abrir con doble clic. `node:vm`: más código y menos evidente para quien empieza. |
| Tabla HTML real con botones en las celdas | Semántica de tabla gratis, navegación por filas/columnas y botones con foco y toque nativos. | Rejilla de `div` con roles ARIA: más fácil equivocarse. SVG: sin foco ni lectores de pantalla por defecto. |
| Un solo `tabindex="0"` que se mueve | Evita 84 paradas de tabulación y hace la cuadrícula un único punto de tabulación. | `tabindex="0"` en todas las celdas: tabular por 84 días es inviable. |
| Detalle en una zona fija bajo la cuadrícula | No se recorta en bordes, no tapa celdas, no mueve el diseño y funciona igual con toque. | Globo flotante: necesita cálculo de colisiones y falla en móvil. |
| Relleno creciente + tono | Distingue los niveles sin depender del color (daltonismo, escala de grises). | Solo tonos: incumple RNF-2. Números dentro: ilegibles a 20–24 px. |
| Fechas como texto `AAAA-MM-DD` | Evita los saltos de día por UTC y hace las comparaciones triviales. | Objetos `Date` en la API: mutables y con trampas de zona horaria. |
| Redibujado completo de 84 celdas | Simple y suficiente; el coste es despreciable y evita estados intermedios inconsistentes. | Actualización incremental: complejidad sin beneficio a esta escala. |
| Releer el historial al volver a la pestaña | Cubre el cambio de día y los guardados de otra pestaña sin `setInterval`. | Temporizador a medianoche: más código y consume recursos. Evento `storage`: sincronía en vivo fuera de alcance. |
| Duplicar los ayudantes de fecha en `heatmap.js` | Mantiene el módulo autocontenido y no toca rachas ni totales ya probados. | Extraer un `dates.js` compartido: mejor a largo plazo, pero obliga a refactorizar código existente y merece su propia spec. |
| Código nuevo con identificadores en inglés | Cumple el principio 6 sin renombrar lo que ya funciona: aplica a JavaScript, HTML (ids y clases) y CSS nuevos. | Renombrar todo `app.js`, `index.html` y `styles.css`: migración grande y fuera del alcance de la spec. |

## 7. Accesibilidad y responsive

- **Semántica:** tabla con `caption` (nombre accesible), cabeceras de fila para los días, cabecera de mes oculta a tecnologías de asistencia (la fecha completa ya está en cada celda).
- **Anuncios:** el detalle vive en `role="status"`; el resumen tras guardar, en una región oculta separada, para no interrumpir el foco del formulario.
- **Foco:** siempre visible, también en `forced-colors`.
- **Objetivos táctiles:** ≥ 24 × 24 px a 375 px; ≥ 20 × 20 px a 320 px (el mínimo que admite la spec en ese ancho).
- **Zoom:** hasta 200 % la página no desborda; el mapa puede desplazarse dentro de su sección.
- **Sin dependencia del color:** el relleno codifica el nivel; la leyenda repite tono, relleno y texto.
- **Sin red y sin datos nuevos:** no hay `fetch` ni recursos externos; el mapa solo lee el array que ya carga la página (RNF-5, RNF-6).
- **Datos dañados o almacenamiento bloqueado:** el `try/catch` de `cargarSesiones` sigue devolviendo `[]`; el mapa cae en el estado vacío sin romper la página (RNF-7).

## 8. Estrategia de tests con `node --test`

- Comando: `node --test` (Node 20+; en este equipo hay Node 24).
- Archivo: `tests/heatmap.test.js`, CommonJS, `require("../heatmap.js")` y `require("node:test")` + `node:assert/strict`.
- Sin `package.json`, sin dependencias y sin DOM: solo se prueba `heatmap.js`.
- La interfaz se verifica aparte con Chrome DevTools (consola, 375 y 320 px, teclado, toque y rendimiento), como pide `AGENTS.md`.

| Caso | Entrada | Resultado esperado | RF |
|---|---|---|---|
| Periodo con hoy lunes | `2026-10-26` | `2026-08-10` … `2026-11-01`, 84 días | RF-2 |
| Periodo con hoy domingo | `2026-11-01` | Mismo periodo; la semana actual sigue siendo la última | RF-2 |
| Cambio de año | `2026-01-05` | `2025-10-20` … `2026-01-11`, sin huecos ni duplicados | RF-2 |
| Año bisiesto | `2028-03-06` | Incluye `2028-02-29` y 84 fechas únicas | RF-2 |
| Cambio de hora | `2026-10-26`, tras el cambio del 25/10 | 84 fechas consecutivas, sin repetir ni saltar días | RF-2, RNF-9 |
| Suma del mismo día | Dos sesiones de 30 min | 60 min → nivel 3 | RF-3, RF-4 |
| Límites | 0, 1, 29, 30, 59, 60, 119, 120, 121 | Niveles 0, 1, 1, 2, 2, 3, 3, 4, 4 | RF-4 |
| Futuro | Sesión de mañana | No suma y la celda es `isFuture` | RF-5 |
| Fuera del periodo | Sesión del día anterior al inicio | Se ignora | RF-3 |
| Datos inválidos | `null`, texto, `2026-02-31`, minutos `"45"`, `0`, `-5`, `1.5` | Todos ignorados | RF-3, RNF-7 |
| Estado vacío | Solo datos inválidos o futuros | `hasSessions = false`, 84 celdas | RF-11 |
| Sin mutaciones | Array congelado con `Object.freeze` | No lanza y no cambia el array | RNF-6 |
| Etiquetas de mes | Periodo 10/08–01/11/2026 | `[7, null, null, 8, null, null, null, 9, null, null, null, 10]` | RF-8 |
| Primera columna con día 1 | `2027-03-15` (empieza el 28/12/2026) | La primera columna se etiqueta `ene` (0) y no `dic` | RF-8 |
| Celdas futuras | `2026-10-26` (lunes) | 84 celdas y 6 futuras (martes a domingo de la semana actual) | RF-5 |
| Tamaño de la cuadrícula | Cualquier `today` | 12 columnas × 7 días, cada fecha única | RF-2 |

Puerta de calidad (principio 4): no se pasa a la interfaz hasta que `node --test` esté en verde.

## 9. Orden de implementación

1. `heatmap.js` con las funciones puras.
2. `tests/heatmap.test.js` y `node --test` en verde.
3. Sección nueva en `index.html` y estilos base en `styles.css`.
4. `renderHeatmap()` en `app.js` y llamada desde `renderizarTodo()`.
5. Detalle, teclado, fijado y anuncios.
6. Integración con guardado y `visibilitychange`.
7. Verificación manual en Chrome: 375 px, 320 px, escritorio, teclado, toque, consola y `localStorage` intacto.
8. Rendimiento: cargar 2.000 sesiones de prueba en un contexto aislado, limitar la CPU a 4× en DevTools y comprobar que el mapa se dibuja y actualiza en menos de 100 ms.

## 10. Trazabilidad RF → piezas

| RF | Dónde se cumple | Cómo se comprueba |
|---|---|---|
| RF-1 | `index.html` (sección), `app.js` (`renderHeatmap`) | Inspección y orden de la página |
| RF-2 | `heatmap.js` (`buildPeriod`, `buildHeatmap`) | Tests de periodo |
| RF-3 | `heatmap.js` (`isValidSession`, `collectDailyMinutes`) | Tests de suma e inválidos |
| RF-4 | `heatmap.js` (`classifyMinutes`) y `styles.css` (relleno) | Tests de límites y captura en gris |
| RF-5 | `heatmap.js` (campo `isFuture`) y `app.js` (sin botón) | Test de futuro y prueba con teclado |
| RF-6 | `app.js` (`showHeatmapDetail`), `index.html` | Detalle con ratón, foco y toque |
| RF-7 | `app.js` (eventos y flechas) | Prueba manual de teclado y toque |
| RF-8 | `heatmap.js` (`buildMonthLabels`) y `styles.css` | Test de etiquetas y captura a 320 px |
| RF-9 | `index.html` (leyenda) y `styles.css` | Inspección visual |
| RF-10 | `app.js` (guardado y `visibilitychange`) | Alta de sesión y cambio de pestaña |
| RF-11 | `heatmap.js` (`hasSessions`) y `app.js` | Test de vacío y captura |
| RF-12 | `index.html`, `app.js` (`aria-label`, `tabindex`, anuncios) | Lector de pantalla y árbol de accesibilidad de DevTools |

## 11. Cumplimiento de la constitución

| Principio | Cómo lo cumple el plan |
|---|---|
| 1. Simplicidad primero | Un archivo nuevo de lógica y uno de tests; nada de dependencias, build ni módulos ES. Se sigue abriendo con doble clic. |
| 2. La spec manda | Cada RF está trazado a una pieza; no hay decisiones fuera de la spec. |
| 3. Lógica separada de la interfaz | `heatmap.js` no toca DOM ni localStorage y recibe `today` como parámetro. |
| 4. Tests como puerta | Las pruebas con `node --test` se escriben y se ponen en verde antes de la interfaz; no se instala nada. |
| 5. Datos sagrados | El mapa solo lee el array existente; no hay migración ni cambio de formato, y los datos dañados caen en el estado vacío. |
| 6. Idioma | Identificadores nuevos en inglés (JS, ids y clases); interfaz, copy y documentación en español. El código antiguo en español queda como deuda fuera de alcance. |

## 12. Riesgos y deuda asumida

- **Duplicación de ayudantes de fecha:** `heatmap.js` repite cuatro operaciones ya presentes en `app.js`. Se acepta para no refactorizar las estadísticas actuales; queda propuesta una spec futura que extraiga un módulo de fechas común.
- **Código en dos idiomas:** lo nuevo va en inglés y lo existente sigue en español. Es deuda consciente hasta una migración aparte.
- **Node:** los tests requieren Node 20 o superior; el proyecto no necesita Node para funcionar en el navegador.
- **Sin tests de interfaz automatizados:** el DOM se verifica con Chrome DevTools, según la política del proyecto.
