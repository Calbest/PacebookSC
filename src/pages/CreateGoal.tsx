import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Goal } from './Goals'
import './CreateGoal.css'

type Course = 'SCY' | 'LCM' | 'SCM'

interface EventOption {
  id: string
  stroke: string
  label: string
}

const SCY_FLAT: EventOption[] = [
  { id: '50-free',    stroke: 'Freestyle',         label: '50y Free'    },
  { id: '100-free',   stroke: 'Freestyle',         label: '100y Free'   },
  { id: '200-free',   stroke: 'Freestyle',         label: '200y Free'   },
  { id: '500-free',   stroke: 'Freestyle',         label: '500y Free'   },
  { id: '1000-free',  stroke: 'Freestyle',         label: '1000y Free'  },
  { id: '1650-free',  stroke: 'Freestyle',         label: '1650y Free'  },
  { id: '50-back',    stroke: 'Backstroke',        label: '50y Back'    },
  { id: '100-back',   stroke: 'Backstroke',        label: '100y Back'   },
  { id: '200-back',   stroke: 'Backstroke',        label: '200y Back'   },
  { id: '50-breast',  stroke: 'Breaststroke',      label: '50y Breast'  },
  { id: '100-breast', stroke: 'Breaststroke',      label: '100y Breast' },
  { id: '200-breast', stroke: 'Breaststroke',      label: '200y Breast' },
  { id: '50-fly',     stroke: 'Butterfly',         label: '50y Fly'     },
  { id: '100-fly',    stroke: 'Butterfly',         label: '100y Fly'    },
  { id: '200-fly',    stroke: 'Butterfly',         label: '200y Fly'    },
  { id: '100-im',     stroke: 'Individual Medley', label: '100y IM'     },
  { id: '200-im',     stroke: 'Individual Medley', label: '200y IM'     },
  { id: '400-im',     stroke: 'Individual Medley', label: '400y IM'     },
]

const LCM_FLAT: EventOption[] = [
  { id: '50-free',    stroke: 'Freestyle',         label: '50m Free'    },
  { id: '100-free',   stroke: 'Freestyle',         label: '100m Free'   },
  { id: '200-free',   stroke: 'Freestyle',         label: '200m Free'   },
  { id: '400-free',   stroke: 'Freestyle',         label: '400m Free'   },
  { id: '800-free',   stroke: 'Freestyle',         label: '800m Free'   },
  { id: '1500-free',  stroke: 'Freestyle',         label: '1500m Free'  },
  { id: '50-back',    stroke: 'Backstroke',        label: '50m Back'    },
  { id: '100-back',   stroke: 'Backstroke',        label: '100m Back'   },
  { id: '200-back',   stroke: 'Backstroke',        label: '200m Back'   },
  { id: '50-breast',  stroke: 'Breaststroke',      label: '50m Breast'  },
  { id: '100-breast', stroke: 'Breaststroke',      label: '100m Breast' },
  { id: '200-breast', stroke: 'Breaststroke',      label: '200m Breast' },
  { id: '50-fly',     stroke: 'Butterfly',         label: '50m Fly'     },
  { id: '100-fly',    stroke: 'Butterfly',         label: '100m Fly'    },
  { id: '200-fly',    stroke: 'Butterfly',         label: '200m Fly'    },
  { id: '200-im',     stroke: 'Individual Medley', label: '200m IM'     },
  { id: '400-im',     stroke: 'Individual Medley', label: '400m IM'     },
]

const SCM_FLAT: EventOption[] = LCM_FLAT.map(e => ({ ...e }))

function formatTimeDigits(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 6)
  switch (d.length) {
    case 0: return ''
    case 1:
    case 2: return d
    case 3: return `${d[0]}.${d.slice(1)}`
    case 4: return `${d.slice(0, 2)}.${d.slice(2)}`
    case 5: return `${d[0]}:${d.slice(1, 3)}.${d.slice(3)}`
    case 6: return `${d.slice(0, 2)}:${d.slice(2, 4)}.${d.slice(4)}`
    default: return d
  }
}

