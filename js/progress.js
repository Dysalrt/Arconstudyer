// progress.js
// Хранит: общий XP, стрик по дням, список ID пройденных уроков.

const Progress = (() => {
  const KEY = "arcon_progress_v1";

  let state = {
    xp: 0,
    streak: 0,
    lastActiveDate: null, // "YYYY-MM-DD"
    completedLessons: [], // ["0-1", "1-1", ...]
  };

  async function load() {
    const saved = await Storage.get(KEY);
    if (saved) state = { ...state, ...saved };
    updateStreak();
    return state;
  }

  async function save() {
    await Storage.set(KEY, state);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateStreak() {
    const today = todayStr();
    if (state.lastActiveDate === today) return; // уже заходил сегодня
    if (!state.lastActiveDate) {
      state.streak = 0;
      return;
    }
    const last = new Date(state.lastActiveDate);
    const diffDays = Math.round((new Date(today) - last) / 86400000);
    if (diffDays > 1) state.streak = 0; // пропустил день — стрик сгорел
  }

  function isLessonDone(lessonId) {
    return state.completedLessons.includes(lessonId);
  }

  async function completeLesson(lessonId, xpEarned) {
    const today = todayStr();
    if (!isLessonDone(lessonId)) {
      state.completedLessons.push(lessonId);
    }
    state.xp += xpEarned;
    if (state.lastActiveDate !== today) {
      state.streak += 1;
      state.lastActiveDate = today;
    }
    await save();
  }

  function getState() {
    return state;
  }

  return { load, save, isLessonDone, completeLesson, getState };
})();
