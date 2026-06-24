import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Check, User, LogOut, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

type EventEntry = { id: string; label: string }
type StrokeGroup = { stroke: string; events: EventEntry[] }

const LCM_EVENTS: StrokeGroup[] = [
  {
    stroke: 'Freestyle',
    events: [
      { id: '50-free',  label: '50m' },
      { id: '100-free', label: '100m' },
      { id: '200-free', label: '200m' },
      { id: '400-free', label: '400m' },
      { id: '800-free', label: '800m' },
      { id: '1500-free',label: '1500m' },
    ],
  },
  {
    stroke: 'Backstroke',
    events: [
      { id: '50-back',  label: '50m' },
      { id: '100-back', label: '100m' },
      { id: '200-back', label: '200m' },
    ],
  },
  {
    stroke: 'Breaststroke',
    events: [
      { id: '50-breast',  label: '50m' },
      { id: '100-breast', label: '100m' },
      { id: '200-breast', label: '200m' },
    ],
  },
  {
    stroke: 'Butterfly',
    events: [
      { id: '50-fly',  label: '50m' },
      { id: '100-fly', label: '100m' },
      { id: '200-fly', label: '200m' },
    ],
  },
  {
    stroke: 'Individual Medley',
    events: [
      { id: '200-im', label: '200m' },
      { id: '400-im', label: '400m' },
    ],
  },
  {
    stroke: 'Relays',
    events: [
      { id: 'relay-4x50-free',    label: '4×50 Free' },
      { id: 'relay-4x100-free',   label: '4×100 Free' },
      { id: 'relay-4x200-free',   label: '4×200 Free' },
      { id: 'relay-4x100-medley', label: '4×100 Medley' },
      { id: 'relay-4x200-medley', label: '4×200 Medley' },
    ],
  },
]

const SCY_EVENTS: StrokeGroup[] = [
  {
    stroke: 'Freestyle',
    events: [
      { id: '50-free',   label: '50y' },
      { id: '100-free',  label: '100y' },
      { id: '200-free',  label: '200y' },
      { id: '500-free',  label: '500y' },
      { id: '1000-free', label: '1000y' },
      { id: '1650-free', label: '1650y' },
    ],
  },
  {
    stroke: 'Backstroke',
    events: [
      { id: '50-back',  label: '50y' },
      { id: '100-back', label: '100y' },
      { id: '200-back', label: '200y' },
    ],
  },
  {
    stroke: 'Breaststroke',
    events: [
      { id: '50-breast',  label: '50y' },
      { id: '100-breast', label: '100y' },
      { id: '200-breast', label: '200y' },
    ],
  },
  {
    stroke: 'Butterfly',
    events: [
      { id: '50-fly',  label: '50y' },
      { id: '100-fly', label: '100y' },
      { id: '200-fly', label: '200y' },
    ],
  },
  {
    stroke: 'Individual Medley',
    events: [
      { id: '100-im', label: '100y' },
      { id: '200-im', label: '200y' },
      { id: '400-im', label: '400y' },
    ],
  },
  {
    stroke: 'Relays',
    events: [
      { id: 'relay-4x50-free',    label: '4×50 Free' },
      { id: 'relay-4x100-free',   label: '4×100 Free' },
      { id: 'relay-4x200-free',   label: '4×200 Free' },
      { id: 'relay-4x100-medley', label: '4×100 Medley' },
    ],
  },
]

type Course = 'SCY' | 'LCM'
type Times = Record<string, string>
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function calcAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Formats raw digits into MM:SS.ss / M:SS.ss / SS.ss as the user types.
// Works right-to-left: last 2 digits are always hundredths, next 2 are seconds, rest is minutes.
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

