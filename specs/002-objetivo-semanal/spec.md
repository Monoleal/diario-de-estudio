# Especificación 002 — Objetivo semanal de estudio

- **Estado:** aprobada (26/10/2026)
- **Fecha:** 26/10/2026
- **Historial:** 26/10/2026 — fase de clarificación: se elimina la promesa de "cuánto falta", se fija el porcentaje truncado y su tope de presentación, se define el objetivo guardado inválido, la fuente única del total semanal, la conservación del texto sin guardar al volver a la pestaña, la matriz de zoom, el reparto de información entre texto visible y lector de pantalla y los criterios de finalización verificables.

## 1. Contexto y objetivo

El Diario de Estudio registra sesiones con fecha, tema y minutos, y resume la constancia con la racha actual, la mejor racha, los minutos de la semana, los días del mes y el mapa de calor de las últimas 12 semanas. La persona sabe **cuánto** ha estudiado esta semana, pero no tiene una meta contra la que medirse.

Esta funcionalidad añade un **objetivo semanal**: una cantidad de minutos que la persona elige y con la que se compara lo estudiado desde el lunes hasta hoy.

**Objetivo:** que la persona fije una meta realista y vea de un vistazo **cuánto lleva** respecto a ella —los minutos estudiados, el objetivo, el porcentaje y, si llega, la marca de cumplimiento— para sostener el hábito sin que el diario le reclame lo que le falta.

**Éxito:** la persona puede fijar, cambiar y quitar su objetivo semanal en menos de 30 segundos; ve cuánto lleva de la meta y qué porcentaje representa, actualizado al registrar sesiones; entiende qué pasa al empezar una semana nueva; y todo funciona sin conexión, con teclado, con lector de pantalla y desde el móvil.

## 2. Usuarios

- **Estudiante que quiere una meta:** estudia con cierta regularidad y necesita un número concreto al que apuntar cada semana.
- **Estudiante que empieza:** no tiene objetivo y necesita entender qué es, para qué sirve y cómo fijarlo sin sentirse evaluado.
- **Estudiante que se pasa de la meta:** quiere ver que la ha superado sin que el diario le pida más.
- **Persona que vuelve y encuentra un objetivo ilegible:** necesita entender que el valor guardado no sirve, poder limpiarlo y fijar uno nuevo sin perder nada.
- **Persona que navega con teclado o lector de pantalla:** necesita que el progreso se pueda leer como texto, una sola vez, con un nombre y un valor comprensibles.

## 3. Historias de usuario

- **US-1.** Como estudiante, quiero fijar cuántos minutos quiero estudiar cada semana para tener una meta concreta.
- **US-2.** Como estudiante, quiero ver cuánto llevo de ese objetivo y qué porcentaje representa para saber cómo va mi semana.
- **US-3.** Como estudiante, quiero cambiar o quitar mi objetivo cuando mi disponibilidad cambia, sin perder mis sesiones.
- **US-4.** Como estudiante, quiero que el objetivo siga ahí la semana siguiente y que el progreso empiece de cero sin hacer nada.
- **US-5.** Como estudiante que usa el móvil, el teclado o un lector de pantalla, quiero fijar el objetivo y entender mi progreso sin depender del color ni del ratón.
- **US-6.** Como estudiante que vuelve y el objetivo guardado no se puede leer, quiero saberlo y poder limpiarlo para fijar uno nuevo.

## 4. Requisitos funcionales

### RF-1. Sección del objetivo semanal

El sistema deberá mostrar una sección propia titulada **"Objetivo semanal"** en la pantalla principal.

**Criterios de aceptación (EARS):**
- Cuando se abre el diario, el sistema deberá mostrar la sección entre la tarjeta "Tu constancia" y la sección "Constancia de las últimas 12 semanas".
- La sección deberá mostrar siempre dos partes: el estado del progreso y el editor del objetivo, sin desplegables ni pasos intermedios.
- La sección deberá estar disponible sin iniciar sesión, sin conexión y sin pedir datos a la red.
- El sistema deberá mantener visibles y sin cambios la racha actual, la mejor racha, el total semanal de la tarjeta "Tu constancia", los días del mes, el mapa de calor, el formulario de sesión y la lista de sesiones.

### RF-2. Progreso de la semana en curso

El sistema deberá calcular los minutos estudiados esta semana como la suma de los minutos de las sesiones con fecha entre el lunes de la semana en curso y hoy, usando la fecha local.

**Criterios de aceptación (EARS):**
- Cuando un día tenga varias sesiones, el sistema deberá sumar al total los minutos de **todas** ellas; el día cuenta una sola vez a efectos de calendario, pero cada registro aporta sus minutos.
- El sistema deberá considerar válida una sesión solo si es un objeto con fecha `AAAA-MM-DD` real y `minutos` entero mayor o igual que 1.
- Si una sesión tiene fecha inválida, minutos no numéricos, decimales, cero o negativos, entonces el sistema deberá ignorarla por completo.
- Mientras una sesión tenga fecha posterior a hoy, el sistema no deberá contarla en el progreso.
- Mientras una sesión tenga fecha anterior al lunes de la semana en curso, el sistema no deberá contarla en el progreso.
- El total mostrado en esta sección deberá coincidir siempre con el total de "Esta semana" de la tarjeta "Tu constancia".
- El sistema deberá obtener ambos totales de una **única función pura**, que recibe la lista de sesiones y la fecha de hoy y no lee el reloj ni el almacenamiento; el resultado será idéntico al actual y no se duplicará la fórmula en dos sitios.
- El sistema no deberá guardar totales semanales: el progreso se derivará en cada renderizado.
- Ejemplo verificable: si hoy es lunes 26/10/2026 y hay sesiones el 19/10 (120 min), el 21/10 (60 min) y el 26/10 (45 min), el progreso será de 45 min.
- Ejemplo verificable: con la misma semana, si además hay una sesión el 28/10 (30 min), el progreso seguirá siendo de 45 min.
- Ejemplo verificable: si hoy es jueves 29/10/2026 y hay dos sesiones el lunes 26/10 de 30 y 45 min, el progreso será de 75 min.
- Ejemplo verificable: la tarjeta "Tu constancia" y esta sección muestran el mismo total si se calculan con la misma lista de sesiones y la misma fecha de hoy.

