import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, RefreshCw } from 'lucide-react'
import './TimeConverter.css'

type Course = 'SCY' | 'SCM' | 'LCM'

// Conversion factors are approximations based on FINA/USA Swimming correction tables.
// The model applies a distance factor for stroke and distance, plus a pool factor.
// Source: Swimrankings correction model (simplified).
const POOL_FACTORS: Record<Course, number> = { SCY: 1.0, SCM: 1.11, LCM: 1.145 }

// Stroke-specific multipliers from SCY base (approximate)
const STROKE_MULT: Record<string, number> = {
  freestyle:   1.0,
  backstroke:  1.01,
  breaststroke:1.015,
  butterfly:   1.01,
  im:          1.01,
}

// Distance multiplier bias (shorter → longer scales differently)
const DIST_BIAS: Record<string, number> = {
  '50':   1.000,
  '100':  1.000,
  '200':  0.998,
  '400':  0.996,
  '500':  0.995,
  '800':  0.994,
  '1000': 0.993,
  '1500': 0.992,
  '1650': 0.991,
}

function parseTime(s: string): number | null {
  s = s.trim()
  if (!s) return null
  const parts = s.split(':')
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10)
    const sec = parseFloat(parts[1])
    if (isNaN(min) || isNaN(sec)) return null
    return min * 60 + sec
  }
  const sec = parseFloat(s)
  if (isNaN(sec)) return null
  return sec
}

function formatTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2)
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(2).padStart(5, '0')}`
}

function convert(
  timeSec: number,
  from: Course,
  to: Course,
  stroke: string,
  distance: string,
): number {
  if (from === to) return timeSec
  const fromFactor = POOL_FACTORS[from]
  const toFactor   = POOL_FACTORS[to]
  const strokeMult = STROKE_MULT[stroke] ?? 1.0
  const distBias   = DIST_BIAS[distance] ?? 1.0
  // Scale: remove "from" pool overhead, apply "to" pool overhead
  return timeSec * (toFactor / fromFactor) * (1 + (strokeMult - 1) * 0.5) * distBias
}

const DISTANCES = ['50', '100', '200', '400', '500', '800', '1000', '1500', '1650']
const STROKES   = [
  { value: 'freestyle',    label: 'Freestyle' },
  { value: 'backstroke',   label: 'Backstroke' },
  { value: 'breaststroke', label: 'Breaststroke' },
  { value: 'butterfly',    label: 'Butterfly' },
  { value: 'im',           label: 'IM' },
]

const COURSE_LABELS: Record<Course, string> = {
  SCY: 'Short Course Yards',
  SCM: 'Short Course Meters',
  LCM: 'Long Course Meters',
}

const COURSES: Course[] = ['SCY', 'SCM', 'LCM']

export default function TimeConverter() {
  const navigate  = useNavigate()
  const [input,    setInput]    = useState('')
  const [fromCourse, setFromCourse] = useState<Course>('SCY')
  const [stroke,   setStroke]   = useState('freestyle')
  const [distance, setDistance] = useState('100')

  const parsed = parseTime(input)

  const results: { course: Course; seconds: number; formatted: string }[] = COURSES
    .filter(c => c !== fromCourse)
    .map(c => {
      if (parsed === null) return { course: c, seconds: 0, formatted: '—' }
      const secs = convert(parsed, fromCourse, c, stroke, distance)
      return { course: c, seconds: secs, formatted: formatTime(secs) }
    })

  const swap = useCallback(() => {
    const nextCourse = COURSES[(COURSES.indexOf(fromCourse) + 1) % COURSES.length]
    setFromCourse(nextCourse)
  }, [fromCourse])

  const reset = () => { setInput(''); setFromCourse('SCY'); setStroke('freestyle'); setDistance('100') }

  return (
    <div className="tc-page">
      <header className="tc-header">
        <button className="tc-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <h1 className="tc-title">Time Converter</h1>
        <div />
      </header>

      <div className="tc-body">
        <p className="tc-subtitle">
          Convert swim times between Short Course Yards, Short Course Meters, and Long Course Meters
          using the FINA approximation model.
        </p>

        <div className="tc-card">
          {/* ── Controls row ── */}
          <div className="tc-controls">
            <div className="tc-field">
              <label className="tc-label">Distance</label>
              <select
                className="tc-select"
                value={distance}
                onChange={e => setDistance(e.target.value)}
              >
                {DISTANCES.map(d => <option key={d} value={d}>{d}m / {d}y</option>)}
              </select>
            </div>

            <div className="tc-field">
              <label className="tc-label">Stroke</label>
              <select
                className="tc-select"
                value={stroke}
                onChange={e => setStroke(e.target.value)}
              >
                {STROKES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="tc-field">
              <label className="tc-label">From Course</label>
              <select
                className="tc-select"
                value={fromCourse}
                onChange={e => setFromCourse(e.target.value as Course)}
              >
                {COURSES.map(c => <option key={c} value={c}>{c} — {COURSE_LABELS[c]}</option>)}
              </select>
            </div>
          </div>

          {/* ── Input ── */}
          <div className="tc-input-row">
            <div className="tc-input-wrap">
              <span className="tc-course-badge">{fromCourse}</span>
              <input
                className="tc-input"
                type="text"
                placeholder="e.g. 52.45 or 1:52.45"
                value={input}
                onChange={e => setInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <button className="tc-swap-btn" onClick={swap} title="Cycle source course">
              <ArrowRightLeft size={16} />
              Cycle Course
            </button>
            <button className="tc-reset-btn" onClick={reset} title="Clear all">
              <RefreshCw size={15} />
            </button>
          </div>

          {parsed !== null && isNaN(parsed) === false && (
            <p className="tc-parsed-label">{COURSE_LABELS[fromCourse]}: {formatTime(parsed)}</p>
          )}

          {/* ── Results ── */}
          <div className="tc-results">
            {results.map(r => (
              <div key={r.course} className="tc-result-card">
                <div className="tc-result-course">
                  <span className="tc-result-abbr">{r.course}</span>
                  <span className="tc-result-full">{COURSE_LABELS[r.course]}</span>
                </div>
                <div className="tc-result-time">{r.formatted}</div>
              </div>
            ))}
          </div>

          <p className="tc-disclaimer">
            * Conversions use the FINA approximation model and are estimates. Official conversion
            tables may vary slightly. Always verify with your meet director or USA Swimming tools.
          </p>
        </div>

        {/* ── Course reference ── */}
        <div className="tc-reference">
          <h3 className="tc-ref-title">Pool Reference</h3>
          <div className="tc-ref-grid">
            {COURSES.map(c => (
              <div key={c} className="tc-ref-item">
                <span className="tc-ref-abbr">{c}</span>
                <span className="tc-ref-name">{COURSE_LABELS[c]}</span>
                <span className="tc-ref-len">
                  {c === 'SCY' ? '25 yards' : c === 'SCM' ? '25 meters' : '50 meters'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
