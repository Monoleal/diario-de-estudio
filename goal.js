// ============================================================
// Objetivo semanal: cálculos puros
// Sin DOM, sin almacenamiento del navegador y sin leer el reloj:
// la fecha de "hoy" siempre se recibe como parámetro.
// ============================================================

const Goal = (() => {
  // Límites del objetivo: de 1 minuto a siete días completos.
  const MIN_GOAL_MINUTES = 1;
  const MAX_GOAL_MINUTES = 10080;
  const PERCENT_CAP = 999;

  // "AAAA-MM-DD" -> Date a medianoche local, o null si la fecha no existe.
  function textToDate(text) {
    if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return null;
    }

    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Si la fecha se desborda (31/02), Date la mueve de mes: la rechazamos.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  // Date local -> "AAAA-MM-DD".
  function dateToText(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Suma (o resta) días manteniendo la fecha local.
  function addDays(dateText, days) {
    const date = textToDate(dateText);
    if (!date) return null;

    date.setDate(date.getDate() + days);
    return dateToText(date);
  }

  // Lunes de la semana a la que pertenece una fecha.
  function startOfWeek(dateText) {
    const date = textToDate(dateText);
    if (!date) return null;

    const offset = (date.getDay() + 6) % 7; // lunes = 0, domingo = 6
    return addDays(dateText, -offset);
  }

  // Una sesión cuenta solo si tiene fecha real y minutos enteros positivos.
  function isValidSession(entry) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    if (!textToDate(entry.fecha)) return false;
    return Number.isInteger(entry.minutos) && entry.minutos >= 1;
  }

  // Minutos de la semana en curso: del lunes a hoy, en fecha local.
  // Las fechas se comparan como texto: ese orden coincide con el cronológico.
  function sumWeekMinutes(sessions, today) {
    if (!Array.isArray(sessions)) return 0;

    const monday = startOfWeek(today);
    if (monday === null) return 0;

    let total = 0;

    for (const entry of sessions) {
      if (!isValidSession(entry)) continue;

      const date = entry.fecha;
      if (date < monday || date > today) continue;

      total += entry.minutos;
    }

    return total;
  }

  // Minutos de objetivo válidos: entero seguro entre 1 y 10080.
  function isValidGoalMinutes(value) {
    return (
      Number.isSafeInteger(value) &&
      value >= MIN_GOAL_MINUTES &&
      value <= MAX_GOAL_MINUTES
    );
  }

  // Valida lo que se escribe en el campo del objetivo (sin DOM).
  function parseGoalInput(rawValue) {
    const text = String(rawValue == null ? "" : rawValue).trim();

    if (text === "") {
      return { ok: false, reason: "empty", minutes: null };
    }

    // Solo dígitos ASCII: deja fuera "-30", "+300", "1,5", "1e3" o "300 min".
    if (!/^\d+$/.test(text)) {
      return { ok: false, reason: "invalid", minutes: null };
    }

    // "0300" se convierte en 300; las cifras enormes dejan de ser enteras seguras.
    const minutes = Number(text);
    if (!isValidGoalMinutes(minutes)) {
      return { ok: false, reason: "invalid", minutes: null };
    }

    return { ok: true, minutes };
  }

  // Interpreta el texto guardado. No lo corrige, no lo borra y no lo modifica.
  function parseStoredGoal(rawText) {
    if (rawText === null || rawText === undefined) {
      return { status: "none", minutes: null };
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      return { status: "invalid", minutes: null };
    }

    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return { status: "invalid", minutes: null };
    }

    if (!isValidGoalMinutes(data.minutos)) {
      return { status: "invalid", minutes: null };
    }

    return { status: "valid", minutes: data.minutos };
  }

  // Números listos para pintar el progreso de la semana en curso.
  function buildGoalState(sessions, today, goalMinutes) {
    const studiedMinutes = sumWeekMinutes(sessions, today);

    if (!isValidGoalMinutes(goalMinutes)) {
      return {
        hasGoal: false,
        goalMinutes: null,
        studiedMinutes,
        percent: null,
        percentValue: null,
        percentOverCap: false,
        isComplete: false,
        ratio: 0,
      };
    }

    // Porcentaje real truncado (sin redondear) y tope solo de presentación.
    const percent = Math.floor((studiedMinutes / goalMinutes) * 100);

    return {
      hasGoal: true,
      goalMinutes,
      studiedMinutes,
      percent,
      percentValue: Math.min(percent, PERCENT_CAP),
      percentOverCap: percent > PERCENT_CAP,
      isComplete: studiedMinutes >= goalMinutes,
      ratio: Math.min(studiedMinutes / goalMinutes, 1),
    };
  }

  return {
    addDays,
    startOfWeek,
    isValidSession,
    sumWeekMinutes,
    parseGoalInput,
    parseStoredGoal,
    buildGoalState,
  };
})();

// En el navegador queda disponible como global para app.js.
// En Node permite que node --test lo importe, sin build ni módulos ES.
if (typeof module !== "undefined" && module.exports) {
  module.exports = Goal;
}