### RF-3. Estado sin objetivo y valor guardado inválido

El sistema deberá explicar qué es el objetivo cuando la persona todavía no ha fijado ninguno, y deberá distinguir entre no tener objetivo y tener un valor guardado que no sirve.

**Criterios de aceptación (EARS):**
- Si no hay objetivo guardado, entonces el sistema deberá mostrar el mensaje `Todavía no has fijado un objetivo semanal. Elige cuántos minutos quieres estudiar cada semana.`
- Mientras no haya objetivo, el sistema no deberá mostrar barra de progreso ni porcentaje.
- Mientras no haya objetivo, el editor deberá mostrarse con el campo vacío y el botón `Fijar objetivo`.
- Cuando no exista ningún valor guardado, ni válido ni inválido, el sistema no deberá mostrar el botón `Quitar objetivo`.
- Si existe un valor guardado que no es un objetivo válido, entonces el sistema deberá tratarlo como si no hubiera objetivo, mostrar además el aviso `El objetivo guardado no es válido y se ha ignorado. Fija uno nuevo o quita el valor guardado.` y ofrecer el botón `Quitar objetivo` para poder limpiarlo.
- El sistema no deberá borrar, corregir ni sobrescribir por su cuenta un valor guardado inválido; solo deberá desaparecer cuando la persona guarde un objetivo válido o pulse `Quitar objetivo`.
- Cuando la persona guarde un objetivo válido, el aviso deberá desaparecer.
- Cuando la persona pulse `Quitar objetivo` con un valor inválido guardado, el sistema deberá eliminar ese valor, vaciar el campo, ocultar el aviso y llevar el foco al campo del objetivo.
- El sistema no deberá crear un objetivo por defecto.

### RF-4. Progreso con objetivo fijado

El sistema deberá comparar los minutos estudiados esta semana con el objetivo y expresarlo en texto visible, sin depender solo de elementos gráficos.

**Criterios de aceptación (EARS):**
- Cuando haya objetivo, el sistema deberá mostrar el progreso con el formato `<estudiado> de <objetivo>`, usando el formato de duración que ya emplea el diario: por ejemplo, `3 h 20 min de 5 h`, `45 min de 2 h`.
- El sistema deberá mostrar el porcentaje cumplido como número entero **truncado** (sin redondear al alza): `Math.floor(estudiado / objetivo * 100)`.
- Cuando los minutos estudiados sean 0, el sistema deberá mostrar `0 min de 5 h` y `0 %`, sin mostrar `Objetivo cumplido`.
- Cuando los minutos estudiados sean iguales o mayores que el objetivo, el sistema deberá mostrar además el texto `Objetivo cumplido`.
- Cuando los minutos estudiados superen el objetivo, el porcentaje será el truncado real de la proporción, que puede ser `100 %` o mayor; la barra no deberá superar el 100 % de su longitud.
- Si el porcentaje real supera 999 %, entonces el sistema deberá mostrar `999 %+` en lugar del número completo, para que la cifra no rompa la línea ni desborde la sección; `999 %` exacto se mostrará sin el signo `+`.
- El sistema no deberá mostrar frases de ánimo, de reproche, cuánto falta para el objetivo (`te faltan…`) ni proyecciones de ningún tipo.

**Tabla verificable de truncado y cumplimiento** (objetivo 300 min salvo donde se indique):

| Estudiado | Objetivo | Porcentaje visible | ¿`Objetivo cumplido`? | Barra |
| --- | --- | --- | --- | --- |
| 0 min | 300 | `0 %` | No | Vacía |
| 1 min | 10 080 | `0 %` | No | Proporcional, prácticamente vacía |
| 1 min | 1 | `100 %` | Sí | Llena |
| 299 min | 300 | `99 %` | No | Proporcional (≈99,7 %) |
| 300 min | 300 | `100 %` | Sí | Llena |
| 301 min | 300 | `100 %` | Sí | Llena |
| 450 min | 300 | `150 %` | Sí | Llena |
| 9 min | 1 | `900 %` | Sí | Llena |
| 10 min | 1 | `999 %+` | Sí | Llena |

> Nota: el porcentaje real se trunca siempre antes de aplicar el tope, de modo que `999 %` (sin `+`) se muestra cuando el truncado es exactamente 999 y `999 %+` solo cuando lo supera. El cumplimiento se decide con los minutos, no con el porcentaje mostrado.

### RF-5. Barra de progreso

El sistema deberá representar el avance con una barra proporcional al objetivo.

