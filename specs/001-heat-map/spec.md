# Especificación 001 — Mapa de calor de constancia

- **Estado:** lista para aprobación (hallazgos de QA resueltos)
- **Fecha:** 26/10/2026

## 1. Contexto y objetivo

El Diario de Estudio ya registra sesiones con fecha, tema y minutos, y resume la constancia con la racha actual, la mejor racha, los minutos de la semana y los días estudiados del mes. Esos datos responden a "cuánto" y "cuándo", pero no dejan ver de un vistazo el ritmo de las últimas semanas.

Esta funcionalidad añade un **mapa de calor** que representa los días de las últimas 12 semanas: cada día es una celda y su intensidad crece con los minutos estudiados ese día.

**Objetivo:** que la persona vea en segundos su constancia reciente, detecte días flojos o fuertes y se motive a mantener el hábito, sin introducir datos nuevos ni cambiar las estadísticas existentes.

**Éxito:** la persona puede distinguir a simple vista los días estudiados, comparar su intensidad, consultar la fecha y los minutos de un día concreto y hacerlo también desde el móvil y con teclado.

## 2. Usuarios

- **Estudiante con historial:** registra sesiones con cierta frecuencia y quiere ver su patrón de las últimas semanas sin recorrer la lista completa.
- **Estudiante que empieza:** acaba de abrir el diario o todavía no tiene sesiones en el periodo y necesita entender qué muestra el mapa y cómo empezar.
- **Persona que navega con teclado o lector de pantalla:** necesita que el mapa no dependa solo del color y que cada día exponga su información.

## 3. Historias de usuario

- **US-1.** Como estudiante, quiero ver de un vistazo los días que he estudiado en las últimas 12 semanas para valorar mi constancia.
- **US-2.** Como estudiante, quiero que los días con más minutos se vean más intensos para identificar mis mejores días y los más flojos.
- **US-3.** Como estudiante, quiero consultar la fecha y los minutos exactos de un día concreto sin salir de la pantalla.
- **US-4.** Como estudiante que usa el móvil, quiero ver el mapa completo sin desplazamiento horizontal para interpretarlo cómodamente.
- **US-5.** Como estudiante sin sesiones recientes, quiero entender que el mapa está vacío y qué puedo hacer para empezar.

## 4. Requisitos funcionales

### RF-1. Sección del mapa

El sistema deberá mostrar el mapa de calor en la pantalla principal como una sección adicional, titulada **"Constancia de las últimas 12 semanas"**.

**Criterios de aceptación (EARS):**
- Cuando se abre el diario, el sistema deberá mostrar la sección entre el resumen de racha y el formulario de nueva sesión.
- El sistema deberá mantener visibles y sin cambios la racha actual, la mejor racha, el total semanal, los días del mes y la lista de sesiones.
- La sección deberá estar disponible sin iniciar sesión, sin conexión y sin pedir datos a la red.

### RF-2. Periodo y estructura

El sistema deberá representar 12 semanas naturales de lunes a domingo. La última columna será la semana que contiene hoy, aunque esté incompleta.

**Criterios de aceptación (EARS):**
- El sistema deberá mostrar 12 columnas, una por semana, y 7 filas, una por día de la semana, de lunes a domingo.
- La primera columna deberá comenzar en el lunes situado 11 semanas antes del lunes de la semana actual.
- La última columna deberá terminar en el domingo de la semana que contiene hoy, aunque ese domingo sea posterior a hoy.
- Cuando hoy sea lunes, el periodo deberá empezar 77 días antes de hoy; cuando hoy sea domingo, la semana en curso seguirá siendo la última columna.
- El periodo deberá incluir el primer lunes y el último domingo completos.
- Ejemplo verificable: si hoy es lunes 26/10/2026, el mapa deberá abarcar del lunes 10/08/2026 al domingo 01/11/2026.

### RF-3. Minutos por día

El sistema deberá calcular los minutos de cada día como la suma de los minutos de las sesiones guardadas con esa fecha.

