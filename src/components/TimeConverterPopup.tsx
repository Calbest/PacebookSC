import { useState, useEffect, useRef } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import './TimeConverterPopup.css'

type Course = 'SCY' | 'SCM' | 'LCM'

const POOL_FACTORS: Record<Course, number> = { SCY: 1.0, SCM: 1.11, LCM: 1.145 }
const STROKE_MULT: Record<string, number> = {
  freestyle: 1.0, backstroke: 1.01, breaststroke: 1.015, butterfly: 1.01, im: 1.01,
}
const DIST_BIAS: Record<string, number> = {
  '50':1,'100':1,'200':0.998,'400':0.996,'500':0.995,
  '800':0.994,'1000':0.993,'1500':0.992,'1650':0.991,
}

function parseTime(s: string): number | null {
  s = s.trim()
  if (!s) return null
  const parts = s.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10), sec = parseFloat(parts[1])
    if (isNaN(m) || isNaN(sec)) return null
    return m * 60 + sec
  }
  const sec = parseFloat(s)
  return isNaN(sec) ? null : sec
}

function fmt(sec: number): string {
  if (sec < 60) return sec.toFixed(2)
  const m = Math.floor(sec / 60)
  return `${m}:${(sec - m * 60).toFixed(2).padStart(5, '0')}`
}

function convert(t: number, from: Course, to: Course, stroke: string, dist: string): number {
  if (from === to) return t
  return t * (POOL_FACTORS[to] / POOL_FACTORS[from])
    * (1 + (STROKE_MULT[stroke] - 1) * 0.5)
    * (DIST_BIAS[dist] ?? 1)
}

const COURSES: Course[] = ['SCY', 'SCM', 'LCM']
const STROKES = [
  { value: 'freestyle', label: 'Free' },
  { value: 'backstroke', label: 'Back' },
  { value: 'breaststroke', label: 'Breast' },
  { value: 'butterfly', label: 'Fly' },
  { value: 'im', label: 'IM' },
]
const DISTS = ['50','100','200','400','500','800','1000','1500','1650']

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function TimeConverterPopup({ isOpen, onClose }: Props) {
  const [input,  setInput]  = useState('')
  const [from,   setFrom]   = useState<Course>('SCY')
  const [stroke, setStroke] = useState('freestyle')
  const [dist,   setDist]   = useState('100')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const parsed = parseTime(input)
  const others = COURSES.filter(c => c !== from)

  return (
    <div className="tcp-overlay">
      <div className="tcp-panel" ref={ref}>
        <div className="tcp-header">
          <span className="tcp-title">Time Converter</span>
          <button className="tcp-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="tcp-controls">
          <select className="tcp-select" value={dist} onChange={e => setDist(e.target.value)}>
            {DISTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="tcp-select" value={stroke} onChange={e => setStroke(e.target.value)}>
            {STROKES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="tcp-input-row">
          <select className="tcp-course-select" value={from} onChange={e => setFrom(e.target.value as Course)}>
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="tcp-input"
            placeholder="52.45 or 1:52.45"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            autoFocus
          />
          <button className="tcp-cycle" onClick={() => setFrom(c => COURSES[(COURSES.indexOf(c)+1)%3])} title="Cycle course">
            <ArrowRightLeft size={13} />
          </button>
        </div>

        <div className="tcp-results">
          {others.map(c => {
            const val = parsed !== null ? fmt(convert(parsed, from, c, stroke, dist)) : '—'
            return (
              <div key={c} className="tcp-result">
                <span className="tcp-result-course">{c}</span>
                <span className="tcp-result-time">{val}</span>
              </div>
            )
          })}
        </div>

        <p className="tcp-note">Estimates only — FINA approximation model</p>
      </div>
    </div>
  )
}
