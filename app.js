// ============================================================
// Diario de Estudio
// Las sesiones se guardan en localStorage (en este navegador).
// ============================================================

// Nombre de la "caja" donde guardamos las sesiones.
const CLAVE_ALMACEN = "diarioDeEstudio.sesiones";
// Copia única de datos dañados antes de reescribir el historial.
const CLAVE_COPIA = CLAVE_ALMACEN + ".copia";
// Objetivo semanal, en su propia clave: {"minutos":300}. Nunca toca el historial.
const CLAVE_OBJETIVO = "diarioDeEstudio.objetivoSemanal";

const LIMITE_SESIONES = 30;
const MAX_MINUTOS = 1440;
const MAX_TEMA = 120;

// Elementos de la página que vamos a usar.
const formulario = document.getElementById("formulario-sesion");
const seccionFormulario = document.getElementById("nueva-sesion");
const tituloFormulario = document.getElementById("form-titulo");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const errorFecha = document.getElementById("error-fecha");
const errorTema = document.getElementById("error-tema");
const errorMinutos = document.getElementById("error-minutos");
const errorGeneral = document.getElementById("error-general");
const avisoFecha = document.getElementById("aviso-fecha");
const botonGuardar = document.getElementById("guardar-sesion");
const botonCancelar = document.getElementById("cancelar-edicion");
const confirmacion = document.getElementById("confirmacion");
const confirmacionTexto = document.getElementById("confirmacion-texto");
const confirmacionExtra = document.getElementById("confirmacion-extra");
const numeroRacha = document.getElementById("racha-numero");
const numeroMejorRacha = document.getElementById("mejor-racha-numero");
const detalleRacha = document.getElementById("racha-detalle");
const minutosSemana = document.getElementById("minutos-semana");
const diasMes = document.getElementById("dias-mes");
const avisoRacha = document.getElementById("racha-aviso");
const listaSesiones = document.getElementById("lista-sesiones");
const avisoSinSesiones = document.getElementById("sin-sesiones");
const listaEstado = document.getElementById("lista-estado");
const listaEstadoTexto = document.getElementById("lista-estado-texto");
const botonDeshacer = document.getElementById("deshacer-borrado");
const listaCuenta = document.getElementById("lista-cuenta");
const listaPie = document.getElementById("lista-pie");
const botonMostrarMas = document.getElementById("mostrar-mas");
const datosIgnorados = document.getElementById("datos-ignorados");
const tituloSesiones = document.getElementById("sesiones-titulo");
const anuncio = document.getElementById("anuncio");
const heatmapGrid = document.getElementById("heatmap-grid");
const heatmapEmpty = document.getElementById("heatmap-empty");
const heatmapDetail = document.getElementById("heatmap-detail");
const goalStatus = document.getElementById("goal-status");
const goalValue = document.getElementById("goal-value");
const goalPercent = document.getElementById("goal-percent");
const goalComplete = document.getElementById("goal-complete");
const goalTrack = document.getElementById("goal-track");
const goalFill = document.getElementById("goal-fill");
const goalEmpty = document.getElementById("goal-empty");
const goalNotice = document.getElementById("goal-notice");
const goalForm = document.getElementById("goal-form");
const goalMinutes = document.getElementById("goal-minutes");
const goalError = document.getElementById("goal-error");
const goalAlert = document.getElementById("goal-alert");
const goalConfirm = document.getElementById("goal-confirm");
const goalSubmit = document.getElementById("goal-submit");
const goalRemove = document.getElementById("goal-remove");

const HEATMAP_HELP_TEXT =
  "Pasa el ratón, toca o usa las flechas para ver el detalle de un día.";
const HEATMAP_MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const HEATMAP_WEEKDAYS = [
  { initial: "L", name: "lunes" },
  { initial: "M", name: "martes" },
  { initial: "X", name: "miércoles" },
  { initial: "J", name: "jueves" },
  { initial: "V", name: "viernes" },
  { initial: "S", name: "sábado" },
  { initial: "D", name: "domingo" },
];
const HEATMAP_LONG_WEEKDAYS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
const HEATMAP_LONG_MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// ------------------------------------------------------------
// Fechas (siempre con la fecha local, nunca UTC)
// ------------------------------------------------------------

// Convierte un objeto Date en texto "AAAA-MM-DD" con la hora local.
function fechaATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Convierte "AAAA-MM-DD" en un Date a medianoche LOCAL.
// Ojo: no usamos new Date("AAAA-MM-DD") porque eso interpreta UTC
// y puede mostrar un día de diferencia.
function textoAFecha(texto) {
  const partes = texto.split("-");
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  return new Date(anio, mes - 1, dia);
}

// Suma (o resta, con números negativos) días a una fecha "AAAA-MM-DD".
function sumarDias(texto, cantidad) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() + cantidad);
  return fechaATexto(fecha);
}

// Las fechas se repiten mucho en la lista: formateamos cada una una sola vez.
const fechasLegibles = new Map();

// Texto bonito para mostrar, por ejemplo: "vie, 23 oct 2026".
function formatearFechaLegible(texto) {
  if (fechasLegibles.has(texto)) return fechasLegibles.get(texto);

  const formateada = textoAFecha(texto).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  fechasLegibles.set(texto, formateada);
  return formateada;
}

// ------------------------------------------------------------
// Guardar y cargar sesiones
// ------------------------------------------------------------

let sesionesIgnoradas = 0;
let errorAlCargar = false;
let copiaSeguridadHecha = false;
let sesiones = cargarSesiones();

// Una sesión guardada solo se usa si tiene fecha real y minutos enteros
// positivos. El resto se conserva en el historial, pero no se pinta.
function normalizarSesion(entrada) {
  if (!Heatmap.isValidSession(entrada)) return null;

  const tema = typeof entrada.tema === "string" ? entrada.tema.trim() : "";
  const creadaEn =
    typeof entrada.creadaEn === "string" ? entrada.creadaEn : "";

  return {
    fecha: entrada.fecha,
    tema: tema || "Sesión sin tema",
    minutos: entrada.minutos,
    creadaEn: creadaEn,
  };
}