**Criterios de aceptación (EARS):**
- Cuando un día tenga varias sesiones, el sistema deberá sumar sus minutos y representarlo como un único día.
- El sistema deberá usar la fecha local de cada sesión, sin desplazarla de día.
- El sistema deberá considerar válida una sesión solo si es un objeto con fecha `AAAA-MM-DD` real y `minutos` entero mayor o igual que 1.
- Si una sesión tiene fecha inválida, minutos no numéricos, decimales, cero o negativos, entonces el sistema deberá ignorarla por completo.
- El sistema no deberá crear, modificar, redondear ni eliminar datos de sesiones para construir el mapa.
- El sistema deberá ignorar las sesiones cuya fecha quede fuera del periodo del mapa.

### RF-4. Niveles de intensidad

El sistema deberá clasificar cada día en uno de cinco estados: sin sesiones, nivel 1 (1–29 minutos), nivel 2 (30–59 minutos), nivel 3 (60–119 minutos) o nivel 4 (120 minutos o más).

**Criterios de aceptación (EARS):**
- Cuando el total de un día esté entre 1 y 29 minutos, el sistema deberá asignarle el nivel 1.
- Cuando el total de un día esté entre 30 y 59 minutos, el sistema deberá asignarle el nivel 2.
- Cuando el total de un día esté entre 60 y 119 minutos, el sistema deberá asignarle el nivel 3.
- Cuando el total de un día sea de 120 minutos o más, el sistema deberá asignarle el nivel 4.
- Cuando el total de un día sea 0, el sistema deberá asignarle el estado "Sin sesiones".
- Cuando el total coincida con un límite, el sistema deberá aplicar el tramo superior: 29 → nivel 1, 30 → nivel 2, 59 → nivel 2, 60 → nivel 3, 119 → nivel 3 y 120 → nivel 4.
- El sistema deberá representar cada nivel con el **tono** de la escala y con una **proporción de relleno creciente** (aproximadamente 25 %, 50 %, 75 % y 100 % de la celda), de modo que los niveles se distingan también sin percibir el color.
- El estado "Sin sesiones" no deberá mostrar relleno.

### RF-5. Días futuros y días sin sesiones

El sistema deberá tratar los días posteriores a hoy como no disponibles y los días pasados o de hoy sin sesiones como consultables.

**Criterios de aceptación (EARS):**
- Mientras un día sea posterior a hoy, el sistema deberá mostrarlo como una celda neutra, sin nivel de intensidad y sin detalle.
- Las celdas de días futuros no deberán ser interactivas, no deberán recibir foco de teclado y deberán anunciarse como no disponibles.
- Cuando un día pasado o de hoy no tenga sesiones, el sistema deberá mostrarlo neutro, permitir consultar su detalle y anunciarlo como "sin sesiones".
- Mientras una sesión tenga fecha posterior a hoy, el sistema no deberá contarla en ningún día ni alterar la intensidad de la celda futura.
- Si una sesión futura cae fuera del periodo, el sistema no deberá mostrarla ni avisar de ella.

### RF-6. Contenido del detalle

El sistema deberá mostrar la fecha y los minutos totales de cada día pasado o de hoy en una única zona de detalle situada bajo la cuadrícula.

**Criterios de aceptación (EARS):**
- Cuando el día tenga minutos, el detalle deberá mostrar la fecha en el formato de la lista de sesiones y la duración: por ejemplo, `vie, 23 oct 2026 · 45 min`, `lun, 26 oct 2026 · 1 h 40 min`.
- Cuando el día no tenga minutos, el detalle deberá mostrar la fecha y el texto `Sin sesiones`: por ejemplo, `lun, 26 oct 2026 · Sin sesiones`.
- El detalle no deberá incluir el número de sesiones ni el desglose de temas.
- Al abrirse el diario, la zona de detalle deberá mostrar el texto de ayuda `Pasa el ratón, toca o usa las flechas para ver el detalle de un día.`
- La zona de detalle deberá existir siempre y reservar su espacio, para que aparecer o cambiar de texto no mueva la cuadrícula.
- El sistema no deberá mostrar más de un detalle a la vez.

