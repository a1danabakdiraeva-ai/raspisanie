/* =====================================================================
   1. ДАННЫЕ РАСПИСАНИЯ — 9-В класс
   ---------------------------------------------------------------------
   Меняй расписание только здесь. У каждого урока указывается:
     time    — время начала, формат "ЧЧ:ММ"           (обязательно)
     subject — название предмета                       (обязательно)

   Кабинет и учитель не используются (по договорённости показываем
   только предмет). Если захочешь вернуть их позже, можно добавить
   в любой урок room: "..." и/или teacher: "..." — сайт умеет их
   показывать, просто сейчас они нигде не указаны.

   Названия предметов оставлены как в исходном расписании школы
   (К-тил, Д-тарбия, О-адаб и т.д.) — при необходимости замени их
   на полные названия, сайт от этого никак не изменится.
   ===================================================================== */

// ===== ИЗМЕНЯЙ РАСПИСАНИЕ ЗДЕСЬ =====
const schedule = {
  monday: [
    { time: "07:30", subject: "Физика" },
    { time: "08:20", subject: "Биология" },
    { time: "09:10", subject: "география" },
    { time: "10:05", subject: "к-адабият" },
    { time: "10:55", subject: "о-адабият" }
  ],

  tuesday: [
    { time: "07:30", subject: "Ч-тил" },
    { time: "08:20", subject: "Д-тарбия" },
    { time: "09:10", subject: "Биолог" },
    { time: "10:05", subject: "К-адаб" },
    { time: "10:55", subject: "О тил" },
    { time: "11:45", subject: "Тарых" }
  ],

  wednesday: [
    { time: "07:30", subject: "Георг" },
    { time: "08:20", subject: "Хим" },
    { time: "09:10", subject: "К-адаб" },
    { time: "10:05", subject: "Инф-ка" },
    { time: "10:55", subject: "А ж коом" },
    { time: "11:45", subject: "О-адаб" }
  ],

  thursday: [
    { time: "07:30", subject: "Физика" },
    { time: "08:20", subject: "Биолог" },
    { time: "09:10", subject: "Георг" },
    { time: "10:05", subject: "К-адаб" },
    { time: "10:55", subject: "О-адаб" }
  ],

  friday: [
    { time: "07:30", subject: "Физика" },
    { time: "08:20", subject: "Д-тарбия" },
    { time: "09:10", subject: "К-тил" },
    { time: "10:05", subject: "Ч-тил" }
  ]
};

/* Звонки: уроки по 45 минут, перемены по 5 минут, большая перемена —
   10 минут, после 3-го урока. Отсюда и получаются времена начала выше:
   07:30, 08:20, 09:10, 10:05 (после большой перемены), 10:55, 11:45. */

// Длительность одного урока в минутах — используется, чтобы определить,
// идёт ли урок сейчас, или он уже завершён.
const LESSON_LENGTH_MIN = 45;

// Подписи дней и порядок кнопок
const DAY_LABELS = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница"
};
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const STORAGE_KEY_THEME = "schedule-theme";
const STORAGE_KEY_DAY = "schedule-selectedDay";


/* =====================================================================
   2. ПОЛУЧЕНИЕ ТЕКУЩЕГО ДНЯ
   ===================================================================== */

// JS: 0 = воскресенье, 1 = понедельник, ... 6 = суббота
function getTodayKey() {
  const jsDay = new Date().getDay();
  const map = { 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday" };
  return map[jsDay] || null; // null означает выходной
}

function isWeekend() {
  const jsDay = new Date().getDay();
  return jsDay === 0 || jsDay === 6;
}


/* =====================================================================
   3. ОТОБРАЖЕНИЕ ДНЕЙ (переключатель)
   ===================================================================== */

let currentDay = null; // текущий выбранный (просматриваемый) день

const daySwitcher = document.getElementById("daySwitcher");
const dayButtons = Array.from(daySwitcher.querySelectorAll(".day-btn"));
const dayTitleEl = document.getElementById("dayTitle");
const weekendMessageEl = document.getElementById("weekendMessage");

function setActiveDayButton(dayKey) {
  dayButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.day === dayKey);
  });
}

function selectDay(dayKey, { remember = false } = {}) {
  currentDay = dayKey;
  setActiveDayButton(dayKey);
  dayTitleEl.hidden = false;
  dayTitleEl.textContent = DAY_LABELS[dayKey];
  weekendMessageEl.hidden = true;

  renderLessons(dayKey);
  updateStatusCard(dayKey);

  if (remember) {
    localStorage.setItem(STORAGE_KEY_DAY, dayKey);
  }
}

function showWeekendState() {
  currentDay = null;
  setActiveDayButton(null);
  dayTitleEl.hidden = true;
  weekendMessageEl.hidden = false;
  document.getElementById("lessonsList").innerHTML = "";
  document.getElementById("emptyMessage").hidden = true;
  document.getElementById("statusCard").hidden = true;
}

dayButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectDay(btn.dataset.day, { remember: true });
  });
});


/* =====================================================================
   4. ОТОБРАЖЕНИЕ УРОКОВ
   ===================================================================== */

