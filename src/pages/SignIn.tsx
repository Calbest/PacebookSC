import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../App.css'
import './CreateAccount.css'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/dashboard')
    }
  }

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
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-sub">Welcome back. Let's check your times.</p>

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/create-account" className="auth-link">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
