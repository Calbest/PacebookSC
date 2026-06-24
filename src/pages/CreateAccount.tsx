import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LOCATIONS, getStandards } from '../lib/standards'
import LocationLogo from '../components/LocationLogo'
import '../App.css'
import './CreateAccount.css'

export default function CreateAccount() {
  const navigate = useNavigate()
  const [fullName,     setFullName]     = useState('')
  const [gender,       setGender]       = useState('')
  const [dob,          setDob]          = useState('')
  const [location,     setLocation]     = useState('')
  const [timeStandard, setTimeStandard] = useState('')
  const [username,     setUsername]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    if (!dob) {
      setError('Please enter your birthday.')
      return
    }
    if (!location) {
      setError('Please select your location.')
      return
    }
    if (!timeStandard) {
      setError('Please select a time standard.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName.trim(),
          gender,
          dob,
          location,
          time_standard: timeStandard,
        },
      },
    })
    setLoading(false)

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError)
      setError(signUpError.message || JSON.stringify(signUpError))
    } else {
      navigate('/dashboard')
    }
  }

  const standards    = getStandards(location)
  const selectedLoc  = LOCATIONS.find(l => l.value === location) ?? null

  return (
    <div className="auth-page">
      <header className="navbar">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          <img src="/logo.svg" alt="SwimSCPlan logo" className="nav-logo-img" />
          <span className="nav-logo">SwimSCPlan</span>
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <img src="/logo.svg" alt="" className="auth-logo" />
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start tracking your swim times today.</p>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="name-gender-row">
              <label className="auth-label">
                Full Name
                <input
                  className="auth-input"
                  type="text"
                  placeholder="e.g. Michael Phelps"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <div className="auth-label gender-field">
                Gender
                <div className="gender-toggle">
                  <button
                    type="button"
                    className={`gender-btn${gender === 'male' ? ' active' : ''}`}
                    onClick={() => setGender('male')}
                  >Male</button>
                  <button
                    type="button"
                    className={`gender-btn${gender === 'female' ? ' active' : ''}`}
                    onClick={() => setGender('female')}
                  >Female</button>
                </div>
              </div>
            </div>

            <label className="auth-label">
              Your Birthday
              <input
                className="auth-input"
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </label>

            <div className="location-standard-block">
              {selectedLoc && <LocationLogo location={selectedLoc} />}

              <label className="auth-label">
                Location
                <select
                  className="auth-input auth-select"
                  value={location}
                  onChange={e => { setLocation(e.target.value); setTimeStandard('') }}
                  required
                >
                  <option value="" disabled>Select your location…</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </label>

              {location && (
                <label className="auth-label">
                  USA Swimming Time Standard
                  <select
                    className="auth-input auth-select"
                    value={timeStandard}
                    onChange={e => setTimeStandard(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a standard…</option>
                    {standards.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="auth-label">
              Username
              <input
                className="auth-input"
                type="text"
                placeholder="e.g. swimfast99"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label className="auth-label">
              Email
              <input
                className="auth-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-label">
              Password
              <input
                className="auth-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>

            <label className="auth-label">
              Confirm password
              <input
                className="auth-input"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/sign-in" className="auth-link">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