**Criterios de aceptación (EARS):**
- Cuando haya objetivo, el sistema deberá mostrar una barra que se llene de izquierda a derecha en proporción exacta a `estudiado / objetivo`, recortada al 100 %.
- Cuando los minutos estudiados sean 0, la barra deberá mostrarse completamente vacía, sin relleno mínimo ni marca artificial.
- Mientras los minutos estudiados sean mayores que 0 y menores que el objetivo, la barra deberá mostrar el relleno proporcional real, aunque sea tan fino que resulte indistinguible del vacío, incluso si el porcentaje truncado es 0 %; no existirá un relleno mínimo forzado.
- Cuando el progreso sea igual o superior al 100 %, la barra deberá mostrarse completamente llena.
- La pista de la barra deberá ser visible cuando el relleno sea 0 %, de modo que se entienda que hay un recorrido y un estado vacío.
- El estado de la barra no deberá comunicarse solo con el color: el texto de RF-4 deberá estar siempre presente y contener la misma información.
- Cuando no haya objetivo, el sistema no deberá mostrar la barra.

### RF-6. Fijar y cambiar el objetivo

El sistema deberá permitir fijar un objetivo nuevo o cambiar el existente desde la misma sección.

**Criterios de aceptación (EARS):**
- El editor deberá incluir una etiqueta `Minutos por semana`, un campo de texto de una línea con teclado numérico en el móvil y un botón de guardado.
- El sistema deberá mostrar la ayuda `Por ejemplo, 300 minutos son 5 horas.` junto al campo.
- Cuando ya haya objetivo, el campo deberá mostrar su valor y el botón deberá decir `Guardar objetivo`.
- Cuando no haya objetivo, el botón deberá decir `Fijar objetivo`.
- Al validar, el sistema deberá recortar los espacios del principio y del final del valor escrito.
- Si tras recortar los espacios el campo está vacío, entonces el sistema deberá mostrar `Escribe cuántos minutos quieres estudiar cada semana.` y no deberá guardar nada.
- Si el valor contiene cualquier carácter que no sea un dígito (`abc`, `1,5`, `1.5`, `1e3`, `+300`, `-30`, `300 min`) o el número resultante queda fuera del rango de 1 a 10 080 minutos, entonces el sistema deberá mostrar `Los minutos del objetivo deben ser un número entero entre 1 y 10 080.` y no deberá guardar nada.
- El sistema deberá aceptar ceros a la izquierda (`0300`) como el número 300 y mostrar en el campo el valor normalizado tras guardar.
- El sistema deberá asociar cada error al campo del objetivo mediante su descripción accesible, marcarlo como no válido y llevar el foco a ese campo.
- Cuando la persona corrija un error y guarde un valor válido, el sistema deberá limpiar el mensaje de error y la marca de campo no válido.
- Cuando el guardado sea correcto, el sistema deberá persistir el objetivo, actualizar el progreso de inmediato sin recargar y mostrar una confirmación visible en la sección con el texto `Objetivo semanal guardado: <objetivo> por semana.`, por ejemplo `Objetivo semanal guardado: 5 h por semana.`, que se anuncia según RF-10.
- Cuando el guardado falle por almacenamiento no disponible o lleno, el sistema deberá mantener el objetivo anterior, conservar el texto escrito en el campo, no mover el foco y mostrar en la sección el aviso `No se ha podido guardar el objetivo. Comprueba el espacio disponible en el navegador e inténtalo de nuevo.`
- Cuando se cambie el objetivo a mitad de semana, el sistema deberá recalcular el porcentaje con lo ya estudiado desde el lunes, sin reiniciar el progreso.
- El sistema no deberá limitar, bloquear ni avisar negativamente al registrar sesiones que superen el objetivo.

### RF-7. Quitar el objetivo

El sistema deberá permitir dejar de tener objetivo sin consecuencias sobre las sesiones.

**Criterios de aceptación (EARS):**
- Cuando haya un objetivo válido guardado, el sistema deberá mostrar un botón secundario `Quitar objetivo` junto al de guardado.
- Cuando exista un valor guardado inválido, el sistema también deberá mostrar `Quitar objetivo`, para que se pueda limpiar (RF-3).
- Cuando la persona pulse `Quitar objetivo`, el sistema deberá eliminar el objetivo guardado, vaciar el campo, volver al estado sin objetivo, quitar el aviso de valor inválido si lo hubiera y anunciar `Objetivo semanal quitado.`
- El sistema no deberá pedir confirmación previa antes de quitar el objetivo.
- El sistema no deberá borrar, modificar ni reordenar ninguna sesión al quitar el objetivo.
- Cuando el borrado no se pueda guardar, el sistema deberá mantener el objetivo anterior (o el valor inválido), mostrarlo en pantalla y avisar con `No se ha podido quitar el objetivo. Comprueba el espacio disponible en el navegador e inténtalo de nuevo.`
- Cuando el objetivo se haya quitado, el sistema deberá llevar el foco al campo del objetivo, ya vacío.

### RF-8. Persistencia y cambio de semana

El sistema deberá conservar el objetivo de una semana a otra y reiniciar solo el progreso.

