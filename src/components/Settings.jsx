const FIELDS = [
  { key: 'workMin', label: 'Focus', unit: 'min', min: 1, max: 90, step: 1 },
  { key: 'breakMin', label: 'Break', unit: 'min', min: 1, max: 30, step: 1 },
  { key: 'cycles', label: 'Rounds', unit: '×', min: 1, max: 8, step: 1 },
]

export default function Settings({ settings, onChange, disabled }) {
  const update = (key, raw, min, max) => {
    let value = Number(raw)
    if (Number.isNaN(value)) return
    value = Math.max(min, Math.min(max, Math.round(value)))
    onChange({ ...settings, [key]: value })
  }

  const totalFocus = settings.workMin * settings.cycles

  return (
    <section className={`settings${disabled ? ' is-disabled' : ''}`}>
      <div className="settings__grid">
        {FIELDS.map(({ key, label, unit, min, max, step }) => (
          <div className="stepper" key={key}>
            <span className="stepper__label">{label}</span>
            <div className="stepper__control">
              <button
                type="button"
                className="stepper__btn"
                aria-label={`Decrease ${label}`}
                disabled={disabled || settings[key] <= min}
                onClick={() => update(key, settings[key] - step, min, max)}
              >
                –
              </button>
              <span className="stepper__value">
                {settings[key]}
                <small>{unit}</small>
              </span>
              <button
                type="button"
                className="stepper__btn"
                aria-label={`Increase ${label}`}
                disabled={disabled || settings[key] >= max}
                onClick={() => update(key, settings[key] + step, min, max)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="settings__summary">
        {settings.cycles} rounds of {settings.workMin} min ·{' '}
        <strong>{totalFocus} min of focus</strong>
      </p>
    </section>
  )
}
