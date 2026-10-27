# Plan técnico 002 — Objetivo semanal de estudio

- **Spec de referencia:** `specs/002-objetivo-semanal/spec.md` (aprobada 26/10/2026, incluidos A-2, A-4, A-6, A-8 a A-13)
- **Constitución:** `docs/constitution.md`
- **Fecha:** 26/10/2026
- **Estado:** aprobado (26/10/2026); implementado

## 1. Objetivo y alcance

Añadir una sección **"Objetivo semanal"** entre "Tu constancia" y el mapa de calor que permita fijar, cambiar y quitar una meta de minutos semanales, y que muestre el progreso de la semana en curso en texto, porcentaje truncado, `Objetivo cumplido` y una barra proporcional accesible.

**Dentro del alcance:** sección nueva, cálculo del total semanal compartido con "Esta semana", validación del campo, lectura/escritura de `diarioDeEstudio.objetivoSemanal`, estados vacío / válido / inválido / error de almacenamiento, relectura al volver a la pestaña, estilos y accesibilidad.

**Fuera del alcance (spec §7):** objetivo diario o mensual, historial de objetivos, proyecciones, celebración, cambios en `diarioDeEstudio.sesiones`, migraciones, dependencias, red o build.

**Cobertura:** RF-1 a RF-10 y RNF-1 a RNF-12. Trazabilidad en la sección 14.

## 2. Archivos

| Archivo | Acción | Responsabilidad | ¿Aprobación previa? |
|---|---|---|---|
| `goal.js` | **Crear** | Lógica pura del objetivo: semana local, total semanal, validación del campo, lectura del objetivo guardado, porcentaje con tope, estado y proporción. Sin DOM, sin `localStorage`, sin reloj y sin red. | **Sí. Archivo nuevo aprobado por el usuario el 26/10/2026.** |
| `tests/goal.test.js` | **Crear** | Pruebas de `goal.js` con `node --test`, sin dependencias ni DOM. | **Sí (archivo nuevo aprobado por el usuario el 26/10/2026).** |
| `app.js` | Modificar | Delegar el total semanal, leer/escribir el objetivo, render de la sección, eventos, anuncios y relectura al volver a la pestaña. | No (archivo existente). |
| `index.html` | Modificar | Sección nueva entre "Tu constancia" y el mapa; carga de `goal.js` antes de `app.js`. | No. |
| `styles.css` | Modificar | Estilos de la sección, barra, foco, responsive 375/320, zoom, `forced-colors`. | No. |
| `AGENTS.md` | Modificar | Nueva clave en la sección Datos y regla del total semanal compartido. | No (al final, en T10). |
| `MEMORY.md` | Modificar | Estado y decisiones al terminar. | No (al final, en T10). |

**No se tocan:** el formato de `diarioDeEstudio.sesiones`, `normalizarSesion`, el respaldo del historial, `calcularRacha`, `calcularMejorRacha`, `calcularDiasDelMes`, `heatmap.js`, el formulario de sesión, la lista, el mapa de calor ni sus tests.

**Archivos nuevos que necesitan aprobación del usuario:** `goal.js` y `tests/goal.test.js` (la spec §10 lo exige explícitamente). `tests/goal.test.js` no cambia el producto, pero se lista por coherencia con la regla de `AGENTS.md` sobre archivos nuevos.

