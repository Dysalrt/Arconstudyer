// storage.js
// Единая точка сохранения прогресса.
// Приоритет: Telegram CloudStorage (синхронизируется между устройствами пользователя).
// Фолбэк: localStorage (работает и вне Telegram — удобно тестировать в обычном браузере).

const Storage = (() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  const hasCloud = !!(tg && tg.CloudStorage);

  function get(key) {
    return new Promise((resolve) => {
      if (hasCloud) {
        tg.CloudStorage.getItem(key, (err, value) => {
          if (err || !value) return resolve(null);
          try { resolve(JSON.parse(value)); } catch { resolve(null); }
        });
      } else {
        const raw = localStorage.getItem(key);
        resolve(raw ? JSON.parse(raw) : null);
      }
    });
  }

  function set(key, value) {
    const raw = JSON.stringify(value);
    return new Promise((resolve) => {
      if (hasCloud) {
        tg.CloudStorage.setItem(key, raw, () => resolve(true));
      } else {
        localStorage.setItem(key, raw);
        resolve(true);
      }
    });
  }

  return { get, set };
})();
