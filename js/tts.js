// tts.js
// Используем бесплатный движок Google Translate TTS для качественного звучания.

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

  /**
   * Воспроизводит текст.
   * @param {string} text - Текст для озвучки.
   * @param {boolean} isArconWord - Если true, транслитерирует Arcon в кириллицу.
   */
  function speak(text, isArconWord = true) {
    const toSay = isArconWord ? transliterate(text) : text;
    
    // Формируем URL для озвучки от Google
    // tl=ru — целевой язык русский
    // client=tw-ob — клиент, который позволяет получать звук без API-ключа
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ru&client=tw-ob&q=${encodeURIComponent(toSay)}`;
    
    const audio = new Audio(url);
    
    // Если уже играет другой звук, можно остановить текущий (опционально)
    audio.play().catch(e => console.error("Ошибка воспроизведения:", e));
  }

  function isSpeakable(text) {
    // Проверка, что это буквы латиницы (для Arcon слов)
    return /^[A-Za-zŪū]+$/.test(text.trim());
  }

  return { speak, isSpeakable, supported: true };
})();