// Returns true if the seconds portion of a formatted time is 00–59.
function isValidTime(value: string): boolean {
  if (value.length <= 2) return true // still typing
  const match = value.match(/(?:^|:)(\d{2})\./)
  if (!match) return true
  return parseInt(match[1], 10) <= 59
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [username,    setUsername]    = useState('')
  const [fullName,    setFullName]    = useState('')
  const [gender,      setGender]      = useState('')
  const [age,         setAge]         = useState<number | null>(null)
  const [avatarUrl,   setAvatarUrl]   = useState('')
  const [course,      setCourse]      = useState<Course>('SCY')
  const [editing,     setEditing]     = useState(false)
  const [times,       setTimes]       = useState<Times>({})
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>('idle')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      setUsername(user.user_metadata?.username || user.email || 'Swimmer')
      setFullName(user.user_metadata?.full_name || '')
      setGender(user.user_metadata?.gender || '')
      setAge(calcAge(user.user_metadata?.dob || ''))
      setAvatarUrl(user.user_metadata?.avatar_url || '')
      setTimes(user.user_metadata?.times || {})
    })
  }, [navigate])

  const persistTimes = useCallback((nextTimes: Times) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase.auth.updateUser({ data: { times: nextTimes } })
      if (error) { setSaveStatus('error'); return }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 700)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const groups = course === 'LCM' ? LCM_EVENTS : SCY_EVENTS

  function timeKey(c: Course, eventId: string) {
    return `${c}-${eventId}`
  }

  function handleTimeChange(eventId: string, raw: string) {
    const formatted = formatTimeDigits(raw)
    setTimes(prev => {
      const next = { ...prev, [timeKey(course, eventId)]: formatted }
      persistTimes(next)
      return next
    })
  }

  return (
    <div className="dash-layout">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-profile">
          <div className="dash-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" className="dash-avatar-img" />
              : <User size={30} />
            }
          </div>
          <span className="dash-username">{fullName || username || '—'}</span>
          <div className="dash-badges">
            {age !== null && <span className="dash-age">Age {age}</span>}
            {gender && <span className={`dash-gender dash-gender--${gender}`}>{gender === 'male' ? 'Male' : 'Female'}</span>}
          </div>
        </div>

        {/* TODO: Add nav links here (Calendar, Meet Comparison, etc.) */}
        <div className="dash-nav-placeholder" />

        <button className="dash-compare" onClick={() => navigate('/compare')}>
          <span className="dash-compare-icon">⇌</span>
          <span>Compare Standards</span>
        </button>

        <button className="dash-settings" onClick={() => navigate('/settings')}>
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <button className="dash-signout" onClick={handleSignOut}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">

        <h1 className="dash-welcome">
          Welcome, {fullName || username || '…'}
          {age !== null && <span className="dash-welcome-age">Age {age}</span>}
          {gender && <span className={`dash-welcome-gender dash-welcome-gender--${gender}`}>{gender === 'male' ? 'Male' : 'Female'}</span>}
        </h1>

        {/* ── Times Panel ── */}
        <section className="times-panel">
          <div className="times-toolbar">
            <div className="times-tabs">
              <button
                className={`times-tab${course === 'SCY' ? ' active' : ''}`}
                onClick={() => setCourse('SCY')}
              >
                SCY
              </button>
              <button
                className={`times-tab${course === 'LCM' ? ' active' : ''}`}
                onClick={() => setCourse('LCM')}
              >
                LCM
              </button>
            </div>

            <div className="toolbar-right">
              {editing && (
                <span className={`save-status save-status--${saveStatus}`}>
                  {saveStatus === 'saving' && 'Saving…'}
                  {saveStatus === 'saved'  && '✓ Saved'}
                  {saveStatus === 'error'  && 'Error saving'}
                </span>
              )}
              <button
                className={`edit-btn${editing ? ' active' : ''}`}
                onClick={() => setEditing(e => !e)}
              >
                {editing ? <Check size={15} /> : <Pencil size={15} />}
                {editing ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>

          {editing && (
            <div className="times-format-hint">
              Type <strong>numbers only</strong> — the <strong>:</strong> and <strong>.</strong> are placed automatically.
              &thinsp; Example: type <code>10234</code> to get <strong>1:02.34</strong>.
              &thinsp; Seconds must be 00–59.
            </div>
          )}

          <div className="times-grid">
            {groups.map(({ stroke, events }) => (
              <div
                key={stroke}
                className={`stroke-group${stroke === 'Relays' ? ' stroke-group--relay' : ''}`}
              >
                <h3 className="stroke-heading">{stroke}</h3>
                {events.map(({ id, label }) => (
                  <div key={id} className="event-row">
                    <span className="event-label">{label}</span>
                    {editing ? (
                      <input
                        className={`time-input${isValidTime(times[timeKey(course, id)] ?? '') ? '' : ' time-input--error'}`}
                        placeholder="e.g. 10234"
                        value={times[timeKey(course, id)] ?? ''}
                        onChange={e => handleTimeChange(id, e.target.value)}
                      />
                    ) : (
                      <span className="time-value">
                        {times[timeKey(course, id)] || '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* TODO: Add Calendar, Meet Comparison, Progress Chart sections here */}

      </main>
    </div>
  )
}