## 3. Decisiones técnicas

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| D-1 | Módulo nuevo `goal.js` con la lógica pura. | `app.js` no se puede cargar en Node (usa `document.getElementById` al arrancar). Separar permite probar con `node --test` sin simular el navegador (principio 3) y sigue la estela de `heatmap.js`. | Ampliar `heatmap.js` con el objetivo: mezcla dos funcionalidades en un módulo y sus tests, y obliga a tocar código ya verificado. Meter la lógica en `app.js`: imposible de probar sin DOM. |
| D-2 | Script clásico con IIFE + guardián `module.exports`, expuesto como global `Goal`. | Funciona con `file://` (sin `type="module"`) y con `require` en Node. Mismo patrón que `heatmap.js`, ya conocido por quien lee el proyecto. | Módulos ES: prohibidos por `AGENTS.md` para abrir con doble clic. `node:vm`: más código para el mismo resultado. |
| D-3 | Una sola función pura `Goal.sumWeekMinutes(sessions, today)`; `calcularMinutosSemana()` de `app.js` pasa a delegar en ella con `fechaATexto(new Date())`. | RF-2 exige una fuente única y RNF-10 exige el mismo resultado. Al delegar, "Esta semana" y la sección usan literalmente la misma función y el mismo parámetro. | Duplicar la fórmula en la sección: incumple RF-2 y desincroniza las cifras. |
| D-4 | `goal.js` lleva sus propios ayudantes de fecha (`textToDate`, `dateToText`, `addDays`, `startOfWeek`, `isValidSession`) y un test que comprueba que coinciden con los de `Heatmap`. | Mantiene `goal.js` autocontenido y sin depender del orden de carga: si `goal.js` llamara a `Heatmap`, los tests necesitarían cargar ambos y el módulo dejaría de ser puro por sí solo. La equivalencia se garantiza con tests, no con acoplamiento. | `goal.js` usando `Heatmap.*`: acopla el módulo puro a otro script y a su orden en `index.html`. Extraer `dates.js` compartido: refactor de `app.js` y `heatmap.js` fuera del alcance (misma deuda aceptada en 001). Recibir `weekStart` ya calculado: RF-2 exige que la función reciba sesiones y hoy, sin cálculo previo en la interfaz. |
| D-5 | `localStorage` solo en `app.js`, con `try/catch` (`readStoredGoal`, `saveStoredGoal`, `deleteStoredGoal`). | El módulo puro recibe texto y devuelve estado; así se prueba la interpretación de datos dañados sin navegador. La escritura no puede fallar de forma controlada en Node. | Acceder a `localStorage` desde `goal.js`: rompe la pureza y RNF-12, y obliga a simular almacenamiento. |
| D-6 | Formato guardado: `diarioDeEstudio.objetivoSemanal` = `{"minutos":300}` (A-2). | Un objeto se explica solo, deja sitio a campos futuros y no toca el historial. | Número como texto: opaco. Objetivo dentro de cada sesión: exigiría migrar. |
| D-7 | `parseStoredGoal(null)` → `none`; cualquier otro texto que no sea un objetivo válido → `invalid` (incluidos `""`, `null` JSON, array, número como texto, JSON roto). | Distingue "no hay nada" de "hay algo que no sirve", que es justo lo que RF-3 pide. Un `""` guardado es un valor presente que no sirve: se avisa y se ofrece quitarlo. | Tratar `""` como ausente: ocultaría un valor corrupto y no ofrecería limpiarlo. |
| D-8 | `<div role="progressbar">` con `aria-valuemin/max/now/valuetext` en lugar de `<progress>`. | Permite `aria-valuetext` con el progreso real, pintar la pista vacía visible al 0 % y controlar el relleno con los colores del proyecto. `<progress>` no se puede estilizar igual entre navegadores (necesita `::-webkit-progress-*` y `::-moz-progress-bar`) y no deja fijar con fiabilidad el estado vacío. | `<progress>`: menos control visual y de contraste, y estilos distintos por navegador. |
| D-9 | El render **nunca** escribe en el campo del objetivo; la sincronización del campo es una función aparte (`syncGoalField`), llamada solo al leer, guardar o quitar. | RF-9 prohíbe pisar el texto sin guardar y RF-6 exige conservarlo si falla el guardado. Separar render y sincronización lo hace estructural, no una precaución. | Escribir el campo en cada render: perdería lo escrito al guardar una sesión o al volver a la pestaña. |
| D-10 | La sección se construye en HTML estático y el render solo cambia `textContent`, atributos y `hidden`. | Conserva el foco del botón pulsado y el texto escrito; evita recrear el editor en cada repintado y cumple RNF-4 (repintado barato con 2.000 sesiones). | Reconstruir la sección con `createElement` en cada render: pierde foco, selección y texto, y cuesta más. |
| D-11 | Los textos de interfaz (mensajes, `aparece en…`, `%`, `más de 999 %`) viven en `app.js`; `goal.js` devuelve números y booleanos (`percent`, `percentValue`, `percentOverCap`, `ratio`, `isComplete`). | Mantiene la separación que ya usa `heatmap.js` (devuelve índices de mes, no abreviaturas) y deja la copia en un solo sitio. El tope se decide en el módulo puro y se prueba sin DOM; el literal `"+"` es copia. | Devolver frases ya formateadas desde `goal.js`: mezcla cálculo y copia y complica el formato de duración, que ya existe en `app.js` (`formatearDuracion`). |
| D-12 | Confirmación visible de la sección con `aria-hidden="true"` y anuncio por `#anuncio`; avisos de fallo en `role="alert"` propio de la sección; aviso de valor guardado inválido como párrafo visible sin región viva. | RF-10 pide lectura única y orden "pintar y luego anunciar". El aviso de valor inválido aparece al cargar la página: no debe interrumpir la lectura inicial. | `aria-live` sobre la sección: repite anuncios y ya está prohibido por la spec y por `MEMORY.md`. |

## 4. Contrato de `goal.js`

Reglas del módulo:

- Sin `document`, sin `localStorage`, sin `fetch`, sin `new Date()` sin argumentos y sin temporizadores.
- Fechas como texto `AAAA-MM-DD` y construidas con `new Date(año, mes - 1, día)`. Nunca `new Date("AAAA-MM-DD")`.
- La fecha de hoy siempre llega como parámetro `today`.
- No modifica los arrays ni los objetos que recibe.
- Expuesto como `Goal` en el navegador e importable con `require("../goal.js")`.

| Función | Firma | Devuelve | Uso |
|---|---|---|---|
| `addDays` | `(dateText, days)` | texto `AAAA-MM-DD` o `null` | Ayudante de fechas; equivalente a `Heatmap.addDays`. |
| `startOfWeek` | `(dateText)` | texto o `null` | Lunes de la semana (local); equivalente a `Heatmap.startOfWeek`. |
| `isValidSession` | `(entry)` | `boolean` | Objeto no nulo, no array, fecha real y `minutos` entero ≥ 1. |
| `sumWeekMinutes` | `(sessions, today)` | número ≥ 0 | **Fuente única** del total de "Esta semana" y del progreso (RF-2). Ignora lo inválido, lo futuro y lo anterior al lunes. |
| `parseGoalInput` | `(rawValue)` | `{ ok: true, minutes }` \| `{ ok: false, reason: "empty" \| "invalid", minutes: null }` | Validación del campo (RF-6), sin DOM. |
| `parseStoredGoal` | `(rawText)` | `{ status: "none" \| "valid" \| "invalid", minutes }` | Interpretación de lo guardado (RF-3, RF-8). `minutes` es `null` salvo en `valid`. |
| `buildGoalState` | `(sessions, today, goalMinutes)` | objeto de estado | Números listos para pintar (RF-4, RF-5). |

