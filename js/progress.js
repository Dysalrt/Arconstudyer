// progress.js
// Хранит только список пройденных уроков. Никаких XP и стриков —
// прогресс показывается как % от общего числа уроков курса.

const Progress = (() => {
  const KEY = "arcon_progress_v1";

  let state = {
    completedLessons: [], // ["0-1", "1-1", ...]
  };

  async function load() {
    const saved = await Storage.get(KEY);
    if (saved) state = { ...state, ...saved };
    return state;
  }

  async function save() {
    await Storage.set(KEY, state);
  }

  function isLessonDone(lessonId) {
    return state.completedLessons.includes(lessonId);
  }

  async function completeLesson(lessonId) {
    if (!isLessonDone(lessonId)) {
      state.completedLessons.push(lessonId);
    }
    await save();
  }

  function getState() {
    return state;
  }

  // totalLessons передаётся снаружи (Lessons знает полный список уроков курса)
  function getPercent(totalLessons) {
    if (!totalLessons) return 0;
    return Math.round((state.completedLessons.length / totalLessons) * 100);
  }

  return { load, save, isLessonDone, completeLesson, getState, getPercent };
})();
