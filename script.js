/* =====================================================================
   1. ДАННЫЕ РАСПИСАНИЯ
   ---------------------------------------------------------------------
   Меняй расписание только здесь. У каждого урока можно указать:
     time    — время начала, формат "ЧЧ:ММ"           (обязательно)
     subject — название предмета                       (обязательно)
     room    — номер кабинета                          (необязательно)
     teacher — фамилия учителя                          (необязательно)

   Если room или teacher не нужны — просто не пиши эту строку
   (или напиши "" — пустая строка тоже не будет показана).
   ===================================================================== */

// ===== ИЗМЕНЯЙ РАСПИСАНИЕ ЗДЕСЬ =====
const schedule = {
  monday: [
    { time: "08:00", subject: "Математика",      room: "101", teacher: "Иванов" },
    { time: "08:45", subject: "Русский язык",     room: "204", teacher: "Петрова" },
    { time: "09:40", subject: "Физика",           room: "305", teacher: "Сидоров" },
    { time: "10:35", subject: "Информатика",      room: "12",  teacher: "Кузнецова" },
    { time: "11:30", subject: "История",          room: "204", teacher: "Смирнов" }
  ],

  tuesday: [
    { time: "08:00", subject: "Английский язык",  room: "18",  teacher: "Морозова" },
    { time: "08:45", subject: "Биология",         room: "210", teacher: "Волкова" },
    { time: "09:40", subject: "Математика",       room: "101", teacher: "Иванов" },
    { time: "10:35", subject: "Литература",       room: "204", teacher: "Петрова" },
    { time: "11:30", subject: "Физкультура",      room: "Спортзал" }
  ],

  wednesday: [
    { time: "08:00", subject: "Химия",            room: "308", teacher: "Орлова" },
    { time: "08:45", subject: "Математика",       room: "101", teacher: "Иванов" },
    { time: "09:40", subject: "География",        room: "215", teacher: "Егоров" },
    { time: "10:35", subject: "Английский язык",  room: "18",  teacher: "Морозова" },
    { time: "11:30", subject: "Музыка",           room: "5" }
  ],

  thursday: [
    { time: "08:00", subject: "Физика",           room: "305", teacher: "Сидоров" },
    { time: "08:45", subject: "Информатика",      room: "12",  teacher: "Кузнецова" },
    { time: "09:40", subject: "Русский язык",     room: "204", teacher: "Петрова" },
    { time: "10:35", subject: "История",          room: "204", teacher: "Смирнов" },
    { time: "11:30", subject: "Обществознание",   room: "204", teacher: "Смирнов" }
  ],

  friday: [
    { time: "08:00", subject: "Математика",       room: "101", teacher: "Иванов" },
    { time: "08:45", subject: "Биология",         room: "210", teacher: "Волкова" },
    { time: "09:40", subject: "Литература",       room: "204", teacher: "Петрова" },
    { time: "10:35", subject: "Физкультура",      room: "Спортзал" },
    { time: "11:30", subject: "Классный час" }
  ]
};

// Если у последнего урока дня нет следующего, для определения статуса
// ("сейчас"/"завершён") считаем, что урок длится столько минут:
const DEFAULT_LESSON_LENGTH_MIN = 45;

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

  lessons.forEach((lesson, index) => {
    const card = document.createElement("div");
    card.className = "lesson-card";
    card.style.animationDelay = `${index * 40}ms`;

    let statusTag = "";
    if (viewingToday) {
      const start = timeToMinutes(lesson.time);
      const next = lessons[index + 1];
      const end = next ? timeToMinutes(next.time) : start + DEFAULT_LESSON_LENGTH_MIN;

      if (nowMin >= start && nowMin < end) {
        card.classList.add("is-current");
        statusTag = `<span class="lesson-tag tag-current">🟢 Сейчас</span>`;
      } else if (nowMin >= end) {
        card.classList.add("is-done");
        statusTag = `<span class="lesson-tag tag-done">✓ Завершён</span>`;
      } else {
        // Ближайший будущий урок помечаем как "следующий"
        const isNext = !lessons.slice(0, index).some((l2, i2) => {
          const s2 = timeToMinutes(l2.time);
          const n2 = lessons[i2 + 1];
          const e2 = n2 ? timeToMinutes(n2.time) : s2 + DEFAULT_LESSON_LENGTH_MIN;
          return nowMin < e2; // есть более ранний урок, который ещё не завершён
        });
        if (isNext) {
          card.classList.add("is-next");
          statusTag = `<span class="lesson-tag tag-next">Следующий</span>`;
        }
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
    const next = lessons[i + 1];
    const end = next ? timeToMinutes(next.time) : start + DEFAULT_LESSON_LENGTH_MIN;

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
                                    