Forma del estado que devuelve `buildGoalState`:

```
{
  hasGoal: boolean,          // goalMinutes es entero entre 1 y 10080
  goalMinutes: number|null,
  studiedMinutes: number,    // sumWeekMinutes(sessions, today)
  percent: number|null,      // truncado real, sin tope; null si no hay objetivo
  percentValue: number|null, // min(percent, 999); null si no hay objetivo
  percentOverCap: boolean,   // percent > 999
  isComplete: boolean,       // hasGoal && studiedMinutes >= goalMinutes
  ratio: number              // 0..1, recortado; 0 si no hay objetivo
}
```

Notas de contrato:

- `buildGoalState` con `goalMinutes` `null`, `0`, negativo, decimal, texto o fuera de rango devuelve `hasGoal: false` y el progreso se puede calcular igual (defensivo y probado).
- `ratio` es la proporción **real** recortada a 1. No existe relleno mínimo: `1/10080` da `0.0000992…`, no `0.01`.
- El cumplimiento se decide con minutos, nunca con `percentValue`.

## 5. Algoritmos en pseudocódigo

```
FUNCIÓN startOfWeek(dateText):                 // lunes = 0 … domingo = 6
  fecha = textToDate(dateText)                 // null si el texto no es fecha real
  SI fecha = null: DEVOLVER null
  DEVOLVER addDays(dateText, -((fecha.getDay() + 6) % 7))

FUNCIÓN sumWeekMinutes(sessions, today):
  SI NO es lista(sessions): DEVOLVER 0
  lunes = startOfWeek(today)
  SI lunes = null: DEVOLVER 0
  total = 0
  PARA CADA sesion EN sessions:
    SI NO isValidSession(sesion): continuar
    SI sesion.fecha < lunes O sesion.fecha > today: continuar
    total = total + sesion.minutos
  DEVOLVER total

FUNCIÓN parseGoalInput(rawValue):
  texto = String(rawValue == null ? "" : rawValue).trim()
  SI texto = "": DEVOLVER { ok: false, reason: "empty", minutes: null }
  SI NO /^\d+$/ prueba texto: DEVOLVER { ok: false, reason: "invalid", minutes: null }
  minutos = Number(texto)
  SI NO enteroSeguro(minutos) O minutos < 1 O minutos > 10080:
    DEVOLVER { ok: false, reason: "invalid", minutes: null }
  DEVOLVER { ok: true, minutes: minutos }

FUNCIÓN parseStoredGoal(rawText):
  SI rawText = null O rawText = undefined: DEVOLVER { status: "none", minutes: null }
  intentar: datos = JSON.parse(rawText)
  si falla: DEVOLVER { status: "invalid", minutes: null }
  SI datos = null O tipo(datos) != "object" O esArray(datos):
    DEVOLVER { status: "invalid", minutes: null }
  minutos = datos.minutos
  SI NO enteroSeguro(minutos) O minutos < 1 O minutos > 10080:
    DEVOLVER { status: "invalid", minutes: null }
  DEVOLVER { status: "valid", minutes: minutos }

FUNCIÓN buildGoalState(sessions, today, goalMinutes):
  estudiado = sumWeekMinutes(sessions, today)
  SI NO objetivoValido(goalMinutes):
    DEVOLVER { hasGoal: false, goalMinutes: null, studiedMinutes: estudiado,
               percent: null, percentValue: null, percentOverCap: false,
               isComplete: false, ratio: 0 }
  porcentaje = truncar(estudiado / goalMinutes * 100)   // Math.floor
  DEVOLVER {
    hasGoal: true,
    goalMinutes: goalMinutes,
    studiedMinutes: estudiado,
    percent: porcentaje,
    percentValue: min(porcentaje, 999),
    percentOverCap: porcentaje > 999,
    isComplete: estudiado >= goalMinutes,
    ratio: min(estudiado / goalMinutes, 1)
  }
```

Notas:

- `enteroSeguro` = `Number.isInteger` (+ rango seguro) para evitar aceptar `"300"`, `1.5` o `1e21`.
- `^\d+$` solo admite dígitos ASCII: rechaza `-30`, `+300`, `1,5`, `1.5`, `1e3`, `300 min`, `1 000` y dígitos de otros alfabetos.
- `0300` → `Number("0300")` = 300, y `app.js` normaliza el campo a `"300"` tras guardar.
- Las fechas se comparan como texto: el orden lexicográfico coincide con el cronológico.

## 6. Flujo de datos y estados

```
localStorage["diarioDeEstudio.objetivoSemanal"]  (texto o null)
        │  readStoredGoal()  — try/catch en app.js
        ▼
Goal.parseStoredGoal(texto) → { status: none|valid|invalid, minutes }
        │
        ├─ none    → shownGoal = null, storedInvalid = false
        ├─ invalid → shownGoal = null, storedInvalid = true
        └─ valid   → shownGoal = minutes, storedInvalid = false
        │
sesiones (memoria de app.js) + today = fechaATexto(new Date())
        ▼
Goal.buildGoalState(sesiones, today, shownGoal) → números
        ▼
renderGoal()  → línea visible, barra (aria-*), mensajes, botones
        ▼
anunciar() / #goal-alert  SOLO tras guardar, quitar o fallar
```

