import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LOCATIONS, getStandards } from '../lib/standards'
import LocationLogo from '../components/LocationLogo'
import './Settings.css'

type SaveStatus  = 'idle' | 'saving' | 'saved' | 'error'
type ResetStep   = 'idle' | 'code_sent'
type ResetStatus = 'idle' | 'loading' | 'success' | 'error'

function formatBirthday(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`
}

export default function Settings() {
  const navigate  = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  // Profile
  const [fullName,      setFullName]     = useState('')
  const [gender,        setGender]       = useState('')
  const [dob,           setDob]          = useState('')
  const [location,      setLocation]     = useState('')
  const [timeStandard,  setTimeStandard] = useState('')
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle')

  // Account
  const [userId,   setUserId]   = useState('')
  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<SaveStatus>('idle')
  const [emailStatus,    setEmailStatus]    = useState<SaveStatus>('idle')

  // Contact
  const [phone,       setPhone]       = useState('')
  const [phoneStatus, setPhoneStatus] = useState<SaveStatus>('idle')

  // Avatar
  const [avatarUrl,     setAvatarUrl]     = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarStatus,  setAvatarStatus]  = useState<'idle'|'uploading'|'saved'|'error'>('idle')

  // Password reset
  const [resetStep,   setResetStep]   = useState<ResetStep>('idle')
  const [resetStatus, setResetStatus] = useState<ResetStatus>('idle')
  const [resetError,  setResetError]  = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) { navigate('/'); return }
      const m = user.user_metadata ?? {}
      setUserId(user.id)
      setEmail(user.email ?? '')
      setUsername(m.username ?? '')
      setFullName(m.full_name ?? '')
      setGender(m.gender ?? '')
      setDob(m.dob ?? '')
      setLocation(m.location ?? '')
      setTimeStandard(m.time_standard ?? '')
      setPhone(m.phone ?? '')
      setAvatarUrl(m.avatar_url ?? '')
    })
  }, [navigate])

  async function saveProfile() {
    setProfileStatus('saving')
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), gender, dob, location, time_standard: timeStandard },
    })
    if (error) { setProfileStatus('error'); return }
    setProfileStatus('saved')
    setTimeout(() => setProfileStatus('idle'), 2500)
  }

  async function saveUsername() {
    setUsernameStatus('saving')
    const { error } = await supabase.auth.updateUser({ data: { username } })
    if (error) { setUsernameStatus('error'); return }
    setUsernameStatus('saved')
    setTimeout(() => setUsernameStatus('idle'), 2500)
  }

  async function saveEmail() {
    setEmailStatus('saving')
    const { error } = await supabase.auth.updateUser({ email })
    if (error) { setEmailStatus('error'); return }
    setEmailStatus('saved')
    setTimeout(() => setEmailStatus('idle'), 4000)
  }

  async function savePhone() {
    setPhoneStatus('saving')
    const { error } = await supabase.auth.updateUser({ data: { phone } })
    if (error) { setPhoneStatus('error'); return }
    setPhoneStatus('saved')
    setTimeout(() => setPhoneStatus('idle'), 2500)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarStatus('uploading')

    const ext  = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadErr) { setAvatarStatus('error'); setAvatarPreview(''); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
    if (updateErr) { setAvatarStatus('error'); return }
    setAvatarUrl(publicUrl)
    setAvatarStatus('saved')
    setTimeout(() => setAvatarStatus('idle'), 2500)
  }

  async function sendResetEmail() {
    setResetStatus('loading')
    setResetError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) { setResetError(error.message); setResetStatus('error'); return }
    setResetStep('code_sent')
    setResetStatus('idle')
  }

  async function changePassword() {
    if (newPassword !== confirmPass) { setResetError('Passwords do not match.'); return }
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters.'); return }
    setResetStatus('loading')
    setResetError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setResetError(error.message); setResetStatus('error'); return }
    setResetStatus('success')
    setResetStep('idle')
    setNewPassword('')
    setConfirmPass('')
  }

  const displayAvatar = avatarPreview || avatarUrl
  const selectedLoc   = LOCATIONS.find(l => l.value === location) ?? null

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-body">

        {/* ── Profile Picture ── */}
        <section className="settings-card">
          <h2 className="settings-section-title">Profile Picture</h2>
          <div className="avatar-section">
            <button className="avatar-picker" onClick={() => fileInput.current?.click()}>
              {displayAvatar
                ? <img src={displayAvatar} alt="Profile" className="avatar-img" />
                : <User size={36} className="avatar-icon" />
              }
              <div className="avatar-overlay">
                <Camera size={18} />
                <span>Change</span>
              </div>
            </button>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            <div className="avatar-meta">
              <p className="settings-hint">Click your photo to choose a new one from your library.</p>
              <p className="settings-hint muted">JPG, PNG, GIF — max 5 MB</p>
              {avatarStatus === 'uploading' && <p className="status-info">Uploading…</p>}
              {avatarStatus === 'saved'     && <p className="status-success">Photo updated!</p>}
              {avatarStatus === 'error'     && (
                <p className="status-error">
                  Upload failed. Make sure the <strong>avatars</strong> bucket exists in
                  Supabase → Storage → Buckets (set it to public).
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Profile Info ── */}
        <section className="settings-card">
          <h2 className="settings-section-title">Profile</h2>

          <div className="settings-row" style={{ alignItems: 'flex-start', gap: 16 }}>
            <div className="settings-field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="settings-label">Full Name</label>
              <input
                className="settings-input"
                value={fullName}
                placeholder="e.g. Michael Phelps"
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="settings-field" style={{ flex: '0 0 140px', marginBottom: 0 }}>
              <label className="settings-label">Gender</label>
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

          <div className="settings-field">
            <label className="settings-label">Birthday</label>
            <input
              className="settings-input"
              type="date"
              value={dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDob(e.target.value)}
            />
            {dob && (
              <p className="settings-birthday-display">
                🎂 {formatBirthday(dob)}
              </p>
            )}
          </div>

          <div className="location-standard-block">
            {selectedLoc && <LocationLogo location={selectedLoc} />}

            <div className="settings-field" style={{ marginBottom: 14 }}>
              <label className="settings-label">Location</label>
              <select
                className="settings-input settings-select"
                value={location}
                onChange={e => { setLocation(e.target.value); setTimeStandard('') }}
              >
                <option value="" disabled>Select a location…</option>
                {LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>

            {location && (
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label className="settings-label">USA Swimming Time Standard</label>
                <select
                  className="settings-input settings-select"
                  value={timeStandard}
                  onChange={e => setTimeStandard(e.target.value)}
                >
                  <option value="" disabled>Select a standard…</option>
                  {getStandards(location).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="settings-profile-footer">
            <button
              className={`settings-save${profileStatus === 'saved' ? ' --saved' : ''}`}
              onClick={saveProfile}
              disabled={profileStatus === 'saving'}
            >
              {profileStatus === 'saving' ? 'Saving…' : profileStatus === 'saved' ? 'Saved!' : 'Save Profile'}
            </button>
            {profileStatus === 'error' && <p className="status-error">Could not save profile.</p>}
          </div>
        </section>

        {/* ── Account ── */}
        <section className="settings-card">
          <h2 className="settings-section-title">Account</h2>

          <div className="settings-field">
            <label className="settings-label">Username</label>
            <div className="settings-row">
              <input
                className="settings-input"
                value={username}
                placeholder="Your username"
                onChange={e => setUsername(e.target.value)}
              />
              <button
                className={`settings-save${usernameStatus === 'saved' ? ' --saved' : ''}`}
                onClick={saveUsername}
                disabled={usernameStatus === 'saving'}
              >
                {usernameStatus === 'saving' ? 'Saving…' : usernameStatus === 'saved' ? 'Saved!' : 'Save'}
              </button>
            </div>
            {usernameStatus === 'error' && <p className="status-error">Could not update username.</p>}
          </div>

          <div className="settings-field">
            <label className="settings-label">Email Address</label>
            <div className="settings-row">
              <input
                className="settings-input"
                type="email"
                value={email}
                placeholder="you@email.com"
                onChange={e => setEmail(e.target.value)}
              />
              <button
                className={`settings-save${emailStatus === 'saved' ? ' --saved' : ''}`}
                onClick={saveEmail}
                disabled={emailStatus === 'saving'}
              >
                {emailStatus === 'saving' ? 'Saving…' : emailStatus === 'saved' ? 'Check inbox' : 'Save'}
              </button>
            </div>
            {emailStatus === 'saved' && (
              <p className="status-info">A confirmation link was sent to your new email address.</p>
            )}
            {emailStatus === 'error' && <p className="status-error">Could not update email.</p>}
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="settings-card">
          <h2 className="settings-section-title">Contact</h2>
          <div className="settings-field">
            <label className="settings-label">Phone Number</label>
            <div className="settings-row">
              <input
                className="settings-input"
                type="tel"
                value={phone}
                placeholder="+1 (555) 000-0000"
                onChange={e => setPhone(e.target.value)}
              />
              <button
                className={`settings-save${phoneStatus === 'saved' ? ' --saved' : ''}`}
                onClick={savePhone}
                disabled={phoneStatus === 'saving'}
              >
                {phoneStatus === 'saving' ? 'Saving…' : phoneStatus === 'saved' ? 'Saved!' : 'Save'}
              </button>
            </div>
            {phoneStatus === 'error' && <p className="status-error">Could not save phone number.</p>}
          </div>
        </section>

        {/* ── Password ── */}
        <section className="settings-card">
          <h2 className="settings-section-title">Password</h2>

          {resetStep === 'idle' && resetStatus !== 'success' && (
            <div className="reset-idle">
              <p className="settings-hint">
                We'll send a password reset link to <strong>{email || 'your email'}</strong>.
                Open the link, then enter your new password below.
              </p>
              <button
                className="settings-action-btn"
                onClick={sendResetEmail}
                disabled={resetStatus === 'loading'}
              >
                {resetStatus === 'loading' ? 'Sending…' : 'Send Reset Email'}
              </button>
            </div>
          )}

          {resetStep === 'code_sent' && (
            <div className="reset-verify">
              <p className="status-info">
                Reset link sent to <strong>{email}</strong>. After clicking it, enter your new password below.
              </p>
              <div className="settings-field">
                <label className="settings-label">New Password</label>
                <input
                  className="settings-input"
                  type="password"
                  placeholder="New password (min. 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Confirm Password</label>
                <input
                  className="settings-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                />
              </div>
              <div className="reset-actions">
                <button
                  className="settings-action-btn"
                  onClick={changePassword}
                  disabled={resetStatus === 'loading'}
                >
                  {resetStatus === 'loading' ? 'Updating…' : 'Change Password'}
                </button>
                <button
                  className="settings-cancel-btn"
                  onClick={() => { setResetStep('idle'); setResetError(''); setResetStatus('idle') }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {resetStatus === 'success' && <p className="status-success">Password updated successfully!</p>}
          {resetError && <p className="status-error">{resetError}</p>}
        </section>

      </div>
    </div>
  )
}