### RF-7. Interacción y teclado

El sistema deberá permitir consultar el detalle con ratón, teclado y toque, sin navegar ni modificar datos.

**Criterios de aceptación (EARS):**
- Cuando el puntero entre en una celda pasada o de hoy, el sistema deberá mostrar su detalle.
- Cuando el puntero salga de la cuadrícula, el sistema deberá mostrar el detalle del día fijado o, si no hay ninguno, volver al texto de ayuda.
- Cuando una celda pasada o de hoy reciba foco de teclado, el sistema deberá mostrar su detalle.
- Cuando el foco salga de la cuadrícula, el sistema deberá mostrar el detalle del día fijado o, si no hay ninguno, volver al texto de ayuda.
- Cuando la persona pulse o toque una celda pasada o de hoy, el sistema deberá fijar su detalle y mantenerlo aunque el puntero se aleje.
- Cuando la persona pulse o toque la celda ya fijada, el sistema deberá desfijarla y mostrar el detalle que corresponda al puntero o al foco; si no hay ninguno, volverá al texto de ayuda.
- Cuando la persona pulse o toque otra celda, el sistema deberá fijar la nueva y descartar la anterior.
- Cuando la persona pulse fuera de la cuadrícula, el sistema deberá desfijar el detalle y volver al texto de ayuda.
- Cuando la persona pulse `Escape`, el sistema deberá desfijar y cerrar el detalle sin abandonar la cuadrícula.
- La cuadrícula deberá ocupar un único punto de tabulación. Las flechas izquierda y derecha deberán mover el foco entre semanas, y las flechas arriba y abajo entre días de la semana, sin entrar en días futuros.
- El detalle no deberá navegar, filtrar, editar ni modificar sesiones.

### RF-8. Referencias temporales

El sistema deberá incluir referencias de días de la semana y de meses para orientar la lectura del mapa.

**Criterios de aceptación (EARS):**
- El sistema deberá mostrar las iniciales `L`, `M`, `X`, `J`, `V`, `S`, `D` junto a las filas, de lunes a domingo.
- El sistema deberá etiquetar con una abreviatura de tres letras (`ene`, `feb`, `mar`, `abr`, `may`, `jun`, `jul`, `ago`, `sep`, `oct`, `nov`, `dic`) la columna que contenga el día 1 de un mes.
- La primera columna deberá etiquetarse con el mes de su lunes cuando no tenga ya una etiqueta.
- El sistema no deberá repetir la misma etiqueta de mes en una columna.
- Si dos etiquetas de mes pudieran solaparse al reducir el ancho, el sistema deberá ocultar la de la izquierda y conservar la de la derecha.
- Si a 320 píxeles una etiqueta no cupiera sin solaparse, el sistema deberá ocultarla.
- A 375 y a 320 píxeles de ancho, las etiquetas no deberán solaparse entre sí ni con las celdas.

### RF-9. Leyenda

El sistema deberá mostrar una leyenda que explique los cinco estados del mapa, con el nombre accesible "Leyenda de intensidad".

**Criterios de aceptación (EARS):**
- La leyenda deberá incluir "Sin sesiones", "1–29 min", "30–59 min", "60–119 min" y "120+ min".
- Cada estado deberá mostrarse con su tono, su relleno y su texto, de modo que el color no sea el único identificador.
- La leyenda deberá permanecer visible aunque no haya sesiones.

### RF-10. Actualización del mapa

El sistema deberá mantener el mapa sincronizado con el historial de sesiones de la pestaña actual.

