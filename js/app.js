// app.js
// Инициализация Telegram WebApp + переключение экранов + флоу прохождения урока.

(async function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const screens = {
    home: document.getElementById("screen-home"),
    theory: document.getElementById("screen-theory"),
    exercise: document.getElementById("screen-exercise"),
    complete: document.getElementById("screen-complete"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.add("hidden"));
    screens[name].classList.remove("hidden");
  }

  // ---------- Состояние текущего прохождения урока ----------
  let activeLesson = null;
  let theoryIndex = 0;
  let exerciseIndex = 0;
  let hearts = 3;
  let correctCount = 0;

  // ---------- Главный экран ----------
  async function renderHome() {
    const state = Progress.getState();
    document.getElementById("streak-line").textContent =
      `🔥 ${state.streak} дней подряд · ⭐ ${state.xp} XP`;
    Lessons.renderModuleList(document.getElementById("module-list"), openLesson);
    showScreen("home");
  }

  // ---------- Теория ----------
  // Рендерит слово Arcon с кнопкой 🔊, если это озвучиваемое слово.
  // Поддерживает формы вида "ane → anede" — озвучивает обе части отдельно.
  function renderWord(wordStr) {
    if (wordStr.includes("→")) {
      const [left, right] = wordStr.split("→").map((s) => s.trim());
      return `${speakSpan(left)} → ${speakSpan(right)}`;
    }
    return speakSpan(wordStr);
  }

  function speakSpan(word) {
    if (!TTS.isSpeakable(word)) return word;
    return `<span>${word}</span> <button class="speak-btn" data-word="${word}" type="button">🔊</button>`;
  }

  // Делегирование клика по кнопкам озвучки — работает для любых будущих карточек
  document.getElementById("theory-content").addEventListener("click", (e) => {
    const btn = e.target.closest(".speak-btn");
    if (btn) TTS.speak(btn.dataset.word);
  });

  function renderTheoryCard() {
    const card = activeLesson.theory[theoryIndex];
    const pct = Math.round(((theoryIndex + 1) / activeLesson.theory.length) * 40); // теория = первые 40% полосы
    document.getElementById("theory-progress-fill").style.width = pct + "%";

    const examplesHtml = card.examples.map((ex) => `
      <div class="example-card">
        <div>
          <div class="word">${renderWord(ex.word)}</div>
          ${ex.translation ? `<div class="translation">${ex.translation}</div>` : ""}
        </div>
        <div class="ipa">${ex.ipa}</div>
      </div>
    `).join("");

    document.getElementById("theory-content").innerHTML = `
      <h2>${card.title}</h2>
      <p>${card.body}</p>
      ${examplesHtml}
    `;
  }

  document.getElementById("theory-back").onclick = renderHome;

  document.getElementById("theory-continue").onclick = () => {
    theoryIndex++;
    if (theoryIndex >= activeLesson.theory.length) {
      startExercises();
    } else {
      renderTheoryCard();
    }
  };

  // ---------- Упражнения ----------
  function startExercises() {
    exerciseIndex = 0;
    hearts = 3;
    correctCount = 0;
    showScreen("exercise");
    renderExercise();
  }

  function updateHeartsDisplay() {
    document.getElementById("exercise-hearts").textContent = "❤️".repeat(hearts) + "🖤".repeat(3 - hearts);
  }

  function renderExercise() {
    const data = activeLesson.exercises[exerciseIndex];
    const totalPct = 40 + Math.round((exerciseIndex / activeLesson.exercises.length) * 60);
    document.getElementById("exercise-progress-fill").style.width = totalPct + "%";
    updateHeartsDisplay();

    const checkBtn = document.getElementById("exercise-check");
    checkBtn.disabled = true;
    checkBtn.textContent = "Проверить";
    document.getElementById("exercise-feedback").classList.add("hidden");

    Exercises.render(document.getElementById("exercise-content"), data, () => {
      checkBtn.disabled = !Exercises.isReady();
    });
  }

  document.getElementById("exercise-check").onclick = () => {
    const checkBtn = document.getElementById("exercise-check");
    const feedback = document.getElementById("exercise-feedback");

    // Если уже показали результат — эта кнопка ведёт "Дальше"
    if (checkBtn.dataset.mode === "next") {
      exerciseIndex++;
      if (exerciseIndex >= activeLesson.exercises.length) {
        finishLesson();
      } else {
        checkBtn.dataset.mode = "";
        renderExercise();
      }
      return;
    }

    const correct = Exercises.check();
    feedback.classList.remove("hidden", "ok", "fail");
    if (correct) {
      correctCount++;
      feedback.classList.add("ok");
      feedback.textContent = "Верно! 🎉";
    } else {
      hearts = Math.max(0, hearts - 1);
      updateHeartsDisplay();
      feedback.classList.add("fail");
      feedback.textContent = "Не совсем — посмотри на подсветку правильного варианта.";
    }
    checkBtn.textContent = "Дальше";
    checkBtn.dataset.mode = "next";
  };

  document.getElementById("exercise-close").onclick = renderHome;

  // ---------- Завершение урока ----------
  async function finishLesson() {
    const earnedXp = activeLesson.xp || 10;
    await Progress.completeLesson(activeLesson.id, earnedXp);
    document.getElementById("complete-stats").textContent =
      `Правильно: ${correctCount} из ${activeLesson.exercises.length} · +${earnedXp} XP`;
    showScreen("complete");
  }

  document.getElementById("complete-continue").onclick = renderHome;

  // ---------- Открытие урока ----------
  async function openLesson(moduleId, lessonMeta) {
    activeLesson = await Lessons.loadLesson(moduleId, lessonMeta);
    theoryIndex = 0;
    showScreen("theory");
    renderTheoryCard();
  }

  // ---------- Старт приложения ----------
  await Progress.load();
  await Lessons.loadCourse();
  await renderHome();
})();
