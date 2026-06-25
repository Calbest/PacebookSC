let ctx: AudioContext | null = null

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playClick() {
  try {
    const a = ac(), t = a.currentTime
    const osc = a.createOscillator(), g = a.createGain()
    osc.type = 'sine'
    osc.connect(g); g.connect(a.destination)
    osc.frequency.setValueAtTime(900, t)
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.06)
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.start(t); osc.stop(t + 0.07)
  } catch { /* audio blocked */ }
}

export function playDelete() {
  try {
    const a = ac(), t = a.currentTime
    const osc = a.createOscillator(), g = a.createGain()
    osc.type = 'sawtooth'
    osc.connect(g); g.connect(a.destination)
    osc.frequency.setValueAtTime(280, t)
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.14)
    g.gain.setValueAtTime(0.1, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.start(t); osc.stop(t + 0.15)
  } catch { /* audio blocked */ }
}

export function playSuccess() {
  try {
    const a = ac(), t = a.currentTime
    ;[523, 659, 784, 1047].forEach((freq, i) => {
      const osc = a.createOscillator(), g = a.createGain()
      osc.type = 'sine'
      osc.connect(g); g.connect(a.destination)
      osc.frequency.value = freq
      const s = t + i * 0.1
      g.gain.setValueAtTime(0, s)
      g.gain.linearRampToValueAtTime(0.18, s + 0.03)
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.28)
      osc.start(s); osc.stop(s + 0.28)
    })
  } catch { /* audio blocked */ }
}

export function playSave() {
  try {
    const a = ac(), t = a.currentTime
    const osc = a.createOscillator(), g = a.createGain()
    osc.type = 'sine'
    osc.connect(g); g.connect(a.destination)
    osc.frequency.setValueAtTime(480, t)
    osc.frequency.exponentialRampToValueAtTime(960, t + 0.09)
    g.gain.setValueAtTime(0.13, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
    osc.start(t); osc.stop(t + 0.11)
  } catch { /* audio blocked */ }
}

export function playNavigate() {
  try {
    const a = ac(), t = a.currentTime
    const osc = a.createOscillator(), g = a.createGain()
    osc.type = 'sine'
    osc.connect(g); g.connect(a.destination)
    osc.frequency.setValueAtTime(340, t)
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.07)
    g.gain.setValueAtTime(0.09, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    osc.start(t); osc.stop(t + 0.09)
  } catch { /* audio blocked */ }
}