function cargarSesiones() {
  sesionesIgnoradas = 0;
  errorAlCargar = false;

  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN);
    if (!guardado) return [];

    let datos;
    try {
      datos = JSON.parse(guardado);
    } catch (error) {
      errorAlCargar = true;
      return [];
    }

    if (!Array.isArray(datos)) {
      errorAlCargar = true;
      return [];
    }

    const validas = [];
    for (const entrada of datos) {
      const sesion = normalizarSesion(entrada);

      if (sesion) {
        validas.push(sesion);
      } else {
        sesionesIgnoradas += 1;
      }
    }

    return validas;
  } catch (error) {
    // localStorage bloqueado o no disponible: la página sigue funcionando.
    errorAlCargar = true;
    return [];
  }
}

// Copia de seguridad best-effort antes de reescribir un historial dañado.
function respaldarHistorial() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN);
    if (!guardado) return false;

    localStorage.setItem(CLAVE_COPIA, guardado);
    return true;
  } catch (error) {
    return false;
  }
}

function guardarSesiones() {
  const serializadas = JSON.stringify(sesiones);
  let copiaHecha = false;

  try {
    if (!copiaSeguridadHecha && (sesionesIgnoradas > 0 || errorAlCargar)) {
      copiaHecha = respaldarHistorial();
      copiaSeguridadHecha = copiaHecha;
    }

    localStorage.setItem(CLAVE_ALMACEN, serializadas);
    sesionesIgnoradas = 0;
    errorAlCargar = false;
    return true;
  } catch (error) {
    // Si la copia de seguridad llenó la cuota, la quitamos y reintentamos.
    if (copiaHecha) {
      try {
        localStorage.removeItem(CLAVE_COPIA);
        // La copia ya no está: si el historial sigue dañado, se puede
        // volver a intentar el respaldo en el próximo guardado.
        copiaSeguridadHecha = false;
      } catch (errorSinEspacio) {
        // Sin espacio ni para limpiar: probamos igualmente a guardar.
      }
    }

    try {
      localStorage.setItem(CLAVE_ALMACEN, serializadas);
      sesionesIgnoradas = 0;
      errorAlCargar = false;
      return true;
    } catch (errorDefinitivo) {
      return false;
    }
  }
}

// ------------------------------------------------------------
// Racha
// ------------------------------------------------------------

// La racha son los días consecutivos con sesión que terminan hoy.
// Si hoy todavía no hay sesión, empezamos a contar desde ayer:
// así la racha no se rompe hasta que termina el día.
function calcularRacha() {
  const diasConSesion = new Set(sesiones.map((sesion) => sesion.fecha));
  const hoy = fechaATexto(new Date());

  let dia = diasConSesion.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;

  while (diasConSesion.has(dia)) {
    racha += 1;
    dia = sumarDias(dia, -1);
  }

  return racha;
}

// La mejor racha es la tirada consecutiva más larga de días con al menos
// una sesión. Se calcula sobre fechas únicas y se excluyen fechas futuras.
function calcularMejorRacha() {
  const hoy = fechaATexto(new Date());
  const dias = [...new Set(sesiones.map((sesion) => sesion.fecha))]
    .filter((fecha) => fecha <= hoy)
    .sort();

  let mejor = 0;
  let racha = 0;
  let diaAnterior = "";

  for (const dia of dias) {
    if (diaAnterior !== "" && sumarDias(diaAnterior, 1) === dia) {
      racha += 1;
    } else {
      racha = 1;
    }
    if (racha > mejor) {
      mejor = racha;
    }
    diaAnterior = dia;
  }

  return mejor;
}

// ------------------------------------------------------------
// Minutos de esta semana
// ------------------------------------------------------------

// Suma los minutos de esta semana, del lunes a hoy.
// La fuente única es Goal.sumWeekMinutes (goal.js): aquí solo le pasamos
// las sesiones y la fecha de hoy, así "Esta semana" y el objetivo semanal
// no pueden dar cifras distintas. Las fechas futuras no cuentan.
function calcularMinutosSemana() {
  return Goal.sumWeekMinutes(sesiones, fechaATexto(new Date()));
}

// Texto para una cantidad de minutos: "45 min", "1 h", "5 h 15 min".
function formatearDuracion(minutos) {
  if (minutos < 60) return minutos + " min";

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? horas + " h" : horas + " h " + resto + " min";
}

// ------------------------------------------------------------
// Objetivo semanal (la lógica pura vive en goal.js)
// ------------------------------------------------------------

// Estado del objetivo que se está mostrando. El progreso se deriva en cada
// renderizado: no se guarda nada de esto en localStorage.
let shownGoal = null; // minutos del objetivo mostrado (null si no hay)
let storedInvalid = false; // hay un valor guardado que no es válido
let lastReadGoalValue = ""; // texto que escribimos en el campo la última vez
let savingGoal = false; // evita dobles envíos mientras se guarda

// El campo del objetivo usa los mismos ayudantes de error que el formulario
// de sesión, que esperan un objeto con { input, error }.
const campoObjetivo = { input: goalMinutes, error: goalError };

// Lee el objetivo guardado sin romper la página si el almacenamiento falla.
// Devuelve { status: "none" | "valid" | "invalid", minutes }.
function readStoredGoal() {
  let guardado;
  try {
    guardado = localStorage.getItem(CLAVE_OBJETIVO);
  } catch (error) {
    // localStorage bloqueado: como si no hubiera objetivo guardado.
    return { status: "none", minutes: null };
  }

  return Goal.parseStoredGoal(guardado);
}

// Escribe en el campo el objetivo que se está mostrando (o lo vacía).
// Es la única función que toca el campo: el render nunca lo pisa (RF-9).
function syncGoalField() {
  goalMinutes.value = shownGoal === null ? "" : String(shownGoal);
  lastReadGoalValue = goalMinutes.value;
}

