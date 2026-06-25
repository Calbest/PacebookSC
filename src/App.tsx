import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.75l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.71a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon fill="white" points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02"/>
    </svg>
  )
}

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="nav-brand">
          <img src="/logo.svg" alt="SwimSCPlan brand mark with a stylized wave and the text SwimSCPlan" className="nav-logo-img" />
          <span className="nav-logo">SwimSCPlan</span>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate('/sign-in')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/create-account')}>Create Account</button>
        </div>
      </header>

      {/* ── Hero / Inspiration ── */}
      <section className="hero">
        <div className="hero-text">
          <h1>Train Smarter.<br />Swim Faster.</h1>
          <p className="hero-sub">
            {/* TODO: Replace with your one-line inspiration / tagline */}
            The planning tool built for swimmers who are serious about the sport.
          </p>
        </div>
        <img src="/Hero.jpg" alt="Swimmer performing a freestyle stroke in an indoor pool" className="hero-img" />
      </section>

      {/* ── Purpose Section ── */}
      <section className="purpose">
        <h2 data-reveal>What is SwimSCPlan?</h2>
        <ul className="purpose-list">
          <li data-reveal data-reveal-delay="1">Compare all your swim event times against upcoming meet cut times at a glance</li>
          <li data-reveal data-reveal-delay="2">Track your progress over time and watch yourself improve as you grow</li>
          <li data-reveal data-reveal-delay="3">Built-in calendar to organize and keep up with all your upcoming meets</li>
          <li data-reveal data-reveal-delay="4">Highlights the events where your times are closest to qualifying cuts so you know exactly where to focus</li>
        </ul>
      </section>

      {/* ── Features ── */}
      <section className="features">
        <h2 data-reveal>Everything you need in one place</h2>
        <div className="features-grid">
          <div className="feature-card" data-reveal data-reveal-delay="1">
            <div className="feature-img-placeholder">
              {/* TODO: Replace with calendar screenshot */}
              <span>Calendar Image</span>
            </div>
            <h3 className="feature-title">Meet Calendar</h3>
            <p className="feature-blurb">
              See all your upcoming meets in one view. Never miss a registration
              deadline or warm-up time again.
            </p>
          </div>

          <div className="feature-card" data-reveal data-reveal-delay="2">
            <div className="feature-img-placeholder">
              {/* TODO: Replace with event list screenshot */}
              <span>Event List Image</span>
            </div>
            <h3 className="feature-title">Event Time Comparison</h3>
            <p className="feature-blurb">
              Line up your personal bests next to meet cut times and instantly
              see which events you're closest to qualifying for.
            </p>
          </div>

          <div className="feature-card" data-reveal data-reveal-delay="3">
            <div className="feature-img-placeholder">
              {/* TODO: Replace with progress chart screenshot */}
              <span>Progress Chart Image</span>
            </div>
            <h3 className="feature-title">Progress Tracker</h3>
            <p className="feature-blurb">
              Watch your times drop over seasons with visual charts that show
              exactly how far you've come since you started.
            </p>
          </div>
        </div>
      </section>

      {/* ── About / Inspiration ── */}
      <section className="about">
        <div className="about-inner">
          <div className="about-text">
            <span className="about-badge" data-reveal>Our Story</span>
            <h2 data-reveal data-reveal-delay="1">Built by a swimmer,<br />for swimmers.</h2>
            <p className="about-body" data-reveal data-reveal-delay="2">
              SwimSCPlan was created out of frustration with scattered spreadsheets and PDF
              standards sheets. I wanted one place that knew my times, knew the SCS cuts, and
              told me exactly where I stood — without digging through documents before every meet.
            </p>
            <p className="about-inspiration" data-reveal data-reveal-delay="3">
              The inspiration? Every swimmer deserves a clear goal to chase and real data to
              back it up — not just a gut feeling. Whether you're chasing your first WAG cut or
              shaving tenths off your 50 fly, you should always know how close you are.
            </p>
          </div>
          <div className="about-quote-col" data-reveal data-reveal-delay="2">
            <blockquote className="about-quote">
              "You can't improve what you don't measure. Start tracking, start dropping time."
            </blockquote>
            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-num">5</span>
                <span className="about-stat-label">Age groups</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">3</span>
                <span className="about-stat-label">Course types</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">9+</span>
                <span className="about-stat-label">Standards tracked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Connect / Socials ── */}
      <section className="connect">
        <div className="connect-inner">
          <h2 data-reveal>Connect</h2>
          <p className="connect-sub" data-reveal data-reveal-delay="1">
            Follow the journey and share your swimming progress.
          </p>
          <div className="connect-grid">
            {/* Replace href="#" with your actual social links */}
            <a href="#" className="connect-card" data-reveal data-reveal-delay="1">
              <span className="connect-icon"><InstagramIcon /></span>
              <span className="connect-platform">Instagram</span>
              <span className="connect-handle">@your_handle</span>
            </a>
            <a href="#" className="connect-card" data-reveal data-reveal-delay="2">
              <span className="connect-icon"><XIcon /></span>
              <span className="connect-platform">X (Twitter)</span>
              <span className="connect-handle">@your_handle</span>
            </a>
            <a href="#" className="connect-card" data-reveal data-reveal-delay="3">
              <span className="connect-icon"><TikTokIcon /></span>
              <span className="connect-platform">TikTok</span>
              <span className="connect-handle">@your_handle</span>
            </a>
            <a href="#" className="connect-card" data-reveal data-reveal-delay="4">
              <span className="connect-icon"><YoutubeIcon /></span>
              <span className="connect-platform">YouTube</span>
              <span className="connect-handle">your channel</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="cta">
        <img src="/logo.svg" alt="SwimSCPlan brand mark with stylized wave and the text SwimSCPlan" className="cta-logo" data-reveal />
        <h2 data-reveal data-reveal-delay="1">Ready to get started?</h2>
        <p data-reveal data-reveal-delay="2">Create a free account and take control of your training.</p>
        <button className="btn-primary btn-large" data-reveal data-reveal-delay="3" onClick={() => navigate('/create-account')}>Create Account</button>
      </section>

      <footer className="footer">
        <img src="/logo.svg" alt="SwimSCPlan brand mark with stylized wave and the text SwimSCPlan" className="footer-logo" />
        <span>© 2026 SwimSCPlan</span>
      </footer>
    </div>
  )
}

export default App
