import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { submitFeedback } from '../api/feedbackApi'

const FEATURES = [
  { key: 'wantsPlayerStats', label: '📊 Detailed player stats' },
  { key: 'wantsLiveStream',  label: '📹 Live video stream integration' },
  { key: 'wantsTeamChat',    label: '💬 Team chat during auction' },
  { key: 'wantsMobileApp',   label: '📱 Dedicated mobile app' },
  { key: 'wantsAutoTimer',   label: '⏱️ Auto-timer management' },
]

function StarRating({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="star-group">
      <label className="star-label">{label}</label>
      <div className="stars">
        {[1,2,3,4,5].map(s => (
          <motion.button
            key={s}
            type="button"
            className={`star-btn ${s <= (hovered || value) ? 'lit' : ''}`}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            whileTap={{ scale: 0.9 }}>
            ★
          </motion.button>
        ))}
        <span className="star-val">
          {value ? ['','Poor','Fair','Good','Great','Excellent'][value] : ''}
        </span>
      </div>
    </div>
  )
}

export default function FeedbackForm() {
  const { tid }    = useParams()
  const navigate   = useNavigate()
  const [step, setStep]         = useState(1)  // 1=ratings 2=text 3=features 4=done
  const [submitting, setSub]    = useState(false)
  const [form, setForm] = useState({
    tournamentId:       Number(tid),
    submitterName:      '',
    submitterRole:      'CAPTAIN',
    overallRating:      0,
    auctionExperience:  0,
    platformEaseOfUse:  0,
    bidProcessRating:   0,
    bestPart:           '',
    improveSuggestion:  '',
    additionalComments: '',
    wouldRecommend:     null,
    wantsPlayerStats:   false,
    wantsLiveStream:    false,
    wantsTeamChat:      false,
    wantsMobileApp:     false,
    wantsAutoTimer:     false,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.overallRating) {
      toast.error('Please give an overall rating')
      return
    }
    setSub(true)
    try {
      await submitFeedback(form)
      setStep(4)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed')
    } finally {
      setSub(false)
    }
  }

  return (
    <div className="fb-bg">
      <div className="fb-card">

        {/* Progress bar */}
        {step < 4 && (
          <div className="fb-progress">
            <div className="fb-progress-bar"
              style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* STEP 1 — Ratings */}
          {step === 1 && (
            <motion.div key="step1" className="fb-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}>

              <div className="fb-step-icon">⭐</div>
              <h2 className="fb-title">Rate Your Experience</h2>
              <p className="fb-sub">How was the AuctionX platform?</p>

              <div className="fb-name-role">
                <div className="form-group">
                  <label>Your Name (optional)</label>
                  <input value={form.submitterName}
                    placeholder="e.g. Rohit"
                    onChange={e => set('submitterName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Your Role</label>
                  <select value={form.submitterRole}
                    onChange={e => set('submitterRole', e.target.value)}>
                    <option value="ORGANIZER">🎯 Organizer</option>
                    <option value="CAPTAIN">🧢 Team Captain</option>
                    <option value="SPECTATOR">👀 Spectator</option>
                  </select>
                </div>
              </div>

              <div className="fb-ratings">
                <StarRating
                  label="Overall Experience"
                  value={form.overallRating}
                  onChange={v => set('overallRating', v)} />
                <StarRating
                  label="Auction Experience"
                  value={form.auctionExperience}
                  onChange={v => set('auctionExperience', v)} />
                <StarRating
                  label="Platform Ease of Use"
                  value={form.platformEaseOfUse}
                  onChange={v => set('platformEaseOfUse', v)} />
                <StarRating
                  label="Bidding Process"
                  value={form.bidProcessRating}
                  onChange={v => set('bidProcessRating', v)} />
              </div>

              <div className="fb-recommend">
                <label>Would you recommend AuctionX?</label>
                <div className="fb-rec-btns">
                  <motion.button
                    className={`fb-rec-btn yes
                      ${form.wouldRecommend === true ? 'active' : ''}`}
                    onClick={() => set('wouldRecommend', true)}
                    whileTap={{ scale: 0.97 }}>
                    👍 Yes, definitely!
                  </motion.button>
                  <motion.button
                    className={`fb-rec-btn no
                      ${form.wouldRecommend === false ? 'active' : ''}`}
                    onClick={() => set('wouldRecommend', false)}
                    whileTap={{ scale: 0.97 }}>
                    👎 Not really
                  </motion.button>
                </div>
              </div>

              <motion.button className="btn-primary full-width"
                onClick={() => setStep(2)}
                disabled={!form.overallRating}
                whileTap={{ scale: 0.97 }}>
                Next →
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2 — Written feedback */}
          {step === 2 && (
            <motion.div key="step2" className="fb-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}>

              <div className="fb-step-icon">💬</div>
              <h2 className="fb-title">Tell Us More</h2>
              <p className="fb-sub">Your words help us improve</p>

              <div className="fb-textareas">
                <div className="form-group">
                  <label>🌟 What did you love most?</label>
                  <textarea
                    className="fb-textarea"
                    placeholder="e.g. The spinning wheel was super fun!"
                    value={form.bestPart}
                    onChange={e => set('bestPart', e.target.value)}
                    rows={3} maxLength={500} />
                  <span className="fb-char-count">
                    {form.bestPart.length}/500
                  </span>
                </div>

                <div className="form-group">
                  <label>🔧 What should we improve?</label>
                  <textarea
                    className="fb-textarea"
                    placeholder="e.g. The timer could be louder..."
                    value={form.improveSuggestion}
                    onChange={e => set('improveSuggestion', e.target.value)}
                    rows={3} maxLength={500} />
                  <span className="fb-char-count">
                    {form.improveSuggestion.length}/500
                  </span>
                </div>

                <div className="form-group">
                  <label>📝 Anything else?</label>
                  <textarea
                    className="fb-textarea"
                    placeholder="Any other thoughts..."
                    value={form.additionalComments}
                    onChange={e => set('additionalComments', e.target.value)}
                    rows={2} maxLength={300} />
                </div>
              </div>

              <div className="fb-nav-btns">
                <button className="btn-secondary"
                  onClick={() => setStep(1)}>← Back</button>
                <motion.button className="btn-primary"
                  onClick={() => setStep(3)}
                  whileTap={{ scale: 0.97 }}>
                  Next →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Feature requests */}
          {step === 3 && (
            <motion.div key="step3" className="fb-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}>

              <div className="fb-step-icon">🚀</div>
              <h2 className="fb-title">Feature Wishlist</h2>
              <p className="fb-sub">
                Which features would you like next?
              </p>

              <div className="fb-features">
                {FEATURES.map(f => (
                  <motion.label key={f.key} className="fb-feature-row"
                    whileHover={{ x: 4 }}>
                    <input
                      type="checkbox"
                      checked={form[f.key]}
                      onChange={e => set(f.key, e.target.checked)} />
                    <span className="fb-feature-label">{f.label}</span>
                    {form[f.key] && (
                      <motion.span className="fb-check"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        ✓
                      </motion.span>
                    )}
                  </motion.label>
                ))}
              </div>

              <div className="fb-nav-btns">
                <button className="btn-secondary"
                  onClick={() => setStep(2)}>← Back</button>
                <motion.button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  whileTap={{ scale: 0.97 }}>
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Feedback'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Thank you */}
          {step === 4 && (
            <motion.div key="step4" className="fb-step fb-done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}>

              <motion.div className="fb-done-icon"
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}>
                🎉
              </motion.div>
              <h2 className="fb-title">Thank You!</h2>
              <p className="fb-sub">
                Your feedback helps make AuctionX better for everyone.
              </p>

              <div className="fb-done-actions">
                <motion.button className="btn-primary"
                  onClick={() => navigate(`/post-auction/${tid}`)}
                  whileTap={{ scale: 0.97 }}>
                  🏆 View Final Results
                </motion.button>
                <motion.button className="btn-secondary"
                  onClick={() => navigate('/')}
                  whileTap={{ scale: 0.97 }}>
                  🏠 Home
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}