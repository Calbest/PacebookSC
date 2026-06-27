import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, ArrowRightLeft, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TimeConverterPopup from '../components/TimeConverterPopup'
import './Calendar.css'

// ─── Types ───────────────────────────────────────────────────────────────────

type DrylandType  = 'gym' | 'stretching' | 'yoga' | 'cardio' | 'core' | 'other'
type SessionStatus = 'attended' | 'absent' | 'cancelled'
type CalView      = 'month' | 'year' | 'career'

interface SessionData {
  time:           string
  status:         SessionStatus
  mood:           number | null
  absenceReason:  string
}

interface DrylandData {
  type: DrylandType
  mood: number | null
}

interface DayData {
  s1:      SessionData | null
  s2:      SessionData | null
  dryland: DrylandData | null
}

type AttendanceMap = Record<string, DayData>

interface Meet {
  id:               string
  name:             string
  date:             string
  mood:             number | null
  confidence:       number | null
  weather:          number | null
  injuries:         string
  performanceNotes: string
}

interface ScheduleTemplate {
  days:           number[]
  twoSessionDays: number[]
  drylandDays:    number[]
  session1Time:   string
  session2Time:   string
  practiceNote:   string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const MOOD = {
  labels: ['','Really Bad','Bad','OK','Good','Great'],
  emojis: ['','😣','😕','😐','😊','😄'],
  colors: ['','#ef4444','#f97316','#eab308','#22c55e','#0ea5e9'],
}

const DRYLAND_TYPES: { id: DrylandType; label: string; color: string }[] = [
  { id: 'gym',        label: 'Gym',        color: '#7c3aed' },
  { id: 'stretching', label: 'Stretching', color: '#0891b2' },
  { id: 'yoga',       label: 'Yoga',       color: '#be185d' },
  { id: 'cardio',     label: 'Cardio',     color: '#dc2626' },
  { id: 'core',       label: 'Core',       color: '#16a34a' },
  { id: 'other',      label: 'Other',      color: '#78716c' },
]

const WEATHER_LABELS = ['','Terrible','Bad','OK','Good','Perfect']

const DEFAULT_SCHEDULE: ScheduleTemplate = {
  days:           [1, 2, 3, 4, 5],
  twoSessionDays: [],
  drylandDays:    [],
  session1Time:   '',
  session2Time:   '',
  practiceNote:   '',
}

const SESSION_KEYS: Array<{ key: 's1' | 's2'; label: string }> = [
  { key: 's1', label: 'Session 1' },
  { key: 's2', label: 'Session 2' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstDOW(y: number, m: number)    { return new Date(y, m, 1).getDay() }

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function fmtShort(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function defaultSession(time = ''): SessionData {
  return { time, status: 'attended', mood: null, absenceReason: '' }
}

function migrateAttendance(raw: Record<string, unknown>): AttendanceMap {
  const out: AttendanceMap = {}
  for (const [date, v] of Object.entries(raw ?? {})) {
    if (!v || typeof v !== 'object') continue
    const vobj = v as Record<string, unknown>
    if ('s1' in vobj) {
      out[date] = v as DayData
    } else {
      out[date] = {
        s1: {
          time: '', absenceReason: '',
          status: vobj.attended ? 'attended' : 'absent',
          mood: null,
        },
        s2: null,
        dryland: vobj.hasDryland ? { type: 'other', mood: null } : null,
      }
    }
  }
  return out
}

function migrateMeets(raw: unknown[]): Meet[] {
  return (raw ?? []).map((m: any) => ({
    id:               m.id   ?? crypto.randomUUID(),
    name:             m.name ?? '',
    date:             m.date ?? '',
    mood:             m.mood             ?? null,
    confidence:       m.confidence       ?? null,
    weather:          m.weather          ?? null,
    injuries:         m.injuries         ?? '',
    performanceNotes: m.performanceNotes ?? m.comments ?? '',
  }))
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

interface PieSeg { label: string; value: number; color: string }

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

function donutPath(cx: number, cy: number, R: number, ri: number, s: number, e: number) {
  if (e - s >= 360) e = s + 359.99
  const [x1, y1] = polar(cx, cy, R,  s), [x2, y2] = polar(cx, cy, R,  e)
  const [x3, y3] = polar(cx, cy, ri, e), [x4, y4] = polar(cx, cy, ri, s)
  const lg = e - s > 180 ? 1 : 0
  const f  = (n: number) => n.toFixed(2)
  return `M${f(x1)} ${f(y1)} A${R} ${R} 0 ${lg} 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${ri} ${ri} 0 ${lg} 0 ${f(x4)} ${f(y4)}Z`
}

function DonutChart({ segs, size = 120 }: { segs: PieSeg[]; size?: number }) {
  const [hov, setHov] = useState<number | null>(null)
  const nonZero = segs.filter(s => s.value > 0)
  const total   = nonZero.reduce((a, s) => a + s.value, 0)

  if (!total) return <div className="cal-pie-empty">No data yet</div>

  const cx = size / 2, cy = size / 2
  const R  = size / 2 - 7, ri = R * 0.56

  let cumulative = 0
  const slices = nonZero.map(seg => {
    const start = cumulative / total * 360
    cumulative += seg.value
    const end = cumulative / total * 360
    const pct = Math.round(seg.value / total * 100)
    return { ...seg, start, end, pct }
  })

  const hovSeg = hov !== null ? slices[hov] : null

  return (
    <div className="cal-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cal-donut-svg">
        {slices.map((s, i) => (
          <path
            key={i}
            d={donutPath(cx, cy, R, ri, s.start, s.end)}
            fill={s.color}
            stroke="#fff"
            strokeWidth="2.5"
            opacity={hov !== null && hov !== i ? 0.38 : 1}
            className="cal-donut-slice"
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" className="cal-donut-big"
          fill={hovSeg ? hovSeg.color : '#0f172a'}>
          {hovSeg ? `${hovSeg.pct}%` : total}
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" className="cal-donut-sm" fill="#64748b">
          {hovSeg ? hovSeg.label : 'total'}
        </text>
      </svg>

      <div className="cal-donut-legend">
        {slices.map((s, i) => (
          <div
            key={i}
            className={`cal-leg-row${hov === i ? ' hov' : ''}`}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <span className="cal-leg-dot" style={{ background: s.color }} />
            <span className="cal-leg-label">{s.label}</span>
            <span className="cal-leg-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mood Picker ─────────────────────────────────────────────────────────────

function MoodPicker({ value, onChange, label }: {
  value: number | null
  onChange: (n: number) => void
  label?: string
}) {
  return (
    <div className="cal-mood">
      {label && <span className="cal-field-lbl">{label}</span>}
      <div className="cal-mood-row">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button"
            className={`cal-mood-btn${value === n ? ' sel' : ''}`}
            style={value === n ? { background: MOOD.colors[n], borderColor: MOOD.colors[n] } : {}}
            title={MOOD.labels[n]}
            onClick={() => onChange(n)}
          >
            {MOOD.emojis[n]}
          </button>
        ))}
      </div>
      {value !== null && (
        <span className="cal-mood-text" style={{ color: MOOD.colors[value] }}>
          {MOOD.labels[value]}
        </span>
      )}
    </div>
  )
}

// ─── Scale Picker (numeric 1–5) ───────────────────────────────────────────────

function ScalePicker({ value, onChange, label, sublabels }: {
  value: number | null
  onChange: (n: number) => void
  label: string
  sublabels?: string[]
}) {
  return (
    <div className="cal-scale">
      <span className="cal-field-lbl">
        {label}{value !== null && sublabels ? ` — ${sublabels[value]}` : ''}
      </span>
      <div className="cal-scale-row">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button"
            className={`cal-scale-btn${value === n ? ' sel' : ''}`}
            onClick={() => onChange(n)}
          >{n}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Session Block (inside DayModal) ─────────────────────────────────────────

function SessionBlock({ session, onChange, label, defaultTime, onRemove }: {
  session:     SessionData
  onChange:    (s: SessionData) => void
  label:       string
  defaultTime?: string
  onRemove?:   () => void
}) {
  const set = <K extends keyof SessionData>(k: K, v: SessionData[K]) =>
    onChange({ ...session, [k]: v })

  return (
    <div className="cal-session">
      <div className="cal-session-head">
        <span className="cal-session-label">{label}</span>
        <input
          className="cal-time-input" type="time"
          value={session.time || defaultTime || ''}
          onChange={e => set('time', e.target.value)}
        />
        {onRemove && (
          <button className="cal-session-remove" type="button" onClick={onRemove}>
            <X size={13} />
          </button>
        )}
      </div>

      <div className="cal-status-row">
        {(['attended', 'absent', 'cancelled'] as SessionStatus[]).map(st => (
          <button
            key={st} type="button"
            className={`cal-status-btn cal-status-btn--${st}${session.status === st ? ' sel' : ''}`}
            onClick={() => set('status', st)}
          >
            {st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {session.status === 'attended' && (
        <MoodPicker value={session.mood} onChange={v => set('mood', v)} label="How was it?" />
      )}
      {session.status === 'absent' && (
        <div className="cal-field">
          <label className="cal-field-lbl">Reason (optional)</label>
          <input
            className="cal-field-input"
            placeholder="Why did you miss practice?"
            value={session.absenceReason}
            onChange={e => set('absenceReason', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Day Modal ────────────────────────────────────────────────────────────────

function DayModal({ dateStr, initial, schedule, onSave, onClose }: {
  dateStr:  string
  initial:  DayData | null
  schedule: ScheduleTemplate
  onSave:   (d: DayData) => void
  onClose:  () => void
}) {
  const dow          = new Date(dateStr + 'T12:00:00').getDay()
  const hasTwoDefault = schedule.twoSessionDays.includes(dow)
  const hasDryDefault = schedule.drylandDays.includes(dow)

  const [d, setD] = useState<DayData>(() => initial ?? {
    s1:      defaultSession(schedule.session1Time),
    s2:      hasTwoDefault ? defaultSession(schedule.session2Time) : null,
    dryland: hasDryDefault ? { type: 'other', mood: null } : null,
  })

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="cal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-modal cal-modal--day">
        <div className="cal-modal-header">
          <span className="cal-modal-title">{fmtDate(dateStr)}</span>
          <button className="cal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cal-modal-body">
          {d.s1 && (
            <SessionBlock
              session={d.s1}
              onChange={s1 => setD(p => ({ ...p, s1 }))}
              label="Session 1"
              defaultTime={schedule.session1Time}
            />
          )}

          {d.s2 ? (
            <SessionBlock
              session={d.s2}
              onChange={s2 => setD(p => ({ ...p, s2 }))}
              label="Session 2"
              defaultTime={schedule.session2Time}
              onRemove={() => setD(p => ({ ...p, s2: null }))}
            />
          ) : (
            <button
              className="cal-add-session-btn" type="button"
              onClick={() => setD(p => ({ ...p, s2: defaultSession(schedule.session2Time) }))}
            >
              <Plus size={13} /> Add 2nd Session
            </button>
          )}

          <div className="cal-dryland-wrap">
            <div className="cal-dryland-head">
              <span className="cal-field-lbl">Dryland</span>
              <button
                className={`cal-toggle${d.dryland ? ' on' : ''}`} type="button"
                onClick={() => setD(p => ({
                  ...p, dryland: p.dryland ? null : { type: 'other', mood: null },
                }))}
              >
                {d.dryland ? 'On' : 'Off'}
              </button>
            </div>

            {d.dryland && (
              <div className="cal-dryland-body">
                <div className="cal-dry-type-grid">
                  {DRYLAND_TYPES.map(t => (
                    <button
                      key={t.id} type="button"
                      className={`cal-dry-type${d.dryland?.type === t.id ? ' sel' : ''}`}
                      style={d.dryland?.type === t.id
                        ? { background: t.color, color: '#fff', borderColor: t.color }
                        : {}}
                      onClick={() => setD(p => ({ ...p, dryland: { ...p.dryland!, type: t.id } }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <MoodPicker
                  value={d.dryland.mood}
                  onChange={v => setD(p => ({ ...p, dryland: { ...p.dryland!, mood: v } }))}
                  label="Dryland rating"
                />
              </div>
            )}
          </div>
        </div>

        <div className="cal-modal-footer">
          <button className="cal-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="cal-modal-save" onClick={() => { onSave(d); onClose() }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Meet Modal ───────────────────────────────────────────────────────────────

function MeetModal({ meet, onSave, onDelete, onClose }: {
  meet:     Meet | null
  onSave:   (m: Meet) => void
  onDelete?: (id: string) => void
  onClose:  () => void
}) {
  const isNew = meet === null

  const [name,  setName]  = useState(meet?.name ?? '')
  const [date,  setDate]  = useState(meet?.date ?? new Date().toISOString().slice(0, 10))
  const [mood,  setMood]  = useState<number | null>(meet?.mood ?? null)
  const [conf,  setConf]  = useState<number | null>(meet?.confidence ?? null)
  const [wthr,  setWthr]  = useState<number | null>(meet?.weather ?? null)
  const [inj,   setInj]   = useState(meet?.injuries ?? '')
  const [notes, setNotes] = useState(meet?.performanceNotes ?? '')

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  function save() {
    if (!name.trim()) return
    onSave({
      id: meet?.id ?? crypto.randomUUID(),
      name: name.trim(), date,
      mood, confidence: conf, weather: wthr,
      injuries: inj, performanceNotes: notes,
    })
    onClose()
  }

  return (
    <div className="cal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-modal cal-modal--meet">
        <div className="cal-modal-header">
          <span className="cal-modal-title">{isNew ? 'Add Meet' : meet!.name}</span>
          <button className="cal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cal-modal-body">
          <div className="cal-field">
            <label className="cal-field-lbl">Meet Name</label>
            <input
              className="cal-field-input"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. SCS Junior Championships"
              autoFocus
            />
          </div>
          <div className="cal-field">
            <label className="cal-field-lbl">Date</label>
            <input
              className="cal-field-input" type="date"
              value={date} onChange={e => setDate(e.target.value)}
            />
          </div>

          {!isNew && (
            <>
              <div className="cal-divider" />
              <p className="cal-section-title">Meet Analysis</p>
              <MoodPicker value={mood} onChange={setMood} label="Overall meet mood" />
              <ScalePicker
                value={conf} onChange={setConf}
                label="Confidence"
                sublabels={['', 'Very Low', 'Low', 'Average', 'Good', 'High']}
              />
              <ScalePicker
                value={wthr} onChange={setWthr}
                label="Weather / Conditions"
                sublabels={WEATHER_LABELS}
              />
              <div className="cal-field">
                <label className="cal-field-lbl">Injuries / Pain</label>
                <input
                  className="cal-field-input"
                  value={inj} onChange={e => setInj(e.target.value)}
                  placeholder="Any injuries or pain during the meet?"
                />
              </div>
              <div className="cal-field">
                <label className="cal-field-lbl">Performance Notes</label>
                <textarea
                  className="cal-field-textarea" rows={3}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="How did it go overall? Explain results, what to improve…"
                />
              </div>
            </>
          )}
        </div>

        <div className="cal-modal-footer">
          {!isNew && onDelete && (
            <button
              className="cal-modal-delete"
              onClick={() => {
                if (window.confirm('Delete this meet?')) { onDelete(meet!.id); onClose() }
              }}
            >
              Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="cal-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="cal-modal-save" onClick={save} disabled={!name.trim()}>
            {isNew ? 'Add Meet' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Month Report ─────────────────────────────────────────────────────────────

function MonthReport({ year, month, attendance, meets, schedule }: {
  year:       number
  month:      number
  attendance: AttendanceMap
  meets:      Meet[]
  schedule:   ScheduleTemplate
}) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const dim    = daysInMonth(year, month)

  const practiceDates: string[] = []
  for (let d = 1; d <= dim; d++) {
    const ds = iso(year, month, d)
    if (schedule.days.includes(new Date(ds + 'T12:00:00').getDay())) practiceDates.push(ds)
  }

  let attended = 0, absent = 0, cancelled = 0
  const moodCount = [0, 0, 0, 0, 0, 0]
  const excuses: { date: string; session: string; reason: string }[] = []

  for (const ds of practiceDates) {
    const day = attendance[ds]
    for (const { key, label } of SESSION_KEYS) {
      const s = day?.[key] ?? null
      if (!s) continue
      if (s.status === 'attended')  { attended++;  if (s.mood) moodCount[s.mood]++ }
      else if (s.status === 'cancelled') cancelled++
      else {
        absent++
        if (s.absenceReason.trim())
          excuses.push({ date: ds, session: label, reason: s.absenceReason.trim() })
      }
    }
  }

  const dryCount: Record<DrylandType, number> = {
    gym: 0, stretching: 0, yoga: 0, cardio: 0, core: 0, other: 0,
  }
  for (const ds of practiceDates) {
    const dry = attendance[ds]?.dryland
    if (dry) dryCount[dry.type]++
  }

  const monthMeets = meets.filter(m => m.date.startsWith(prefix))
  const hasData    = attended + absent + cancelled > 0

  if (!hasData && monthMeets.length === 0) return null

  return (
    <div className="cal-report-section">
      <h2 className="cal-report-heading">
        {MONTH_NAMES[month]} {year} — Analysis
      </h2>

      {hasData && (
        <div className="cal-charts-row">
          <div className="cal-chart-card">
            <div className="cal-chart-title">Attendance</div>
            <DonutChart segs={[
              { label: 'Attended',  value: attended,  color: '#22c55e' },
              { label: 'Absent',    value: absent,    color: '#ef4444' },
              { label: 'Cancelled', value: cancelled, color: '#94a3b8' },
            ]} />
          </div>

          <div className="cal-chart-card">
            <div className="cal-chart-title">Practice Mood</div>
            <DonutChart segs={[1, 2, 3, 4, 5].map(n => ({
              label: MOOD.labels[n], value: moodCount[n], color: MOOD.colors[n],
            }))} />
          </div>

          <div className="cal-chart-card">
            <div className="cal-chart-title">Dryland Types</div>
            <DonutChart segs={DRYLAND_TYPES.map(t => ({
              label: t.label, value: dryCount[t.id], color: t.color,
            }))} />
          </div>
        </div>
      )}

      {excuses.length > 0 && (
        <div className="cal-excuses">
          <h3 className="cal-excuses-title">Absence Reasons</h3>
          <div className="cal-excuses-list">
            {excuses.map((e, i) => (
              <div key={i} className="cal-excuse-row">
                <span className="cal-excuse-date">{fmtShort(e.date)}</span>
                <span className="cal-excuse-session">{e.session}</span>
                <span className="cal-excuse-text">"{e.reason}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthMeets.some(m => m.mood || m.confidence || m.weather || m.injuries || m.performanceNotes) && (
        <div className="cal-meet-analysis">
          <h3 className="cal-excuses-title">Meet Analysis</h3>
          {monthMeets.map(m => {
            const hasInfo = m.mood || m.confidence || m.weather || m.injuries || m.performanceNotes
            if (!hasInfo) return null
            return (
              <div key={m.id} className="cal-meet-an-card">
                <div className="cal-meet-an-head">
                  <strong>{m.name}</strong>
                  <span className="cal-meet-an-date">{fmtShort(m.date)}</span>
                </div>
                <div className="cal-meet-an-chips">
                  {m.mood       && <span className="cal-ma-chip">{MOOD.emojis[m.mood]} {MOOD.labels[m.mood]}</span>}
                  {m.confidence && <span className="cal-ma-chip">Confidence {m.confidence}/5</span>}
                  {m.weather    && <span className="cal-ma-chip">Weather: {WEATHER_LABELS[m.weather]}</span>}
                  {m.injuries   && <span className="cal-ma-chip cal-ma-chip--warn">⚠ {m.injuries}</span>}
                </div>
                {m.performanceNotes && (
                  <p className="cal-meet-an-notes">"{m.performanceNotes}"</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Year View ────────────────────────────────────────────────────────────────

function YearView({ year, setYear, attendance, meets, schedule, onSelectMonth }: {
  year:          number
  setYear:       (y: number) => void
  attendance:    AttendanceMap
  meets:         Meet[]
  schedule:      ScheduleTemplate
  onSelectMonth: (m: number) => void
}) {
  const stats = Array.from({ length: 12 }, (_, m) => {
    const dim = daysInMonth(year, m)
    let att = 0, tot = 0
    for (let d = 1; d <= dim; d++) {
      const ds = iso(year, m, d)
      if (!schedule.days.includes(new Date(ds + 'T12:00:00').getDay())) continue
      const day = attendance[ds]
      if (!day?.s1) { tot++; continue }
      for (const { key } of SESSION_KEYS) {
        const s = day[key]
        if (!s || s.status === 'cancelled') continue
        tot++
        if (s.status === 'attended') att++
      }
    }
    const pct = tot > 0 ? Math.round(att / tot * 100) : null
    const mc  = meets.filter(mt =>
      mt.date.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`),
    ).length
    return { m, att, tot, pct, mc }
  })

  const yearTot = stats.reduce((a, s) => a + s.tot, 0)
  const yearAtt = stats.reduce((a, s) => a + s.att, 0)
  const yearPct = yearTot > 0 ? Math.round(yearAtt / yearTot * 100) : null

  return (
    <div className="cal-year-view cal-fade-in">
      <div className="cal-year-nav">
        <button className="cal-arrow-btn" onClick={() => setYear(year - 1)}><ChevronLeft size={18} /></button>
        <span className="cal-year-title">{year}</span>
        <button className="cal-arrow-btn" onClick={() => setYear(year + 1)}><ChevronRight size={18} /></button>
      </div>

      {yearPct !== null && (
        <div className="cal-year-summary">
          <span className="cal-year-big">{yearPct}%</span>
          <span className="cal-year-big-sub">
            {yearAtt} of {yearTot} sessions attended in {year}
          </span>
        </div>
      )}

      <div className="cal-year-grid">
        {stats.map(({ m, att, tot, pct, mc }, i) => (
          <div
            key={m}
            className="cal-year-card"
            style={{ '--yi': i } as React.CSSProperties}
            onClick={() => onSelectMonth(m)}
          >
            <div className="cal-year-card-month">{MONTH_NAMES[m].slice(0, 3)}</div>
            {pct !== null ? (
              <>
                <div className="cal-year-bar-bg">
                  <div
                    className="cal-year-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <div
                  className="cal-year-card-pct"
                  style={{ color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444' }}
                >
                  {pct}%
                </div>
                <div className="cal-year-card-sub">{att}/{tot} sessions</div>
              </>
            ) : (
              <div className="cal-year-card-empty">No data</div>
            )}
            {mc > 0 && (
              <div className="cal-year-card-meets">{mc} meet{mc !== 1 ? 's' : ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Career View ──────────────────────────────────────────────────────────────

function CareerView({ attendance, meets, schedule }: {
  attendance: AttendanceMap
  meets:      Meet[]
  schedule:   ScheduleTemplate
}) {
  const yrSet = new Set<number>()
  Object.keys(attendance).forEach(d => yrSet.add(parseInt(d.slice(0, 4))))
  meets.forEach(m => yrSet.add(parseInt(m.date.slice(0, 4))))
  if (!yrSet.size) yrSet.add(new Date().getFullYear())

  const rows = Array.from(yrSet).sort((a, b) => b - a).map(yr => {
    let att = 0, tot = 0
    for (const [ds, day] of Object.entries(attendance)) {
      if (!ds.startsWith(String(yr))) continue
      if (!schedule.days.includes(new Date(ds + 'T12:00:00').getDay())) continue
      if (!day.s1) { tot++; continue }
      for (const { key } of SESSION_KEYS) {
        const s = day[key]
        if (!s || s.status === 'cancelled') continue
        tot++
        if (s.status === 'attended') att++
      }
    }
    return {
      yr, att, tot,
      pct: tot > 0 ? Math.round(att / tot * 100) : null,
      mc:  meets.filter(m => m.date.startsWith(String(yr))).length,
    }
  })

  const totAll = rows.reduce((a, r) => a + r.tot, 0)
  const attAll = rows.reduce((a, r) => a + r.att, 0)
  const pctAll = totAll > 0 ? Math.round(attAll / totAll * 100) : null

  return (
    <div className="cal-career-view cal-fade-in">
      <h2 className="cal-year-title" style={{ marginBottom: 20 }}>Career Summary</h2>

      {pctAll !== null && (
        <div className="cal-career-hero">
          <span className="cal-career-pct">{pctAll}%</span>
          <span className="cal-career-sub">
            All-time attendance — {attAll} of {totAll} sessions
          </span>
        </div>
      )}

      <div className="cal-career-table">
        <div className="cal-career-head">
          <span>Year</span>
          <span>Attended</span>
          <span>Total</span>
          <span>Rate</span>
          <span>Meets</span>
        </div>
        {rows.map(r => (
          <div key={r.yr} className="cal-career-row">
            <span className="cal-career-yr">{r.yr}</span>
            <span>{r.att}</span>
            <span>{r.tot}</span>
            <span
              className="cal-career-rate"
              style={{
                color: r.pct === null ? '#94a3b8'
                  : r.pct >= 80 ? '#22c55e'
                  : r.pct >= 60 ? '#eab308' : '#ef4444',
              }}
            >
              {r.pct !== null ? `${r.pct}%` : '—'}
            </span>
            <span>{r.mc || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Calendar ────────────────────────────────────────────────────────────

export default function Calendar() {
  const navigate = useNavigate()
  const today    = new Date()
  const todayStr = iso(today.getFullYear(), today.getMonth(), today.getDate())

  const [year,      setYear]      = useState(today.getFullYear())
  const [month,     setMonth]     = useState(today.getMonth())
  const [view,      setView]      = useState<CalView>('month')
  const [meets,     setMeets]     = useState<Meet[]>([])
  const [attn,      setAttn]      = useState<AttendanceMap>({})
  const [sched,     setSched]     = useState<ScheduleTemplate>(DEFAULT_SCHEDULE)
  const [showSched, setShowSched] = useState(false)
  const [showTC,    setShowTC]    = useState(false)
  const [saving,    setSaving]    = useState(false)

  const [dayModal,  setDayModal]  = useState<string | null>(null)
  const [meetModal, setMeetModal] = useState<Meet | null | 'new'>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      const m = user.user_metadata ?? {}
      setMeets(migrateMeets(m.calMeets ?? []))
      setAttn(migrateAttendance(m.calAttendance ?? {}))
      if (m.calSchedule) setSched({ ...DEFAULT_SCHEDULE, ...m.calSchedule })
    })
  }, [navigate])

  async function persist(patch: object) {
    setSaving(true)
    await supabase.auth.updateUser({ data: patch })
    setSaving(false)
  }

  function handleMeetSave(m: Meet) {
    const next = meets.some(x => x.id === m.id)
      ? meets.map(x => x.id === m.id ? m : x)
      : [...meets, m]
    setMeets(next)
    persist({ calMeets: next })
  }

  function handleMeetDelete(id: string) {
    const next = meets.filter(m => m.id !== id)
    setMeets(next)
    persist({ calMeets: next })
  }

  function handleDaySave(ds: string, d: DayData) {
    const next = { ...attn, [ds]: d }
    setAttn(next)
    persist({ calAttendance: next })
  }

  function handleSchedSave(s: ScheduleTemplate) {
    setSched(s)
    persist({ calSchedule: s })
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const dim  = daysInMonth(year, month)
  const fday = firstDOW(year, month)
  const monthPfx = `${year}-${String(month + 1).padStart(2, '0')}`

  const meetsByDate = new Map<string, Meet>()
  meets.forEach(m => meetsByDate.set(m.date, m))

  const meetsThisMonth = meets
    .filter(m => m.date.startsWith(monthPfx))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="cal-layout">
      <TimeConverterPopup isOpen={showTC} onClose={() => setShowTC(false)} />

      {dayModal && (
        <DayModal
          key={dayModal}
          dateStr={dayModal}
          initial={attn[dayModal] ?? null}
          schedule={sched}
          onSave={d => handleDaySave(dayModal, d)}
          onClose={() => setDayModal(null)}
        />
      )}

      {meetModal !== null && (
        <MeetModal
          key={meetModal === 'new' ? 'new' : (meetModal as Meet).id}
          meet={meetModal === 'new' ? null : meetModal as Meet}
          onSave={handleMeetSave}
          onDelete={handleMeetDelete}
          onClose={() => setMeetModal(null)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="cal-sidebar">
        <div className="cal-sidebar-brand">Calendar</div>
        <nav className="cal-sidebar-nav">
          <button className="cal-nav-btn" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={16} /><span>Dashboard</span>
          </button>
          <button className="cal-nav-btn" onClick={() => navigate('/event-planning')}>
            <CalendarCheck size={16} /><span>Event Planning</span>
          </button>
          <button className="cal-nav-btn" onClick={() => setShowTC(true)}>
            <ArrowRightLeft size={16} /><span>Time Converter</span>
          </button>
        </nav>
        <div className="cal-sidebar-lower">
          <button className="cal-sidebar-action-btn" onClick={() => setShowSched(v => !v)}>
            {showSched ? 'Close Schedule' : 'Edit Schedule'}
          </button>
          {saving && <span className="cal-saving">Saving…</span>}
        </div>
      </aside>

      {/* ── Page ── */}
      <div className="cal-page">
        <div className="cal-page-header">
          <div>
            <h1 className="cal-title">Practice Calendar</h1>
            <p className="cal-subtitle">Track attendance, mood, dryland, and meets</p>
          </div>
          <img src="/logos/scs.svg" alt="SCS" className="scs-logo-corner" />
        </div>

        <div className="cal-body">

          {/* View tabs */}
          <div className="cal-view-tabs">
            {(['month', 'year', 'career'] as CalView[]).map(v => (
              <button
                key={v}
                className={`cal-view-tab${view === v ? ' active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Schedule editor */}
          {showSched && (
            <div className="cal-card cal-fade-in">
              <h2 className="cal-card-title">Practice Schedule</h2>

              <p className="cal-card-desc">Practice days</p>
              <div className="cal-day-grid">
                {DAY_LABELS.map((lbl, i) => (
                  <button
                    key={i}
                    className={`cal-day-toggle${sched.days.includes(i) ? ' active' : ''}`}
                    onClick={() => handleSchedSave({
                      ...sched,
                      days: sched.days.includes(i)
                        ? sched.days.filter(d => d !== i)
                        : [...sched.days, i],
                    })}
                  >{lbl}</button>
                ))}
              </div>

              <p className="cal-card-desc" style={{ marginTop: 14 }}>Two-session days</p>
              <div className="cal-day-grid">
                {DAY_LABELS.map((lbl, i) => (
                  <button
                    key={i}
                    className={`cal-day-toggle cal-day-toggle--two${sched.twoSessionDays.includes(i) ? ' active' : ''}`}
                    onClick={() => handleSchedSave({
                      ...sched,
                      twoSessionDays: sched.twoSessionDays.includes(i)
                        ? sched.twoSessionDays.filter(d => d !== i)
                        : [...sched.twoSessionDays, i],
                    })}
                  >{lbl}</button>
                ))}
              </div>

              <p className="cal-card-desc" style={{ marginTop: 14 }}>Dryland days</p>
              <div className="cal-day-grid">
                {DAY_LABELS.map((lbl, i) => (
                  <button
                    key={i}
                    className={`cal-day-toggle cal-day-toggle--dryland${sched.drylandDays.includes(i) ? ' active' : ''}`}
                    onClick={() => handleSchedSave({
                      ...sched,
                      drylandDays: sched.drylandDays.includes(i)
                        ? sched.drylandDays.filter(d => d !== i)
                        : [...sched.drylandDays, i],
                    })}
                  >{lbl}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                <div className="cal-field">
                  <label className="cal-field-lbl">Session 1 time</label>
                  <input
                    className="cal-field-input" type="time"
                    value={sched.session1Time}
                    onChange={e => handleSchedSave({ ...sched, session1Time: e.target.value })}
                  />
                </div>
                <div className="cal-field">
                  <label className="cal-field-lbl">Session 2 time</label>
                  <input
                    className="cal-field-input" type="time"
                    value={sched.session2Time}
                    onChange={e => handleSchedSave({ ...sched, session2Time: e.target.value })}
                  />
                </div>
              </div>

              <div className="cal-field" style={{ marginTop: 12 }}>
                <label className="cal-field-lbl">Practice note (optional)</label>
                <input
                  className="cal-field-input"
                  value={sched.practiceNote}
                  onChange={e => handleSchedSave({ ...sched, practiceNote: e.target.value })}
                  placeholder="e.g. 6:00–8:00 AM at Rosemead Aquatics"
                />
              </div>
            </div>
          )}

          {/* ── MONTH VIEW ── */}
          {view === 'month' && (
            <>
              <div className="cal-controls">
                <div className="cal-month-nav">
                  <button className="cal-arrow-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <span className="cal-month-label">{MONTH_NAMES[month]} {year}</span>
                  <button className="cal-arrow-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="cal-controls-right">
                  <button
                    className="cal-today-btn"
                    onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
                  >
                    Today
                  </button>
                  <button className="cal-add-meet-btn" onClick={() => setMeetModal('new')}>
                    <Plus size={13} /> Add Meet
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="cal-grid" key={`${year}-${month}`}>
                {DAY_LABELS.map(d => (
                  <div key={d} className="cal-grid-head">{d}</div>
                ))}

                {Array.from({ length: fday }, (_, i) => (
                  <div key={`b${i}`} className="cal-cell cal-cell--empty" />
                ))}

                {Array.from({ length: dim }, (_, i) => {
                  const day    = i + 1
                  const ds     = iso(year, month, day)
                  const dow    = new Date(year, month, day).getDay()
                  const isPrac = sched.days.includes(dow)
                  const meet   = meetsByDate.get(ds)
                  const dayDat = attn[ds]
                  const isToday = ds === todayStr

                  const hasTwoSched = sched.twoSessionDays.includes(dow)
                  const showS2Dot   = !!(dayDat?.s2 || hasTwoSched)

                  return (
                    <div
                      key={day}
                      className={[
                        'cal-cell',
                        isPrac   ? 'cal-cell--prac'     : '',
                        meet     ? 'cal-cell--meet'     : '',
                        isToday  ? 'cal-cell--today'    : '',
                        (isPrac || meet) ? 'cal-cell--click' : '',
                      ].filter(Boolean).join(' ')}
                      style={{ '--ci': i } as React.CSSProperties}
                      onClick={() => { if (isPrac) setDayModal(ds) }}
                    >
                      <span className={`cal-cell-num${isToday ? ' today' : ''}`}>{day}</span>

                      {meet && (
                        <div
                          className="cal-meet-chip"
                          onClick={e => { e.stopPropagation(); setMeetModal(meet) }}
                        >
                          <span className="cal-meet-chip-name">{meet.name}</span>
                          {meet.mood && <span>{MOOD.emojis[meet.mood]}</span>}
                        </div>
                      )}

                      {isPrac && !meet && (
                        <div className="cal-cell-dots">
                          {(['s1', 's2'] as const).map(key => {
                            if (key === 's2' && !showS2Dot) return null
                            const s = dayDat?.[key] ?? null
                            const color = !s ? '#e2e8f0'
                              : s.status === 'attended'  ? (s.mood ? MOOD.colors[s.mood] : '#22c55e')
                              : s.status === 'cancelled' ? '#94a3b8'
                              : '#ef4444'
                            return (
                              <span
                                key={key}
                                className={`cal-dot${!s ? ' cal-dot--empty' : ''}`}
                                style={{ background: color }}
                                title={s ? `${key.toUpperCase()}: ${s.status}${s.mood ? ` (${MOOD.labels[s.mood]})` : ''}` : `${key.toUpperCase()}: not logged`}
                              />
                            )
                          })}
                          {dayDat?.dryland && (
                            <span
                              className="cal-dot cal-dot--dry"
                              style={{
                                background: DRYLAND_TYPES.find(t => t.id === dayDat.dryland?.type)?.color ?? '#7c3aed',
                              }}
                              title={`Dryland: ${dayDat.dryland.type}`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="cal-legend">
                <span className="cal-legend-item">
                  <span className="cal-dot" style={{ background: '#22c55e' }} /> Attended
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot" style={{ background: '#ef4444' }} /> Absent
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot" style={{ background: '#94a3b8' }} /> Cancelled
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot" style={{ background: '#7c3aed' }} /> Dryland
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot cal-dot--empty" style={{ background: '#e2e8f0' }} /> Not logged
                </span>
              </div>

              {/* Meets this month */}
              {meetsThisMonth.length > 0 && (
                <div className="cal-meets-list">
                  <div className="cal-meets-list-head">
                    <h3 className="cal-meets-title">Meets This Month</h3>
                  </div>
                  {meetsThisMonth.map(m => (
                    <div key={m.id} className="cal-meet-row" onClick={() => setMeetModal(m)}>
                      <span className="cal-meet-date">{fmtShort(m.date)}</span>
                      <span className="cal-meet-name">{m.name}</span>
                      {m.mood && <span className="cal-meet-mood">{MOOD.emojis[m.mood]}</span>}
                      <button
                        className="cal-meet-del"
                        onClick={e => { e.stopPropagation(); handleMeetDelete(m.id) }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Month analysis */}
              <MonthReport
                year={year} month={month}
                attendance={attn} meets={meets} schedule={sched}
              />
            </>
          )}

          {/* ── YEAR VIEW ── */}
          {view === 'year' && (
            <YearView
              year={year} setYear={setYear}
              attendance={attn} meets={meets} schedule={sched}
              onSelectMonth={m => { setMonth(m); setView('month') }}
            />
          )}

          {/* ── CAREER VIEW ── */}
          {view === 'career' && (
            <CareerView attendance={attn} meets={meets} schedule={sched} />
          )}

        </div>
      </div>
    </div>
  )
}