**Criterios de aceptación (EARS):**
- Cuando se guarde una sesión dentro del periodo, el sistema deberá actualizar la celda correspondiente y su nivel de inmediato, sin recargar la página.
- Cuando se guarde una sesión fuera del periodo o con fecha futura, el sistema deberá mantener el mapa igual y no mostrar ningún aviso.
- Cuando se recargue la página, el sistema deberá mostrar el mismo mapa que antes de recargar.
- Cuando la pestaña vuelva a estar visible tras haber estado oculta, el sistema deberá volver a leer el historial y recalcular "hoy" y el periodo.
- El sistema no deberá actualizarse automáticamente con un temporizador a medianoche.
- El sistema no deberá solicitar datos a la red para dibujar ni actualizar el mapa.
- Las pestañas no se sincronizarán en tiempo real: los cambios hechos en otra pestaña se verán al volver a esta o al recargar.

### RF-11. Estado vacío

El sistema deberá ofrecer un estado vacío comprensible cuando no haya sesiones válidas en el periodo.

**Criterios de aceptación (EARS):**
- Si no hay ninguna sesión válida entre el primer lunes del periodo y hoy, entonces el sistema deberá mostrar la cuadrícula completa en estado neutro.
- En ese caso, el sistema deberá mostrar el mensaje `Todavía no hay días estudiados en las últimas 12 semanas. Registra una sesión para empezar.`
- La leyenda y la zona de detalle deberán seguir visibles.
- El estado vacío no deberá ocultar ni alterar el resto de la página.

### RF-12. Estructura accesible

El sistema deberá exponer el mapa como una cuadrícula comprensible para tecnologías de asistencia.

**Criterios de aceptación (EARS):**
- El sistema deberá presentar la cuadrícula como una tabla con nombre accesible "Mapa de calor de las últimas 12 semanas", 7 filas de días y 12 columnas de semanas.
- Cada celda de día deberá exponer un nombre accesible con la fecha completa y los minutos, o "sin sesiones": por ejemplo, `viernes 23 de octubre de 2026, 45 minutos`.
- Las celdas futuras deberán anunciarse como no disponibles y quedar fuera del orden de tabulación.
- El foco de teclado deberá ser visible en todo momento.
- Cuando cambie el detalle, el sistema deberá anunciarlo en una región de anuncio cortés, sin interrumpir la lectura en curso.
- Cuando se guarde una sesión, el sistema deberá anunciar el nuevo estado del mapa sin mover el foco del formulario.
- Las abreviaturas de mes y las iniciales de día deberán quedar ocultas a tecnologías de asistencia cuando su información ya esté en los nombres accesibles.

## 5. Requisitos no funcionales

