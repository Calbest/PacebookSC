import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const navigate = useNavigate()
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
        <h2>What is SwimSCPlan?</h2>
        <ul className="purpose-list">
          <li>Compare all your swim event times against upcoming meet cut times at a glance</li>
          <li>Track your progress over time and watch yourself improve as you grow</li>
          <li>Built-in calendar to organize and keep up with all your upcoming meets</li>
          <li>Highlights the events where your times are closest to qualifying cuts so you know exactly where to focus</li>
        </ul>
      </section>

      {/* ── Features ── */}
      <section className="features">
        <h2>Everything you need in one place</h2>
        <div className="features-grid">
          <div className="feature-card">
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

          <div className="feature-card">
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

          <div className="feature-card">
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

      {/* ── Call to Action ── */}
      <section className="cta">
        <img src="/logo.svg" alt="SwimSCPlan brand mark with stylized wave and the text SwimSCPlan" className="cta-logo" />
        <h2>Ready to get started?</h2>
        <p>Create a free account and take control of your training.</p>
        <button className="btn-primary btn-large" onClick={() => navigate('/create-account')}>Create Account</button>
      </section>

      <footer className="footer">
        <img src="/logo.svg" alt="SwimSCPlan brand mark with stylized wave and the text SwimSCPlan" className="footer-logo" />
        <span>© 2026 SwimSCPlan</span>
      </footer>
    </div>
  )
}

export default App