const lessonsListEl = document.getElementById("lessonsList");
const emptyMessageEl = document.getElementById("emptyMessage");

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function renderLessons(dayKey) {
  const lessons = schedule[dayKey] || [];
  lessonsListEl.innerHTML = "";
  emptyMessageEl.hidden = lessons.length > 0;

  const viewingToday = dayKey === getTodayKey();
  const nowMin = viewingToday ? new Date().getHours() * 60 + new Date().getMinutes() : null;
  let nextAlreadyMarked = false; // помечаем "Следующий" только у первого будущего урока

  lessons.forEach((lesson, index) => {
    const card = document.createElement("div");
    card.className = "lesson-card";
    card.style.animationDelay = `${index * 40}ms`;

    let statusTag = "";
    if (viewingToday) {
      const start = timeToMinutes(lesson.time);
      const end = start + LESSON_LENGTH_MIN;

      if (nowMin >= start && nowMin < end) {
        card.classList.add("is-current");
        statusTag = `<span class="lesson-tag tag-current">🟢 Сейчас</span>`;
      } else if (nowMin >= end) {
        card.classList.add("is-done");
        statusTag = `<span class="lesson-tag tag-done">✓ Завершён</span>`;
      } else if (!nextAlreadyMarked) {
        // Первый урок, который ещё не начался (в том числе во время перемены)
        card.classList.add("is-next");
        statusTag = `<span class="lesson-tag tag-next">Следующий</span>`;
        nextAlreadyMarked = true;
      }
    }

    const metaParts = [];
    if (lesson.room) metaParts.push(`Кабинет ${escapeHtml(lesson.room)}`);
    if (lesson.teacher) metaParts.push(escapeHtml(lesson.teacher));
    const metaHtml = metaParts.length
      ? `<p class="lesson-meta">${metaParts.join(" · ")}</p>`
      : "";

    card.innerHTML = `
      <div class="lesson-number">${String(index + 1).padStart(2, "0")}</div>
      <div class="lesson-body">
        <div class="lesson-time-row">
          <span class="lesson-time">${escapeHtml(lesson.time)}</span>
          ${statusTag}
        </div>
        <p class="lesson-subject">${escapeHtml(lesson.subject)}</p>
        ${metaHtml}
      </div>
    `;

    lessonsListEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}


/* =====================================================================
   5. ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (светлая / тёмная)
   ===================================================================== */

const themeToggleBtn = document.getElementById("themeToggle");
const themeIconEl = document.getElementById("themeIcon");

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  themeIconEl.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  if (saved) {
    applyTheme(saved);
  } else {
    // Если тема не выбрана — ориентируемся на системные настройки
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.contains("theme-dark");
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY_THEME, next);
});


/* =====================================================================
   6. ТЕКУЩЕЕ ВРЕМЯ
   ===================================================================== */

const clockTimeEl = document.getElementById("clockTime");

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clockTimeEl.textContent = `${hh}:${mm}`;
}


/* =====================================================================
   7. ОПРЕДЕЛЕНИЕ ТЕКУЩЕГО / СЛЕДУЮЩЕГО УРОКА (карточка статуса)
   ===================================================================== */

const statusCardEl = document.getElementById("statusCard");
const statusLabelEl = document.getElementById("statusLabel");
const statusTimeEl = document.getElementById("statusTime");
const statusSubjectEl = document.getElementById("statusSubject");

function updateStatusCard(dayKey) {
  const todayKey = getTodayKey();

  if (dayKey !== todayKey || !todayKey) {
    statusCardEl.hidden = true;
    return;
  }

  const lessons = schedule[dayKey] || [];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  let current = null;
  let upcoming = null;

  for (let i = 0; i < lessons.length; i++) {
    const start = timeToMinutes(lessons[i].time);
    const end = start + LESSON_LENGTH_MIN;

    if (nowMin >= start && nowMin < end) {
      current = lessons[i];
      break;
    }
    if (nowMin < start && !upcoming) {
      upcoming = lessons[i];
    }
  }

  if (current) {
    statusCardEl.hidden = false;
    statusLabelEl.textContent = "🟢 Сейчас идёт урок";
    statusTimeEl.textContent = current.time;
    statusSubjectEl.textContent = current.subject;
  } else if (upcoming) {
    statusCardEl.hidden = false;
    statusLabelEl.textContent = "Следующий урок";
    statusTimeEl.textContent = upcoming.time;
    statusSubjectEl.textContent = upcoming.subject;
  } else if (lessons.length > 0) {
    statusCardEl.hidden = false;
    statusLabelEl.textContent = "На сегодня уроки закончились";
    statusTimeEl.textContent = "✓";
    statusSubjectEl.textContent = "Хорошего отдыха!";
  } else {
    statusCardEl.hidden = true;
  }
}


/* =====================================================================
   8. ЛОКАЛЬНОЕ ХРАНЕНИЕ (localStorage) И ЗАПУСК ПРИЛОЖЕНИЯ
   ===================================================================== */

function init() {
  initTheme();
  updateClock();
  setInterval(() => {
    updateClock();
    // Обновляем статус и подсветку урока каждую минуту, без перезагрузки
    if (currentDay) {
      renderLessons(currentDay);
      updateStatusCard(currentDay);
    }
  }, 30000);

  const savedDay = localStorage.getItem(STORAGE_KEY_DAY);

  if (savedDay && DAY_ORDER.includes(savedDay)) {
    // Пользователь уже когда-то выбирал день вручную — уважаем его выбор
    selectDay(savedDay);
    return;
  }

  const todayKey = getTodayKey();
  if (todayKey) {
    selectDay(todayKey);
  } else {
    showWeekendState();
  }
}

document.addEventListener("DOMContentLoaded", init);
