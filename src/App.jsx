import { useEffect, useRef, useState } from 'react'
import BackgroundName from './components/BackgroundName.jsx'
import Timer from './components/Timer.jsx'
import Settings from './components/Settings.jsx'
import History from './components/History.jsx'
import { usePomodoro } from './hooks/usePomodoro.js'
import {
  loadSettings,
  saveSettings,
  loadTheme,
  saveTheme,
  loadSound,
  saveSound,
} from './lib/storage.js'
import { setVolume, setMuted, playBlip } from './lib/sound.js'

/* ---- dynamic favicon: a tiny progress ring drawn on a canvas ---- */
let faviconEl = null
let originalFavicon = null
function getFavicon() {
  if (!faviconEl) {
    faviconEl = document.querySelector("link[rel~='icon']")
    if (faviconEl) originalFavicon = faviconEl.getAttribute('href')
  }
  return faviconEl
}
function setFaviconProgress(progress, color) {
  const link = getFavicon()
  if (!link) return
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const cx = size / 2
  const cy = size / 2
  const r = 24
  ctx.clearRect(0, 0, size, size)
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(130,130,130,0.28)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0.02, progress) * 2 * Math.PI)
  ctx.stroke()
  link.href = canvas.toDataURL('image/png')
}
function resetFavicon() {
  const link = getFavicon()
  if (link && originalFavicon) link.href = originalFavicon
}

export default function App() {
  const [settings, setSettings] = useState(() => loadSettings())
  const [theme, setTheme] = useState(() => loadTheme())
  const [sound, setSound] = useState(() => loadSound())
  const [intention, setIntention] = useState('')
  const [view, setView] = useState('timer')
  const pomodoro = usePomodoro(settings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  // Apply + persist sound settings.
  useEffect(() => {
    setVolume(sound.volume)
    setMuted(sound.muted)
    saveSound(sound)
  }, [sound])

  // Reflect the current phase on <body> so the background can shift calmly.
  useEffect(() => {
    document.body.dataset.phase = pomodoro.active ? pomodoro.phaseType : 'idle'
  }, [pomodoro.active, pomodoro.phaseType])

  // Tab title + favicon countdown.
  const displaySec = Math.ceil(pomodoro.remaining)
  useEffect(() => {
    if (pomodoro.active) {
      const mm = String(Math.floor(displaySec / 60)).padStart(2, '0')
      const ss = String(displaySec % 60).padStart(2, '0')
      const label = pomodoro.phaseType === 'break' ? 'Break' : 'Focus'
      document.title = `${mm}:${ss} · ${label}`
      const progress =
        pomodoro.phaseDuration > 0
          ? (pomodoro.phaseDuration - pomodoro.remaining) / pomodoro.phaseDuration
          : 0
      const color = pomodoro.phaseType === 'break' ? '#c0876b' : '#7c8b6f'
      setFaviconProgress(Math.min(1, Math.max(0, progress)), color)
    } else {
      document.title = 'Pomodoro — focused work'
      resetFavicon()
    }
  }, [pomodoro.active, pomodoro.phaseType, pomodoro.phaseDuration, displaySec])

  // Screen Wake Lock — keep the display awake during an active, running session.
  useEffect(() => {
    if (!(pomodoro.active && pomodoro.running)) return
    if (!('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        /* denied or unsupported — silently ignore */
      }
    }
    acquire()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      if (lock) lock.release().catch(() => {})
    }
  }, [pomodoro.active, pomodoro.running])

  // Keyboard shortcuts. Refs keep the handler stable while reading latest state.
  const pomodoroRef = useRef(pomodoro)
  pomodoroRef.current = pomodoro
  const intentionRef = useRef(intention)
  intentionRef.current = intention
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return
      }
      const p = pomodoroRef.current
      if (e.code === 'Space') {
        e.preventDefault()
        if (!p.active) p.start(intentionRef.current)
        else if (p.running) p.pause()
        else p.resume()
      } else if (e.key === 'f' || e.key === 'F') {
        if (p.active) {
          e.preventDefault()
          p.finishEarly()
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setSound((s) => ({ ...s, muted: !s.muted }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app" data-phase={pomodoro.active ? pomodoro.phaseType : 'idle'}>
      <BackgroundName />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__name">Pomodoro</span>
        </div>
        <div className="topbar__actions">
          <button
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="4" />
                <path
                  strokeLinecap="round"
                  d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <nav className="tabs">
            <button
              className={`tab${view === 'timer' ? ' is-active' : ''}`}
              onClick={() => setView('timer')}
            >
              Timer
            </button>
            <button
              className={`tab${view === 'history' ? ' is-active' : ''}`}
              onClick={() => setView('history')}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="stage">
        {view === 'timer' ? (
          <div className="panel panel--timer">
            <Timer
              pomodoro={pomodoro}
              intention={intention}
              onIntentionChange={setIntention}
            />
            <Settings settings={settings} onChange={setSettings} disabled={pomodoro.active} />
          </div>
        ) : (
          <div className="panel panel--history">
            <h2 className="panel__title">Your focused work</h2>
            <History history={pomodoro.history} onClear={pomodoro.clearHistory} />
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="soundctl">
          <button
            className="icon-btn icon-btn--sm"
            onClick={() => setSound((s) => ({ ...s, muted: !s.muted }))}
            aria-label={sound.muted ? 'Unmute' : 'Mute'}
            title={sound.muted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {sound.muted || sound.volume === 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" d="M16 9l5 6M21 9l-5 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" />
              </svg>
            )}
          </button>
          <input
            className="soundctl__slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sound.muted ? 0 : sound.volume}
            onChange={(e) =>
              setSound({ volume: Number(e.target.value), muted: Number(e.target.value) === 0 })
            }
            onPointerUp={() => playBlip()}
            aria-label="Volume"
          />
        </div>
        <span className="footer__hint">
          <kbd>Space</kbd> start / pause · <kbd>F</kbd> finish · <kbd>M</kbd> mute
        </span>
      </footer>
    </div>
  )
}