- **RNF-1. Responsive:** a 375 píxeles de ancho, el mapa deberá caber completo sin desplazamiento horizontal de la página, con celdas de al menos 24 × 24 píxeles y 2 píxeles de separación; la sección podrá reducir su relleno interior para lograrlo. A 320 píxeles, las celdas podrán reducirse hasta 20 × 20 píxeles y las etiquetas de mes podrán ocultarse según RF-8, sin desbordar la página.
- **RNF-2. Accesibilidad:** el texto deberá tener contraste de al menos 4,5:1 y el indicador de foco de al menos 3:1 frente a los colores contiguos. Los cinco estados deberán distinguirse en escala de grises gracias al relleno de RF-4. Con `forced-colors` activo, cada celda deberá conservar un borde visible y el nivel seguirá disponible en el detalle y en el nombre accesible.
- **RNF-3. Zoom y texto ampliado:** hasta el 200 % de zoom, la página no deberá desplazarse horizontalmente; si el mapa no cabe, podrá desplazarse horizontalmente dentro de su propia sección. Con texto ampliado, las etiquetas no deberán solaparse con las celdas ni recortarse.
- **RNF-4. Rendimiento:** con 2.000 sesiones guardadas, el mapa deberá dibujarse y actualizarse en menos de 100 ms en Chrome de escritorio con la CPU limitada a 4× en DevTools, sin tareas bloqueantes perceptibles.
- **RNF-5. Privacidad y funcionamiento sin conexión:** el mapa deberá funcionar sin conexión y no deberá enviar datos a la red.
- **RNF-6. Integridad de los datos:** el mapa no deberá modificar, borrar, migrar ni reordenar sesiones; solo leerá el historial existente.
- **RNF-7. Compatibilidad de datos:** el sistema deberá leer el formato guardado actual sin migraciones y deberá seguir funcionando si el historial contiene elementos inválidos, está dañado o el almacenamiento no está disponible, mostrando el estado vacío y sin romper el resto de la página.
- **RNF-8. Idioma:** los textos visibles estarán en español y las fechas se mostrarán en el formato local español que ya usa la lista de sesiones.
- **RNF-9. Fechas locales:** el cálculo deberá usar la fecha local y ser correcto en cambios de hora, de mes, de año y de zona horaria, sin desplazar ningún día.
- **RNF-10. Sin regresiones:** la racha, la mejor racha, el total semanal, los días del mes y la lista de sesiones deberán mantener su comportamiento actual.
- **RNF-11. Coherencia visual:** el mapa deberá respetar la identidad existente (papel, tinta verde y acento amarillo) y no introducir un lenguaje visual ajeno.
- **RNF-12. Comprobabilidad:** el cálculo del periodo, de los minutos por día, de los niveles y de la exclusión de días futuros deberá poder ejecutarse con una fecha de referencia recibida como dato, sin depender del reloj del sistema, y deberá cubrirse con pruebas automatizadas sin instalar dependencias, según la constitución.

## 6. Casos límite

- **Sin sesiones en el periodo:** cuadrícula completa en neutro, mensaje de estado vacío, leyenda y zona de detalle visibles.
- **Solo sesiones anteriores al periodo:** se muestran como si no hubiera sesiones en las últimas 12 semanas.
- **Solo sesiones con fecha futura:** todas las celdas del periodo aparecen neutras; las futuras no son interactivas ni enfocables.
- **Sesión en el primer lunes del periodo:** se incluye y se cuenta con normalidad.
- **Sesión en el último domingo:** solo se cuenta si ese domingo ya ha llegado; si es futuro, se ignora (RF-5).
- **Varias sesiones el mismo día:** se suman para calcular el nivel y el detalle muestra un único total diario.
- **Sesión de 0 minutos o con minutos inválidos:** se ignora; el día puede quedar en "Sin sesiones" aunque exista el registro.
- **Fecha inválida, incompleta o elemento que no es objeto:** se ignora sin afectar al resto del mapa ni a la lista.
- **Límites exactos:** 29, 30, 59, 60, 119 y 120 minutos caen en el tramo indicado en RF-4.
- **Hoy sin sesiones:** la celda de hoy es neutra, interactiva y muestra "Sin sesiones".
- **Semana actual a medias:** los días posteriores a hoy se ven neutros y no son interactivos.
- **Hoy lunes o domingo:** la semana en curso se mantiene como última columna y el periodo no se desplaza.
- **Cambio de año y año bisiesto:** el periodo puede cruzar diciembre y enero, o incluir el 29 de febrero, sin huecos ni días duplicados.
- **Cambio de hora:** la celda de cada día conserva su fecha local y no se desplaza.
- **Página abierta al cambiar el día:** el mapa se recalcula al guardar, al recargar o al volver a la pestaña; no hay actualización por temporizador.
- **Pestañas simultáneas:** cada pestaña muestra su propio estado hasta que se recarga o vuelve a estar visible.
- **Datos dañados, almacenamiento bloqueado o cuota agotada:** el mapa se muestra vacío y el resto de la página sigue funcionando.
- **Guardado con un detalle fijado:** el mapa se vuelve a dibujar, el detalle se cierra y la zona vuelve al texto de ayuda.
- **Detalle en los bordes o al redimensionar:** al estar bajo la cuadrícula, nunca se recorta ni tapa celdas; se mantiene legible al girar el móvil o cambiar el zoom.
- **Interacción táctil:** tocar una celda futura no hace nada; tocar fuera de la cuadrícula cierra el detalle fijado.
- **Historial muy largo:** las sesiones fuera de las últimas 12 semanas no afectan al mapa ni al rendimiento.