// Pinta la sección: línea de progreso, porcentaje, barra y botones.
// No escribe en el campo, no toca los avisos y no anuncia nada.
function renderGoal() {
  const estado = Goal.buildGoalState(sesiones, fechaATexto(new Date()), shownGoal);

  if (!estado.hasGoal) {
    goalStatus.hidden = true;
    goalEmpty.hidden = false;
    goalNotice.hidden = !storedInvalid;
    goalRemove.hidden = !storedInvalid;
    goalSubmit.textContent = "Fijar objetivo";
    return;
  }

  // Textos visibles y para lectores de pantalla.
  const estudiado = formatearDuracion(estado.studiedMinutes);
  const objetivo = formatearDuracion(estado.goalMinutes);
  const porcentajeVisible = estado.percentOverCap
    ? "999 %+"
    : estado.percentValue + " %";
  // En voz alta el tope suena mejor sin el signo: "más de 999 %".
  const porcentajeHablado = estado.percentOverCap
    ? "más de 999 %"
    : estado.percentValue + " %";

  goalStatus.hidden = false;
  goalEmpty.hidden = true;
  goalNotice.hidden = true;
  goalRemove.hidden = false;
  goalSubmit.textContent = "Guardar objetivo";

  goalValue.textContent = estudiado + " de " + objetivo;
  goalPercent.textContent = porcentajeVisible;
  goalComplete.hidden = !estado.isComplete;

  // aria-valuenow se recorta al objetivo, pero aria-valuetext conserva el
  // progreso real: la barra nunca pasa del 100 %.
  goalTrack.setAttribute("aria-valuemin", "0");
  goalTrack.setAttribute("aria-valuemax", String(estado.goalMinutes));
  goalTrack.setAttribute(
    "aria-valuenow",
    String(Math.min(estado.studiedMinutes, estado.goalMinutes))
  );
  goalTrack.setAttribute(
    "aria-valuetext",
    estudiado + " de " + objetivo + ", " + porcentajeHablado +
      (estado.isComplete ? ", Objetivo cumplido" : "")
  );

  goalFill.style.width = estado.ratio * 100 + "%";
}

// Guarda el objetivo en su propia clave: {"minutos":300}.
// Devuelve false si el navegador no deja escribir (lleno o bloqueado).
function saveStoredGoal(minutes) {
  try {
    localStorage.setItem(CLAVE_OBJETIVO, JSON.stringify({ minutos: minutes }));
    return true;
  } catch (error) {
    return false;
  }
}

// Quita el objetivo de su propia clave.
// Devuelve false si el navegador no deja escribir (lleno o bloqueado).
function deleteStoredGoal() {
  try {
    localStorage.removeItem(CLAVE_OBJETIVO);
    return true;
  } catch (error) {
    return false;
  }
}

// Aviso de fallo: esta región es role="alert", así que se anuncia sola.
function showGoalAlert(texto) {
  goalAlert.textContent = texto;
  goalAlert.hidden = false;
}

function clearGoalAlert() {
  goalAlert.textContent = "";
  goalAlert.hidden = true;
}

// Confirmación visible decorativa: el texto se anuncia por #anuncio.
function showGoalConfirmation(texto) {
  goalConfirm.textContent = texto;
  goalConfirm.hidden = false;
}

function clearGoalConfirmation() {
  goalConfirm.textContent = "";
  goalConfirm.hidden = true;
}

// Enviar el editor del objetivo: validar, guardar y, si todo va bien,
// pintar primero, mostrar la confirmación y anunciarla después.
function handleGoalSubmit(evento) {
  evento.preventDefault();
  if (savingGoal) return;

  savingGoal = true;
  try {
    const resultado = Goal.parseGoalInput(goalMinutes.value);

    if (!resultado.ok) {
      marcarErrorCampo(
        campoObjetivo,
        resultado.reason === "empty"
          ? "Escribe cuántos minutos quieres estudiar cada semana."
          : "Los minutos del objetivo deben ser un número entero entre 1 y 10 080."
      );
      return;
    }

    limpiarErrorCampo(campoObjetivo);
    clearGoalAlert();

    // Si falla el guardado, se mantiene el objetivo anterior, se conserva
    // el texto escrito y no se mueve el foco (RF-6).
    if (!saveStoredGoal(resultado.minutes)) {
      showGoalAlert(
        "No se ha podido guardar el objetivo. Comprueba el espacio disponible en el navegador e inténtalo de nuevo."
      );
      return;
    }

    shownGoal = resultado.minutes;
    storedInvalid = false;
    syncGoalField(); // normaliza lo escrito, por ejemplo "0300" -> "300"
    renderGoal();

    const texto =
      "Objetivo semanal guardado: " +
      formatearDuracion(resultado.minutes) + " por semana.";
    showGoalConfirmation(texto);
    anunciar(texto);
  } finally {
    savingGoal = false;
  }
}

// Pulsar "Quitar objetivo": borrar el valor guardado y volver al estado sin
// objetivo, también cuando lo guardado era un valor inválido.
// Si el borrado falla no cambia nada en pantalla (ni siquiera el aviso de
// valor inválido) y el aviso sale en #goal-alert, que se anuncia solo.
function handleGoalRemove() {
  if (savingGoal) return;

  savingGoal = true;
  try {
    if (!deleteStoredGoal()) {
      renderGoal();
      showGoalAlert(
        "No se ha podido quitar el objetivo. Comprueba el espacio disponible en el navegador e inténtalo de nuevo."
      );
      return;
    }

    shownGoal = null;
    storedInvalid = false;
    syncGoalField(); // deja el campo vacío
    clearGoalAlert();
    limpiarErrorCampo(campoObjetivo);
    renderGoal();

    // Pintar, mostrar la confirmación y anunciarla después (RF-10).
    showGoalConfirmation("Objetivo semanal quitado.");
    anunciar("Objetivo semanal quitado.");
    goalMinutes.focus();
  } finally {
    savingGoal = false;
  }
}

// Volver a la pestaña: relee el objetivo guardado solo si no hay nada escrito
// sin guardar ni el foco en el campo (RF-9). No anuncia nada: el progreso ya
// se recalcula en renderizarTodo() con el objetivo que quede en shownGoal.
function refreshGoalOnVisible() {
  const hasUnsavedChanges = goalMinutes.value.trim() !== lastReadGoalValue;
  const hasFocus = document.activeElement === goalMinutes;

  // Con cambios o con el foco: ni se relee ni se escribe el campo.
  if (hasUnsavedChanges || hasFocus) return;

  const stored = readStoredGoal();
  shownGoal = stored.status === "valid" ? stored.minutes : null;
  storedInvalid = stored.status === "invalid";
  syncGoalField();
}