**Criterios de aceptación (EARS):**
- Cuando la persona recargue la página, cierre el diario y lo vuelva a abrir, el sistema deberá mostrar el mismo objetivo y el progreso recalculado.
- Cuando empiece una semana nueva, el sistema deberá mantener el objetivo y mostrar el progreso a 0 min hasta que haya sesiones de esa semana.
- El sistema deberá guardar el objetivo de forma independiente del historial de sesiones: un historial dañado, vacío o ilegible no deberá borrar el objetivo, y quitar el objetivo no deberá afectar al historial.
- El sistema no deberá guardar el progreso semanal ni un historial de objetivos de semanas anteriores.
- Si el almacenamiento del navegador no está disponible, el sistema deberá seguir mostrando la sección, deberá tratar el objetivo como no fijado y, al intentar guardarlo, deberá avisar de que no se ha podido guardar sin perder lo escrito en el campo.

### RF-9. Actualización del progreso

El sistema deberá mantener el progreso sincronizado con las sesiones, con el objetivo y con "hoy".

**Criterios de aceptación (EARS):**
- Cuando se guarde, edite, borre o deshaga una sesión, el sistema deberá recalcular el progreso de inmediato, sin recargar la página.
- Cuando se guarde o se quite el objetivo, el sistema deberá recalcular el texto, el porcentaje y la barra de inmediato.
- Cuando la pestaña vuelva a estar visible tras haber estado oculta, el sistema deberá recalcular "hoy" y la semana en curso y, si el campo del objetivo no tiene cambios sin guardar ni el foco, deberá volver a leer el objetivo guardado.
- Si el campo del objetivo contiene cambios sin guardar (su valor recortado difiere del último objetivo leído) o tiene el foco, entonces el sistema no deberá reescribir el campo ni cambiar el objetivo mostrado al volver a la pestaña; solo recalculará "hoy" y el progreso con el objetivo que ya se mostraba.
- El sistema no deberá actualizarse automáticamente con un temporizador a medianoche.
- El sistema no deberá solicitar datos a la red para mostrar ni actualizar el objetivo.
- Las pestañas no se sincronizarán en tiempo real: los cambios hechos en otra pestaña se verán al volver a esta o al recargar.
- El sistema no deberá anunciar el progreso al recalcularlo: los cambios de progreso son silenciosos y solo se anuncian las confirmaciones y los errores descritos en RF-10.

### RF-10. Accesibilidad de la sección

El sistema deberá permitir usar el objetivo con teclado, lector de pantalla y sin percibir el color.

**Criterios de aceptación (EARS):**
- El campo del objetivo deberá tener etiqueta asociada, ayuda y mensajes de error asociados.
- La barra deberá exponerse como un indicador con nombre accesible `Progreso del objetivo semanal`, valor mínimo 0 y valor máximo igual al objetivo en minutos.
- Cuando los minutos estudiados sean iguales o menores que el objetivo, el valor actual del indicador será igual a los minutos estudiados.
- Cuando los minutos estudiados superen el objetivo, el valor actual del indicador se recortará al máximo (el objetivo), para que el indicador no declare un relleno imposible.
- El indicador deberá exponer un texto accesible (`aria-valuetext`) con el progreso **real**, por ejemplo `3 h 20 min de 5 h, 66 %`, añadiendo `, Objetivo cumplido` cuando corresponda; si el porcentaje supera el tope de presentación, el texto dirá `más de 999 %`.
- El `aria-valuetext` prevalecerá sobre el valor numérico: si el valor actual se recortó al máximo, el texto accesible seguirá diciendo los minutos estudiados y el porcentaje reales, sin indicar cuánto falta.
- La línea visible de progreso (minutos, porcentaje y `Objetivo cumplido`) se marcará como decorativa para tecnologías de asistencia, de modo que el mismo texto no se lea dos veces seguidas; el `aria-valuetext` será su equivalente completo.
- El estado `Objetivo cumplido` deberá estar en texto visible y en el `aria-valuetext`, no solo en color, icono o relleno.
- Cuando se guarde el objetivo con éxito, el sistema deberá actualizar antes el texto, el porcentaje y la barra, y después escribir en la región de anuncio que ya usa el diario el texto `Objetivo semanal guardado: <objetivo> por semana.`, sin repetir las cifras de progreso.
- La confirmación visible de la sección será decorativa para tecnologías de asistencia, porque el mismo texto se anuncia en la región de anuncio; así no se lee dos veces.
- Cuando se quite el objetivo con éxito, el sistema deberá anunciar `Objetivo semanal quitado.` después de actualizar la sección.
- Cuando falle el guardado o el borrado, el sistema deberá mostrar el aviso de RF-6 o RF-7 en una región de alerta propia de la sección, que se anuncia por sí sola; no deberá repetir el mismo mensaje en la región de anuncio.
- El sistema no deberá usar regiones de anuncio sobre toda la sección ni sobre la tarjeta de constancia.
- Al volver a la pestaña, el sistema no deberá anunciar ni el objetivo ni el progreso.
- El editor y el botón de quitar deberán ser operables solo con teclado, con foco visible.

## 5. Requisitos no funcionales

