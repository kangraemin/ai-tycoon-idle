// sound.js - Web Audio API synthesized sound effects

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function isEnabled() {
    return typeof gameState !== 'undefined' && gameState.settings.sfxOn;
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

  return {
    tap() {
      playTone(600, 0.08, 'sine', 0.12, 900);
    },

    sell() {
      playNotes([
        { freq: 800, dur: 0.06 },
        { freq: 1000, dur: 0.06 },
        { freq: 1200, dur: 0.1 },
      ], 50);
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
  };
})();