// ------------------------------------------------------------
// Días estudiados este mes
// ------------------------------------------------------------

// Primer día del mes al que pertenece una fecha "AAAA-MM-DD".
function inicioDeMes(texto) {
  const fecha = textoAFecha(texto);
  fecha.setDate(1);
  return fechaATexto(fecha);
}

// Cuenta días únicos con sesión entre el día 1 y hoy.
// Las fechas futuras no cuentan y varias sesiones del mismo día suman 1.
function calcularDiasDelMes() {
  const hoy = fechaATexto(new Date());
  const inicio = inicioDeMes(hoy);
  const dias = new Set();

  for (const sesion of sesiones) {
    if (typeof sesion.fecha !== "string") continue;
    if (sesion.fecha < inicio || sesion.fecha > hoy) continue;
    dias.add(sesion.fecha);
  }

  return dias.size;
}

// ------------------------------------------------------------
// Dibujar la página
// ------------------------------------------------------------

function renderizarRacha() {
  const racha = calcularRacha();
  const mejorRacha = calcularMejorRacha();
  const hoy = fechaATexto(new Date());
  const heEstudiadoHoy = sesiones.some((sesion) => sesion.fecha === hoy);

  numeroRacha.textContent = racha;
  if (numeroMejorRacha) {
    numeroMejorRacha.textContent = mejorRacha;
  }
  detalleRacha.textContent = racha === 1 ? "día seguido" : "días seguidos";
  minutosSemana.textContent = formatearDuracion(calcularMinutosSemana());

  const diasDelMes = calcularDiasDelMes();
  diasMes.textContent = diasDelMes + (diasDelMes === 1 ? " día" : " días");

  // Aviso opcional: la racha sigue viva aunque hoy no haya sesión.
  avisoRacha.hidden = !(racha > 0 && !heEstudiadoHoy);
}

function crearBotonAccion(etiqueta, accion, indice, tema) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "sesion__accion";
  boton.dataset.accion = accion;
  boton.dataset.indice = String(indice);
  boton.textContent = etiqueta;
  boton.setAttribute("aria-label", etiqueta + " sesión: " + tema);
  return boton;
}

function crearItemSesion(sesion, indice, hoy) {
  const item = document.createElement("li");
  item.className = "sesion";

  const principal = document.createElement("div");
  principal.className = "sesion__principal";

  const info = document.createElement("div");
  info.className = "sesion__info";

  const tema = document.createElement("p");
  tema.className = "sesion__tema";
  tema.textContent = sesion.tema;

  const fecha = document.createElement("p");
  fecha.className = "sesion__fecha";
  fecha.textContent = formatearFechaLegible(sesion.fecha);

  if (sesion.fecha > hoy) {
    const programada = document.createElement("span");
    programada.className = "sesion__programada";
    programada.textContent = "Programada";
    fecha.append(" ", programada);
  }

  info.append(tema, fecha);

  const minutos = document.createElement("span");
  minutos.className = "sesion__minutos";
  minutos.textContent = formatearDuracion(sesion.minutos);

  principal.append(info, minutos);

  const acciones = document.createElement("div");
  acciones.className = "sesion__acciones";
  acciones.append(
    crearBotonAccion("Editar", "editar", indice, sesion.tema),
    crearBotonAccion("Borrar", "borrar", indice, sesion.tema)
  );

  item.append(principal, acciones);
  return item;
}

function renderizarSesiones() {
  // Vaciamos la lista antes de volver a dibujarla.
  listaSesiones.textContent = "";

  // Copia ordenada: primero la más reciente.
  // Guardamos el índice original para poder editar o borrar sin confundirnos.
  const ordenadas = sesiones
    .map((sesion, indice) => ({ sesion, indice }))
    .sort((a, b) => {
      if (a.sesion.fecha !== b.sesion.fecha) {
        return a.sesion.fecha < b.sesion.fecha ? 1 : -1;
      }
      // Si es el mismo día, la registrada más tarde va primero.
      return b.sesion.creadaEn.localeCompare(a.sesion.creadaEn);
    });

  const total = ordenadas.length;
  const visibles = ordenadas.slice(0, sesionesVisibles);
  const hoy = fechaATexto(new Date());

  avisoSinSesiones.hidden = total > 0;

  // Un solo fragmento: el navegador repinta la lista una vez, no treinta.
  const fragmento = document.createDocumentFragment();
  for (const { sesion, indice } of visibles) {
    fragmento.append(crearItemSesion(sesion, indice, hoy));
  }
  listaSesiones.append(fragmento);

  const hayMas = total > visibles.length;

  // El recuento solo aporta cuando la lista está paginada.
  listaCuenta.hidden = total <= LIMITE_SESIONES;
  if (!listaCuenta.hidden) {
    listaCuenta.textContent =
      "Mostrando " + visibles.length + " de " + total +
      (total === 1 ? " sesión." : " sesiones.");
  }

  listaPie.hidden = !hayMas;
  if (hayMas) {
    botonMostrarMas.disabled = false;
    botonMostrarMas.textContent =
      "Mostrar " + Math.min(LIMITE_SESIONES, total - visibles.length) + " más";
  }
}

// ------------------------------------------------------------
// Mapa de calor (la lógica vive en heatmap.js)
// ------------------------------------------------------------

let heatmapDaysByDate = new Map();
let pinnedHeatmapDate = null;
let hoveredHeatmapDate = null;
let focusedHeatmapDate = null;
let heatmapDetailDismissed = false;

// Fecha larga para lectores de pantalla y para las celdas futuras.
// Se compone a mano para no crear 84 formateadores de idioma en cada dibujado.
function formatHeatmapDateLong(dateText) {
  const date = textoAFecha(dateText);
  return (
    HEATMAP_LONG_WEEKDAYS[date.getDay()] + " " + date.getDate() +
    " de " + HEATMAP_LONG_MONTHS[date.getMonth()] +
    " de " + date.getFullYear()
  );
}

// Minutos en palabras para el nombre accesible de cada celda.
function formatHeatmapMinutes(minutes) {
  if (minutes === 0) return "sin sesiones";
  return minutes === 1 ? "1 minuto" : minutes + " minutos";
}