Variables de estado nuevas en `app.js`:

| Variable | Significado |
|---|---|
| `shownGoal` | Minutos del objetivo que se están mostrando (`null` si no hay). Es el que usa el progreso, aunque el almacenamiento cambie en otra pestaña. |
| `storedInvalid` | Hay un valor guardado que no es válido (muestra el aviso y `Quitar objetivo`). |
| `lastReadGoalValue` | Texto que se escribió en el campo en la última lectura, guardado o borrado; sirve para detectar cambios sin guardar (RF-9). |
| `savingGoal` | Evita dobles envíos mientras se guarda. |

Tabla de estados de la sección:

| Estado | Origen | Progreso / barra | Editor | Avisos |
|---|---|---|---|---|
| Sin objetivo | `status: none` | Mensaje de RF-3, sin barra ni porcentaje | Campo vacío, `Fijar objetivo`, sin quitar | Ninguno |
| Objetivo válido | `status: valid` | Línea + barra + porcentaje + `Objetivo cumplido` si toca | Campo con el valor, `Guardar objetivo`, quitar visible | Ninguno |
| Valor guardado inválido | `status: invalid` | Igual que sin objetivo | Campo vacío, `Fijar objetivo`, quitar visible | Aviso de valor inválido (visible, sin región viva) |
| Error al guardar | `setItem` lanza | No cambia el estado anterior | Conserva el texto escrito y el foco | `#goal-alert`: `No se ha podido guardar el objetivo…` |
| Error al quitar | `removeItem` lanza | No cambia el estado anterior (incluido el inválido) | Sin cambios | `#goal-alert`: `No se ha podido quitar el objetivo…` |
| Confirmación | Guardado o borrado correcto | Ya actualizado | Botón y campo normalizados / vaciados | `#goal-confirm` (decorativa) + `#anuncio` |

## 7. Integración con el renderizado existente

### 7.1 Funciones nuevas en `app.js` (identificadores en inglés)

| Función | Responsabilidad |
|---|---|
| `readStoredGoal()` | `localStorage.getItem` con `try/catch`; devuelve `Goal.parseStoredGoal` o `none` si el acceso falla. |
| `saveStoredGoal(minutes)` | `setItem(CLAVE_OBJETIVO, JSON.stringify({ minutos }))`; `true`/`false`. |
| `deleteStoredGoal()` | `removeItem`; `true`/`false`. |
| `renderGoal()` | Calcula el estado y actualiza texto, porcentaje, barra, botones y mensajes. **No escribe en el campo ni toca las confirmaciones.** |
| `syncGoalField()` | Escribe en el campo el valor de `shownGoal` (o lo vacía) y actualiza `lastReadGoalValue`. |
| `showGoalAlert(text)` / `clearGoalAlert()` | Región `role="alert"` de la sección. |
| `showGoalConfirmation(text)` / `clearGoalConfirmation()` | Confirmación visible decorativa. |
| `handleGoalSubmit(event)` | Validación, guardado, normalización del campo, orden pintar → anunciar. |
| `handleGoalRemove()` | Borrado, estado sin objetivo, aviso y foco al campo. |
| `refreshGoalOnVisible()` | Relectura condicionada al volver a la pestaña (RF-9). |

`renderizarTodo()` pasa a ser:

```
renderizarRacha()
renderizarSesiones()
renderizarAvisoDatos()
renderGoal()                 ← nuevo
return renderHeatmap()       ← se mantiene el valor devuelto para el anuncio del formulario
```

Como el formulario ya llama a `renderizarTodo()` al guardar, editar, borrar y deshacer, el progreso se actualiza sin ningún camino nuevo (RF-9, primera viñeta).

### 7.2 Eventos y orden de anuncios

- **Enviar el formulario del objetivo:** `preventDefault`, validar con `Goal.parseGoalInput`, marcar `aria-invalid` y `#goal-error`, enfocar el campo si hay error; si es válido, guardar, actualizar `shownGoal`, `syncGoalField()`, `renderGoal()`, limpiar error y aviso de valor inválido, mostrar confirmación y **después** `anunciar("Objetivo semanal guardado: " + formatearDuracion(minutes) + " por semana.")`.
- **Quitar:** borrar, `shownGoal = null`, `storedInvalid = false`, vaciar campo, limpiar avisos, `renderGoal()`, `anunciar("Objetivo semanal quitado.")` y foco al campo.
- **Fallo de guardado o borrado:** revertir solo la variable en memoria, conservar el texto y el foco, `renderGoal()` y `showGoalAlert(mensaje)`. No se usa `#anuncio` (RF-10).
- **Escribir en el campo:** se limpia `#goal-error`, `aria-invalid` y la confirmación decorativa. El progreso no cambia hasta guardar.
- **Volver a la pestaña:** dentro del `visibilitychange` existente, después de `sesiones = cargarSesiones()` y antes de `renderizarTodo()`, `refreshGoalOnVisible()`:
  - con cambios sin guardar (`campo.value.trim() !== lastReadGoalValue`) o con el foco en el campo → no se relee ni se escribe el campo; solo se recalcula el progreso con `shownGoal`;
  - sin cambios → se relee el almacenamiento, se actualizan `shownGoal`, `storedInvalid`, `syncGoalField()` y se pinta;
  - nunca se anuncia nada (RF-9).
