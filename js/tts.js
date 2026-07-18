// tts.js
const TTS = (() => {
  const LETTER_MAP = {
    a: "а", b: "б", c: "к", d: "д", e: "э", f: "ф", g: "г",
    h: "х", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н",
    o: "о", p: "п", q: "к", r: "р", s: "с", t: "т", u: "у",
    "ū": "ю", v: "в", w: "в", x: "кс", y: "и", z: "з",
  };

  function transliterate(word) {
    return word
      .toLowerCase()
      .split("")
      .map((ch) => (ch in LETTER_MAP ? LETTER_MAP[ch] : ch))
      .join("");
  }

  let voices = [];
  // Загружаем голоса при инициализации
  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
  }
  
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, isArconWord = true) {
    const toSay = isArconWord ? transliterate(text) : text;
    const utterance = new SpeechSynthesisUtterance(toSay);
    
    // Пытаемся найти качественный голос (Google или системный русский)
    const preferredVoice = voices.find(v => 
      v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Russian'))
    ) || voices.find(v => v.lang.includes('ru'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.lang = "ru-RU";
    utterance.rate = 0.85; // Чуть медленнее — звучит естественнее
    utterance.pitch = 1.0; // Стандартный тон
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return { speak, isSpeakable: (t) => /^[A-Za-zŪū]+$/.test(t.trim()) };
})();