// Texto del detalle: reutiliza el formato de la lista de sesiones.
function formatHeatmapDetail(day) {
  const duracion = day.minutes > 0 ? formatearDuracion(day.minutes) : "Sin sesiones";
  return formatearFechaLegible(day.date) + " · " + duracion;
}

function clearHeatmapDetail() {
  heatmapDetail.textContent = HEATMAP_HELP_TEXT;
}

function showHeatmapDetail(dateText) {
  const day = heatmapDaysByDate.get(dateText);
  if (!day) {
    clearHeatmapDetail();
    return;
  }
  heatmapDetail.textContent = formatHeatmapDetail(day);
}

// Prioridad: puntero, foco y, por último, el día fijado con un toque o clic.
function updateHeatmapDetail() {
  if (heatmapDetailDismissed) {
    clearHeatmapDetail();
    return;
  }

  const dateText = hoveredHeatmapDate || focusedHeatmapDate || pinnedHeatmapDate;
  if (dateText) {
    showHeatmapDetail(dateText);
  } else {
    clearHeatmapDetail();
  }
}

// El estado "fijado" se expone también a tecnologías de asistencia.
function updateHeatmapPressed() {
  const botones = heatmapGrid.querySelectorAll("button[data-date]");
  for (const boton of botones) {
    boton.setAttribute(
      "aria-pressed",
      boton.dataset.date === pinnedHeatmapDate ? "true" : "false"
    );
  }
}

function buildHeatmapTable(result) {
  const table = document.createElement("table");
  table.className = "heatmap__table";

  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = "Mapa de calor de las últimas 12 semanas";
  table.append(caption);

  // Cabecera de meses: decorativa, la fecha completa va en cada celda.
  const thead = document.createElement("thead");
  thead.setAttribute("aria-hidden", "true");

  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "heatmap__corner";
  corner.scope = "col";
  headRow.append(corner);

  const monthLabels = Heatmap.buildMonthLabels(result.weeks);
  for (const monthIndex of monthLabels) {
    const cell = document.createElement("th");
    cell.className = "heatmap__month";
    cell.scope = "col";
    if (monthIndex !== null) {
      cell.textContent = HEATMAP_MONTHS[monthIndex];
    }
    headRow.append(cell);
  }

  thead.append(headRow);
  table.append(thead);

  // 7 filas (días de la semana) por 12 columnas (semanas).
  const tbody = document.createElement("tbody");

  HEATMAP_WEEKDAYS.forEach((weekday, dayIndex) => {
    const row = document.createElement("tr");

    const header = document.createElement("th");
    header.className = "heatmap__weekday";
    header.scope = "row";

    const initial = document.createElement("span");
    initial.setAttribute("aria-hidden", "true");
    initial.textContent = weekday.initial;

    const fullName = document.createElement("span");
    fullName.className = "visually-hidden";
    fullName.textContent = weekday.name;

    header.append(initial, fullName);
    row.append(header);

    for (const week of result.weeks) {
      const day = week[dayIndex];
      const cell = document.createElement("td");
      cell.className = "heatmap__day";

      if (day.isFuture) {
        // Los días futuros no son interactivos ni enfocables.
        const visual = document.createElement("span");
        visual.className = "heatmap__cell heatmap__cell--future";
        visual.setAttribute("aria-hidden", "true");

        const hidden = document.createElement("span");
        hidden.className = "visually-hidden";
        hidden.textContent = formatHeatmapDateLong(day.date) + ", no disponible";

        cell.append(visual, hidden);
      } else {
        const esHoy = day.date === result.today;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "heatmap__cell level-" + day.level;
        button.dataset.date = day.date;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-controls", "heatmap-detail");
        button.setAttribute(
          "aria-label",
          (esHoy ? "Hoy, " : "") +
            formatHeatmapDateLong(day.date) + ", " +
            formatHeatmapMinutes(day.minutes)
        );
        // Un único punto de tabulación: hoy; el resto se alcanza con flechas.
        button.tabIndex = esHoy ? 0 : -1;

        if (esHoy) {
          button.classList.add("heatmap__cell--today");
          button.setAttribute("aria-current", "date");
        }

        const fill = document.createElement("span");
        fill.className = "heatmap__fill";
        fill.setAttribute("aria-hidden", "true");

        button.append(fill);
        cell.append(button);
      }

      row.append(cell);
    }

    tbody.append(row);
  });

  table.append(tbody);
  return table;
}

// Devuelve el resultado del mapa para poder anunciarlo desde el formulario.
function renderHeatmap() {
  const today = fechaATexto(new Date());
  const result = Heatmap.buildHeatmap(sesiones, today);

  // Si el foco estaba en una celda, lo devolvemos a su día tras redibujar.
  const celdaEnfocada =
    heatmapGrid.contains(document.activeElement) && document.activeElement.dataset
      ? document.activeElement.dataset.date
      : undefined;

  heatmapDaysByDate = new Map(result.weeks.flat().map((day) => [day.date, day]));

  heatmapGrid.textContent = "";
  heatmapGrid.append(buildHeatmapTable(result));
  heatmapEmpty.hidden = result.hasSessions;

  // Al redibujar no queda ningún detalle abierto.
  pinnedHeatmapDate = null;
  hoveredHeatmapDate = null;
  focusedHeatmapDate = null;
  heatmapDetailDismissed = false;
  clearHeatmapDetail();

  if (celdaEnfocada && heatmapDaysByDate.has(celdaEnfocada)) {
    moveHeatmapFocus(celdaEnfocada);
  }

  return result;
}

function moveHeatmapFocus(dateText) {
  const target = heatmapGrid.querySelector('button[data-date="' + dateText + '"]');
  if (!target) return;

  const current = heatmapGrid.querySelector('button[tabindex="0"]');
  if (current) current.tabIndex = -1;

  target.tabIndex = 0;
  target.focus();
}