- **Sin temporizadores y sin evento `storage`** (fuera de alcance).

### 7.3 Sin regresiones (RNF-10)

`calcularMinutosSemana()` se reduce a:

```
return Goal.sumWeekMinutes(sesiones, fechaATexto(new Date()));
```

`renderizarRacha()` y el texto de "Esta semana" no cambian; el formato sigue en `formatearDuracion`. La igualdad se comprueba de tres formas:

1. **Test de referencia:** `tests/goal.test.js` implementa la fórmula antigua con `Heatmap.startOfWeek`/`Heatmap.addDays` y compara con `Goal.sumWeekMinutes` sobre un conjunto de casos realistas (varias sesiones por día, futuras, anteriores al lunes, cambios de mes y de año, cambio de hora).
2. **Test de equivalencia de ayudantes:** para una matriz de fechas, `Goal.startOfWeek(x) === Heatmap.startOfWeek(x)` y `Goal.addDays(x, n) === Heatmap.addDays(x, n)`.
3. **Comprobación manual en Chrome (T3):** con el mismo `localStorage`, anotar "Esta semana" antes y después del cambio, y repetir tras guardar, editar, borrar y deshacer una sesión.

## 8. Interfaz

### 8.1 Estructura HTML (esquema)

```
<section class="tarjeta goal" id="goal" aria-labelledby="goal-title">
  <h2 id="goal-title">Objetivo semanal</h2>

  <div class="goal__status" id="goal-status" hidden>
    <p class="goal__progress" id="goal-progress" aria-hidden="true">
      <span class="goal__value" id="goal-value"></span>
      <span class="goal__percent" id="goal-percent"></span>
      <span class="goal__complete" id="goal-complete" hidden>Objetivo cumplido</span>
    </p>
    <div class="goal__track" id="goal-track"
         role="progressbar"
         aria-label="Progreso del objetivo semanal"
         aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="">
      <span class="goal__fill" id="goal-fill" aria-hidden="true"></span>
    </div>
  </div>

  <p class="goal__empty" id="goal-empty" hidden>Todavía no has fijado un objetivo semanal. Elige cuántos minutos quieres estudiar cada semana.</p>
  <p class="goal__notice" id="goal-notice" hidden>El objetivo guardado no es válido y se ha ignorado. Fija uno nuevo o quita el valor guardado.</p>
  <p class="goal__alert error" id="goal-alert" role="alert" hidden></p>

  <form class="goal__form" id="goal-form" novalidate>
    <div class="campo">
      <label for="goal-minutes">Minutos por semana</label>
      <input type="text" id="goal-minutes" name="goal-minutes" inputmode="numeric"
             autocomplete="off" aria-describedby="goal-help goal-error">
      <p class="campo__aviso" id="goal-help">Por ejemplo, 300 minutos son 5 horas.</p>
      <p class="campo__error" id="goal-error" hidden></p>
    </div>
    <div class="goal__actions">
      <button type="submit" class="boton" id="goal-submit">Fijar objetivo</button>
      <button type="button" class="boton-secundario" id="goal-remove" hidden>Quitar objetivo</button>
    </div>
  </form>

  <p class="goal__confirm confirmacion" id="goal-confirm" aria-hidden="true" hidden></p>
</section>
```

- La sección va **después** de `.racha` y **antes** de `.heatmap`, sin `tabindex` ni regiones vivas contenedoras.
- `#goal-progress` se oculta a tecnologías de asistencia (A-13): el `aria-valuetext` de la barra es el texto completo.
- `#goal-confirm` es decorativa porque el texto se anuncia en `#anuncio` (RF-10).
- Los identificadores nuevos van en inglés (principio 6); los textos, en español.
- `index.html` carga `goal.js` **antes** de `app.js`, después de `heatmap.js`.

### 8.2 Reglas de `styles.css`

- La sección reutiliza `.tarjeta`; añade `.goal` para el espaciado y `.goal__*` para sus piezas.
- `.goal__progress`: tipografía serif del proyecto, `display: flex`, `flex-wrap: wrap`, `column-gap: .4em`, `min-width: 0`, números tabulares; el porcentaje con `white-space: nowrap`.
- `.goal__value`: tamaño destacado (similar a `.racha__valor--semana`); `.goal__percent`: acento verde; `.goal__complete`: resaltado amarillo con texto oscuro (contraste ≥ 4,5:1) y `border-radius` de subrayador, no solo color.
- `.goal__track`: altura 12 px, `background: var(--superficie-suave)`, borde 1 px `--borde-control` (visible al 0 %), `border-radius: 999px`, `overflow: hidden`.
- `.goal__fill`: `height: 100%`, `background: var(--acento)` (≥ 3:1 frente a la pista), `width` fijada por JS en `ratio * 100 + "%"`, **sin `min-width`** (RF-5).
- `.goal__actions`: `flex-wrap: wrap`, `gap: 8px`, botones `flex: 1 1 150px`; a 320 px se apilan sin desbordar.
- `.goal__empty` y `.goal__notice`: mismo tratamiento que `.heatmap__empty` y `.campo__aviso` (cursiva suave / aviso en `--aviso`).
- `@media (forced-colors: active)`: borde `CanvasText` en `.goal__track`, relleno con `CanvasText` y `forced-color-adjust: none`; el porcentaje y `Objetivo cumplido` siguen en texto.
- `@media (max-width: 480px)`: sección y pista a ancho completo, texto de progreso a varias líneas permitido.
- Foco: input y botones usan ya `input:focus` y `button:focus-visible` globales; no se añade estilo que los anule.
- Nada de animaciones nuevas (`prefers-reduced-motion` sigue cubriendo botones).

