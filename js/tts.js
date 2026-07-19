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

  const VOWELS = new Set(["a", "e", "i", "o", "u", "ū"]);

  function transliterate(word) {
    const chars = word.toLowerCase().split("");
    let result = "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === "ū") {
        // "ю" после согласной в русском — это просто мягкая согласная + "у",
        // без отдельного звука [j]. Чтобы получить настоящий глайд (как в "вью"),
        // нужен мягкий знак перед "ю" — но только если до этого стояла согласная.
        const prev = chars[i - 1];
        const prevIsConsonant = prev && !VOWELS.has(prev);
        result += (prevIsConsonant ? "ь" : "") + "ю";
      } else {
        result += ch in LETTER_MAP ? LETTER_MAP[ch] : ch;
      }
    }
    return result;
  }

  const supported = "speechSynthesis" in window;
  let ruVoice = null;

  function pickVoice() {
    if (!supported) return;
    const voices = speechSynthesis.getVoices();
    ruVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ru")) || null;
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

  return { speak, isSpeakable, supported };
})();
