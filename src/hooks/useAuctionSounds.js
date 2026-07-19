import { useRef, useCallback } from 'react'

/**
 * AuctionX Sound Engine v2
 * ─────────────────────────────────────────────────────────────────
 * Features:
 *  • Web Audio API — zero file dependencies
 *  • Web Speech API — spoken announcements
 *  • "SOLD to [Team Name]!" announcement
 *  • "UNSOLD!" announcement
 *  • IPL-style bid war clash sound + crowd roar
 *  • All sounds respect global mute
 */
export function useAuctionSounds() {

  const acRef    = useRef(null)
  const mutedRef = useRef(false)

  // ── AudioContext ────────────────────────────────────────────────
  const getAC = useCallback(() => {
    if (!acRef.current || acRef.current.state === 'closed') {
      acRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (acRef.current.state === 'suspended') {
      acRef.current.resume()
    }
    return acRef.current
  }, [])

  // ── Make gain node connected to destination ─────────────────────
  const makeGain = useCallback((ac, volume = 0.5) => {
    const g = ac.createGain()
    g.gain.value = volume
    g.connect(ac.destination)
    return g
  }, [])

  // ── Single oscillator helper ────────────────────────────────────
  const makeOsc = useCallback((ac, gain, type, freq, start, stop) => {
    const o = ac.createOscillator()
    o.type = type
    o.frequency.value = freq
    o.connect(gain)
    o.start(start)
    o.stop(stop)
    return o
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // SPEECH ENGINE
  // Uses Web Speech API (SpeechSynthesis) — built into all browsers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Speak any text aloud.
   * pitch / rate / volume fully configurable.
   */
  const speak = useCallback((text, {
    pitch  = 1.1,
    rate   = 0.92,
    volume = 1.0,
    voice  = null    // null = use browser default
  } = {}) => {
    if (mutedRef.current) return
    if (!window.speechSynthesis) return

    // Cancel any current speech immediately
    window.speechSynthesis.cancel()

    const utt     = new SpeechSynthesisUtterance(text)
    utt.pitch     = pitch
    utt.rate      = rate
    utt.volume    = volume
    utt.lang      = 'en-IN'   // Indian English accent — fits IPL/cricket theme

    // Use a specific voice if available
    if (voice) {
      const voices = window.speechSynthesis.getVoices()
      const found  = voices.find(v =>
        v.name.toLowerCase().includes(voice.toLowerCase()))
      if (found) utt.voice = found
    }

    window.speechSynthesis.speak(utt)
  }, [])

  /**
   * Load voices (some browsers load them async)
   * Call once on app start if needed.
   */
  const loadVoices = useCallback(() => {
    return new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) return resolve(voices)
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices())
      }
    })
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: SOLD — Gavel + "SOLD to [Team]!"
  // ═══════════════════════════════════════════════════════════════

  /**
   * @param {string} teamName  - e.g. "Mumbai Indians"
   * @param {number} price     - e.g. 1500000
   * @param {string} playerName - e.g. "Virat Kohli"
   */
  const playSold = useCallback((teamName = '', price = 0, playerName = '') => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime

      // ── Gavel bang 1 ───────────────────────────────────────────
      const g1 = makeGain(ac, 0)
      const o1 = ac.createOscillator()
      o1.type = 'sawtooth'
      o1.frequency.setValueAtTime(200, t)
      o1.frequency.exponentialRampToValueAtTime(60, t + 0.28)
      o1.connect(g1)
      o1.start(t); o1.stop(t + 0.3)
      g1.gain.setValueAtTime(0.8, t)
      g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)

      // ── Gavel bang 2 (stronger) ─────────────────────────────────
      const g2 = makeGain(ac, 0)
      const o2 = ac.createOscillator()
      o2.type = 'sawtooth'
      o2.frequency.setValueAtTime(220, t + 0.2)
      o2.frequency.exponentialRampToValueAtTime(70, t + 0.48)
      o2.connect(g2)
      o2.start(t + 0.2); o2.stop(t + 0.5)
      g2.gain.setValueAtTime(0.9, t + 0.2)
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)

      // ── Victory chime after gavel ───────────────────────────────
      const chimes = [523, 659, 784, 1047, 1319]
      chimes.forEach((freq, i) => {
        const gc = makeGain(ac, 0)
        makeOsc(ac, gc, 'sine', freq, t + 0.55 + i * 0.09, t + 0.9 + i * 0.09)
        gc.gain.setValueAtTime(0.22, t + 0.55 + i * 0.09)
        gc.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 + i * 0.09)
      })

      // ── Speech announcement — fires after gavel finishes ────────
      // "SOLD! Virat Kohli — to Mumbai Indians — for 15 lakh!"
      const delayMs = 600
      setTimeout(() => {
        let announcement = 'SOLD!'
        if (playerName) announcement += ` ${playerName}.`
        if (teamName)   announcement += ` Going to ${teamName}!`
        if (price > 0) {
          // Convert to lakh/crore for Indian flavour
          const display = price >= 10000000
            ? `${(price / 10000000).toFixed(1)} crore`
            : price >= 100000
              ? `${(price / 100000).toFixed(1)} lakh`
              : `${price}`
          announcement += ` For ${display}!`
        }
        speak(announcement, { pitch: 1.2, rate: 0.85, volume: 1.0 })
      }, delayMs)

    } catch (e) { console.warn('playSold error:', e) }
  }, [getAC, makeGain, makeOsc, speak])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: UNSOLD — Buzzer + "UNSOLD!"
  // ═══════════════════════════════════════════════════════════════

  /**
   * @param {string} playerName - e.g. "Ben Stokes"
   */
  const playUnsold = useCallback((playerName = '') => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime

      // ── Descending wah-wah buzzer ───────────────────────────────
      const g = makeGain(ac, 0)
      const o = ac.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(300, t)
      o.frequency.exponentialRampToValueAtTime(140, t + 0.22)
      o.frequency.setValueAtTime(260, t + 0.22)
      o.frequency.exponentialRampToValueAtTime(100, t + 0.48)
      o.connect(g)
      o.start(t); o.stop(t + 0.52)

      // Volume shape — two wah pulses
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.5,    t + 0.04)
      g.gain.linearRampToValueAtTime(0.0001, t + 0.21)
      g.gain.linearRampToValueAtTime(0.4,    t + 0.25)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52)

      // Low thud underneath
      const gt = makeGain(ac, 0)
      const ot = ac.createOscillator()
      ot.type = 'sine'
      ot.frequency.setValueAtTime(80, t)
      ot.frequency.exponentialRampToValueAtTime(40, t + 0.3)
      ot.connect(gt)
      ot.start(t); ot.stop(t + 0.32)
      gt.gain.setValueAtTime(0.4, t)
      gt.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)

      // ── Speech announcement ─────────────────────────────────────
      setTimeout(() => {
        let announcement = 'Unsold!'
        if (playerName) announcement = `${playerName}. Unsold!`
        speak(announcement, { pitch: 0.85, rate: 0.88, volume: 0.95 })
      }, 400)

    } catch (e) { console.warn('playUnsold error:', e) }
  }, [getAC, makeGain, makeOsc, speak])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: BID WAR — IPL-style clash + crowd roar
  // ═══════════════════════════════════════════════════════════════

  /**
   * IPL bid war sound:
   *  1. Metal CLASH hit (like bat hitting ball)
   *  2. Crowd noise swell
   *  3. Rapid war drums speeding up
   *  4. Rising siren tension
   *  5. "Bid War!" speech announcement
   *
   * @param {string} team1 - first team in war
   * @param {string} team2 - second team in war
   */
  const playBidWar = useCallback((team1 = '', team2 = '') => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime

      // ── 1. Metal CLASH hit ──────────────────────────────────────
      // Simulates two bids "clashing" — metallic impact sound
      const clashBuffer = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate)
      const clashData   = clashBuffer.getChannelData(0)
      for (let i = 0; i < clashData.length; i++) {
        // Decaying noise with metallic character
        const decay = Math.exp(-i / (ac.sampleRate * 0.08))
        clashData[i] = (Math.random() * 2 - 1) * decay
      }
      const clashSrc = ac.createBufferSource()
      clashSrc.buffer = clashBuffer

      // High-pass filter for metallic tone
      const clashFilter = ac.createBiquadFilter()
      clashFilter.type = 'highpass'
      clashFilter.frequency.value = 1200

      const clashGain = ac.createGain()
      clashGain.gain.value = 0.7
      clashSrc.connect(clashFilter)
      clashFilter.connect(clashGain)
      clashGain.connect(ac.destination)
      clashSrc.start(t)

      // Second clash hit slightly offset — collision feel
      setTimeout(() => {
        try {
          const ac2  = getAC()
          const t2   = ac2.currentTime
          const src2 = ac2.createBufferSource()
          src2.buffer = clashBuffer
          const f2 = ac2.createBiquadFilter()
          f2.type = 'highpass'; f2.frequency.value = 800
          const g2 = ac2.createGain(); g2.gain.value = 0.5
          src2.connect(f2); f2.connect(g2); g2.connect(ac2.destination)
          src2.start(t2)
        } catch {}
      }, 80)

      // ── 2. Crowd noise swell ────────────────────────────────────
      // Pink-ish noise filtered to sound like crowd
      const crowdBuffer = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate)
      const crowdData   = crowdBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0  // pink noise state
      for (let i = 0; i < crowdData.length; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        crowdData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11
      }

      const crowdSrc = ac.createBufferSource()
      crowdSrc.buffer = crowdBuffer

      // Band-pass to make it "crowd cheer" frequency
      const crowdFilter = ac.createBiquadFilter()
      crowdFilter.type = 'bandpass'
      crowdFilter.frequency.value = 600
      crowdFilter.Q.value = 0.4

      const crowdGain = ac.createGain()
      crowdSrc.connect(crowdFilter)
      crowdFilter.connect(crowdGain)
      crowdGain.connect(ac.destination)

      // Crowd swells in from 0.1s
      crowdGain.gain.setValueAtTime(0.0001, t + 0.1)
      crowdGain.gain.linearRampToValueAtTime(0.35, t + 0.5)
      crowdGain.gain.linearRampToValueAtTime(0.5,  t + 0.9)
      crowdGain.gain.linearRampToValueAtTime(0.0001, t + 1.5)
      crowdSrc.start(t + 0.1)

      // ── 3. War drums — rapid pattern speeding up ────────────────
      // IPL-style dhol drum rhythm
      const drumTimes = [0.15, 0.28, 0.39, 0.48, 0.56, 0.62, 0.67, 0.71, 0.74, 0.77]
      drumTimes.forEach((offset, i) => {
        const gd = makeGain(ac, 0)
        const od = ac.createOscillator()
        od.type = 'sine'
        od.frequency.setValueAtTime(90 + i * 8, t + offset)
        od.frequency.exponentialRampToValueAtTime(50, t + offset + 0.08)
        od.connect(gd)
        od.start(t + offset)
        od.stop(t + offset + 0.1)
        gd.gain.setValueAtTime(0.5 + i * 0.04, t + offset)
        gd.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.1)

        // High cymbal hit on every other drum
        if (i % 2 === 0) {
          const gc = makeGain(ac, 0)
          makeOsc(ac, gc, 'square', 800 + i * 50, t + offset, t + offset + 0.05)
          gc.gain.setValueAtTime(0.12, t + offset)
          gc.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.05)
        }
      })

      // ── 4. Rising siren / tension tone ─────────────────────────
      const gs = makeGain(ac, 0)
      const os = ac.createOscillator()
      os.type = 'sawtooth'
      os.frequency.setValueAtTime(220, t + 0.1)
      os.frequency.linearRampToValueAtTime(880, t + 0.9)
      os.connect(gs)
      os.start(t + 0.1); os.stop(t + 0.95)
      gs.gain.setValueAtTime(0.0001, t + 0.1)
      gs.gain.linearRampToValueAtTime(0.18, t + 0.5)
      gs.gain.linearRampToValueAtTime(0.0001, t + 0.95)

      // ── 5. Speech announcement ──────────────────────────────────
      setTimeout(() => {
        let msg = 'Bid war!'
        if (team1 && team2) {
          msg = `Bid war! ${team1} versus ${team2}!`
        } else if (team1) {
          msg = `Bid war! ${team1} is leading!`
        }
        speak(msg, { pitch: 1.3, rate: 1.1, volume: 1.0 })
      }, 500)

    } catch (e) { console.warn('playBidWar error:', e) }
  }, [getAC, makeGain, makeOsc, speak])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: BID PLACED — Cash register ding
  // ═══════════════════════════════════════════════════════════════
  const playBid = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime
      const g  = makeGain(ac, 0)
      makeOsc(ac, g, 'sine', 1100, t, t + 0.16)
      g.gain.setValueAtTime(0.3, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      // Subtle overtone
      const g2 = makeGain(ac, 0)
      makeOsc(ac, g2, 'sine', 2200, t, t + 0.09)
      g2.gain.setValueAtTime(0.1, t)
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    } catch (e) { console.warn('playBid error:', e) }
  }, [getAC, makeGain, makeOsc])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: TIMER TICKS
  // ═══════════════════════════════════════════════════════════════
  const playTick = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime
      const g  = makeGain(ac, 0)
      makeOsc(ac, g, 'square', 1300, t, t + 0.04)
      g.gain.setValueAtTime(0.1, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    } catch (e) {}
  }, [getAC, makeGain, makeOsc])

  const playUrgentTick = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime
      const g  = makeGain(ac, 0)
      makeOsc(ac, g, 'square', 1700, t, t + 0.055)
      g.gain.setValueAtTime(0.2, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055)
      const g2 = makeGain(ac, 0)
      makeOsc(ac, g2, 'sine', 850, t + 0.02, t + 0.07)
      g2.gain.setValueAtTime(0.08, t + 0.02)
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    } catch (e) {}
  }, [getAC, makeGain, makeOsc])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: WHEEL SPIN — Roulette whirr
  // ═══════════════════════════════════════════════════════════════
  const playWheelSpin = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ac         = getAC()
      const t          = ac.currentTime
      const bufferSize = ac.sampleRate * 2
      const buffer     = ac.createBuffer(1, bufferSize, ac.sampleRate)
      const data       = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

      const src    = ac.createBufferSource()
      src.buffer   = buffer
      const filter = ac.createBiquadFilter()
      filter.type  = 'bandpass'
      filter.frequency.setValueAtTime(900, t)
      filter.frequency.linearRampToValueAtTime(180, t + 2)
      filter.Q.value = 0.7

      const g = ac.createGain()
      src.connect(filter); filter.connect(g); g.connect(ac.destination)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.22, t + 0.25)
      g.gain.setValueAtTime(0.22, t + 1.5)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2)
      src.start(t); src.stop(t + 2)
    } catch (e) { console.warn('playWheelSpin error:', e) }
  }, [getAC])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: PLAYER REVEALED — Tier-based fanfare
  // ═══════════════════════════════════════════════════════════════
  const playReveal = useCallback((tier = 'BRONZE') => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime

      const freqMap = {
        PLATINUM: [261, 329, 392, 523, 659, 784, 1047],
        GOLD:     [329, 415, 523, 659, 784],
        SILVER:   [392, 523, 659, 784],
        BRONZE:   [392, 523, 659]
      }
      const freqs = freqMap[tier] || freqMap.BRONZE

      freqs.forEach((freq, i) => {
        const g = makeGain(ac, 0)
        makeOsc(ac, g, 'sine', freq, t + i * 0.08, t + i * 0.08 + 0.32)
        g.gain.setValueAtTime(tier === 'PLATINUM' ? 0.28 : 0.2, t + i * 0.08)
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.32)
      })

      // Platinum shimmer
      if (tier === 'PLATINUM') {
        [2100, 2500, 2900, 3300].forEach((freq, i) => {
          const g = makeGain(ac, 0)
          makeOsc(ac, g, 'sine', freq, t + 0.28 + i * 0.06, t + 0.6 + i * 0.06)
          g.gain.setValueAtTime(0.07, t + 0.28 + i * 0.06)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + i * 0.06)
        })
      }
    } catch (e) { console.warn('playReveal error:', e) }
  }, [getAC, makeGain, makeOsc])

  // ═══════════════════════════════════════════════════════════════
  // SOUND: AUCTION COMPLETE
  // ═══════════════════════════════════════════════════════════════
  const playComplete = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ac = getAC()
      const t  = ac.currentTime

      [[261,329,392],[349,440,523],[392,494,587],[523,659,784]]
        .forEach((chord, ci) => {
          chord.forEach(freq => {
            const g = makeGain(ac, 0)
            makeOsc(ac, g, 'sine', freq, t + ci * 0.28, t + ci * 0.28 + 0.38)
            g.gain.setValueAtTime(0.2, t + ci * 0.28)
            g.gain.exponentialRampToValueAtTime(0.0001, t + ci * 0.28 + 0.38)
          })
        })

      // Final high note
      const gf = makeGain(ac, 0)
      makeOsc(ac, gf, 'sine', 1047, t + 1.15, t + 1.85)
      gf.gain.setValueAtTime(0.28, t + 1.15)
      gf.gain.exponentialRampToValueAtTime(0.0001, t + 1.85)

      setTimeout(() => {
        speak('Auction complete! Thank you!', { pitch: 1.1, rate: 0.88 })
      }, 1200)
    } catch (e) { console.warn('playComplete error:', e) }
  }, [getAC, makeGain, makeOsc, speak])

  // ── Mute controls ───────────────────────────────────────────────
  const setMuted = useCallback((val) => {
    mutedRef.current = val
    if (val) window.speechSynthesis?.cancel()
  }, [])

  const isMuted = useCallback(() => mutedRef.current, [])

  return {
    playSold,
    playUnsold,
    playBid,
    playBidWar,
    playTick,
    playUrgentTick,
    playWheelSpin,
    playReveal,
    playComplete,
    setMuted,
    isMuted,
    loadVoices
  }
}