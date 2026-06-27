import { useState } from 'react'
import './OnboardingModal.css'

interface Props {
  name: string
  onDone: () => void
}

const SLIDES = [
  {
    emoji: '👋',
    title: (name: string) => `Welcome, ${name || 'swimmer'}!`,
    body: 'SwimSync is your personal training hub. Let\'s take 30 seconds to show you around so you can hit the water running.',
    visual: 'welcome',
  },
  {
    emoji: '🗂️',
    title: () => 'Navigate with the sidebar',
    body: 'The sidebar on the left is your main navigation. Each icon takes you to a different section of the app.',
    visual: 'sidebar',
  },
  {
    emoji: '⏱️',
    title: () => 'Enter your best times',
    body: 'Head to Compare Times to log your personal bests. Your times power your qualification checks, goal tracking, and progress charts.',
    visual: 'times',
  },
  {
    emoji: '📅',
    title: () => 'Plan your season',
    body: 'Use the Calendar to log practices and the Event Planning page to prep for upcoming meets — including which events to enter.',
    visual: 'calendar',
  },
  {
    emoji: '🚀',
    title: () => 'You\'re all set!',
    body: 'You can revisit this tutorial any time in Settings → Tutorial tab. Now go drop some time.',
    visual: 'done',
  },
]

const NAV_ITEMS = [
  { icon: '⇌', label: 'Compare' },
  { icon: '🏆', label: 'Quals'   },
  { icon: '🎯', label: 'Goals'   },
  { icon: '📈', label: 'Progress'},
  { icon: '📅', label: 'Calendar'},
  { icon: '📚', label: 'Media'   },
  { icon: '👥', label: 'Friends' },
]

function SlideVisual({ type, activeNav }: { type: string; activeNav: number }) {
  if (type === 'welcome') {
    return (
      <div className="ob-visual ob-visual--welcome">
        <div className="ob-pool-lane"><span /><span /><span /><span /><span /></div>
        <div className="ob-welcome-badge">🏊 SwimSync</div>
        <div className="ob-welcome-rings">
          <div className="ob-ring ob-ring--1" />
          <div className="ob-ring ob-ring--2" />
          <div className="ob-ring ob-ring--3" />
        </div>
      </div>
    )
  }

  if (type === 'sidebar') {
    return (
      <div className="ob-visual ob-visual--sidebar">
        <div className="ob-mock-app">
          <div className="ob-mock-rail">
            <div className="ob-mock-rail-logo" />
            {NAV_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`ob-mock-rail-btn${i === activeNav ? ' ob-mock-rail-btn--active' : ''}`}
              >
                <span className="ob-mock-rail-icon">{item.icon}</span>
                <span className="ob-mock-rail-label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="ob-mock-content">
            <div className="ob-mock-bar ob-mock-bar--lg" />
            <div className="ob-mock-bar ob-mock-bar--md" />
            <div className="ob-mock-bar ob-mock-bar--sm" />
            <div className="ob-mock-cards">
              <div className="ob-mock-card" />
              <div className="ob-mock-card" />
              <div className="ob-mock-card" />
            </div>
          </div>
        </div>
        <div className="ob-sidebar-arrow">← tap any icon to navigate</div>
      </div>
    )
  }

  if (type === 'times') {
    return (
      <div className="ob-visual ob-visual--times">
        <div className="ob-times-card">
          <div className="ob-times-header">Compare Times</div>
          {[
            { event: '100 Free', time: '48.21', color: '#22c55e' },
            { event: '200 Free', time: '1:52.44', color: '#3b82f6' },
            { event: '100 Back', time: '55.03', color: '#f59e0b' },
          ].map(({ event, time, color }) => (
            <div key={event} className="ob-times-row">
              <span className="ob-times-event">{event}</span>
              <span className="ob-times-badge" style={{ background: color + '22', color }}>
                {time}
              </span>
            </div>
          ))}
          <div className="ob-times-btn">+ Add time</div>
        </div>
      </div>
    )
  }

  if (type === 'calendar') {
    return (
      <div className="ob-visual ob-visual--calendar">
        <div className="ob-cal-card">
          <div className="ob-cal-header">
            <span>◀</span>
            <span className="ob-cal-month">June 2026</span>
            <span>▶</span>
          </div>
          <div className="ob-cal-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="ob-cal-dow">{d}</div>
            ))}
            {Array.from({ length: 30 }, (_, i) => {
              const isPrac = [1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25].includes(i + 2)
              const isToday = i === 24
              return (
                <div
                  key={i}
                  className={`ob-cal-day${isPrac ? ' ob-cal-day--prac' : ''}${isToday ? ' ob-cal-day--today' : ''}`}
                >
                  {i + 2}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'done') {
    return (
      <div className="ob-visual ob-visual--done">
        <div className="ob-done-circle">
          <span className="ob-done-check">✓</span>
        </div>
        <div className="ob-done-sparkles">
          {['✦','✦','✦','✦','✦','✦'].map((s, i) => (
            <span key={i} className="ob-done-sparkle" style={{ '--i': i } as React.CSSProperties}>{s}</span>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default function OnboardingModal({ name, onDone }: Props) {
  const [slide, setSlide] = useState(0)
  const [activeNav, setActiveNav] = useState(0)

  const total = SLIDES.length
  const s = SLIDES[slide]
  const isLast = slide === total - 1

  // Cycle sidebar highlight
  const next = () => {
    if (isLast) { onDone(); return }
    setSlide(n => n + 1)
    if (slide === 1) setActiveNav(n => (n + 1) % NAV_ITEMS.length)
  }

  return (
    <div className="ob-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('ob-overlay')) onDone() }}>
      <div className="ob-modal">

        {/* Skip */}
        <button className="ob-skip" onClick={onDone}>Skip</button>

        {/* Visual */}
        <SlideVisual type={s.visual} activeNav={activeNav} />

        {/* Text */}
        <div className="ob-text">
          <h2 className="ob-title">{s.title(name)}</h2>
          <p className="ob-body">{s.body}</p>
        </div>

        {/* Dots */}
        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ob-dot${slide === i ? ' active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Action */}
        <button className="ob-next" onClick={next}>
          {isLast ? "Let's go 🏊" : 'Next →'}
        </button>

      </div>
    </div>
  )
}