- **RNF-1. Responsive:** a 375 y a 320 píxeles de ancho, la sección deberá caber sin desplazamiento horizontal de la página; el texto de progreso, el porcentaje y la barra no deberán solaparse ni recortarse. Los controles del editor deberán tener un área táctil de al menos 24 × 24 píxeles.
- **RNF-2. Accesibilidad:** el texto deberá tener contraste de al menos 4,5:1, el indicador de foco al menos 3:1 y el relleno de la barra al menos 3:1 frente a su pista. Con `forced-colors` activo, la barra deberá conservar un borde visible y el porcentaje y el estado deberán seguir disponibles en el texto. El porcentaje y el estado no deberán depender del color.
- **RNF-3. Zoom y texto ampliado:** la página no deberá desplazarse horizontalmente ni recortar textos de la sección en esta matriz: 200 % de zoom sobre una ventana de 1280 px (640 px CSS) y 200 % de zoom sobre una ventana de 375 px (187,5 px CSS). A 320 px de ancho y con zoom, el editor podrá apilarse en vertical (etiqueta, campo, ayuda y botones uno debajo de otro) y la barra podrá ocupar el ancho completo; el texto de progreso podrá partirse en varias líneas.
- **RNF-4. Rendimiento:** con 2.000 sesiones guardadas, guardar o quitar el objetivo y repintar la sección (texto, porcentaje y barra) deberá completarse en menos de 50 ms en Chrome de escritorio con la CPU limitada a 4× en DevTools. La medición excluye el repintado de la lista de sesiones, del mapa de calor y del resto de la tarjeta "Tu constancia".
- **RNF-5. Privacidad y funcionamiento sin conexión:** la sección deberá funcionar sin conexión y no deberá enviar datos a la red.
- **RNF-6. Integridad de los datos:** la funcionalidad no deberá modificar, borrar, migrar ni reordenar sesiones; solo leerá el historial. El objetivo se guardará aparte y solo se escribirá o eliminará por acción explícita de la persona.
- **RNF-7. Compatibilidad y tolerancia a fallos:** el sistema deberá leer el formato de sesiones actual sin migraciones y deberá seguir funcionando si el historial está dañado, si el objetivo guardado no es válido o si el almacenamiento no está disponible, mostrando los estados descritos en RF-3 y RF-8 y sin romper el resto de la página.
- **RNF-8. Idioma:** los textos visibles estarán en español y las duraciones se mostrarán en el formato que ya usa el diario (`45 min`, `1 h`, `5 h 15 min`).
- **RNF-9. Fechas locales:** la semana se calculará de lunes a domingo en fecha local, sin usar `new Date("AAAA-MM-DD")`, sin `toISOString()` para obtener el día y sin aritmética de milisegundos; deberá ser correcta en cambios de hora, de mes, de año y de zona horaria, y en semanas que cruzan de mes o de año.
- **RNF-10. Sin regresiones:** la racha, la mejor racha, el total semanal, los días del mes, el mapa de calor, el alta, la edición, el borrado con deshacer y la lista de sesiones deberán mantener su comportamiento y sus resultados actuales.
- **RNF-11. Coherencia visual:** la sección deberá respetar la identidad existente (papel, tinta verde y acento amarillo) y no introducir un lenguaje visual ajeno; la barra usará los colores ya definidos en el proyecto.
- **RNF-12. Comprobabilidad:** el cálculo de la semana, del total estudiado, del porcentaje, del tope de presentación y del estado del objetivo deberá poder ejecutarse con la fecha de referencia recibida como dato, sin depender del reloj del sistema, y deberá cubrirse con pruebas automatizadas con `node --test`, sin instalar dependencias. La validación del campo del objetivo deberá ser igualmente comprobable sin DOM.

## 6. Casos límite

