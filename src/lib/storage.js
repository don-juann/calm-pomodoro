const HISTORY_KEY = 'pomodoro.history.v1'
const SETTINGS_KEY = 'pomodoro.settings.v1'
const THEME_KEY = 'pomodoro.theme.v1'
const SOUND_KEY = 'pomodoro.sound.v1'

export function loadSound() {
  try {
    const s = JSON.parse(localStorage.getItem(SOUND_KEY))
    if (s && typeof s.volume === 'number') {
      return { volume: s.volume, muted: !!s.muted }
    }
  } catch {
    /* ignore */
  }
  return { volume: 0.8, muted: false }
}

export function saveSound(sound) {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(sound))
  } catch {
    /* ignore */
  }
}

export function loadTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export const DEFAULT_SETTINGS = { workMin: 25, breakMin: 5, cycles: 4 }

export function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* storage unavailable — history is best-effort */
  }
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return raw ? { ...DEFAULT_SETTINGS, ...raw } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}
