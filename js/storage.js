// storage.js
// Единая точка сохранения прогресса.
// Приоритет: Telegram CloudStorage (синхронизируется между устройствами пользователя).
// Фолбэк: localStorage (работает и вне Telegram — удобно тестировать в обычном браузере).

const Storage = (() => {
  const tg = window.Telegram && window.Telegram.WebApp;

  // CloudStorage появился в Bot API 6.9 — на более старых версиях Telegram-клиента
  // объект tg.CloudStorage может существовать, но вызов его методов кинет
  // WebAppMethodUnsupported и зависнет без try/catch. Поэтому проверяем версию
  // явно и дополнительно страхуемся try/catch на каждый вызов.
  const hasCloud = !!(
    tg &&
    tg.CloudStorage &&
    typeof tg.isVersionAtLeast === "function" &&
    tg.isVersionAtLeast("6.9")
  );

  function get(key) {
    return new Promise((resolve) => {
      if (hasCloud) {
        try {
          tg.CloudStorage.getItem(key, (err, value) => {
            if (err || !value) return resolve(null);
            try { resolve(JSON.parse(value)); } catch { resolve(null); }
          });
        } catch (e) {
          console.warn("CloudStorage.getItem failed, falling back to localStorage", e);
          fallbackGet(key, resolve);
        }
      } else {
        fallbackGet(key, resolve);
      }
    });
  }

  function fallbackGet(key, resolve) {
    const raw = localStorage.getItem(key);
    resolve(raw ? JSON.parse(raw) : null);
  }

  function set(key, value) {
    const raw = JSON.stringify(value);
    return new Promise((resolve) => {
      if (hasCloud) {
        try {
          tg.CloudStorage.setItem(key, raw, () => resolve(true));
        } catch (e) {
          console.warn("CloudStorage.setItem failed, falling back to localStorage", e);
          localStorage.setItem(key, raw);
          resolve(true);
        }
      } else {
        localStorage.setItem(key, raw);
        resolve(true);
      }
    });
  }

  return { get, set };
})();