- **Sin objetivo nunca fijado:** mensaje de RF-3, editor vacío, sin barra, sin porcentaje y sin `Quitar objetivo`.
- **Objetivo guardado con valor inválido** (por ejemplo `{"minutos": 0}`, `{"minutos": -30}`, `{"minutos": 1.5}`, `{"minutos": "300"}` con el número como texto, `{"minutos": 10081}`, JSON roto o un valor que no es objeto): se trata como no fijado, se muestra el aviso y se ofrece `Quitar objetivo`; el valor no se borra solo.
- **Quitar tras un objetivo inválido:** el valor desaparece del almacenamiento, el aviso y el botón desaparecen, el campo queda vacío y el foco va al campo.
- **Guardar un objetivo válido con un valor inválido guardado:** el aviso desaparece y el nuevo objetivo sustituye al anterior.
- **Sesiones dañadas o historial ilegible:** el objetivo se sigue mostrando y se puede cambiar; el progreso puede quedar en 0 min.
- **Objetivo guardado con el historial vacío:** se muestra `0 min de 5 h`, `0 %` y la barra vacía.
- **Almacenamiento lleno o bloqueado al guardar:** no se guarda el objetivo, se mantiene el anterior, el campo conserva lo escrito, el foco no se mueve y aparece el aviso de RF-6.
- **Almacenamiento lleno o bloqueado al quitar:** se mantiene el objetivo (o el valor inválido) y aparece el aviso de RF-7.
- **Objetivo de 1 minuto:** `1 min de 1 min`, `100 %` y `Objetivo cumplido` desde la primera sesión válida.
- **Objetivo de 10 080 minutos:** se acepta; se muestra como `168 h`.
- **Progreso de 0 min con objetivo:** barra vacía, `0 %`, sin `Objetivo cumplido`.
- **Progreso mínimo de 1 min con objetivo muy alto:** `1 min de 168 h`, `0 %` y barra prácticamente vacía; no se fuerza un relleno visible.
- **Progreso de 299 min con objetivo de 300:** `4 h 59 min de 5 h`, `99 %`, sin `Objetivo cumplido`.
- **Progreso exactamente igual al objetivo:** `Objetivo cumplido`, `100 %` y barra llena.
- **Progreso por encima del objetivo:** `Objetivo cumplido`, porcentaje truncado real (puede seguir siendo `100 %` si el exceso es menor que un punto porcentual, o `150 %`), barra llena.
- **Porcentaje enorme:** por encima de 999 % se muestra `999 %+` y el texto accesible dice `más de 999 %`; la barra sigue llena y el indicador mantiene el valor máximo.
- **Objetivo cambiado a mitad de semana:** se recalcula el porcentaje con lo ya estudiado desde el lunes; las sesiones anteriores del mismo lunes cuentan.
- **Objetivo cambiado a un valor mayor que lo estudiado:** el porcentaje baja sin perder sesiones ni progreso.
- **Semana nueva:** lunes con progreso a 0 min, objetivo intacto, sin avisos.
- **Semana que cruza de mes o de año** (por ejemplo, del lunes 28/12/2026 al domingo 3/1/2027): el lunes se calcula bien y las sesiones de diciembre no cuentan en enero.
- **Cambio de hora** (último domingo de marzo y de octubre): la semana y el día de hoy no se desplazan.
- **Sesión con fecha futura dentro de la semana:** no suma al progreso aunque aparezca en la lista como programada.
- **Sesión borrada que hace bajar el progreso:** el porcentaje y la barra bajan de inmediato; el objetivo no cambia y no se anuncia nada.
- **Deshacer un borrado:** el progreso recupera los minutos, en silencio.
- **Página abierta al cambiar el día o al pasar de domingo a lunes:** el progreso se recalcula al guardar, al recargar o al volver a la pestaña; no hay actualización por temporizador.
- **Volver a la pestaña con cambios sin guardar en el campo:** el campo conserva lo escrito y el objetivo mostrado no se reescribe; el progreso se recalcula con ese objetivo.
- **Volver a la pestaña sin cambios en el campo:** se relee el objetivo guardado, por si cambió en otra pestaña, y el campo se actualiza.
- **Pestañas simultáneas:** cada pestaña muestra su propio objetivo hasta que se recarga o vuelve a estar visible.
- **Móvil a 320 px o con zoom al 200 %:** el editor se apila en vertical, el texto de progreso puede partirse en varias líneas y ni la barra ni el editor desbordan la página.
- **Lector de pantalla con el objetivo al 0 %:** se lee una sola vez el nombre de la barra y el texto `0 min de 5 h, 0 %`; el texto visible no se repite.
- **Lector de pantalla con el objetivo superado:** el valor del indicador está en el máximo, pero el texto accesible dice los minutos reales y el porcentaje real (con el tope si aplica).

## 7. Fuera de alcance

- Objetivo diario, mensual o por tema; varios objetivos a la vez.
- Historial de objetivos, comparación entre semanas, promedios, proyecciones ("a este ritmo…"), cuánto falta para la meta o rachas de objetivos cumplidos.
- Mostrar el objetivo en el mapa de calor, colorear celdas según el objetivo o cambiar el significado de la racha y de las estadísticas actuales.
- Notificaciones, recordatorios, sonidos, confeti, animaciones o felicitaciones.
- Editar sesiones desde la sección del objetivo.
- Cambiar el resultado del total semanal de la tarjeta "Tu constancia": solo se comparte su cálculo mediante una función pura común (RF-2), sin alterar cifras ni formato.
- Elegir la unidad (horas o minutos) en la interfaz: el objetivo se escribe siempre en minutos y se muestra en el formato de duración habitual.
- Exportar, compartir o imprimir el objetivo.
- Sincronización entre pestañas, cuentas, backend o cualquier petición de red.
- Modo oscuro, temas alternativos, idiomas distintos del español o selección de zona horaria.
- Cambios en el formato de las sesiones guardadas o migraciones.
- Renombrar o reescribir el código existente para alinearlo con el idioma que fija la constitución; esta funcionalidad solo añade código nuevo.

## 8. Supuestos para aprobación

Los siguientes puntos no estaban decididos en la petición o los ha resuelto el equipo durante la clarificación. Los confirmados por el usuario se marcan como tales; los pendientes cambian el alcance si no son válidos.