## 9. Accesibilidad (resumen de cumplimiento)

| Requisito | Cómo se cumple |
|---|---|
| RF-10 etiqueta, ayuda y error | `label[for]`, `aria-describedby="goal-help goal-error"`, `aria-invalid="true"` y el mismo patrón de `marcarErrorCampo` del formulario. |
| Nombre y rango del indicador | `role="progressbar"`, `aria-label="Progreso del objetivo semanal"`, `aria-valuemin="0"`, `aria-valuemax` = objetivo, `aria-valuenow` = `min(estudiado, objetivo)`. |
| `aria-valuetext` con el progreso real | `formatearDuracion(estudiado) + " de " + formatearDuracion(objetivo) + ", " + labelPorcentaje`, más `", Objetivo cumplido"`; si `percentOverCap`, `más de 999 %`. Prevalece sobre `valuenow` recortado. |
| Lectura única | `aria-hidden="true"` en `#goal-progress`; confirmación visible decorativa; sin `aria-live` en la sección. |
| Anuncios | Éxito y borrado por `#anuncio` (ya existente, con vaciado previo); fallos por `#goal-alert` (`role="alert"`). Orden: pintar → anunciar. |
| Sin depender del color | Texto, porcentaje y `Objetivo cumplido` siempre visibles; la barra solo acompaña. |
| Teclado y foco | Orden natural: campo → `Fijar/Guardar objetivo` → `Quitar objetivo`; el foco se mueve al campo en error, al quitar y nunca se pierde al guardar (el DOM del editor no se recrea). |

## 10. Estrategia de tests con `node --test`

- Comando: `node --test`. Sin `package.json`, sin dependencias, sin DOM.
- Archivo nuevo: `tests/goal.test.js` (CommonJS: `node:test`, `node:assert/strict`, `require("../goal.js")` y `require("../heatmap.js")` **solo para las pruebas de equivalencia**).
- Los tests se escriben antes que la implementación de cada tarea. Puerta de calidad: no se pasa a la interfaz con rojo.
- La interfaz se verifica con Chrome DevTools (sección 12), como pide `AGENTS.md`.

