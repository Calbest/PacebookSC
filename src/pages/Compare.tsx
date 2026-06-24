import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LOCATIONS, getStandards } from '../lib/standards'
import './Compare.css'

const ALL_EVENTS = [
  { stroke: 'Freestyle',        events: ['50','100','200','400','800','1500'] },
  { stroke: 'Backstroke',       events: ['50','100','200'] },
  { stroke: 'Breaststroke',     events: ['50','100','200'] },
  { stroke: 'Butterfly',        events: ['50','100','200'] },
  { stroke: 'Individual Medley',events: ['200','400'] },
]

const SCY_EVENTS = [
  { stroke: 'Freestyle',        events: ['50','100','200','500','1000','1650'] },
  { stroke: 'Backstroke',       events: ['50','100','200'] },
  { stroke: 'Breaststroke',     events: ['50','100','200'] },
  { stroke: 'Butterfly',        events: ['50','100','200'] },
  { stroke: 'Individual Medley',events: ['100','200','400'] },
]

// Converts a formatted time string to total seconds for comparison
function toSeconds(t: string): number | null {
  if (!t || t === '—') return null
  const parts = t.split(':')
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(t)
}

type Course = 'SCY' | 'LCM'

export default function Compare() {
  const navigate  = useNavigate()
  const [course,          setCourse]          = useState<Course>('SCY')
  const [times,           setTimes]           = useState<Record<string, string>>({})
  const [locationVal,     setLocationVal]     = useState('')
  const [selectedStandard, setSelectedStandard] = useState('')
  const [gender,          setGender]          = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      const m = user.user_metadata ?? {}
      setTimes(m.times ?? {})
      setLocationVal(m.location ?? '')
      setSelectedStandard(m.time_standard ?? '')
      setGender(m.gender ?? '')
    })
  }, [navigate])

  const locationLabel  = LOCATIONS.find(l => l.value === locationVal)?.label ?? locationVal
  const standards      = getStandards(locationVal)
  const standardLabel  = standards.find(s => s.value === selectedStandard)?.label ?? selectedStandard

  const groups = course === 'SCY' ? SCY_EVENTS : ALL_EVENTS
  const unit   = course === 'SCY' ? 'y' : 'm'

  function timeKey(eventId: string) {
    return `${course}-${eventId}`
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <button className="compare-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <div className="compare-header-info">
          <h1 className="compare-title">Compare Times</h1>
          {locationVal && standardVal && (
            <p className="compare-subtitle">
              {locationLabel} — {standardLabel}
              {gender && <span className="compare-gender-tag">{gender === 'male' ? 'Male' : 'Female'}</span>}
            </p>
          )}
        </div>
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
          </div>

          {standards.length > 0 && (
            <div className="compare-standard-picker">
              <label className="compare-standard-label">Standard</label>
              <select
                className="compare-standard-select"
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value)}
              >
                {standards.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
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
              {events.map(dist => {
                const id        = `${dist}-${stroke.split(' ')[0].toLowerCase()}`
                const userTime  = times[timeKey(id)] || ''
                const userSec   = toSeconds(userTime)
                const cutTime   = ''   // placeholder — add real cuts to standards.ts
                const cutSec    = toSeconds(cutTime)

                let status: 'met' | 'not-met' | 'no-time' | 'no-cut' = 'no-cut'
                if (!userTime)          status = 'no-time'
                else if (!cutSec)       status = 'no-cut'
                else if (userSec !== null && userSec <= cutSec) status = 'met'
                else                    status = 'not-met'

                return (
                  <div key={dist} className="compare-row">
                    <span className="compare-event">{dist}{unit}</span>
                    <span className="compare-time">{userTime || '—'}</span>
                    <span className="compare-cut">{cutTime || '—'}</span>
                    <span className={`compare-status compare-status--${status}`}>
                      {status === 'met'     && '✓ Meets cut'}
                      {status === 'not-met' && '✗ Below cut'}
                      {status === 'no-time' && 'No time entered'}
                      {status === 'no-cut'  && 'Cut coming soon'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