## 7. Fuera de alcance

- Selector de periodo (12, 26, 52 semanas o rango personalizado).
- Filtrar, navegar o abrir la lista de sesiones desde el mapa.
- Editar o eliminar sesiones desde el mapa.
- Mostrar el número de sesiones o el desglose de temas dentro del detalle; solo se muestra el total diario.
- Exportar, compartir o imprimir el mapa.
- Sincronización entre pestañas, cuentas, backend, notificaciones o recordatorios.
- Nuevas métricas, comparativas entre semanas o meses, promedios y proyecciones.
- Cambiar el significado de la racha, la mejor racha, el total semanal o los días del mes.
- Modo oscuro, temas alternativos o animaciones.
- Idiomas distintos del español o selección de zona horaria.
- Cambios en el formato de los datos guardados y migraciones.
- Renombrar o reescribir el código existente para unificarlo con el idioma que fija la constitución; esta funcionalidad solo añade código nuevo.

## 8. Trazabilidad con la constitución

- **Principio 1 (simplicidad):** la funcionalidad no añade dependencias, build ni red; RF-10 y RNF-5 lo verifican.
- **Principio 2 (la spec manda):** no quedan decisiones abiertas ni contradicciones; las tres dudas anteriores están cerradas en RF-5, RF-6 y RF-10.
- **Principio 3 (lógica separada):** RNF-12 exige cálculos con fecha de referencia inyectable y sin depender del reloj; la separación efectiva se detalla en el plan.
- **Principio 4 (tests como puerta):** RNF-12 y los criterios de finalización exigen pruebas automatizadas sin instalar dependencias; `AGENTS.md` ya refleja esa política.
- **Principio 5 (datos sagrados):** RNF-6 y RNF-7 prohíben modificar o migrar datos y exigen compatibilidad con lo ya guardado.
- **Principio 6 (idioma):** el código nuevo seguirá la constitución (inglés) y la interfaz y la documentación seguirán en español; la deuda del código existente en español queda fuera del alcance de esta spec.

`AGENTS.md` ya está alineado con el código y con la constitución: clave `diarioDeEstudio.sesiones` y pruebas con `node --test`.

## 9. Criterios de finalización

- [ ] Se cumplen RF-1 a RF-12 y sus criterios de aceptación.
- [ ] Se cumplen RNF-1 a RNF-12.
- [ ] El mapa se ha probado en Chrome a 375 y 320 píxeles y en escritorio, sin desbordamiento horizontal ni errores en consola.
- [ ] Se han probado los límites de intensidad, el estado vacío, los días futuros, las sesiones inválidas, varias sesiones el mismo día y los cambios de semana, mes y año.
- [ ] El detalle funciona con ratón, teclado y toque; `Escape` y el cierre al tocar fuera funcionan; las celdas exponen fecha y minutos y el detalle se anuncia.
- [ ] La racha, la mejor racha, el total semanal, los días del mes y la lista siguen funcionando igual.
- [ ] Las pruebas automatizadas de la lógica están en verde, con fecha de referencia y sin dependencias instaladas.
- [ ] No se han añadido dependencias, no se ha modificado el formato de datos y no hay peticiones de red.
- [ ] La persona responsable del proyecto aprueba el resultado.

## 10. Dudas abiertas

Ninguna. Las tres dudas del borrador anterior quedaron cerradas:

- **Sesiones con fecha futura:** no llevan indicador; su celda es neutra y no interactiva (RF-5).
- **Contenido del detalle:** solo fecha y total de minutos; sin número de sesiones (RF-6).
- **Actualización al cambiar el día:** al guardar, al recargar y al volver a la pestaña; sin temporizador (RF-10).