| Bloque | Casos | RF |
|---|---|---|
| Semana y total | Lunes 26/10/2026 con 19/10 (120), 21/10 (60) y 26/10 (45) → 45. Añadir 28/10 (30) → 45. Jueves 29/10 con 26/10 (30) y 26/10 (45) → 75. | RF-2 |
| Filtros | Sesión anterior al lunes, futura dentro de la semana, fuera de rango, `null`, texto, array, `{}`, `2026-02-31`, minutos `"45"`, `0`, `-5`, `1.5` → todas ignoradas. Lista no-array y `today` inválido → 0. | RF-2, RNF-7 |
| Semana que cruza | Lunes 28/12/2026 con sesiones 27/12 y 1/1/2027 → solo cuenta la de enero si `today ≥ 2027-01-01`. | RF-2, RNF-9 |
| Cambio de hora | `2026-10-25` y `2026-03-29`: lunes correcto y 7 fechas consecutivas sin saltos. | RNF-9 |
| Equivalencia con `Heatmap` | Matriz de ~20 fechas (incluye 29/02/2028, 31/12, 1/1): `startOfWeek` y `addDays` coinciden. `sumWeekMinutes` coincide con la fórmula antigua de referencia sobre 5 fixtures. | RF-2, RNF-10 |
| Validación del campo | `"300"`→300, `" 300 "`→300, `"0300"`→300, `"1"`→1, `"10080"`→10080; `""` y `"   "`→`empty`; `"abc"`, `"1,5"`, `"1.5"`, `"1e3"`, `"+300"`, `"-30"`, `"300 min"`, `"1 000"`, `"٣٠٠"`, `"0"`, `"10081"`, `"999999999999999999999"`→`invalid`. | RF-6, RNF-12 |
| Lectura de lo guardado | `null`→`none`; `""`, `"{"`, `"null"`, `"[]"`, `"42"`, `'"300"'`, `{"minutos":"300"}`, `{"minutos":0}`, `{"minutos":-30}`, `{"minutos":1.5}`, `{"minutos":10081}`, `{}`→`invalid`; `{"minutos":1}`, `{"minutos":300}`, `{"minutos":10080}`, `{"minutos":300,"x":1}`→`valid`. | RF-3, RF-8 |
| Tabla de truncado | (0,300)→0 %, no cumple, ratio 0. (1,10080)→0 %. (1,1)→100 %, cumple, ratio 1. (299,300)→99 %, no cumple. (300,300)→100 %, cumple. (301,300)→100 %, cumple. (450,300)→150 %. (9,1)→900 %. (10,1)→`percentValue` 999 con `percentOverCap`. (999,100)→999 sin `+`. | RF-4 |
| Barra | `ratio` 0 con 0 min; `1/10080` > 0 y < 0,001 (sin relleno mínimo); 299/300 ≈ 0,9967; 300/300 = 1; 450/300 = 1. | RF-5 |
| Sin objetivo | `buildGoalState(..., null)`, `0`, `-30`, `1.5`, `"300"`, `10081` → `hasGoal: false`, `percent: null`, `ratio: 0`, `studiedMinutes` correcto. | RF-3, RF-5 |
| Sin mutaciones | `Object.freeze` en sesiones: no lanza y el `JSON.stringify` no cambia. | RNF-6 |
| Estado vacío del historial | Objetivo 300 con `[]` → 0 min, 0 %, ratio 0, no cumple. | 6 |

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El total semanal cambia por validar más que antes (RNF-10). | `app.js` solo pasa sesiones ya normalizadas por `normalizarSesion`, así que la validación extra no descarta nada real; test de referencia con la fórmula antigua y comparación manual en Chrome. |
| Tres copias de los ayudantes de fecha (`app.js`, `heatmap.js`, `goal.js`). | Duplicación mínima y deliberada, con tests de equivalencia entre `Goal` y `Heatmap`. Deuda documentada y candidata a spec futura (`dates.js`). |
| Si `goal.js` no se carga, `app.js` falla y se rompe todo el diario. | Orden de scripts en `index.html`, `node --check` en cada tarea y comprobación de consola en Chrome (T3). |
| El render pisa el texto sin guardar o pierde el foco. | Regla D-9/D-10: el render no escribe en el campo y no recrea nodos; la sincronización es una función aparte. |
| Anuncios duplicados o fuera de orden. | `aria-hidden` en la línea visible y en la confirmación; `#goal-alert` solo para fallos; pintar antes de llamar a `anunciar()`. |
| `aria-valuenow` recortado oculta el progreso real. | `aria-valuetext` siempre con minutos y porcentaje reales; probado con lector de pantalla. |
| Desbordamiento a 320 px o con zoom. | Línea de progreso con `flex-wrap`, porcentaje en una sola pieza corta, botones que se apilan, pista a ancho completo; matriz de zoom en la verificación. |
| Barra invisible en progresos mínimos (1/10080). | Decisión de la spec: no hay relleno mínimo; se acepta y queda documentado. |
| Repintado lento con 2.000 sesiones (RNF-4). | El render solo cambia nodos existentes y no relee `localStorage`; se mide con CPU 4×. |
| Datos dañados o almacenamiento bloqueado. | `readStoredGoal`, `saveStoredGoal` y `deleteStoredGoal` con `try/catch`; estados `none`/`invalid` y avisos de la spec; el historial no se toca. |
| El usuario no aprueba `goal.js` (histórico: aprobado el 26/10/2026). | El plan se detenía en T1: sin aprobación había que volver a la spec (la alternativa sería un `app.js` no testeable en Node). Ya no aplica: el usuario aprobó `goal.js` y `tests/goal.test.js` el 26/10/2026. |

## 12. Verificación manual (Chrome DevTools)

1. **Estados con `localStorage` manipulado**: clave ausente; `{"minutos":300}`; `{"minutos":"300"}`; `{"minutos":0}`; `{` roto; `1180` (inválido por tipo). En cada caso: mensaje, aviso, botones, barra y porcentaje esperados.
2. **Progreso**: 0 min, 1 min con objetivo 10 080, 299/300, 300/300, 301/300, 450/300, 9/1, 10/1 (`999 %+`), objetivo 10 080 (`168 h`) y objetivo 1 min.
3. **Igualdad con "Esta semana"**: anotar la cifra de la tarjeta y la del objetivo antes y después de guardar, editar, borrar y deshacer una sesión; deben coincidir siempre.
4. **Validación y foco**: vacío, solo espacios, `abc`, `1,5`, `1.5`, `1e3`, `+300`, `-30`, `300 min`, `0`, `10 081`, `0300`; comprobar `aria-invalid`, mensaje asociado y foco en el campo; tras corregir, el error desaparece.
5. **Fallos de almacenamiento**: sobrescribir temporalmente `Storage.prototype.setItem`/`removeItem` en la consola para que lancen; verificar que se mantiene el objetivo anterior, se conserva el texto y el foco, y que el aviso sale una sola vez.
6. **Pestaña**: cambiar el objetivo en otra pestaña y volver con y sin cambios escritos en el campo; comprobar que no se anuncia nada y que el texto escrito sobrevive.
7. **Cambio de semana**: con la fecha del sistema o editando el historial, comprobar lunes a 0 min con el objetivo intacto (incluido el salto 28/12/2026 → 3/1/2027).
8. **Responsive**: 375 px y 320 px sin desplazamiento horizontal; editor apilado si hace falta; botones ≥ 24 px de alto.
9. **Zoom**: 200 % sobre ventana de 1280 px y sobre 375 px; sin scroll horizontal ni texto recortado.
10. **Teclado**: recorrido completo de la sección, foco visible, guardar y quitar solo con teclado; el orden de tabulación no salta a la barra.
11. **Lector de pantalla**: nombre y valor del indicador, `valuenow` recortado al máximo con `valuetext` real, lectura única del progreso, orden "progreso → anuncio" al guardar, y error solo en su región de alerta.
12. **`forced-colors`**: en DevTools → Rendering → Emulate `forced-colors: active`; la pista conserva borde y el porcentaje y el estado siguen en texto.
13. **Contraste**: textos ≥ 4,5:1, foco ≥ 3:1, relleno ≥ 3:1 frente a la pista.
14. **Rendimiento**: cargar 2.000 sesiones de prueba, CPU 4× y medir `renderGoal()` (no `renderizarTodo`) al guardar y al quitar; menos de 50 ms.
15. **Consola**: sin errores ni avisos; sin peticiones de red nuevas; `diarioDeEstudio.sesiones` intacto tras toda la interacción.

