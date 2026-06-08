function formatDuration(totalSeconds) {
  const mins = Math.round(totalSeconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// Sum focus seconds per calendar day.
function focusByDay(history) {
  const map = new Map()
  for (const r of history) {
    if (!r.startedAt) continue
    const key = dayKey(new Date(r.startedAt))
    map.set(key, (map.get(key) || 0) + (r.focusSeconds || 0))
  }
  return map
}

// Current week (Monday -> Sunday), each with a weekday label and focus seconds.
function buildWeek(byDay) {
  const out = []
  const today = new Date()
  // JS getDay(): Sun=0..Sat=6. Shift so Monday is the start of the week.
  const monday = new Date(today)
  const offsetToMonday = (today.getDay() + 6) % 7
  monday.setDate(today.getDate() - offsetToMonday)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    out.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      full: d.toLocaleDateString('en-US', { weekday: 'long' }),
      seconds: byDay.get(dayKey(d)) || 0,
    })
  }
  return out
}

// Consecutive days (ending today or yesterday) with any focused time.
function computeStreak(byDay) {
  const d = new Date()
  if (!byDay.has(dayKey(d))) d.setDate(d.getDate() - 1) // allow today to be unstarted
  let streak = 0
  while (byDay.has(dayKey(d))) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function History({ history, onClear }) {
  const totalFocus = history.reduce((sum, r) => sum + (r.focusSeconds || 0), 0)
  const completedCount = history.filter((r) => r.status === 'completed').length

  const byDay = focusByDay(history)
  const week = buildWeek(byDay)
  const streak = computeStreak(byDay)
  const weekMax = Math.max(1, ...week.map((d) => d.seconds))

  return (
    <section className="history">
      <div className="history__stats">
        <div className="stat">
          <span className="stat__value">{formatDuration(totalFocus)}</span>
          <span className="stat__label">total focus</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {streak}
            <small className="stat__unit">{streak === 1 ? 'day' : 'days'}</small>
          </span>
          <span className="stat__label">streak</span>
        </div>
        <div className="stat">
          <span className="stat__value">{completedCount}</span>
          <span className="stat__label">completed</span>
        </div>
      </div>

      <div className="weekchart" aria-label="Focus over the last 7 days">
        {week.map((d, i) => (
          <div className="weekchart__col" key={i} title={`${d.full}: ${formatDuration(d.seconds)}`}>
            <div className="weekchart__bar-track">
              <div
                className="weekchart__bar"
                style={{ height: `${Math.round((d.seconds / weekMax) * 100)}%` }}
              />
            </div>
            <span className="weekchart__label">{d.label}</span>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <p className="history__empty">
          No sessions yet. Your finished and early-ended sessions will appear here.
        </p>
      ) : (
        <ul className="history__list">
          {history.map((r) => (
            <li className="record" key={r.id}>
              <div className="record__main">
                <span className="record__date">{formatDate(r.startedAt)}</span>
                {r.intention ? (
                  <span className="record__intention">“{r.intention}”</span>
                ) : null}
                <span className="record__detail">
                  {formatDuration(r.focusSeconds)} focused · {r.completedBlocks}/{r.totalBlocks} rounds
                </span>
              </div>
              <span className={`badge badge--${r.status}`}>
                {r.status === 'completed' ? 'Completed' : 'Early finish'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {history.length > 0 && (
        <button className="btn btn--ghost btn--small history__clear" onClick={onClear}>
          Clear history
        </button>
      )}
    </section>
  )
}