export default function CreateGoal() {
  const navigate = useNavigate()
  const comboRef = useRef<HTMLDivElement>(null)

  const [course,        setCourse]        = useState<Course>('SCY')
  const [search,        setSearch]        = useState('')
  const [showDropdown,  setShowDropdown]  = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null)
  const [currentTime,   setCurrentTime]   = useState('')
  const [targetTime,    setTargetTime]    = useState('')
  const [deadline,      setDeadline]      = useState('')
  const [times,         setTimes]         = useState<Record<string, string>>({})
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      setTimes(user.user_metadata?.times ?? {})
    })
  }, [navigate])

  const eventsFlat = course === 'SCY' ? SCY_FLAT : course === 'LCM' ? LCM_FLAT : SCM_FLAT

  const filtered = search.trim()
    ? eventsFlat.filter(e =>
        e.label.toLowerCase().includes(search.toLowerCase()) ||
        e.stroke.toLowerCase().includes(search.toLowerCase())
      )
    : eventsFlat

  function selectEvent(ev: EventOption) {
    setSelectedEvent(ev)
    setSearch(ev.label)
    setShowDropdown(false)
    setCurrentTime(times[`${course}-${ev.id}`] || '')
  }

  function changeCourse(c: Course) {
    setCourse(c)
    setSelectedEvent(null)
    setSearch('')
    setCurrentTime('')
  }

  async function handleSave() {
    setError('')
    if (!selectedEvent) { setError('Please select an event.'); return }
    if (!targetTime)    { setError('Please enter your target time.'); return }

    setSaving(true)
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) { navigate('/'); return }

    const existing: Goal[] = user.user_metadata?.goals ?? []
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      course,
      eventId:    selectedEvent.id,
      eventLabel: `${selectedEvent.stroke} · ${selectedEvent.label}`,
      stroke:     selectedEvent.stroke,
      currentTime,
      targetTime,
      deadline,
      createdAt: new Date().toISOString(),
    }
    await supabase.auth.updateUser({ data: { goals: [...existing, newGoal] } })
    setSaving(false)
    navigate('/goals')
  }

  return (
    <div className="cg-page">
      <div className="cg-header">
        <button className="cg-back" onClick={() => navigate('/goals')}>
          <ArrowLeft size={16} />
          Goals
        </button>
        <h1 className="cg-title">New Goal</h1>
        <img src="/logos/scs.svg" alt="Southern California Swimming" className="scs-logo-corner" />
      </div>

      <div className="cg-body">
        <div className="cg-card">

          {/* Course */}
          <div className="cg-field">
            <label className="cg-label">Course</label>
            <div className="cg-tabs">
              {(['SCY', 'LCM', 'SCM'] as Course[]).map(c => (
                <button
                  key={c}
                  type="button"
                  className={`cg-tab${course === c ? ' active' : ''}`}
                  onClick={() => changeCourse(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Event combobox */}
          <div className="cg-field">
            <label className="cg-label">Event</label>
            <div className="cg-combobox" ref={comboRef}>
              <div className="cg-combobox-wrap">
                <input
                  className="cg-input cg-combobox-input"
                  type="text"
                  placeholder="Search events (e.g. 100 back, fly)…"
                  value={search}
                  autoComplete="off"
                  onChange={e => {
                    setSearch(e.target.value)
                    setShowDropdown(true)
                    setSelectedEvent(null)
                    setCurrentTime('')
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
                <ChevronDown size={16} className="cg-chevron" />
              </div>

              {showDropdown && (
                <div className="cg-dropdown">
                  {filtered.length === 0 ? (
                    <div className="cg-dropdown-empty">No events match your search.</div>
                  ) : (
                    filtered.map(ev => (
                      <button
                        key={ev.id}
                        type="button"
                        className={`cg-option${selectedEvent?.id === ev.id ? ' selected' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => selectEvent(ev)}
                      >
                        <span className="cg-option-stroke">{ev.stroke}</span>
                        <span className="cg-option-label">{ev.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Current time (auto-filled) */}
          <div className="cg-field">
            <label className="cg-label">
              Your Current Time
              <span className="cg-label-hint">
                {selectedEvent ? 'Auto-filled from your dashboard' : 'Select an event first'}
              </span>
            </label>
            <input
              className="cg-input cg-input--prefilled"
              value={currentTime}
              readOnly
              placeholder="—"
            />
          </div>

          {/* Target time */}
          <div className="cg-field">
            <label className="cg-label">Target Time</label>
            <input
              className="cg-input"
              placeholder="Type numbers only, e.g. 4921 → 49.21"
              value={targetTime}
              onChange={e => setTargetTime(formatTimeDigits(e.target.value))}
            />
            <p className="cg-hint">Colons and decimals are placed automatically.</p>
          </div>

          {/* Deadline */}
          <div className="cg-field">
            <label className="cg-label">
              Deadline
              <span className="cg-label-hint">optional</span>
            </label>
            <input
              className="cg-input"
              type="date"
              value={deadline}
              min={tomorrow}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          {error && <p className="cg-error">{error}</p>}

          <div className="cg-actions">
            <button className="cg-cancel" onClick={() => navigate('/goals')}>Cancel</button>
            <button className="cg-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
