import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  SCS_STANDARDS, getAgeGroup, getCut,
  type StdLevel,
} from '../lib/scsStandards'
import './Compare.css'

type Course = 'SCY' | 'LCM' | 'SCM'

const SCY_GROUPS = [
  { stroke: 'Freestyle', events: [
    { id: '50-free',    label: '50y'   },
    { id: '100-free',   label: '100y'  },
    { id: '200-free',   label: '200y'  },
    { id: '500-free',   label: '500y'  },
    { id: '1000-free',  label: '1000y' },
    { id: '1650-free',  label: '1650y' },
  ]},
  { stroke: 'Backstroke', events: [
    { id: '50-back',  label: '50y'  },
    { id: '100-back', label: '100y' },
    { id: '200-back', label: '200y' },
  ]},
  { stroke: 'Breaststroke', events: [
    { id: '50-breast',  label: '50y'  },
    { id: '100-breast', label: '100y' },
    { id: '200-breast', label: '200y' },
  ]},
  { stroke: 'Butterfly', events: [
    { id: '50-fly',  label: '50y'  },
    { id: '100-fly', label: '100y' },
    { id: '200-fly', label: '200y' },
  ]},
  { stroke: 'Individual Medley', events: [
    { id: '100-im', label: '100y' },
    { id: '200-im', label: '200y' },
    { id: '400-im', label: '400y' },
  ]},
]

const LCM_GROUPS = [
  { stroke: 'Freestyle', events: [
    { id: '50-free',   label: '50m'   },
    { id: '100-free',  label: '100m'  },
    { id: '200-free',  label: '200m'  },
    { id: '400-free',  label: '400m'  },
    { id: '800-free',  label: '800m'  },
    { id: '1500-free', label: '1500m' },
  ]},
  { stroke: 'Backstroke', events: [
    { id: '50-back',  label: '50m'  },
    { id: '100-back', label: '100m' },
    { id: '200-back', label: '200m' },
  ]},
  { stroke: 'Breaststroke', events: [
    { id: '50-breast',  label: '50m'  },
    { id: '100-breast', label: '100m' },
    { id: '200-breast', label: '200m' },
  ]},
  { stroke: 'Butterfly', events: [
    { id: '50-fly',  label: '50m'  },
    { id: '100-fly', label: '100m' },
    { id: '200-fly', label: '200m' },
  ]},
  { stroke: 'Individual Medley', events: [
    { id: '200-im', label: '200m' },
    { id: '400-im', label: '400m' },
  ]},
]

const SCM_GROUPS = [
  { stroke: 'Freestyle', events: [
    { id: '50-free',   label: '50m'   },
    { id: '100-free',  label: '100m'  },
    { id: '200-free',  label: '200m'  },
    { id: '400-free',  label: '400m'  },
    { id: '800-free',  label: '800m'  },
    { id: '1500-free', label: '1500m' },
  ]},
  { stroke: 'Backstroke', events: [
    { id: '50-back',  label: '50m'  },
    { id: '100-back', label: '100m' },
    { id: '200-back', label: '200m' },
  ]},
  { stroke: 'Breaststroke', events: [
    { id: '50-breast',  label: '50m'  },
    { id: '100-breast', label: '100m' },
    { id: '200-breast', label: '200m' },
  ]},
  { stroke: 'Butterfly', events: [
    { id: '50-fly',  label: '50m'  },
    { id: '100-fly', label: '100m' },
    { id: '200-fly', label: '200m' },
  ]},
  { stroke: 'Individual Medley', events: [
    { id: '200-im', label: '200m' },
    { id: '400-im', label: '400m' },
  ]},
]

function calcAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function toSeconds(t: string): number | null {
  if (!t || t === '—') return null
  const parts = t.split(':')
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  return parseFloat(t)
}

