// tts.js
// Автоматическая озвучка без записанного голоса.
// Идея: правила чтения Arcon почти 1-в-1 совпадают со звуками русских букв,
// поэтому переводим спеллинг Arcon в кириллическую транслитерацию
// и проигрываем через системный русский голос (Web Speech API).
// Это приближение, а не настоящее произношение носителя — известный компромисс.

const TTS = (() => {
  const LETTER_MAP = {
    a: "а", b: "б", c: "к", d: "д", e: "э", f: "ф", g: "г",
    h: "х", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н",
    o: "о", p: "п", q: "к", r: "р", s: "с", t: "т", u: "у",
    "ū": "ю", v: "в", w: "в", x: "кс", y: "и", z: "з",
  };

  // Точечные исключения: если какое-то слово (в оригинальном написании Arcon,
  // с маленькой буквы) звучит криво по общим правилам транслитерации —
  // впиши сюда его "на слух" подобранное кириллическое написание.
  // Ключ — слово Arcon в нижнем регистре, значение — как это должно звучать.
  const OVERRIDES = {
    "nev": "нев"
  };

  function transliterate(word) {
    const lower = word.toLowerCase();
    if (lower in OVERRIDES) return OVERRIDES[lower];
    return lower
      .split("")
      .map((ch) => (ch in LETTER_MAP ? LETTER_MAP[ch] : ch))
      .join("");
  }

  const supported = "speechSynthesis" in window;
  let ruVoice = null;

  function pickVoice() {
    if (!supported) return;
    const voices = speechSynthesis.getVoices();
    const ruVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("ru"));
    // Голоса Google звучат заметно естественнее на непривычных/несловарных
    // сочетаниях букв, чем офлайн-голоса Windows (SAPI) — предпочитаем его,
    // но если его нет на устройстве, берём любой другой русский голос.
    ruVoice = ruVoices.find((v) => v.name.toLowerCase().includes("google")) || ruVoices[0] || null;
  }

  if (supported) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // isArconWord=true (по умолчанию) — транслитерируем перед озвучкой.
  // isArconWord=false — текст уже на русском, просто произносим как есть.
  function speak(text, isArconWord = true) {
    if (!supported) return;
    const toSay = isArconWord ? transliterate(text) : text;
    const utter = new SpeechSynthesisUtterance(toSay);
    utter.lang = "ru-RU";
    if (ruVoice) utter.voice = ruVoice;
    utter.rate = 0.85;
    speechSynthesis.cancel(); // прервать предыдущую фразу, если ещё играет
    speechSynthesis.speak(utter);
  }

  // Проверяем, что строка — это "чистое" слово Arcon (буквы латиницы + ū),
  // а не IPA-нотация вроде "[x]" или составная форма вроде "ane → anede".
  function isSpeakable(text) {
    return /^[A-Za-zŪū]+$/.test(text.trim());
  }

  return { speak, isSpeakable, supported, transliterate };
})();
