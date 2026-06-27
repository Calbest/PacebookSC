import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Target, Trash2, ArrowRightLeft, Archive, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TimeConverterPopup from '../components/TimeConverterPopup'
import './Goals.css'

type Course = 'SCY' | 'LCM' | 'SCM'

export interface Goal {
  id: string
  course: Course
  eventId: string
  eventLabel: string
  stroke: string
  currentTime: string
  targetTime: string
  deadline: string
  createdAt: string
}

function toSeconds(t: string): number | null {
  if (!t) return null
  const parts = t.split(':')
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  return parseFloat(t)
}

function formatDeadline(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysLeft(iso: string): number {
  const end = new Date(iso + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function Goals() {
  const navigate = useNavigate()
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [archive,      setArchive]      = useState<Goal[]>([])
  const [times,        setTimes]        = useState<Record<string, string>>({})
  const [showTC,       setShowTC]       = useState(false)
  const [showArchive,  setShowArchive]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      setGoals(user.user_metadata?.goals ?? [])
      setArchive(user.user_metadata?.goalArchive ?? [])
      setTimes(user.user_metadata?.times ?? {})
    })
  }, [navigate])

  function isAchieved(goal: Goal): boolean {
    const liveTime = times[`${goal.course}-${goal.eventId}`] || ''
    const liveSec   = toSeconds(liveTime || goal.currentTime)
    const targetSec = toSeconds(goal.targetTime)
    return liveSec !== null && targetSec !== null && liveSec <= targetSec
  }

  async function deleteGoal(id: string) {
    const updated = goals.filter(g => g.id !== id)
    setGoals(updated)
    await supabase.auth.updateUser({ data: { goals: updated } })
  }

  async function archiveCompleted() {
    const achieved = goals.filter(g => isAchieved(g))
    if (achieved.length === 0) return
    const remaining = goals.filter(g => !isAchieved(g))
    const newArchive = [...archive, ...achieved]
    setGoals(remaining)
    setArchive(newArchive)
    await supabase.auth.updateUser({ data: { goals: remaining, goalArchive: newArchive } })
  }

  return (
    <div className="goals-layout">
      <aside className="goals-sidebar">
        <div className="goals-sidebar-brand">Goals</div>
        <nav className="goals-sidebar-nav">
          <button className="goals-nav-btn" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button className="goals-nav-btn" onClick={() => setShowTC(true)}>
            <ArrowRightLeft size={16} />
            <span>Time Converter</span>
          </button>
        </nav>
      </aside>
      <TimeConverterPopup isOpen={showTC} onClose={() => setShowTC(false)} />

      <div className="goals-page">
        <div className="goals-header">
          <div className="goals-header-info">
            <h1 className="goals-title">My Goals</h1>
            <p className="goals-subtitle">Times you're working toward</p>
          </div>
          <img src="/logos/scs.svg" alt="Southern California Swimming" className="scs-logo-corner" />
        </div>

        <div className="goals-body">
          {/* ── Archive button ── */}
          {goals.some(g => isAchieved(g)) && (
            <button className="goals-archive-btn" onClick={archiveCompleted}>
              <Archive size={14} /> Archive Completed Goals
            </button>
          )}

          {goals.length === 0 ? (
            <div className="goals-empty">
              <Target size={52} className="goals-empty-icon" />
              <h2>No goals yet</h2>
              <p>Set a target time for any event and track your progress toward it.</p>
              <button className="goals-create-btn" onClick={() => navigate('/goals/create')}>
                <Plus size={18} />
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="goals-list">
              {goals.map(goal => {
                const liveTime = times[`${goal.course}-${goal.eventId}`] || ''
                const liveSec   = toSeconds(liveTime || goal.currentTime)
                const targetSec = toSeconds(goal.targetTime)
                const achieved  = liveSec !== null && targetSec !== null && liveSec <= targetSec
                const days      = goal.deadline ? daysLeft(goal.deadline) : null
                const overdue   = days !== null && days < 0

                return (
                  <div
                    key={goal.id}
                    className={`goal-card${achieved ? ' goal-card--achieved' : overdue ? ' goal-card--overdue' : ''}`}
                  >
                    <div className="goal-card-top">
                      <div className="goal-event-row">
                        <span className="goal-event">{goal.eventLabel}</span>
                        <span className={`goal-course-badge goal-course-badge--${goal.course.toLowerCase()}`}>
                          {goal.course}
                        </span>
                      </div>
                      <button
                        className="goal-delete"
                        onClick={() => deleteGoal(goal.id)}
                        title="Delete goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="goal-times">
                      <div className="goal-time-block">
                        <span className="goal-time-label">Current</span>
                        <span className="goal-time-value">
                          {liveTime || goal.currentTime || '—'}
                        </span>
                      </div>
                      <div className="goal-arrow">→</div>
                      <div className="goal-time-block">
                        <span className="goal-time-label">Target</span>
                        <span className={`goal-time-value goal-time-target${achieved ? ' goal-time-target--met' : ''}`}>
                          {goal.targetTime}
                        </span>
                      </div>
                    </div>

                    <div className="goal-footer">
                      {goal.deadline ? (
                        <span className={`goal-deadline${overdue ? ' goal-deadline--overdue' : ''}`}>
                          {overdue
                            ? `Deadline passed — ${formatDeadline(goal.deadline)}`
                            : days === 0
                            ? `Due today — ${formatDeadline(goal.deadline)}`
                            : `${days} day${days === 1 ? '' : 's'} left — ${formatDeadline(goal.deadline)}`
                          }
                        </span>
                      ) : (
                        <span className="goal-deadline">No deadline set</span>
                      )}
                      {achieved && <span className="goal-achieved-badge">✓ Achieved!</span>}
                    </div>
                  </div>
                )
              })}

              <button className="goals-add-btn" onClick={() => navigate('/goals/create')}>
                <Plus size={18} />
                Add another goal
              </button>
            </div>
          )}
          {/* ── Goal Archive section ── */}
          {archive.length > 0 && (
            <div className="goals-archive-section">
              <button className="goals-archive-header" onClick={() => setShowArchive(v => !v)}>
                <Archive size={15} />
                <span>Goal Archive ({archive.length})</span>
                <ChevronDown size={14} className={`goals-archive-chevron${showArchive ? ' open' : ''}`} />
              </button>
              {showArchive && (
                <div className="goals-archive-list">
                  {archive.map(goal => (
                    <div key={goal.id} className="goals-archive-row">
                      <span className="goals-archive-event">{goal.eventLabel} · {goal.course}</span>
                      <span className="goals-archive-time">Target: {goal.targetTime}</span>
                      <span className="goals-archive-badge">✓ Achieved</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
