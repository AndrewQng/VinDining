const MUTE_STORAGE_KEY = 'vd-cashier-bell-muted'

export function isCashierBellMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setCashierBellMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false')
  } catch {
    // Ignore storage restriction errors in sandboxed contexts.
  }
}

/**
 * Plays a short two-note Web Audio chime for new checkout requests.
 * Respects the persisted mute preference and degrades cleanly without audio files.
 */
export function playCheckoutBell(muted = isCashierBellMuted()): void {
  if (muted || typeof window === 'undefined') return
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) return

  try {
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined)
    }
    const now = ctx.currentTime
    const notes = [880, 1174.66]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + idx * 0.11
      const duration = 0.24
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + duration)
    })
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined)
    }, 600)
  } catch {
    // Web Audio API may be blocked before user interaction; fail silently.
  }
}
