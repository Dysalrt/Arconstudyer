// exercises.js
// Каждый тип упражнения умеет: render(container, data) и isCorrect().
// Текущее состояние ответа хранится в замыкании модуля и сбрасывается
// перед рендером каждого нового упражнения через Exercises.reset().

const Exercises = (() => {
  let currentAnswerReady = false;
  let checkFn = () => false;

  function reset() {
    currentAnswerReady = false;
    checkFn = () => false;
  }

  function isReady() {
    return currentAnswerReady;
  }

  function check() {
    return checkFn();
  }

  // ---------- Тип: выбор одного варианта ----------
  function renderChoice(container, data, onReady) {
    container.innerHTML = `
      <div class="exercise-prompt">
        ${data.prompt}
        ${data.ipaHint ? `<span class="ipa-hint">${data.ipaHint}</span>` : ""}
      </div>
      <div class="choice-grid"></div>
    `;
    const grid = container.querySelector(".choice-grid");
    let selected = null;

    data.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-option";
      btn.dataset.value = opt;
      const speakable = TTS.isSpeakable(opt);
      btn.innerHTML = speakable
        ? `<span>${opt}</span> <button class="speak-btn" type="button" data-word="${opt}">🔊</button>`
        : opt;
      btn.onclick = (e) => {
        if (e.target.closest(".speak-btn")) return; // клик по колонке звука не выбирает вариант
        grid.querySelectorAll(".choice-option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selected = opt;
        currentAnswerReady = true;
        onReady();
      };
      grid.appendChild(btn);
    });

    grid.addEventListener("click", (e) => {
      const speakBtn = e.target.closest(".speak-btn");
      if (speakBtn) TTS.speak(speakBtn.dataset.word);
    });

    checkFn = () => {
      const isCorrect = selected === data.answer;
      grid.querySelectorAll(".choice-option").forEach((b) => {
        if (b.dataset.value === data.answer) b.classList.add("correct");
        else if (b.dataset.value === selected) b.classList.add("incorrect");
      });
      return isCorrect;
    };
  }

  // ---------- Тип: сопоставление пар ----------
  function renderMatch(container, data, onReady) {
    container.innerHTML = `
      <div class="exercise-prompt">Найди пары</div>
      <div class="match-grid"></div>
    `;
    const grid = container.querySelector(".match-grid");

    const left = data.pairs.map((p) => p[0]);
    const right = shuffle(data.pairs.map((p) => p[1]));
    const matched = new Set();
    let selectedLeft = null;
    let selectedRight = null;
    let mistakesFree = true;

    function render() {
      grid.innerHTML = "";
      left.forEach((word) => {
        const el = document.createElement("div");
        el.className = "match-item" + (matched.has(word) ? " matched" : "");
        el.innerHTML = TTS.isSpeakable(word)
          ? `<span>${word}</span> <button class="speak-btn" type="button" data-word="${word}">🔊</button>`
          : word;
        el.onclick = (e) => {
          if (e.target.closest(".speak-btn")) return;
          if (!matched.has(word)) { selectedLeft = word; tryMatch(); render(); }
        };
        if (selectedLeft === word) el.classList.add("selected");
        grid.appendChild(el);
      });
      right.forEach((word) => {
        const pair = data.pairs.find((p) => p[1] === word);
        const el = document.createElement("div");
        el.className = "match-item" + (matched.has(pair[0]) ? " matched" : "");
        el.textContent = word;
        el.onclick = () => { if (!matched.has(pair[0])) { selectedRight = word; tryMatch(); render(); } };
        if (selectedRight === word) el.classList.add("selected");
        grid.appendChild(el);
      });
      grid.querySelectorAll(".speak-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          TTS.speak(btn.dataset.word);
        });
      });
    }

    function tryMatch() {
      if (selectedLeft && selectedRight) {
        const correctPair = data.pairs.find((p) => p[0] === selectedLeft);
        if (correctPair && correctPair[1] === selectedRight) {
          matched.add(selectedLeft);
        } else {
          mistakesFree = false;
        }
        selectedLeft = null;
        selectedRight = null;
        if (matched.size === data.pairs.length) {
          currentAnswerReady = true;
          onReady();
        }
      }
    }

    render();
    checkFn = () => mistakesFree;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Тип: свободный ввод (перевод / вставить форму слова) ----------
  function normalize(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:"'«»ё]/g, (m) => (m === "ё" ? "е" : ""))
      .replace(/\s+/g, " ");
  }

  function renderWrite(container, data, onReady) {
    container.innerHTML = `
      <div class="exercise-prompt">
        ${data.prompt.replace(/\n/g, "<br>")}
        ${data.ipaHint ? `<span class="ipa-hint">${data.ipaHint}</span>` : ""}
      </div>
      <input type="text" class="write-input" placeholder="Напиши ответ..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
    `;
    const input = container.querySelector(".write-input");
    input.addEventListener("input", () => {
      currentAnswerReady = input.value.trim().length > 0;
      onReady();
    });
    input.focus();

    checkFn = () => {
      const norm = normalize(input.value);
      const acceptedNorm = data.answers.map(normalize);
      const isCorrect = acceptedNorm.includes(norm);
      input.disabled = true;
      input.classList.add(isCorrect ? "correct" : "incorrect");
      return isCorrect;
    };
  }

  function render(container, data, onReady) {
    reset();
    if (data.type === "choice") renderChoice(container, data, onReady);
    else if (data.type === "match") renderMatch(container, data, onReady);
    else if (data.type === "write") renderWrite(container, data, onReady);
  }

  return { render, isReady, check, reset };
})();
