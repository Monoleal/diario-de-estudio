// ============================================================
// Mapa de calor: cálculos puros
// Sin DOM, sin localStorage y sin leer el reloj:
// la fecha de "hoy" siempre se recibe como parámetro.
// ============================================================

const Heatmap = (() => {
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

  // Indica si un texto es una fecha "AAAA-MM-DD" que existe de verdad.
  function isValidDate(text) {
    return textToDate(text) !== null;
  }

  // Una sesión cuenta solo si tiene fecha real y minutos enteros positivos.
  function isValidSession(entry) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    if (!isValidDate(entry.fecha)) return false;
    return Number.isInteger(entry.minutos) && entry.minutos >= 1;
  }

  // 12 semanas de lunes a domingo; la última es la semana de hoy.
  function buildPeriod(today) {
    const monday = startOfWeek(today);

    return {
      start: addDays(monday, -77), // 11 semanas antes
      end: addDays(monday, 6), // domingo de esta semana
      weeks: 12,
      days: 84,
    };
  }

  // Minutos por fecha: suma las sesiones válidas del periodo y descarta futuras.
  function collectDailyMinutes(sessions, start, end, today) {
    const totals = new Map();
    if (!Array.isArray(sessions)) return totals;

    for (const entry of sessions) {
      if (!isValidSession(entry)) continue;

      const date = entry.fecha;
      if (date < start || date > end || date > today) continue;

      totals.set(date, (totals.get(date) || 0) + entry.minutos);
    }

    return totals;
  }

  // 0 = sin sesiones; 1 = 1–29; 2 = 30–59; 3 = 60–119; 4 = 120+.
  function classifyMinutes(minutes) {
    if (minutes <= 0) return 0;
    if (minutes <= 29) return 1;
    if (minutes <= 59) return 2;
    if (minutes <= 119) return 3;
    return 4;
  }

  // Índice de mes (0–11) por columna, o null si esa columna no lleva etiqueta.
  function buildMonthLabels(weeks) {
    const labels = new Array(weeks.length).fill(null);

    weeks.forEach((week, index) => {
      const firstOfMonth = week.find((day) => day.date.slice(8, 10) === "01");
      if (firstOfMonth) {
        labels[index] = Number(firstOfMonth.date.slice(5, 7)) - 1;
      }
    });

    // Si la primera columna no contiene un día 1, se etiqueta con su mes.
    if (labels[0] === null && weeks.length > 0 && weeks[0].length > 0) {
      labels[0] = Number(weeks[0][0].date.slice(5, 7)) - 1;
    }

    return labels;
  }

  // Cuadrícula completa lista para pintar. No modifica las sesiones.
  function buildHeatmap(sessions, today) {
    const period = buildPeriod(today);
    const totals = collectDailyMinutes(sessions, period.start, period.end, today);

    const weeks = [];
    let daysStudied = 0;

    for (let week = 0; week < period.weeks; week++) {
      const column = [];

      for (let day = 0; day < 7; day++) {
        const date = addDays(period.start, week * 7 + day);
        const minutes = totals.get(date) || 0;
        const level = classifyMinutes(minutes);

        if (minutes > 0) daysStudied += 1;

        column.push({
          date,
          minutes,
          level,
          isFuture: date > today,
        });
      }

      weeks.push(column);
    }

    return {
      today,
      start: period.start,
      end: period.end,
      weeks,
      daysStudied,
      hasSessions: daysStudied > 0,
    };
  }

  return {
    addDays,
    startOfWeek,
    isValidDate,
    isValidSession,
    buildPeriod,
    collectDailyMinutes,
    classifyMinutes,
    buildMonthLabels,
    buildHeatmap,
  };
})();

// En el navegador queda disponible como global para app.js.
// En Node permite que node --test lo importe, sin build ni módulos ES.
if (typeof module !== "undefined" && module.exports) {
  module.exports = Heatmap;
}
