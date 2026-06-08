import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { loadHistory, saveHistory } from '../lib/storage'
import { playTransition, ensureAudio } from '../lib/sound'

function buildPhases({ workMin, breakMin, cycles }) {
  const phases = []
  for (let i = 0; i < cycles; i++) {
    phases.push({ type: 'work', duration: Math.round(workMin * 60) })
    if (i < cycles - 1) phases.push({ type: 'break', duration: Math.round(breakMin * 60) })
  }
  return phases
}

const blankSession = () => ({
  active: false,
  running: false,
  phaseIndex: 0,
  phaseEndsAt: null, // ms timestamp — valid while running
  remainingMs: 0, // valid while paused
  startedAt: null,
  focusBaseSec: 0, // seconds from fully-completed work blocks
  completedBlocks: 0,
  intention: '',
})

export function usePomodoro(settings) {
  const [, force] = useReducer((n) => n + 1, 0)
  const session = useRef(blankSession())
  const phasesRef = useRef(buildPhases(settings))
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const [history, setHistory] = useState(() => loadHistory())

  // While idle, keep the phase plan (and preview) in sync with settings.
  useEffect(() => {
    if (!session.current.active) {
      phasesRef.current = buildPhases(settings)
      force()
    }
  }, [settings.workMin, settings.breakMin, settings.cycles])

  const remainingSecOf = (st) => {
    if (!st.active) return Math.round(settingsRef.current.workMin * 60)
    if (st.running) return Math.max(0, (st.phaseEndsAt - Date.now()) / 1000)
    return st.remainingMs / 1000
  }

  const recordSession = useCallback((status) => {
    const st = session.current
    const phases = phasesRef.current
    const totalBlocks = phases.filter((p) => p.type === 'work').length
    const cur = phases[st.phaseIndex]
    let focusSeconds = st.focusBaseSec
    if (status === 'early' && cur && cur.type === 'work') {
      focusSeconds += Math.max(0, Math.round(cur.duration - remainingSecOf(st)))
    }
    const record = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + Math.random()),
      startedAt: st.startedAt,
      endedAt: Date.now(),
      focusSeconds,
      completedBlocks: st.completedBlocks,
      totalBlocks,
      plannedFocusSeconds: totalBlocks * Math.round(settingsRef.current.workMin * 60),
      intention: (st.intention || '').trim(),
      status, // 'completed' | 'early'
    }
    setHistory((prev) => {
      const next = [record, ...prev]
      saveHistory(next)
      return next
    })
  }, [])

  // Timestamp-driven tick: stays accurate even if the tab was backgrounded,
  // and catches up across any phase boundaries that passed while away.
  useEffect(() => {
    const id = setInterval(() => {
      const st = session.current
      if (!st.active || !st.running) return
      const phases = phasesRef.current
      const now = Date.now()

      while (st.active && st.running && now >= st.phaseEndsAt) {
        const cur = phases[st.phaseIndex]
        const boundary = st.phaseEndsAt
        if (cur.type === 'work') {
          st.focusBaseSec += cur.duration
          st.completedBlocks += 1
        }
        const nextIndex = st.phaseIndex + 1
        const recent = now - boundary < 1500 // skip sounds when catching up after long sleep
        if (nextIndex >= phases.length) {
          st.running = false
          st.active = false
          st.phaseEndsAt = null
          recordSession('completed')
          if (recent) playTransition('done')
          break
        }
        st.phaseIndex = nextIndex
        st.phaseEndsAt = boundary + phases[nextIndex].duration * 1000
        if (recent) playTransition(phases[nextIndex].type === 'break' ? 'break' : 'work')
      }
      force()
    }, 500)
    return () => clearInterval(id)
  }, [recordSession])

  const start = useCallback((intention = '') => {
    ensureAudio()
    phasesRef.current = buildPhases(settingsRef.current)
    const now = Date.now()
    const firstDuration = phasesRef.current[0].duration
    session.current = {
      active: true,
      running: true,
      phaseIndex: 0,
      phaseEndsAt: now + firstDuration * 1000,
      remainingMs: firstDuration * 1000,
      startedAt: now,
      focusBaseSec: 0,
      completedBlocks: 0,
      intention,
    }
    force()
  }, [])

  const pause = useCallback(() => {
    const st = session.current
    if (st.active && st.running) {
      st.remainingMs = Math.max(0, st.phaseEndsAt - Date.now())
      st.running = false
      st.phaseEndsAt = null
      force()
    }
  }, [])

  const resume = useCallback(() => {
    const st = session.current
    if (st.active && !st.running) {
      ensureAudio()
      st.phaseEndsAt = Date.now() + st.remainingMs
      st.running = true
      force()
    }
  }, [])

  const finishEarly = useCallback(() => {
    if (!session.current.active) return
    recordSession('early')
    session.current.running = false
    session.current.active = false
    session.current.phaseEndsAt = null
    playTransition('done')
    force()
  }, [recordSession])

  const reset = useCallback(() => {
    session.current = blankSession()
    phasesRef.current = buildPhases(settingsRef.current)
    force()
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const st = session.current
  const phases = phasesRef.current
  const totalBlocks = phases.filter((p) => p.type === 'work').length
  const currentPhase = st.active ? phases[st.phaseIndex] : null
  const previewDuration = Math.round(settings.workMin * 60)

  return {
    active: st.active,
    running: st.running,
    phaseType: currentPhase ? currentPhase.type : 'idle',
    phaseIndex: st.phaseIndex,
    totalPhases: phases.length,
    remaining: remainingSecOf(st),
    phaseDuration: currentPhase ? currentPhase.duration : previewDuration,
    completedBlocks: st.completedBlocks,
    totalBlocks,
    intention: st.intention,
    history,
    start,
    pause,
    resume,
    finishEarly,
    reset,
    clearHistory,
  }
}
