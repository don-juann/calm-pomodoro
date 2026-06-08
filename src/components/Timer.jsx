function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const PHASE_LABEL = { work: 'Focus', break: 'Break', idle: 'Ready' }
const PHASE_NOTE = {
  work: 'Stay with one thing.',
  break: 'Breathe. Look away from the screen.',
  idle: 'When you are ready, begin.',
}

export default function Timer({ pomodoro, intention, onIntentionChange }) {
  const {
    active,
    running,
    phaseType,
    remaining,
    phaseDuration,
    completedBlocks,
    totalBlocks,
    start,
    pause,
    resume,
    finishEarly,
  } = pomodoro

  const progress =
    phaseDuration > 0 ? Math.min(1, (phaseDuration - remaining) / phaseDuration) : 0

  const R = 130
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - progress)

  const sessionIntention = (pomodoro.intention || '').trim()

  return (
    <section className="timer" data-phase={phaseType}>
      {active && sessionIntention && (
        <p className="timer__intention" title={sessionIntention}>
          Focusing on — <strong>{sessionIntention}</strong>
        </p>
      )}

      <div className="timer__ring-wrap">
        <svg className="timer__ring" viewBox="0 0 300 300" aria-hidden="true">
          <circle className="timer__track" cx="150" cy="150" r={R} />
          <circle
            className="timer__progress"
            cx="150"
            cy="150"
            r={R}
            style={{ strokeDasharray: C, strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="timer__center">
          <span className="timer__phase">{PHASE_LABEL[phaseType]}</span>
          <span className="timer__time">{formatTime(remaining)}</span>
          <span className="timer__note">{PHASE_NOTE[phaseType]}</span>
        </div>
      </div>

      <div className="blocks" aria-label={`${completedBlocks} of ${totalBlocks} focus blocks complete`}>
        {Array.from({ length: totalBlocks }).map((_, i) => {
          const done = i < completedBlocks
          const isCurrent = active && phaseType === 'work' && i === completedBlocks
          return (
            <span
              key={i}
              className={`blocks__dot${done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
            />
          )
        })}
      </div>

      {!active && (
        <input
          className="intention-input"
          type="text"
          value={intention}
          onChange={(e) => onIntentionChange(e.target.value)}
          placeholder="What are you focusing on? (optional)"
          maxLength={80}
          aria-label="Session intention"
        />
      )}

      <div className="controls">
        {!active && (
          <button className="btn btn--primary" onClick={() => start(intention)}>
            Start session
          </button>
        )}
        {active && running && (
          <button className="btn" onClick={pause}>
            Pause
          </button>
        )}
        {active && !running && (
          <button className="btn btn--primary" onClick={resume}>
            Resume
          </button>
        )}
        {active && (
          <button className="btn btn--ghost" onClick={finishEarly}>
            Finish session
          </button>
        )}
      </div>
    </section>
  )
}