function handleHeatmapKeydown(event) {
  if (event.key === "Escape") {
    // Desfija y cierra el detalle sin sacar el foco de la cuadrícula.
    if (pinnedHeatmapDate !== null) {
      pinnedHeatmapDate = null;
      updateHeatmapPressed();
    }
    hoveredHeatmapDate = null;
    focusedHeatmapDate = null;
    heatmapDetailDismissed = true;
    clearHeatmapDetail();
    return;
  }

  let offset = 0;
  if (event.key === "ArrowLeft") {
    offset = -7;
  } else if (event.key === "ArrowRight") {
    offset = 7;
  } else if (event.key === "ArrowUp") {
    offset = -1;
  } else if (event.key === "ArrowDown") {
    offset = 1;
  } else {
    return;
  }

  const current = event.target.closest("button[data-date]");
  if (!current) return;

  event.preventDefault();
  heatmapDetailDismissed = false;
  moveHeatmapFocus(Heatmap.addDays(current.dataset.date, offset));
}

// El puntero solo cuenta si es un ratón: en táctil no hay hover real.
// Usamos pointermove (no pointerover) para que al abrir la página, si el
// cursor ya estaba sobre la cuadrícula, el detalle siga mostrando la ayuda.
heatmapGrid.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;

  const button = event.target.closest("button[data-date]");
  const dateText = button ? button.dataset.date : null;
  if (dateText === hoveredHeatmapDate) return;

  hoveredHeatmapDate = dateText;
  heatmapDetailDismissed = false;
  updateHeatmapDetail();
});

heatmapGrid.addEventListener("pointerleave", () => {
  if (hoveredHeatmapDate === null) return;

  hoveredHeatmapDate = null;
  updateHeatmapDetail();
});

heatmapGrid.addEventListener("focusin", (event) => {
  const button = event.target.closest("button[data-date]");
  if (!button) return;

  focusedHeatmapDate = button.dataset.date;
  heatmapDetailDismissed = false;
  updateHeatmapDetail();
});

heatmapGrid.addEventListener("focusout", (event) => {
  if (heatmapGrid.contains(event.relatedTarget)) return;

  focusedHeatmapDate = null;
  updateHeatmapDetail();
});

heatmapGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-date]");
  if (!button) return;

  // En táctil el foco no siempre sigue al toque: lo sincronizamos aquí.
  button.focus();

  const dateText = button.dataset.date;
  heatmapDetailDismissed = false;
  pinnedHeatmapDate = pinnedHeatmapDate === dateText ? null : dateText;
  updateHeatmapPressed();
  updateHeatmapDetail();
});

heatmapGrid.addEventListener("keydown", handleHeatmapKeydown);

document.addEventListener("click", (event) => {
  if (heatmapGrid.contains(event.target)) return;

  if (pinnedHeatmapDate !== null) {
    pinnedHeatmapDate = null;
    updateHeatmapPressed();
  }
  hoveredHeatmapDate = null;
  if (!heatmapGrid.contains(document.activeElement)) {
    focusedHeatmapDate = null;
  }
  clearHeatmapDetail();
});

// ------------------------------------------------------------
// Formulario
// ------------------------------------------------------------

// Si la fecha sigue siendo la que pusimos nosotros, la mantenemos al día
// (al volver a la pestaña o al cruzar medianoche). Si la persona la cambió,
// no la tocamos.
let fechaAutomatica = null;

const camposFormulario = [
  { input: campoFecha, error: errorFecha },
  { input: campoTema, error: errorTema },
  { input: campoMinutos, error: errorMinutos },
];

function limpiarErrorCampo(campo) {
  campo.input.removeAttribute("aria-invalid");
  campo.error.textContent = "";
  campo.error.hidden = true;
}

function limpiarErrores() {
  for (const campo of camposFormulario) {
    limpiarErrorCampo(campo);
  }
  errorGeneral.textContent = "";
  errorGeneral.hidden = true;
}

function marcarErrorCampo(campo, mensaje) {
  campo.input.setAttribute("aria-invalid", "true");
  campo.error.textContent = mensaje;
  campo.error.hidden = false;
  campo.input.focus();
}

function mostrarErrorGeneral(mensaje) {
  errorGeneral.textContent = mensaje;
  errorGeneral.hidden = false;
}

function actualizarAvisoFecha() {
  const fecha = campoFecha.value;
  const hoy = fechaATexto(new Date());
  const esFutura = fecha !== "" && fecha > hoy;

  avisoFecha.textContent = esFutura
    ? "Fecha futura: esta sesión no contará para la racha hasta ese día."
    : "";
  avisoFecha.hidden = !esFutura;
}

function actualizarFechaAutomatica() {
  if (fechaAutomatica === null) return;

  const hoy = fechaATexto(new Date());
  if (campoFecha.value !== hoy) {
    campoFecha.value = hoy;
  }
  fechaAutomatica = hoy;
  actualizarAvisoFecha();
}

// Región de anuncio permanente: se vacía y se rellena para que los lectores
// de pantalla vuelvan a anunciar incluso un mensaje repetido.
let anuncioTemporizador = null;

function anunciar(texto) {
  anuncio.textContent = "";
  clearTimeout(anuncioTemporizador);
  anuncioTemporizador = setTimeout(() => {
    anuncio.textContent = texto;
  }, 80);
}

function mostrarConfirmacion(texto, extra) {
  confirmacionTexto.textContent = texto;
  confirmacionExtra.textContent = extra || "";
  confirmacion.hidden = false;
  anunciar(texto + (extra ? " " + extra : ""));
}

function ocultarConfirmacion() {
  confirmacion.hidden = true;
  confirmacionTexto.textContent = "";
  confirmacionExtra.textContent = "";
}

function mostrarEstadoLista(texto, conDeshacer) {
  listaEstadoTexto.textContent = texto;
  botonDeshacer.hidden = !conDeshacer;
  listaEstado.hidden = false;
  anunciar(texto);
}

function ocultarEstadoLista() {
  listaEstado.hidden = true;
  listaEstadoTexto.textContent = "";
  botonDeshacer.hidden = true;
}

function renderizarAvisoDatos() {
  const partes = [];

  if (errorAlCargar) {
    partes.push(
      "No se ha podido leer el historial guardado en este navegador. " +
        "Puedes seguir registrando sesiones."
    );
  }

  if (sesionesIgnoradas > 0) {
    partes.push(
      "Se han ignorado " + sesionesIgnoradas +
        (sesionesIgnoradas === 1 ? " registro dañado" : " registros dañados") +
        " del historial; el resto sigue disponible."
    );
  }

  datosIgnorados.textContent = partes.join(" ");
  datosIgnorados.hidden = partes.length === 0;
}

