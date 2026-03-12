// sound.js - Web Audio API synthesized sound effects (AI Tycoon theme)

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function isEnabled() {
    return typeof gameState !== 'undefined' && gameState.settings && gameState.settings.sfx !== false;
  }

  function playTone(freq, duration, type, volume, ramp) {
    if (!isEnabled()) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (ramp) osc.frequency.linearRampToValueAtTime(ramp, c.currentTime + duration);
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function playNotes(notes, interval) {
    if (!isEnabled()) return;
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n.freq, n.dur || 0.12, n.type || 'sine', n.vol || 0.15, n.ramp), i * (interval || 80));
    });
  }

  function playNoise(duration, volume) {
    if (!isEnabled()) return;
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const bandpass = c.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 4000;
    bandpass.Q.value = 0.5;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume || 0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(c.destination);
    noise.start(c.currentTime);
    noise.stop(c.currentTime + duration);
  }

  return {
    // Keyboard keystroke sound — short noise burst + click tone
    tap() {
      playNoise(0.04, 0.1);
      playTone(1200 + Math.random() * 400, 0.03, 'square', 0.04);
    },

    // Compile success — ascending digital chime
    sell() {
      playNotes([
        { freq: 880, dur: 0.06, type: 'square', vol: 0.1 },
        { freq: 1100, dur: 0.06, type: 'square', vol: 0.1 },
        { freq: 1320, dur: 0.08, type: 'triangle', vol: 0.12 },
        { freq: 1760, dur: 0.12, type: 'sine', vol: 0.15 },
      ], 40);
    },

    buy() {
      playNotes([
        { freq: 500, dur: 0.08, type: 'triangle' },
        { freq: 700, dur: 0.12, type: 'triangle' },
      ], 70);
    },

    levelUp() {
      playNotes([
        { freq: 523, dur: 0.1, type: 'triangle' },
        { freq: 659, dur: 0.1, type: 'triangle' },
        { freq: 784, dur: 0.1, type: 'triangle' },
        { freq: 1047, dur: 0.2, type: 'triangle' },
      ], 90);
    },

    gachaPull() {
      playNotes([
        { freq: 300, dur: 0.1, type: 'square', vol: 0.08 },
        { freq: 350, dur: 0.1, type: 'square', vol: 0.08 },
        { freq: 400, dur: 0.1, type: 'square', vol: 0.08 },
        { freq: 500, dur: 0.15, type: 'square', vol: 0.1 },
      ], 100);
    },

    gachaReveal(rarity) {
      const delay = 450;
      if (rarity === 'legendary' || rarity === 'epic') {
        setTimeout(() => playNotes([
          { freq: 523, dur: 0.12, type: 'triangle', vol: 0.2 },
          { freq: 659, dur: 0.12, type: 'triangle', vol: 0.2 },
          { freq: 784, dur: 0.12, type: 'triangle', vol: 0.2 },
          { freq: 1047, dur: 0.3, type: 'sine', vol: 0.25 },
        ], 100), delay);
      } else if (rarity === 'rare') {
        setTimeout(() => playNotes([
          { freq: 600, dur: 0.1, type: 'triangle' },
          { freq: 800, dur: 0.15, type: 'triangle' },
        ], 100), delay);
      } else {
        setTimeout(() => playTone(700, 0.15, 'triangle', 0.12), delay);
      }
    },

    prestige() {
      playNotes([
        { freq: 392, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 523, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 659, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 784, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 1047, dur: 0.4, type: 'sine', vol: 0.25 },
      ], 120);
    },

    navigate() {
      playTone(800, 0.04, 'sine', 0.06);
    },

    error() {
      playNotes([
        { freq: 200, dur: 0.08, type: 'square', vol: 0.1 },
        { freq: 150, dur: 0.12, type: 'square', vol: 0.1 },
      ], 80);
    },

    achievement() {
      playNotes([
        { freq: 784, dur: 0.1, type: 'triangle', vol: 0.2 },
        { freq: 988, dur: 0.1, type: 'triangle', vol: 0.2 },
        { freq: 1175, dur: 0.2, type: 'sine', vol: 0.25 },
      ], 100);
    },

    // Challenge start
    challengeStart() {
      playNotes([
        { freq: 440, dur: 0.08, type: 'square', vol: 0.1 },
        { freq: 660, dur: 0.08, type: 'square', vol: 0.1 },
        { freq: 880, dur: 0.12, type: 'triangle', vol: 0.15 },
      ], 80);
    },

    // Event positive
    eventPositive() {
      playNotes([
        { freq: 523, dur: 0.1, type: 'sine', vol: 0.15 },
        { freq: 784, dur: 0.15, type: 'sine', vol: 0.2 },
      ], 100);
    },

    // Event negative
    eventNegative() {
      playNotes([
        { freq: 300, dur: 0.15, type: 'sawtooth', vol: 0.1 },
        { freq: 200, dur: 0.2, type: 'sawtooth', vol: 0.1 },
      ], 100);
    },

    // Fusion success
    fusion() {
      playNotes([
        { freq: 400, dur: 0.1, type: 'triangle', vol: 0.15 },
        { freq: 600, dur: 0.1, type: 'triangle', vol: 0.15 },
        { freq: 800, dur: 0.1, type: 'triangle', vol: 0.15 },
        { freq: 1200, dur: 0.25, type: 'sine', vol: 0.2 },
      ], 80);
    },

    // Career promote
    promote() {
      playNotes([
        { freq: 392, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 523, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 659, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 784, dur: 0.15, type: 'triangle', vol: 0.2 },
        { freq: 1047, dur: 0.4, type: 'sine', vol: 0.25 },
      ], 120);
    },
  };
})();
