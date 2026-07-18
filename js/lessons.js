// lessons.js
// Загружает data/course.json + отдельные файлы уроков,
// рендерит список модулей на главном экране.

const Lessons = (() => {
  let course = null;
  const lessonCache = {};

  async function loadCourse() {
    const res = await fetch("data/course.json");
    course = await res.json();
    return course;
  }

  async function loadLesson(moduleId, lessonMeta) {
    if (lessonCache[lessonMeta.id]) return lessonCache[lessonMeta.id];
    const res = await fetch(`data/lessons/${lessonMeta.file}`);
    const data = await res.json();
    lessonCache[lessonMeta.id] = data;
    return data;
  }

  // Урок доступен, если это первый урок курса, либо предыдущий урок пройден.
  function isUnlocked(flatLessons, index) {
    if (index === 0) return true;
    const prev = flatLessons[index - 1];
    return Progress.isLessonDone(prev.id);
  }

  function flattenLessons() {
    const flat = [];
    course.modules.forEach((m) => m.lessons.forEach((l) => flat.push(l)));
    return flat;
  }

  function renderModuleList(container, onOpenLesson) {
    const flat = flattenLessons();
    container.innerHTML = "";

    course.modules.forEach((mod) => {
      const block = document.createElement("div");
      block.className = "module-block";
      block.innerHTML = `<p class="module-title">Модуль ${mod.id} · ${mod.title}</p>`;

      mod.lessons.forEach((lesson) => {
        const index = flat.findIndex((l) => l.id === lesson.id);
        const unlocked = isUnlocked(flat, index);
        const done = Progress.isLessonDone(lesson.id);

        const row = document.createElement("div");
        row.className = "lesson-row" + (unlocked ? "" : " locked") + (done ? " done" : "");
        row.innerHTML = `
          <div class="lesson-dot">${done ? "✓" : index + 1}</div>
          <div class="lesson-info">
            <div class="t">${lesson.title}</div>
            <div class="s">${lesson.subtitle}</div>
          </div>
        `;
        if (unlocked) row.onclick = () => onOpenLesson(mod.id, lesson);
        block.appendChild(row);
      });

      container.appendChild(block);
    });
  }

  return { loadCourse, loadLesson, renderModuleList };
})();