- **A-1. Ubicación:** sección propia "Objetivo semanal" entre "Tu constancia" y el mapa de calor. **Confirmado por el usuario (26/10/2026).** *Descartado:* integrar la meta dentro de la tarjeta oscura de constancia, porque el formulario y la barra no caben bien a 320 px y ensucian las métricas existentes; y ponerla al final de la página, porque quedaría lejos de las cifras que interpreta.
- **A-2. Clave y formato de datos:** clave `diarioDeEstudio.objetivoSemanal` con un objeto JSON `{"minutos": 300}`. No se toca `diarioDeEstudio.sesiones` ni se migra nada; si la clave no existe o no se puede leer, no hay objetivo. *Descartado:* guardar solo el número como texto, porque no se explica por sí mismo, y añadir el objetivo a cada sesión, porque obligaría a migrar el historial. No se crea copia de seguridad de esta clave: es un dato reconstruible en segundos y el respaldo existente es para el historial.
- **A-3. Editor siempre visible:** el campo y sus botones se muestran siempre, sin desplegable. **Confirmado por el usuario (26/10/2026).** *Descartado:* un botón "Cambiar objetivo" que despliegue el formulario, porque añade estados y no aporta en una sección de dos controles.
- **A-4. Unidad:** minutos por semana, con la ayuda de conversión a horas. *Descartado:* pedir horas, porque el diario ya guarda minutos y habría dos unidades conviviendo.
- **A-5. Progreso:** texto `estudiado de objetivo`, porcentaje truncado y `Objetivo cumplido`, sin cuánto falta ni mensajes de ánimo. **Confirmado por el usuario (26/10/2026).** *Descartado:* mostrar `te faltan…` o proyecciones, porque añade presión y un cálculo fuera del hábito.
- **A-6. Quitar sin confirmación:** quitar el objetivo es inmediato y avisado. *Descartado:* un diálogo de confirmación, porque el dato es de un solo valor y volver a fijarlo cuesta segundos.
- **A-7. Límite del objetivo:** entre 1 y 10 080 minutos (siete días completos). **Confirmado por el usuario (26/10/2026).** *Descartado:* permitir 0 para "sin objetivo", porque entonces el botón de quitar no tendría sentido.
- **A-8. La tarjeta "Tu constancia" no cambia:** "Esta semana" sigue mostrando los minutos, sin compararlos con la meta. *Descartado:* mostrar `3 h 20 min de 5 h` también allí, porque duplicaría la comparación en dos sitios.
- **A-9. Sin celebración extra:** superar el objetivo solo cambia el texto y llena la barra; no hay confeti, sonidos ni cambios de color llamativos.
- **A-10. Tope de presentación del porcentaje:** por encima de 999 % se muestra `999 %+` y el texto accesible dice `más de 999 %`. Es una decisión de presentación, no de cálculo: el porcentaje real se sigue calculando y usando para decidir el cumplimiento. *Descartado:* mostrar cifras de cuatro o más dígitos, porque desbordan la línea a 320 px y en zoom; y recortar el porcentaje en el cálculo, porque falsearía el cumplimiento.
- **A-11. Objetivo guardado inválido:** se ignora, se avisa y se ofrece `Quitar objetivo` para limpiarlo; no se borra automáticamente. *Descartado:* borrarlo al cargar, porque destruiría datos sin permiso, y no ofrecer quitarlo, porque dejaría a la persona sin forma de deshacerse del valor.
- **A-12. Campo del objetivo:** control de texto con teclado numérico (`inputmode="numeric"`) en lugar de `type="number"`, para poder distinguir "vacío" de "no válido": con `type="number"` el navegador descarta `abc` y `1,5`, el campo parecería vacío y el aviso sería engañoso. *Descartado:* `type="number"`, porque impide dar un mensaje correcto; y `type="range"`, porque no permite escribir una cifra exacta.
- **A-13. Texto visible frente a lector de pantalla:** la línea visible de progreso se oculta a las tecnologías de asistencia y el indicador expone el texto completo en `aria-valuetext`. *Descartado:* dejar visibles ambos, porque el mismo progreso se leería dos veces seguidas.

## 9. Trazabilidad con la constitución

- **Principio 1 (simplicidad):** la funcionalidad no añade dependencias, build ni red; RF-1, RF-9 y RNF-5 lo verifican.
- **Principio 2 (la spec manda):** las decisiones no pedidas están en la sección 8 para que se aprueben antes de implementar; las confirmadas por el usuario están marcadas.
- **Principio 3 (lógica separada):** RF-2 exige una función pura única, con sesiones y fecha de hoy como parámetros, compartida con "Esta semana"; RNF-12 exige que semana, total, porcentaje y validación se calculen sin reloj ni DOM. La ubicación concreta se detalla en el plan.
- **Principio 4 (tests como puerta):** RNF-12 y la tabla RF→prueba de la sección 10 exigen pruebas con `node --test` sin instalar nada.
- **Principio 5 (datos sagrados):** RNF-6 y RNF-7 prohíben modificar el historial, exigen una clave aparte y tolerancia a datos dañados y almacenamiento no disponible; RF-3 prohíbe borrar por iniciativa propia un valor guardado.
- **Principio 6 (idioma):** el código nuevo seguirá la constitución (inglés) y la interfaz y la documentación seguirán en español.

## 10. Criterios de finalización