## 13. Documentación

- `AGENTS.md`: añadir `diarioDeEstudio.objetivoSemanal` (`{"minutos":300}`) a la sección **Datos** y una línea en **Fechas y racha** que fije que el total semanal sale de `Goal.sumWeekMinutes` compartido con "Esta semana", sin guardarse.
- `MEMORY.md`: estado (sección implementada, tests en verde, verificación) y decisiones (clave aparte, render que no escribe el campo, barra con `role="progressbar"` y `aria-valuetext`, aviso de valor inválido sin región viva, relectura condicional al volver a la pestaña) y la deuda de ayudantes de fecha triplicados.
- Sin cambios en `docs/constitution.md`.

## 14. Trazabilidad RF → pieza

| RF | Dónde se cumple | Cómo se comprueba |
|---|---|---|
| RF-1 | `index.html` (sección y posición), `styles.css` | Inspección y orden de la página |
| RF-2 | `goal.js` (`sumWeekMinutes`) y `app.js` (`calcularMinutosSemana` delegado) | Tests de semana + igualdad con "Esta semana" |
| RF-3 | `goal.js` (`parseStoredGoal`), `app.js` (`readStoredGoal`, `renderGoal`) | Tests de lectura y prueba de los tres estados |
| RF-4 | `goal.js` (`buildGoalState`), `app.js` (textos con `formatearDuracion`) | Tabla de truncado y tope |
| RF-5 | `goal.js` (`ratio`), `app.js`/`styles.css` (relleno) | Tests de proporción y prueba visual |
| RF-6 | `goal.js` (`parseGoalInput`), `app.js` (`handleGoalSubmit`) | Tests de validación y prueba de foco/error |
| RF-7 | `app.js` (`handleGoalRemove`, `deleteStoredGoal`) | Prueba de quitar y de fallo simulado |
| RF-8 | `app.js` (`saveStoredGoal`, clave aparte) | Recarga, cierre, historial dañado |
| RF-9 | `app.js` (`renderizarTodo`, `refreshGoalOnVisible`) | Guardar/editar/borrar/deshacer y volver a la pestaña |
| RF-10 | `index.html` (marcado), `app.js` (anuncios) | Lector de pantalla y árbol de accesibilidad |
| RNF-1/2/3 | `styles.css` | 375/320, zoom, contraste y `forced-colors` |
| RNF-4 | `app.js` (`renderGoal` sin recrear nodos) | CPU 4× con 2.000 sesiones |
| RNF-6/7 | clave aparte y `try/catch` | Historial intacto y datos dañados |
| RNF-10 | delegación + tests de referencia | Tests y comparación en Chrome |
| RNF-12 | `tests/goal.test.js` | `node --test` sin dependencias |

## 15. Cumplimiento de la constitución

| Principio | Cómo lo cumple el plan |
|---|---|
| 1. Simplicidad | Un módulo nuevo, un test nuevo y cambios puntuales; sin dependencias, build, red ni módulos ES. |
| 2. La spec manda | Cada pieza está trazada a un RF; las decisiones no pedidas (D-1, D-4, D-8, D-12) se justifican con su alternativa descartada y el archivo nuevo se somete a aprobación. |
| 3. Lógica separada | `goal.js` es puro, recibe `today` y no conoce DOM ni almacenamiento. |
| 4. Tests como puerta | Tests antes de cada pieza; `node --test` en verde para cerrar cada tarea. |
| 5. Datos sagrados | Clave aparte, sin migraciones, sin borrar valores ajenos a una acción explícita, `try/catch` en todo acceso. |
| 6. Idioma | Identificadores, ids y clases nuevos en inglés; interfaz, mensajes y documentación en español. |

## 16. Criterios de aceptación del plan

1. Los diez RF tienen al menos una pieza y una prueba asignadas (sección 14).
2. `goal.js` no usa DOM, `localStorage`, red ni reloj, y se puede importar con `require`.
3. El total semanal solo se calcula en `Goal.sumWeekMinutes` y "Esta semana" lo consume mediante delegación.
4. Todo acceso a `localStorage` está en `app.js` y dentro de `try/catch`.
5. El render no escribe en el campo del objetivo ni recrea sus nodos.
6. La barra expone nombre, mínimo, máximo, valor recortado y `aria-valuetext` real; la línea visible y la confirmación son decorativas.
7. Los fallos salen solo en `#goal-alert`; los éxitos, solo en `#anuncio`, después de pintar.
8. Cada tarea de `tasks.md` deja `node --test` en verde y es implementable por separado.
9. No se modifica el formato de las sesiones, no se añaden dependencias y no hay peticiones de red.
10. Quedan identificados los archivos nuevos pendientes de aprobación (`goal.js`, `tests/goal.test.js`) y los riesgos con su mitigación.