export default function Compare() {
  const navigate = useNavigate()
  const [course,           setCourse]           = useState<Course>('SCY')
  const [times,            setTimes]            = useState<Record<string, string>>({})
  const [dob,              setDob]              = useState('')
  const [gender,           setGender]           = useState('')
  const [selectedStandard, setSelectedStandard] = useState<StdLevel>('a')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      const m = user.user_metadata ?? {}
      setTimes(m.times ?? {})
      setDob(m.dob ?? '')
      setGender(m.gender ?? '')
    })
  }, [navigate])

  const age      = calcAge(dob)
  const ageGroup = getAgeGroup(age)
  const agData   = SCS_STANDARDS[ageGroup]
  const allLevels = agData?.levels ?? (['a', 'b'] as StdLevel[])
  const labels    = agData?.labels ?? { a: 'A Standard', b: 'B Standard' }

  const SCS_MEET_KEYS: StdLevel[] = ['wag', 'sprAG', 'jag', 'eliteCh', 'sag']
  const levels = allLevels.filter(l => !SCS_MEET_KEYS.includes(l))

  // Keep selected standard in sync when age group changes
  const safeStandard: StdLevel = levels.includes(selectedStandard) ? selectedStandard : levels[0] ?? 'a'

  const groups = course === 'SCY' ? SCY_GROUPS : course === 'LCM' ? LCM_GROUPS : SCM_GROUPS

  function timeKey(eventId: string) {
    return `${course}-${eventId}`
  }

  const ageGroupLabel =
    ageGroup === '8u'  ? '8 & Under' :
    ageGroup === '10u' ? '10 & Under' :
    ageGroup === '1112' ? '11-12' :
    ageGroup === '1314' ? '13-14' :
    ageGroup === '1516' ? '15-16' :
    ageGroup === '1718' ? '17-18' : ''

  return (
    <div className="compare-layout">

      {/* ── Sidebar ── */}
      <aside className="compare-sidebar">
        <div className="compare-sidebar-brand">Compare Times</div>
        <nav className="compare-sidebar-nav">
          <button className="compare-nav-btn" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="compare-page">
        <div className="compare-header">
          <div className="compare-header-info">
            <h1 className="compare-title">Compare Times</h1>
            <p className="compare-subtitle">
              Southern California Swimming
              {ageGroupLabel && <span> · {ageGroupLabel}</span>}
              {gender && (
                <span className="compare-gender-tag">
                  {gender === 'male' ? 'Male' : 'Female'}
                </span>
              )}
            </p>
          </div>
          <img src="/logos/scs.svg" alt="Southern California Swimming" className="scs-logo-corner" />
        </div>

        <div className="compare-body">
          <div className="compare-controls">
            <div className="compare-tabs">
              <button
                className={`compare-tab${course === 'SCY' ? ' active' : ''}`}
                onClick={() => setCourse('SCY')}
              >SCY</button>
              <button
                className={`compare-tab${course === 'LCM' ? ' active' : ''}`}
                onClick={() => setCourse('LCM')}
              >LCM</button>
              <button
                className={`compare-tab${course === 'SCM' ? ' active' : ''}`}
                onClick={() => setCourse('SCM')}
              >SCM</button>
            </div>

            <div className="compare-standard-picker">
              <label className="compare-standard-label">Standard</label>
              <select
                className="compare-standard-select"
                value={safeStandard}
                onChange={e => setSelectedStandard(e.target.value as StdLevel)}
              >
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>{labels[lvl] ?? lvl}</option>
                ))}
              </select>
            </div>

            {!ageGroup && (
              <p className="compare-note">
                Add your birthday in Settings to see age-group cut times.
              </p>
            )}
          </div>

          {groups.map(({ stroke, events }) => (
            <div key={stroke} className="compare-group">
              <h2 className="compare-group-title">{stroke}</h2>
              <div className="compare-table">
                <div className="compare-table-head">
                  <span>Event</span>
                  <span>Your Time</span>
                  <span>Standard Cut</span>
                  <span>Status</span>
                </div>
                {events.map(({ id, label }) => {
                  const userTime = times[timeKey(id)] || ''
                  const cutTime  = getCut(ageGroup, gender, course, id, safeStandard)
                  const userSec  = toSeconds(userTime)
                  const cutSec   = toSeconds(cutTime)

                  let status: 'met' | 'not-met' | 'no-time' | 'no-cut' = 'no-cut'
                  if (!userTime)                                            status = 'no-time'
                  else if (!cutSec)                                         status = 'no-cut'
                  else if (userSec !== null && userSec <= cutSec)           status = 'met'
                  else                                                      status = 'not-met'

                  return (
                    <div key={id} className="compare-row">
                      <span className="compare-event">{label}</span>
                      <span className="compare-time">{userTime || '—'}</span>
                      <span className="compare-cut">{cutTime || '—'}</span>
                      <span className={`compare-status compare-status--${status}`}>
                        {status === 'met'     && '✓ Meets cut'}
                        {status === 'not-met' && '✗ Below cut'}
                        {status === 'no-time' && 'No time entered'}
                        {status === 'no-cut'  && '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