- [ ] Se cumplen RF-1 a RF-10 y sus criterios de aceptación.
- [ ] Se cumplen RNF-1 a RNF-12.
- [ ] El total de "Esta semana" y el progreso del objetivo salen de la misma función pura y muestran siempre la misma cifra en Chrome.
- [ ] Se han probado los límites de truncado de la tabla de RF-4, incluido `1/10 080 → 0 %`, `299/300 → 99 %`, `300/300 → 100 %` con `Objetivo cumplido` y el tope `999 %+`.
- [ ] Se ha probado el objetivo guardado inválido: aviso visible, `Quitar objetivo` disponible, valor intacto hasta guardar o quitar, aviso que desaparece en ambos casos.
- [ ] Se ha probado el almacenamiento bloqueado y lleno al guardar y al quitar: se mantiene el estado anterior, se conserva el texto escrito y aparece el aviso correspondiente.
- [ ] Se ha probado el orden de los anuncios: primero se actualiza el progreso, después se anuncia la confirmación; el progreso no se anuncia dos veces; los errores salen solo en su región de alerta.
- [ ] Se ha comprobado con lector de pantalla que la sección lee el progreso una sola vez, que el valor del indicador se recorta al máximo y que el texto accesible conserva los minutos y el porcentaje reales.
- [ ] Se ha probado `forced-colors` y el contraste: la barra conserva borde, el porcentaje y el estado están en texto.
- [ ] Se ha comprobado la matriz de zoom (200 % sobre 1280 px y sobre 375 px) y 320 px: sin scroll horizontal, con el editor apilado si hace falta.
- [ ] Con 2.000 sesiones y CPU 4×, guardar y quitar el objetivo repintan la sección en menos de 50 ms, sin repintar la lista ni el mapa.
- [ ] Al volver a la pestaña con cambios sin guardar en el campo, el texto escrito se conserva intacto; sin cambios, se relee el objetivo guardado.
- [ ] La sección se ha probado en Chrome a 375 y 320 píxeles y en escritorio, sin desbordamiento horizontal ni errores en consola.
- [ ] Se han probado sin objetivo, objetivo de 1 minuto, objetivo de 10 080 minutos, progreso 0, progreso exacto, progreso por encima, cambio a mitad de semana (subida y bajada del objetivo) y cambio de semana.
- [ ] Las sesiones, la racha, la mejor racha, el total semanal (misma cifra que antes del cambio), los días del mes, el mapa de calor y la lista siguen funcionando igual.
- [ ] Las pruebas automatizadas de la lógica están en verde, con fecha de referencia y sin dependencias instaladas.
- [ ] No se han añadido dependencias, no se ha modificado el formato de las sesiones y no hay peticiones de red.
- [ ] `AGENTS.md` incluye la nueva clave en la sección Datos y `MEMORY.md` recoge el estado y las decisiones de esta funcionalidad.
- [ ] Si el plan propone un archivo nuevo para la lógica pura, la persona responsable del proyecto lo ha aprobado antes de crearlo.
- [ ] La persona responsable del proyecto aprueba los supuestos pendientes de la sección 8 y el resultado.

**Mapa RF → prueba**

| RF | Prueba automatizada (`node --test`) | Prueba manual (Chrome + lector de pantalla) |
| --- | --- | --- |
| RF-1 | — | Posición entre "Tu constancia" y el mapa; editor siempre visible; resto de la página intacto. |
| RF-2 | Total semanal con fecha fija: varias sesiones el mismo día, fechas futuras, anteriores al lunes, sesiones inválidas y semana que cruza de mes o año. | Igualdad exacta con "Esta semana" tras guardar, editar, borrar y deshacer. |
| RF-3 | Objetivo inválido se interpreta como no fijado; no se corrige ni se borra. | Aviso visible, `Quitar objetivo` disponible, aviso que desaparece al guardar o quitar; foco al campo. |
| RF-4 | Tabla de truncado completa, incluido el tope `999 %+` y el caso `301/300 → 100 %`. | Textos `estudiado de objetivo`, `Objetivo cumplido` y ausencia de `te faltan…`. |
| RF-5 | Proporción de la barra recortada a 0–1 y sin relleno mínimo. | Barra vacía al 0 %, llena al 100 %, pista visible, `forced-colors`. |
| RF-6 | Validación: vacío, solo espacios, `abc`, `1,5`, `-30`, `0`, `10 081`, `0300 → 300`, rango 1 y 10 080. | Foco y `aria-invalid` en el campo, error asociado, confirmación literal, texto conservado en el fallo. |
| RF-7 | — | Quitar: campo vacío, foco al campo, anuncio; fallo simulado mantiene el objetivo. |
| RF-8 | Lectura del objetivo guardado, semana nueva y progreso a 0; independencia del historial. | Recarga, cierre y reapertura; historial dañado; almacenamiento no disponible. |
| RF-9 | Recalcular con sesiones y `hoy` distintos al guardar y quitar. | Guardar/editar/borrar/deshacer; volver a la pestaña con y sin cambios sin guardar; sin temporizador y sin anuncios. |
| RF-10 | — | Etiqueta, ayuda y errores; nombre y valor del indicador; `valuenow` recortado y `valuetext` real; lectura única; orden de anuncios; teclado y foco visible. |

## 11. Dudas abiertas

Ninguna duda bloqueante. Las decisiones de la petición y de la revisión están integradas en la spec:

- **Progreso:** se muestran los minutos estudiados, el objetivo, el porcentaje truncado y `Objetivo cumplido`; no se muestra ni se anuncia cuánto falta (RF-4, A-5).
- **Editor:** sección propia siempre visible con el editor a la vista (RF-1, A-1, A-3).
- **Porcentaje:** truncado con `Math.floor`, con ejemplos verificables y tope de presentación `999 %+` (RF-4, A-10).
- **Límites:** objetivo entre 1 y 10 080 minutos (RF-6, A-7).
- **Fuente del total:** una única función pura compartida con "Esta semana", sin cambiar el resultado (RF-2).
- **Objetivo inválido y volver a la pestaña:** valor inválido tratado como no fijado y limpiable; el texto sin guardar nunca se sobrescribe (RF-3, RF-9, A-11).

Quedan pendientes de aprobación A-2 (clave de datos), A-4, A-6, A-8, A-9, A-10, A-11, A-12 y A-13. La implementación podrá proponer en el plan un archivo nuevo para la lógica pura del objetivo; crear ese archivo necesita la aprobación del usuario. `AGENTS.md` y `MEMORY.md` se actualizarán al terminar la implementación (sección 10).
