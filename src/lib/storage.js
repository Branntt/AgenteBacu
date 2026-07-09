export function load(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    /* ignore corrupt storage, fall back to seed */
  }
  try { localStorage.setItem(key, JSON.stringify(seed)); } catch (e) {}
  return seed;
}

export function persist(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

export function loadValue(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

export function persistValue(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
