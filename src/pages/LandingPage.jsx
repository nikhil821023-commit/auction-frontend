import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'

function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function LiveAuctionCard() {
  const [bid, setBid] = useState(1500000)
  const [lastTeam, setLastTeam] = useState('Mumbai Indians')
  const teams = ['Mumbai Indians', 'RCB', 'Chennai Super Kings', 'Delhi Capitals']
  const colors = ['#005da0', '#c8102e', '#f9cd05', '#0033a0']
  useEffect(() => {
    const t = setInterval(() => {
      const idx = Math.floor(Math.random() * teams.length)
      setLastTeam(teams[idx])
      setBid(b => b + Math.floor(Math.random() * 250000 + 100000))
    }, 2200)
    return () => clearInterval(t)
  }, [])
  const teamIdx = teams.indexOf(lastTeam)
  const teamColor = colors[teamIdx] || '#005da0'

  return (
    <div className="hp-preview">
      <div className="hp-preview-topbar">
        <div className="hp-preview-live">
          <span className="hp-preview-dot" />
          LIVE AUCTION
        </div>
        <div className="hp-preview-name">AUCTIONX</div>
        <div className="hp-preview-count">48 players · 6 teams</div>
      </div>

      <div className="hp-preview-player-block">
        <div className="hp-preview-avatar">VK</div>
        <div className="hp-preview-player-info">
          <div className="hp-preview-tier">🥇 PLATINUM</div>
          <div className="hp-preview-player-name">VIRAT KOHLI</div>
          <div className="hp-preview-player-role">Batsman · India</div>
        </div>
        <div className="hp-preview-stats">
          <div className="hp-preview-stat"><span>274</span><small>Matches</small></div>
          <div className="hp-preview-stat"><span>53.5</span><small>Avg</small></div>
        </div>
      </div>

      <div className="hp-preview-bid-section">
        <div className="hp-preview-bid-label">CURRENT BID</div>
        <motion.div className="hp-preview-bid-value"
          key={bid}
          initial={{ scale: 1.15, color: '#c8ff00' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.35 }}>
          ₹{(bid / 100000).toFixed(1)}L
        </motion.div>
        <div className="hp-preview-leader" style={{ color: teamColor }}>
          🏆 {lastTeam} is leading
        </div>
      </div>

      <div className="hp-preview-timer-row">
        <span className="hp-preview-timer-label">⏱</span>
        <div className="hp-preview-timer-track">
          <motion.div className="hp-preview-timer-fill"
            animate={{ width: ['100%', '0%'] }}
            transition={{ duration: 30, repeat: Infinity }} />
        </div>
        <span className="hp-preview-timer-secs">18s</span>
      </div>

      <div className="hp-preview-teams">
        {['MI', 'RCB', 'CSK', 'DC'].map((t, i) => (
          <div key={t} className="hp-preview-team-pill"
            style={{ borderColor: colors[i] + '55',
                     background: t === lastTeam.split(' ').pop()
                       ? colors[i] + '22' : 'transparent' }}>
            <span style={{ color: colors[i] }}>■</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, delay = 0, accent }) {
  return (
    <motion.div className="hp-feat-card"
      style={{ '--accent': accent }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}>
      <div className="hp-feat-icon-wrap">
        <span className="hp-feat-icon">{icon}</span>
      </div>
      <h3 className="hp-feat-title">{title}</h3>
      <p className="hp-feat-desc">{desc}</p>
    </motion.div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [faqOpen, setFaqOpen] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const faqs = [
    { q: 'Is AuctionX free?', a: 'Yes, completely free. No signup, no credit card. Create a tournament and start instantly.' },
    { q: 'How many teams can participate?', a: 'Up to 10 teams per tournament. Each captain joins using a 6-character code you share.' },
    { q: 'Can I upload players in bulk?', a: 'Yes. Upload a CSV file for player details, or a ZIP with player photos included.' },
    { q: 'Does it work on mobile?', a: 'Yes. Organizer runs from laptop, captains bid from their phones seamlessly.' },
    { q: 'Can spectators watch without bidding?', a: 'Yes. Share a spectator link — anyone can watch live and react with emojis.' },
    { q: 'What sports are supported?', a: 'Cricket, Football, Kabaddi, Basketball, Hockey — any sport with a player auction format.' },
  ]

  const features = [
    { icon: '🎰', title: 'Spinning Wheel', desc: 'Cinematic player reveals with an animated wheel. Platinum players get special golden reveals.', accent: '#e5c100' },
    { icon: '⚡', title: 'Real-Time Bidding', desc: 'Bids appear instantly for all. Timer resets on each new bid — tension stays alive.', accent: '#00e5ff' },
    { icon: '💰', title: 'Live Budget Tracker', desc: 'Every team\'s budget updates the moment a sale closes. Overspend warnings built in.', accent: '#c8ff00' },
    { icon: '🔊', title: 'IPL-Style Sounds', desc: 'Gavel on sold, crowd roar on bid war, spoken announcements. Feels completely authentic.', accent: '#ff9500' },
    { icon: '📱', title: 'Mobile-First Captains', desc: 'Captains bid from any phone. No app install. Organiser controls everything from laptop.', accent: '#bf5af2' },
    { icon: '👀', title: 'Spectator Mode', desc: 'Share a link and anyone can watch live and react with emojis in real time.', accent: '#ff375f' },
    { icon: '🖥️', title: 'Projector View', desc: 'Full-screen big-display mode for projectors. Stadium-style scoreboard aesthetic.', accent: '#30d158' },
    { icon: '📊', title: 'Post-Auction Analytics', desc: 'Squad breakdowns, leaderboard, bid history and charts once the auction ends.', accent: '#0a84ff' },
    { icon: '📅', title: 'Schedule & Reserve', desc: 'Schedule your auction days ahead. Auto-reminders, postpone and extend with one click.', accent: '#ff6b35' },
  ]

  return (
    <div className="hp-root">

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="hp-nav">
        <div className="hp-nav-brand">
          <span className="hp-brand-icon">🏏</span>
          <span className="hp-brand-name">AuctionX</span>
        </div>

        <div className="hp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#faq">FAQ</a>
         
        </div>

        <div className="hp-nav-ctas">
          <motion.button className="hp-nav-ghost"
            onClick={() => navigate('/team/register')}
            whileTap={{ scale: 0.97 }}>
            Join Auction
          </motion.button>
          <motion.button className="hp-nav-solid"
            onClick={() => navigate('/organizer/setup')}
            whileTap={{ scale: 0.97 }}>
            Host Free →
          </motion.button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hp-hero">
        <div className="hp-hero-bg-grid" aria-hidden />
        <div className="hp-hero-glow-1" aria-hidden />
        <div className="hp-hero-glow-2" aria-hidden />

        <div className="hp-hero-left">
          <motion.div className="hp-hero-badge"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}>
            <span className="hp-badge-dot" />
            IPL-Style Live Auctions
          </motion.div>

          <motion.h1 className="hp-hero-h1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}>
            Host a Live
            <br />
            <span className="hp-hero-hl">Cricket Auction</span>
            <br />
            in Minutes
          </motion.h1>

          <motion.p className="hp-hero-sub"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}>
            Real-time bidding · Spinning wheel · Live dashboard
            <br />
            IPL sounds · Works on mobile · 100% free
          </motion.p>

          <motion.div className="hp-hero-actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>
            <motion.button className="hp-cta-primary"
              onClick={() => navigate('/organizer/setup')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}>
              🎯 Create Tournament — Free
            </motion.button>
            <motion.button className="hp-cta-secondary"
              onClick={() => navigate('/team/register')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}>
              🧢 Join as Captain
            </motion.button>
          </motion.div>

          <motion.p className="hp-hero-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}>
            No signup · No credit card · Starts instantly
          </motion.p>

          {/* Social proof row */}
          <motion.div className="hp-social-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}>
            <div className="hp-sp-avatars">
              {['R','P','A','M','S'].map((l, i) => (
                <div key={i} className="hp-sp-av"
                  style={{ zIndex: 5 - i, marginLeft: i > 0 ? '-10px' : 0 }}>
                  {l}
                </div>
              ))}
            </div>
            <span className="hp-sp-text">
              500+ tournaments hosted this year
            </span>
          </motion.div>
        </div>

        <motion.div className="hp-hero-right"
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.65 }}>
          <LiveAuctionCard />
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <div className="hp-stats-strip">
        {[
          { n: 500,   s: '+', l: 'Tournaments Hosted' },
          { n: 12000, s: '+', l: 'Players Auctioned' },
          { n: 98,    s: '%', l: 'Satisfaction Rate' },
          { n: 6,     s: '',  l: 'Sports Supported' },
        ].map((stat, i) => (
          <motion.div key={i} className="hp-stat-item"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}>
            <div className="hp-stat-num">
              <Counter target={stat.n} suffix={stat.s} />
            </div>
            <div className="hp-stat-label">{stat.l}</div>
          </motion.div>
        ))}
      </div>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="hp-section" id="features">
        <motion.div className="hp-section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          EVERYTHING YOU NEED
        </motion.div>
        <motion.h2 className="hp-section-h2"
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Built for a <span className="hp-hl">Perfect Auction</span>
        </motion.h2>
        <motion.p className="hp-section-sub"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.15 }}>
          Every feature designed specifically for live cricket and sports tournaments
        </motion.p>

        <div className="hp-feat-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.06} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="hp-section hp-how" id="how">
        <motion.div className="hp-section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          SIMPLE PROCESS
        </motion.div>
        <motion.h2 className="hp-section-h2"
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Live in <span className="hp-hl">4 Steps</span>
        </motion.h2>

        <div className="hp-steps">
          {[
            { n: '01', icon: '🎯', title: 'Create Tournament', desc: 'Set name, team budget, bid increment. Takes under 2 minutes.' },
            { n: '02', icon: '👥', title: 'Teams Register',    desc: 'Share 6-character join code. Captains register from any device.' },
            { n: '03', icon: '🏏', title: 'Add Players',       desc: 'Add one-by-one or bulk upload via CSV. Include photos with ZIP.' },
            { n: '04', icon: '🔴', title: 'Go Live!',          desc: 'Start auction. Spin wheel, take bids, watch budgets update live.' },
          ].map((step, i) => (
            <motion.div key={i} className="hp-step"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}>
              <div className="hp-step-num">{step.n}</div>
              <div className="hp-step-icon-wrap">{step.icon}</div>
              <h4 className="hp-step-title">{step.title}</h4>
              <p className="hp-step-desc">{step.desc}</p>
              {i < 3 && <div className="hp-step-arrow">→</div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SPORTS ───────────────────────────────────────── */}
      <section className="hp-sports-section">
        <motion.h2 className="hp-section-h2 center"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          Works for Every Sport
        </motion.h2>
        <div className="hp-sports-row">
          {[
            { icon: '🏏', name: 'Cricket',    hot: true  },
            { icon: '⚽', name: 'Football',   hot: false },
            { icon: '🤼', name: 'Kabaddi',    hot: false },
            { icon: '🏀', name: 'Basketball', hot: false },
            { icon: '🏑', name: 'Hockey',     hot: false },
            { icon: '🎽', name: 'Any Sport',  hot: false },
          ].map((s, i) => (
            <motion.div key={i} className="hp-sport-pill"
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.04 }}>
              <span className="hp-sport-icon">{s.icon}</span>
              <span className="hp-sport-name">{s.name}</span>
              {s.hot && <span className="hp-sport-hot">Popular</span>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="hp-section">
        <motion.div className="hp-section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          WHAT ORGANIZERS SAY
        </motion.div>
        <motion.h2 className="hp-section-h2"
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Real Feedback, Real Results
        </motion.h2>

        <div className="hp-testimonials">
          {[
            { name: 'Rahul S.', role: 'Tournament Organizer, Mumbai', stars: 5, text: 'Used AuctionX for our office cricket tournament. The spinning wheel made it feel exactly like IPL. Everyone loved the sound effects and the bid war moments!' },
            { name: 'Priya K.', role: 'Team Captain, Bangalore',      stars: 5, text: 'So easy on my phone. I could bid instantly without confusion. The budget tracker saved me from overspending multiple times.' },
            { name: 'Arjun M.', role: 'College Fest Organizer',       stars: 5, text: '8 teams, 60 players, ran perfectly. The projector mode on the big screen was amazing — looked like a real IPL auction room!' },
          ].map((t, i) => (
            <motion.div key={i} className="hp-testimonial"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}>
              <div className="hp-t-stars">{'★'.repeat(t.stars)}</div>
              <p className="hp-t-text">"{t.text}"</p>
              <div className="hp-t-author">
                <div className="hp-t-av">{t.name.charAt(0)}</div>
                <div>
                  <div className="hp-t-name">{t.name}</div>
                  <div className="hp-t-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="hp-section hp-faq-section" id="faq">
        <motion.div className="hp-section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          FAQ
        </motion.div>
        <motion.h2 className="hp-section-h2"
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Questions? Answered.
        </motion.h2>
        <div className="hp-faq">
          {faqs.map((faq, i) => (
            <motion.div key={i} className="hp-faq-item"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}>
              <button className={`hp-faq-q ${faqOpen === i ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span>{faq.q}</span>
                <motion.span className="hp-faq-chevron"
                  animate={{ rotate: faqOpen === i ? 180 : 0 }}
                  transition={{ duration: 0.22 }}>
                  ▼
                </motion.span>
              </button>
              <AnimatePresence>
                {faqOpen === i && (
                  <motion.div className="hp-faq-a"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}>
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="hp-cta-section">
        <div className="hp-cta-glow" aria-hidden />
        <motion.div className="hp-cta-box"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          <div className="hp-cta-trophy">🏆</div>
          <h2 className="hp-cta-title">Ready to Host Your Auction?</h2>
          <p className="hp-cta-sub">Free. No signup. No download. Live in 2 minutes.</p>
          <div className="hp-cta-btns">
            <motion.button className="hp-cta-primary"
              onClick={() => navigate('/organizer/setup')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}>
              🎯 Create Your Tournament Now
            </motion.button>
            <motion.button className="hp-cta-ghost"
              onClick={() => navigate('/team/register')}
              whileTap={{ scale: 0.97 }}>
              Join as Captain →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand-col">
            <div className="hp-footer-brand">
              <span>🏏</span>
              <span className="hp-brand-name">AuctionX</span>
            </div>
            <p className="hp-footer-tagline">
              The best free live auction platform for cricket and sports tournaments.
            </p>
          </div>
          <div className="hp-footer-links-col">
            <div className="hp-footer-col">
              <h4>Platform</h4>
              <a onClick={() => navigate('/organizer/setup')}>Create Tournament</a>
              <a onClick={() => navigate('/team/register')}>Register Team</a>
              <a onClick={() => navigate('/my-tournaments')}>My Tournaments</a>
            </div>
            <div className="hp-footer-col">
              <h4>Explore</h4>
              <a href="#features">Features</a>
              <a href="#how">How It Works</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </div>
        <div className="hp-footer-bottom">
          <span>© 2026 AuctionX — Free forever</span>
          <span>Made with ❤️ for cricket fans</span>
        </div>
      </footer>

      {/* ── ALL STYLES ───────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --hp-bg:      #04060f;
          --hp-bg2:     #080c1a;
          --hp-bg3:     #0d1225;
          --hp-border:  rgba(255,255,255,0.07);
          --hp-border2: rgba(255,255,255,0.12);
          --hp-text:    #f0f2ff;
          --hp-muted:   #7a849c;
          --hp-accent:  #c8ff00;
          --hp-cyan:    #00e5ff;
          --hp-purple:  #8b5cf6;
          --hp-gold:    #fbbf24;
          --hp-red:     #ef4444;
        }

        .hp-root {
          background: var(--hp-bg);
          color: var(--hp-text);
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── NAV ─────────────────────────────────────────── */
        .hp-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 64px;
          background: rgba(4,6,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--hp-border);
        }
        .hp-nav-brand {
          display: flex; align-items: center; gap: 0.6rem;
          cursor: pointer;
        }
        .hp-brand-icon { font-size: 1.4rem; }
        .hp-brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem; letter-spacing: 2px;
          color: var(--hp-accent);
        }
        .hp-nav-links {
          display: flex; gap: 2rem;
          font-size: 0.88rem; color: var(--hp-muted);
        }
        .hp-nav-links a {
          color: var(--hp-muted); cursor: pointer;
          text-decoration: none; transition: color 0.15s;
        }
        .hp-nav-links a:hover { color: var(--hp-text); }
        .hp-nav-ctas { display: flex; gap: 0.6rem; }
        .hp-nav-ghost {
          background: transparent;
          border: 1px solid var(--hp-border2);
          color: var(--hp-text);
          border-radius: 8px;
          padding: 0.5rem 1.1rem;
          font-size: 0.88rem; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
        }
        .hp-nav-ghost:hover { border-color: var(--hp-accent); color: var(--hp-accent); }
        .hp-nav-solid {
          background: var(--hp-accent);
          border: none; color: #000;
          border-radius: 8px;
          padding: 0.5rem 1.2rem;
          font-size: 0.88rem; font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .hp-nav-solid:hover { opacity: 0.88; }

        /* ── HERO ────────────────────────────────────────── */
        .hp-hero {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          padding: 6rem 2.5rem 5rem;
          max-width: 1280px;
          margin: 0 auto;
          min-height: calc(100vh - 64px);
        }
        .hp-hero-bg-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(200,255,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,255,0,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .hp-hero-glow-1 {
          position: absolute; top: -100px; left: -200px;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.12), transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .hp-hero-glow-2 {
          position: absolute; top: 100px; right: -100px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,255,0.08), transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .hp-hero-left { position: relative; z-index: 1; }
        .hp-hero-right { position: relative; z-index: 1; }

        .hp-hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(200,255,0,0.08);
          border: 1px solid rgba(200,255,0,0.2);
          border-radius: 20px;
          padding: 0.35rem 0.9rem;
          font-size: 0.82rem; font-weight: 600;
          color: var(--hp-accent);
          letter-spacing: 0.5px;
          margin-bottom: 1.5rem;
        }
        .hp-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--hp-accent);
          animation: badgePulse 1.2s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .hp-hero-h1 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(2.6rem, 5vw, 4.2rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -1px;
          margin: 0 0 1.4rem;
          color: var(--hp-text);
        }
          /* Add to HomePage styles */
.hp-user-row {
  display: flex; align-items: center; gap: 0.6rem;
}
.hp-user-badge {
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(200,255,0,0.08);
  border: 1px solid rgba(200,255,0,0.2);
  border-radius: 20px; padding: 0.3rem 0.75rem;
}
.hp-user-av {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--hp-accent); color: #000;
  font-size: 0.75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.hp-user-name { font-size: 0.85rem; color: var(--hp-accent); font-weight: 600; }
        .hp-hero-hl {
          background: linear-gradient(90deg, #c8ff00, #00e5ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-hero-sub {
          font-size: 1.05rem; line-height: 1.65;
          color: var(--hp-muted); margin: 0 0 2rem;
        }
        .hp-hero-actions { display: flex; gap: 0.85rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .hp-cta-primary {
          background: var(--hp-accent);
          border: none; color: #000;
          border-radius: 10px;
          padding: 0.85rem 1.8rem;
          font-size: 1rem; font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .hp-cta-primary:hover { opacity: 0.88; }
        .hp-cta-secondary {
          background: transparent;
          border: 1px solid var(--hp-border2);
          color: var(--hp-text);
          border-radius: 10px;
          padding: 0.85rem 1.8rem;
          font-size: 1rem; font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
        }
        .hp-cta-secondary:hover { border-color: var(--hp-cyan); color: var(--hp-cyan); }
        .hp-hero-note { font-size: 0.8rem; color: var(--hp-muted); margin: 0.75rem 0 1.25rem; }

        .hp-social-proof { display: flex; align-items: center; gap: 0.75rem; }
        .hp-sp-avatars { display: flex; }
        .hp-sp-av {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, var(--hp-purple), var(--hp-cyan));
          border: 2px solid var(--hp-bg);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: #fff;
        }
        .hp-sp-text { font-size: 0.82rem; color: var(--hp-muted); }

        /* ── PREVIEW CARD ─────────────────────────────────── */
        .hp-preview {
          background: var(--hp-bg2);
          border: 1px solid var(--hp-border2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6),
                      0 0 0 1px rgba(200,255,0,0.08);
        }
        .hp-preview-topbar {
          background: #000;
          border-bottom: 2px solid var(--hp-accent);
          padding: 0.65rem 1.2rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .hp-preview-live {
          display: flex; align-items: center; gap: 0.4rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.8rem; color: #ff3b30;
          letter-spacing: 2px;
        }
        .hp-preview-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #ff3b30;
          animation: badgePulse 0.8s ease-in-out infinite;
        }
        .hp-preview-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1rem; letter-spacing: 3px; color: var(--hp-accent);
          flex: 1;
        }
        .hp-preview-count { font-size: 0.75rem; color: var(--hp-muted); }

        .hp-preview-player-block {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.2rem 1.2rem 0.75rem;
          border-bottom: 1px solid var(--hp-border);
        }
        .hp-preview-avatar {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.3rem; color: #fff; flex-shrink: 0;
          border: 2px solid var(--hp-accent);
        }
        .hp-preview-player-info { flex: 1; }
        .hp-preview-tier {
          font-size: 0.7rem; color: var(--hp-gold);
          letter-spacing: 2px; margin-bottom: 0.2rem;
        }
        .hp-preview-player-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.4rem; letter-spacing: 1px; line-height: 1;
        }
        .hp-preview-player-role { font-size: 0.78rem; color: var(--hp-muted); }
        .hp-preview-stats { display: flex; gap: 1rem; }
        .hp-preview-stat {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(255,255,255,0.05); border-radius: 8px;
          padding: 0.4rem 0.7rem;
        }
        .hp-preview-stat span {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem; color: var(--hp-cyan);
        }
        .hp-preview-stat small { font-size: 0.62rem; color: var(--hp-muted); }

        .hp-preview-bid-section {
          padding: 1rem 1.2rem 0.5rem; text-align: center;
        }
        .hp-preview-bid-label {
          font-size: 0.68rem; letter-spacing: 3px;
          color: var(--hp-muted); margin-bottom: 0.25rem;
        }
        .hp-preview-bid-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.8rem; letter-spacing: 2px; color: #fff;
          line-height: 1;
        }
        .hp-preview-leader { font-size: 0.85rem; font-weight: 600; margin-top: 0.3rem; }

        .hp-preview-timer-row {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 1.2rem;
        }
        .hp-preview-timer-label { font-size: 0.85rem; }
        .hp-preview-timer-track {
          flex: 1; height: 4px;
          background: rgba(255,255,255,0.1); border-radius: 50px; overflow: hidden;
        }
        .hp-preview-timer-fill {
          height: 100%; background: var(--hp-accent); border-radius: 50px;
        }
        .hp-preview-timer-secs { font-size: 0.82rem; color: var(--hp-accent); font-weight: 700; }

        .hp-preview-teams {
          display: flex; gap: 0.4rem; padding: 0.6rem 1.2rem 1rem; flex-wrap: wrap;
        }
        .hp-preview-team-pill {
          border: 1px solid;
          border-radius: 20px;
          padding: 0.2rem 0.6rem;
          font-size: 0.75rem; font-weight: 600;
          display: flex; align-items: center; gap: 0.3rem;
          transition: all 0.25s;
        }

        /* ── STATS ────────────────────────────────────────── */
        .hp-stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--hp-border);
          border-bottom: 1px solid var(--hp-border);
          background: var(--hp-bg2);
        }
        .hp-stat-item {
          padding: 2rem 1rem; text-align: center;
          border-right: 1px solid var(--hp-border);
        }
        .hp-stat-item:last-child { border-right: none; }
        .hp-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.8rem; color: var(--hp-accent);
          letter-spacing: 1px; line-height: 1;
        }
        .hp-stat-label { font-size: 0.82rem; color: var(--hp-muted); margin-top: 0.3rem; }

        /* ── SECTIONS ─────────────────────────────────────── */
        .hp-section {
          padding: 5rem 2.5rem;
          max-width: 1200px; margin: 0 auto;
        }
        .hp-section-eyebrow {
          font-size: 0.72rem; letter-spacing: 4px;
          color: var(--hp-accent); font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .hp-section-h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 800; line-height: 1.15;
          letter-spacing: -0.5px; margin: 0 0 0.75rem;
        }
        .hp-section-h2.center { text-align: center; }
        .hp-hl {
          background: linear-gradient(90deg, #c8ff00, #00e5ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-section-sub { color: var(--hp-muted); font-size: 1rem; line-height: 1.6; margin: 0 0 3rem; }

        /* ── FEATURES ─────────────────────────────────────── */
        .hp-feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
          margin-top: 2.5rem;
        }
        .hp-feat-card {
          background: var(--hp-bg2);
          border: 1px solid var(--hp-border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: border-color 0.2s;
          cursor: default;
        }
        .hp-feat-card:hover { border-color: var(--accent, var(--hp-accent)); }
        .hp-feat-icon-wrap {
          width: 48px; height: 48px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--hp-border);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; margin-bottom: 1rem;
        }
        .hp-feat-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem; }
        .hp-feat-desc { font-size: 0.88rem; color: var(--hp-muted); line-height: 1.55; margin: 0; }

        /* ── HOW ──────────────────────────────────────────── */
        .hp-how { background: var(--hp-bg2); max-width: 100%; border-top: 1px solid var(--hp-border); border-bottom: 1px solid var(--hp-border); }
        .hp-how .hp-section-h2,
        .hp-how .hp-section-eyebrow { max-width: 1200px; margin-left: auto; margin-right: auto; padding: 0 2.5rem; }
        .hp-steps {
          display: flex; align-items: flex-start;
          gap: 0; max-width: 1200px; margin: 2.5rem auto 0;
          padding: 0 2.5rem;
          position: relative;
        }
        .hp-step {
          flex: 1; text-align: center;
          background: var(--hp-bg3);
          border: 1px solid var(--hp-border);
          border-radius: 16px; padding: 2rem 1.5rem;
          position: relative; z-index: 1;
        }
        .hp-step-arrow {
          font-size: 1.5rem; color: var(--hp-muted);
          align-self: center; flex-shrink: 0;
          padding: 0 0.5rem;
        }
        .hp-step-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem; color: rgba(200,255,0,0.12);
          line-height: 1; margin-bottom: 0.5rem;
          letter-spacing: 2px;
        }
        .hp-step-icon-wrap { font-size: 2rem; margin-bottom: 0.75rem; }
        .hp-step-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.4rem; }
        .hp-step-desc { font-size: 0.84rem; color: var(--hp-muted); line-height: 1.5; margin: 0; }

        /* ── SPORTS ───────────────────────────────────────── */
        .hp-sports-section {
          padding: 4rem 2.5rem;
          text-align: center;
          border-top: 1px solid var(--hp-border);
        }
        .hp-sports-row {
          display: flex; gap: 1rem; flex-wrap: wrap;
          justify-content: center; margin-top: 2rem;
        }
        .hp-sport-pill {
          background: var(--hp-bg2);
          border: 1px solid var(--hp-border);
          border-radius: 50px;
          padding: 0.7rem 1.4rem;
          display: flex; align-items: center; gap: 0.5rem;
          cursor: default; transition: all 0.18s;
          position: relative;
        }
        .hp-sport-pill:hover { border-color: var(--hp-accent); }
        .hp-sport-icon { font-size: 1.2rem; }
        .hp-sport-name { font-size: 0.9rem; font-weight: 600; }
        .hp-sport-hot {
          background: var(--hp-accent);
          color: #000; font-size: 0.65rem; font-weight: 700;
          padding: 0.1rem 0.45rem; border-radius: 10px;
          letter-spacing: 0.5px;
        }

        /* ── TESTIMONIALS ─────────────────────────────────── */
        .hp-testimonials {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem; margin-top: 2.5rem;
        }
        .hp-testimonial {
          background: var(--hp-bg2);
          border: 1px solid var(--hp-border);
          border-radius: 16px; padding: 1.5rem;
        }
        .hp-t-stars { color: var(--hp-gold); font-size: 0.9rem; margin-bottom: 0.75rem; letter-spacing: 2px; }
        .hp-t-text { font-size: 0.9rem; color: var(--hp-muted); line-height: 1.6; margin: 0 0 1.2rem; font-style: italic; }
        .hp-t-author { display: flex; align-items: center; gap: 0.75rem; }
        .hp-t-av {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, var(--hp-purple), var(--hp-cyan));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; color: #fff; flex-shrink: 0;
        }
        .hp-t-name { font-size: 0.88rem; font-weight: 700; }
        .hp-t-role { font-size: 0.78rem; color: var(--hp-muted); }

        /* ── FAQ ──────────────────────────────────────────── */
        .hp-faq-section { border-top: 1px solid var(--hp-border); }
        .hp-faq { max-width: 720px; margin: 2rem auto 0; }
        .hp-faq-item {
          border-bottom: 1px solid var(--hp-border);
          overflow: hidden;
        }
        .hp-faq-q {
          width: 100%; background: none; border: none;
          color: var(--hp-text); text-align: left;
          padding: 1.1rem 0; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; gap: 1rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.15s;
        }
        .hp-faq-q:hover { color: var(--hp-accent); }
        .hp-faq-q.open { color: var(--hp-accent); }
        .hp-faq-chevron { font-size: 0.7rem; flex-shrink: 0; color: var(--hp-muted); }
        .hp-faq-a {
          overflow: hidden;
          padding: 0;
        }
        .hp-faq-a p {
          font-size: 0.88rem; color: var(--hp-muted);
          line-height: 1.65; padding: 0 0 1.1rem; margin: 0;
        }

        /* ── CTA ──────────────────────────────────────────── */
        .hp-cta-section {
          position: relative;
          padding: 6rem 2.5rem;
          text-align: center;
          border-top: 1px solid var(--hp-border);
          overflow: hidden;
        }
        .hp-cta-glow {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 400px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(139,92,246,0.15), transparent 70%);
          pointer-events: none;
        }
        .hp-cta-box { position: relative; z-index: 1; }
        .hp-cta-trophy { font-size: 3.5rem; margin-bottom: 1rem; }
        .hp-cta-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800; letter-spacing: -0.5px;
          margin: 0 0 0.75rem;
        }
        .hp-cta-sub { color: var(--hp-muted); font-size: 1rem; margin: 0 0 2rem; }
        .hp-cta-btns { display: flex; gap: 0.85rem; justify-content: center; flex-wrap: wrap; }
        .hp-cta-ghost {
          background: transparent;
          border: 1px solid var(--hp-border2);
          color: var(--hp-text);
          border-radius: 10px; padding: 0.85rem 1.8rem;
          font-size: 1rem; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
        }
        .hp-cta-ghost:hover { border-color: var(--hp-cyan); color: var(--hp-cyan); }

        /* ── FOOTER ───────────────────────────────────────── */
        .hp-footer {
          background: var(--hp-bg2);
          border-top: 1px solid var(--hp-border);
          padding: 3rem 2.5rem 1.5rem;
        }
        .hp-footer-inner {
          display: flex; gap: 3rem;
          max-width: 1200px; margin: 0 auto 2rem;
          flex-wrap: wrap;
        }
        .hp-footer-brand-col { flex: 2; min-width: 200px; }
        .hp-footer-links-col { flex: 1; display: flex; gap: 3rem; min-width: 200px; }
        .hp-footer-brand {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .hp-footer-tagline { color: var(--hp-muted); font-size: 0.85rem; line-height: 1.55; margin: 0; max-width: 300px; }
        .hp-footer-col { display: flex; flex-direction: column; gap: 0.5rem; }
        .hp-footer-col h4 { font-size: 0.8rem; letter-spacing: 2px; color: var(--hp-muted); text-transform: uppercase; margin: 0 0 0.5rem; }
        .hp-footer-col a { font-size: 0.88rem; color: var(--hp-muted); cursor: pointer; text-decoration: none; transition: color 0.15s; }
        .hp-footer-col a:hover { color: var(--hp-text); }
        .hp-footer-bottom {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 0.5rem;
          border-top: 1px solid var(--hp-border);
          padding-top: 1.2rem; max-width: 1200px; margin: 0 auto;
          font-size: 0.8rem; color: var(--hp-muted);
        }

        /* ── RESPONSIVE ───────────────────────────────────── */
        @media (max-width: 900px) {
          .hp-hero { grid-template-columns: 1fr; padding: 3rem 1.5rem 2rem; min-height: auto; }
          .hp-hero-right { display: none; }
          .hp-stats-strip { grid-template-columns: repeat(2, 1fr); }
          .hp-stat-item:nth-child(2) { border-right: none; }
          .hp-steps { flex-direction: column; gap: 1rem; }
          .hp-step-arrow { display: none; }
          .hp-nav-links { display: none; }
          .hp-section { padding: 3.5rem 1.5rem; }
        }
        @media (max-width: 600px) {
          .hp-stats-strip { grid-template-columns: 1fr 1fr; }
          .hp-nav { padding: 0 1.25rem; }
          .hp-hero-h1 { font-size: 2.4rem; }
          .hp-cta-title { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  )
}