// ------------------------------------------------------------
// Alta, edición y borrado de sesiones
// ------------------------------------------------------------

// Sesión que se está editando (referencia al objeto dentro de `sesiones`).
let sesionEnEdicion = null;
// Última sesión borrada, para poder deshacer.
let sesionParaDeshacer = null;
let sesionesVisibles = LIMITE_SESIONES;
let guardando = false;

function empezarEdicion(sesion) {
  sesionEnEdicion = sesion;
  tituloFormulario.textContent = "Editar sesión";
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;

  campoFecha.value = sesion.fecha;
  fechaAutomatica = null;
  campoTema.value = sesion.tema;
  campoMinutos.value = String(sesion.minutos);

  limpiarErrores();
  ocultarConfirmacion();
  actualizarAvisoFecha();

  seccionFormulario.scrollIntoView({ block: "start" });
  campoTema.focus({ preventScroll: true });
}

// Vuelve al modo "nueva sesión". Si se guardó una edición, la fecha
// vuelve a hoy para no duplicar la sesión sin querer.
function cancelarEdicion() {
  sesionEnEdicion = null;
  tituloFormulario.textContent = "Nueva sesión";
  botonGuardar.textContent = "Guardar sesión";
  botonCancelar.hidden = true;

  campoTema.value = "";
  campoMinutos.value = "";

  const hoy = fechaATexto(new Date());
  campoFecha.value = hoy;
  fechaAutomatica = hoy;

  limpiarErrores();
  actualizarAvisoFecha();
}

function borrarSesion(indice) {
  const sesion = sesiones[indice];
  if (!sesion) return;

  const anteriores = sesiones;
  const copia = sesiones.slice();
  copia.splice(indice, 1);
  sesiones = copia;

  if (!guardarSesiones()) {
    sesiones = anteriores;
    mostrarEstadoLista(
      "No se pudo borrar la sesión. Comprueba el espacio del navegador e inténtalo de nuevo.",
      false
    );
    return;
  }

  // Solo cerramos la edición si el borrado se ha guardado de verdad.
  if (sesionEnEdicion === sesion) {
    cancelarEdicion();
  }

  ocultarConfirmacion();
  sesionParaDeshacer = { sesion, indice };
  sesionesVisibles = Math.max(sesionesVisibles, LIMITE_SESIONES);
  renderizarTodo();
  mostrarEstadoLista("Sesión borrada: " + sesion.tema + ".", true);
  botonDeshacer.focus();
}

function deshacerBorrado() {
  if (!sesionParaDeshacer) return;

  const { sesion, indice } = sesionParaDeshacer;
  const anteriores = sesiones;
  const copia = sesiones.slice();
  copia.splice(Math.min(indice, copia.length), 0, sesion);
  sesiones = copia;

  if (!guardarSesiones()) {
    sesiones = anteriores;
    mostrarEstadoLista(
      "No se pudo recuperar la sesión. Comprueba el espacio del navegador e inténtalo de nuevo.",
      true
    );
    return;
  }

  sesionParaDeshacer = null;
  renderizarTodo();
  mostrarEstadoLista("Sesión recuperada.", false);

  const boton = listaSesiones.querySelector(
    'button[data-accion="editar"][data-indice="' + indice + '"]'
  );
  if (boton) {
    boton.focus();
  } else {
    tituloSesiones.focus();
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (guardando) return;

  actualizarFechaAutomatica();
  ocultarConfirmacion();
  limpiarErrores();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Validación con mensajes claros y asociados a cada campo.
  if (!fecha || !Heatmap.isValidDate(fecha)) {
    marcarErrorCampo(camposFormulario[0], "Elige una fecha válida.");
    return;
  }

  if (!tema) {
    marcarErrorCampo(camposFormulario[1], "Escribe el tema de la sesión.");
    return;
  }

  if (tema.length > MAX_TEMA) {
    marcarErrorCampo(
      camposFormulario[1],
      "El tema no puede superar los " + MAX_TEMA + " caracteres."
    );
    return;
  }

  if (!Number.isInteger(minutos) || minutos < 1 || minutos > MAX_MINUTOS) {
    marcarErrorCampo(
      camposFormulario[2],
      "Los minutos deben ser un número entero entre 1 y " + MAX_MINUTOS + "."
    );
    return;
  }

  guardando = true;
  botonGuardar.disabled = true;
  formulario.setAttribute("aria-busy", "true");

  try {
    const anteriores = sesiones;
    const estabaEditando = sesionEnEdicion !== null;
    let sesionGuardada;

    if (estabaEditando) {
      const indice = sesiones.indexOf(sesionEnEdicion);
      if (indice === -1) {
        cancelarEdicion();
        mostrarErrorGeneral("La sesión que intentabas editar ya no existe.");
        return;
      }

      const copia = sesiones.slice();
      copia[indice] = {
        fecha: fecha,
        tema: tema,
        minutos: minutos,
        creadaEn: sesionEnEdicion.creadaEn,
      };
      sesiones = copia;
      sesionGuardada = copia[indice];
    } else {
      sesionGuardada = {
        fecha: fecha,
        tema: tema,
        minutos: minutos,
        creadaEn: new Date().toISOString(),
      };
      sesiones = sesiones.concat(sesionGuardada);
    }

    if (!guardarSesiones()) {
      // No dejamos la memoria y el almacenamiento desincronizados.
      sesiones = anteriores;
      mostrarErrorGeneral(
        "No se pudo guardar la sesión. Comprueba el espacio disponible en el navegador e inténtalo de nuevo."
      );
      return;
    }

    const resultado = renderizarTodo();
    const hoy = fechaATexto(new Date());
    const esFutura = sesionGuardada.fecha > hoy;
    const fechaLegible = formatearFechaLegible(sesionGuardada.fecha);
    const duracion = formatearDuracion(sesionGuardada.minutos);
    const racha = calcularRacha();
    const textoRacha = "Racha: " + racha + (racha === 1 ? " día." : " días.");

    // El detalle del mapa solo se añade si la sesión cae en el periodo visible.
    let detalle = textoRacha;
    if (
      resultado &&
      sesionGuardada.fecha >= resultado.start &&
      sesionGuardada.fecha <= resultado.today
    ) {
      let textoMapa;
      if (resultado.daysStudied === 0) {
        textoMapa = "Mapa actualizado: ningún día estudiado en las últimas 12 semanas.";
      } else if (resultado.daysStudied === 1) {
        textoMapa = "Mapa actualizado: 1 día estudiado en las últimas 12 semanas.";
      } else {
        textoMapa =
          "Mapa actualizado: " + resultado.daysStudied +
          " días estudiados en las últimas 12 semanas.";
      }

      detalle = textoRacha + " " + textoMapa;
    }

    ocultarEstadoLista();
    sesionParaDeshacer = null;

    if (estabaEditando) {
      mostrarConfirmacion(
        "Cambios guardados: " + duracion + " de «" + tema + "» el " + fechaLegible + ".",
        detalle
      );
      cancelarEdicion();
    } else if (esFutura) {
      mostrarConfirmacion(
        "Sesión programada para el " + fechaLegible + ": " + duracion +
          " de «" + tema + "». No contará para la racha hasta ese día.",
        detalle
      );
      campoTema.value = "";
      campoMinutos.value = "";
    } else {
      mostrarConfirmacion(
        "Sesión guardada: " + duracion + " de «" + tema + "» el " + fechaLegible + ".",
        detalle
      );
      campoTema.value = "";
      campoMinutos.value = "";
    }

    campoTema.focus();
  } finally {
    guardando = false;
    botonGuardar.disabled = false;
    formulario.removeAttribute("aria-busy");
  }
});

