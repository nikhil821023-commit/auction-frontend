import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { register, login } from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import { useRedirectIfAuthed } from '../hooks/useAuth'

export default function AuthPage() {
  useRedirectIfAuthed()

  const navigate    = useNavigate()
  const { setAuth } = useAuthStore()
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (mode === 'register') {
      if (!form.name.trim())             errs.name = 'Name is required'
      if (form.name.trim().length < 2)   errs.name = 'Name too short'
    }
    if (!form.email.includes('@'))       errs.email = 'Enter a valid email'
    if (form.password.length < 6)        errs.password = 'Min 6 characters'
    if (mode === 'register'
        && form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await login({ email: form.email, password: form.password })
      } else {
        res = await register({
          name:     form.name,
          email:    form.email,
          password: form.password,
          phone:    form.phone,
        })
      }

      const data = res.data
      setAuth({
        id:    data.userId,
        name:  data.name,
        email: data.email,
        role:  data.role,
      }, data.token)

      toast.success(mode === 'login'
        ? `👋 Welcome back, ${data.name}!`
        : `🎉 Welcome, ${data.name}! Account created.`)

      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      {/* Background effects */}
      <div className="auth-glow-1" aria-hidden />
      <div className="auth-glow-2" aria-hidden />

      <div className="auth-container">

        {/* LEFT: Branding */}
        <motion.div className="auth-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}>

          <div className="auth-brand">
            <span className="auth-brand-icon">🏏</span>
            <span className="auth-brand-name">AuctionX</span>
          </div>

          <h2 className="auth-left-title">
            Run Live IPL-Style<br />
            <span className="auth-left-hl">Cricket Auctions</span>
          </h2>

          <div className="auth-features-list">
            {[
              { icon: '🎰', text: 'Spinning wheel player reveal' },
              { icon: '⚡', text: 'Real-time bidding with timer' },
              { icon: '💰', text: 'Live budget tracker per team' },
              { icon: '🔊', text: 'IPL-style sound effects' },
              { icon: '📊', text: 'Post-auction stats & charts' },
              { icon: '📅', text: 'Schedule & postpone auctions' },
            ].map((f, i) => (
              <motion.div key={i} className="auth-feature-item"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}>
                <span className="auth-fi-icon">{f.icon}</span>
                <span className="auth-fi-text">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="auth-left-note">
            Free forever · No credit card needed
          </div>
        </motion.div>

        {/* RIGHT: Form */}
        <motion.div className="auth-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}>

          <div className="auth-card">

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setErrors({}) }}>
                Login
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setErrors({}) }}>
                Register
              </button>
              <div className="auth-tab-slider"
                style={{ left: mode === 'login' ? '4px' : 'calc(50% + 0px)' }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                className="auth-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}>

                {/* Title */}
                <div className="auth-form-header">
                  <h3 className="auth-form-title">
                    {mode === 'login'
                      ? 'Welcome back 👋'
                      : 'Create your account 🎯'}
                  </h3>
                  <p className="auth-form-sub">
                    {mode === 'login'
                      ? 'Login to access your tournaments'
                      : 'Start hosting live auctions for free'}
                  </p>
                </div>

                {/* Name — register only */}
                {mode === 'register' && (
                  <div className="auth-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className={errors.name ? 'error' : ''}
                      autoFocus
                    />
                    {errors.name && (
                      <span className="auth-error">{errors.name}</span>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="auth-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    autoFocus={mode === 'login'}
                  />
                  {errors.email && (
                    <span className="auth-error">{errors.email}</span>
                  )}
                </div>

                {/* Phone — register only */}
                {mode === 'register' && (
                  <div className="auth-field">
                    <label>Phone (optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                    />
                  </div>
                )}

                {/* Password */}
                <div className="auth-field">
                  <label>Password *</label>
                  <div className="auth-pass-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder={mode === 'register'
                        ? 'Min 6 characters' : 'Your password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      className={errors.password ? 'error' : ''}
                    />
                    <button type="button"
                      className="auth-pass-toggle"
                      onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="auth-error">{errors.password}</span>
                  )}
                </div>

                {/* Confirm password — register only */}
                {mode === 'register' && (
                  <div className="auth-field">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && (
                      <span className="auth-error">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  {loading
                    ? <span className="auth-spinner" />
                    : mode === 'login'
                      ? '🔑 Login to AuctionX'
                      : '🚀 Create Free Account'}
                </motion.button>

                {/* Switch mode */}
                <div className="auth-switch">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button type="button"
                        onClick={() => { setMode('register'); setErrors({}) }}>
                        Register free →
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button"
                        onClick={() => { setMode('login'); setErrors({}) }}>
                        Login →
                      </button>
                    </>
                  )}
                </div>

                {/* Captain note */}
                <div className="auth-captain-note">
                  🧢 Joining as a <strong>Team Captain</strong>?
                  <button type="button"
                    onClick={() => navigate('/team/register')}>
                    No login needed — Register your team →
                  </button>
                </div>

              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-bg {
          min-height: 100vh;
          background: #04060f;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
          padding: 2rem 1rem;
        }
        .auth-glow-1 {
          position: fixed; top: -100px; left: -150px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.1), transparent 65%);
          pointer-events: none;
        }
        .auth-glow-2 {
          position: fixed; bottom: -100px; right: -100px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,255,0.07), transparent 65%);
          pointer-events: none;
        }
        .auth-container {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 3rem; max-width: 980px; width: 100%;
          position: relative; z-index: 1;
          align-items: center;
        }

        /* LEFT */
        .auth-left { padding: 1rem 0; }
        .auth-brand {
          display: flex; align-items: center; gap: 0.6rem;
          margin-bottom: 2rem;
        }
        .auth-brand-icon { font-size: 1.6rem; }
        .auth-brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.8rem; letter-spacing: 3px; color: #c8ff00;
        }
        .auth-left-title {
          font-size: 2rem; font-weight: 800; line-height: 1.2;
          color: #f0f2ff; margin: 0 0 1.8rem; letter-spacing: -0.5px;
        }
        .auth-left-hl {
          background: linear-gradient(90deg, #c8ff00, #00e5ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-features-list {
          display: flex; flex-direction: column; gap: 0.65rem;
          margin-bottom: 2rem;
        }
        .auth-feature-item {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .auth-fi-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem; flex-shrink: 0;
        }
        .auth-fi-text { font-size: 0.88rem; color: #7a849c; }
        .auth-left-note { font-size: 0.78rem; color: #4a5568; }

        /* RIGHT: card */
        .auth-card {
          background: #080c1a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }

        /* Tabs */
        .auth-tabs {
          display: flex; position: relative;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 4px;
          margin-bottom: 1.75rem;
        }
        .auth-tab {
          flex: 1; background: none; border: none;
          color: #7a849c; padding: 0.55rem;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; border-radius: 7px;
          transition: color 0.2s; position: relative; z-index: 1;
          font-family: inherit;
        }
        .auth-tab.active { color: #f0f2ff; }
        .auth-tab-slider {
          position: absolute; top: 4px; bottom: 4px;
          width: calc(50% - 4px);
          background: #1a2035;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
        }

        /* Form */
        .auth-form { display: flex; flex-direction: column; gap: 0; }
        .auth-form-header { margin-bottom: 1.5rem; }
        .auth-form-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 0.3rem; color: #f0f2ff; }
        .auth-form-sub { font-size: 0.83rem; color: #7a849c; margin: 0; }

        .auth-field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
        .auth-field label { font-size: 0.8rem; font-weight: 600; color: #7a849c; text-transform: uppercase; letter-spacing: 0.5px; }
        .auth-field input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px; color: #f0f2ff;
          padding: 0.7rem 0.95rem; font-size: 0.92rem;
          outline: none; transition: border-color 0.15s;
          font-family: inherit; width: 100%;
          box-sizing: border-box;
        }
        .auth-field input:focus { border-color: #c8ff00; }
        .auth-field input.error { border-color: #ef4444; }
        .auth-error { font-size: 0.75rem; color: #ef4444; }

        .auth-pass-wrap { position: relative; }
        .auth-pass-wrap input { padding-right: 2.5rem; }
        .auth-pass-toggle {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 1rem; line-height: 1;
        }

        .auth-submit {
          width: 100%; background: #c8ff00; border: none;
          color: #000; border-radius: 10px;
          padding: 0.85rem; font-size: 0.95rem; font-weight: 700;
          cursor: pointer; margin-top: 0.5rem;
          font-family: inherit; display: flex;
          align-items: center; justify-content: center; gap: 0.5rem;
          transition: opacity 0.15s;
        }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #00000040;
          border-top-color: #000;
          animation: authSpin 0.7s linear infinite;
        }
        @keyframes authSpin { to { transform: rotate(360deg); } }

        .auth-switch {
          text-align: center; font-size: 0.83rem;
          color: #7a849c; margin-top: 1rem;
        }
        .auth-switch button {
          background: none; border: none;
          color: #c8ff00; cursor: pointer; font-weight: 600;
          font-family: inherit; font-size: 0.83rem;
        }
        .auth-switch button:hover { text-decoration: underline; }

        .auth-captain-note {
          margin-top: 1.25rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 9px; padding: 0.75rem;
          font-size: 0.8rem; color: #7a849c;
          text-align: center;
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .auth-captain-note strong { color: #f0f2ff; }
        .auth-captain-note button {
          background: none; border: none;
          color: #00e5ff; cursor: pointer; font-size: 0.8rem;
          font-family: inherit;
        }
        .auth-captain-note button:hover { text-decoration: underline; }

        @media (max-width: 720px) {
          .auth-container { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-card { padding: 1.5rem; }
        }
      `}</style>
    </div>
  )
} 