botonCancelar.addEventListener("click", () => {
  cancelarEdicion();
  campoTema.focus();
});

// Al escribir, los errores ya corregidos desaparecen y la confirmación se va.
formulario.addEventListener("input", (evento) => {
  ocultarConfirmacion();
  errorGeneral.hidden = true;

  const campo = camposFormulario.find((item) => item.input === evento.target);
  if (campo) {
    limpiarErrorCampo(campo);
  }

  if (evento.target === campoFecha) {
    fechaAutomatica = null;
    actualizarAvisoFecha();
  }
});

formulario.addEventListener("focusin", () => {
  actualizarFechaAutomatica();
});

listaSesiones.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const indice = Number(boton.dataset.indice);
  const sesion = sesiones[indice];
  if (!sesion) return;

  if (boton.dataset.accion === "editar") {
    empezarEdicion(sesion);
  } else if (boton.dataset.accion === "borrar") {
    borrarSesion(indice);
  }
});

botonMostrarMas.addEventListener("click", () => {
  const total = sesiones.length;
  sesionesVisibles += LIMITE_SESIONES;
  renderizarSesiones();

  // Si ya está todo a la vista, el botón desaparece: llevamos el foco
  // a la última sesión para no perderlo ni saltar al principio de la lista.
  if (sesionesVisibles >= total) {
    const ultimaAccion = listaSesiones.querySelector(
      ".sesion:last-child .sesion__accion"
    );
    if (ultimaAccion) {
      ultimaAccion.focus();
    } else {
      tituloSesiones.focus();
    }
  }
});

botonDeshacer.addEventListener("click", deshacerBorrado);

// Editor del objetivo: se guarda con su propia validación y anuncio (T6).
goalForm.addEventListener("submit", handleGoalSubmit);

// Quitar el objetivo es inmediato y sin confirmación previa (T7).
goalRemove.addEventListener("click", handleGoalRemove);

// Al escribir, el error y la confirmación ya no sirven. El progreso no
// cambia hasta guardar y el campo nunca se reescribe aquí.
goalMinutes.addEventListener("input", () => {
  limpiarErrorCampo(campoObjetivo);
  clearGoalConfirmation();
});

// ------------------------------------------------------------
// Arranque
// ------------------------------------------------------------

function renderizarTodo() {
  renderizarRacha();
  renderizarSesiones();
  renderizarAvisoDatos();
  renderGoal();
  return renderHeatmap();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;

  const enEdicion = sesionEnEdicion;
  ocultarEstadoLista();
  sesionParaDeshacer = null;
  actualizarFechaAutomatica();

  sesiones = cargarSesiones();

  // Si se estaba editando, apuntamos a la copia recargada de esa misma
  // sesión para no perder los cambios escritos en el formulario.
  let edicionPerdida = false;
  if (enEdicion) {
    const guardada = enEdicion.creadaEn
      ? sesiones.find((sesion) => sesion.creadaEn === enEdicion.creadaEn)
      : sesiones.find(
          (sesion) =>
            sesion.fecha === enEdicion.fecha &&
            sesion.tema === enEdicion.tema &&
            sesion.minutos === enEdicion.minutos
        );

    if (guardada) {
      sesionEnEdicion = guardada;
    } else {
      cancelarEdicion();
      edicionPerdida = true;
    }
  }

  sesionesVisibles = Math.max(sesionesVisibles, LIMITE_SESIONES);

  // El objetivo guardado se relee antes de pintar, salvo que haya cambios
  // escritos sin guardar o el campo tenga el foco (RF-9).
  refreshGoalOnVisible();
  renderizarTodo();

  if (edicionPerdida) {
    mostrarEstadoLista(
      "La sesión que estabas editando ya no existe; se ha cerrado la edición.",
      false
    );
  }
});

// La fecha del formulario empieza en hoy (pero se puede cambiar).
const hoyInicial = fechaATexto(new Date());
campoFecha.value = hoyInicial;
fechaAutomatica = hoyInicial;
actualizarAvisoFecha();

// Objetivo semanal guardado: se lee una sola vez al arrancar (el historial
// ya se cargó arriba, en `sesiones`). Después lo pinta renderizarTodo().
const objetivoGuardado = readStoredGoal();
shownGoal = objetivoGuardado.status === "valid" ? objetivoGuardado.minutes : null;
storedInvalid = objetivoGuardado.status === "invalid";
syncGoalField();

renderizarTodo();
