// events.js - Random event system (positive + negative)

const TARGET_LABELS = { loc: 'Code', compile: 'Compile' };

const EVENT_DEFS = {
  // Positive events
  viral:       { type: 'positive', name: 'Viral Post!',      desc: 'Your model went viral! 5x Code for 30s',     duration: 30, effect: { target: 'loc', multiplier: 5 } },
  hackerNews:  { type: 'positive', name: 'Hacker News!',     desc: 'Front page! +5000 Compute',                 duration: 0,  effect: { instant: 'compute', amount: 5000 } },
  enterprise:  { type: 'positive', name: 'Enterprise Deal!', desc: '2x Compute per compile for 60s',                    duration: 60, effect: { target: 'compile', multiplier: 2 } },
  intern:      { type: 'positive', name: 'New Intern!',      desc: 'A talented intern joins — random model +1',  duration: 0,  effect: { instant: 'model' } },
  gpuDonation: { type: 'positive', name: 'GPU Donation!',    desc: '+10000 Compute donated!',                    duration: 0,  effect: { instant: 'compute', amount: 10000 } },
  benchmark:   { type: 'positive', name: 'Benchmark Win!',   desc: '3x Code for 45s',                            duration: 45, effect: { target: 'loc', multiplier: 3 } },

  // Negative events
  criticalBug:   { type: 'negative', name: 'Critical Bug!',     desc: 'Your AI models stopped! Tap Fix to resume + earn 2x bonus!',     duration: 0,   fixTaps: 30, effect: { halt: true } },
  serverCrash:   { type: 'negative', name: 'Server Crash!',     desc: 'Models offline! Tap Fix to restore + earn 2x bonus!',      duration: 0,   fixTaps: 20, effect: { halt: true } },
  hallucination: { type: 'negative', name: 'Hallucination!',    desc: 'Auto-Compile paused! Tap Fix to resume + earn 2x bonus!', duration: 0, fixTaps: 15, effect: { stopAutoProd: true } },
  regulation:    { type: 'negative', name: 'New Regulation',    desc: 'Compliance audit — LoC production halved for 60s',       duration: 60,  fixTaps: 0,  effect: { target: 'loc', multiplier: 0.5 } },
  overheating:   { type: 'negative', name: 'GPU Overheating!',  desc: 'Models overheated! Tap Fix to cool down + earn 2x bonus!',             duration: 0,   fixTaps: 15, effect: { halt: true } },
  negativePR:    { type: 'negative', name: 'Negative PR',       desc: 'Bad press — LoC production halved for 45s',              duration: 45,  fixTaps: 0,  effect: { target: 'loc', multiplier: 0.5 } },
};

const EVENT_SPAWN_MIN = 120;  // 2 minutes
const EVENT_SPAWN_MAX = 300;  // 5 minutes

let activeEvent = null;
let activeBuffs = [];
let eventFixTaps = 0;
let lastRenderedEventId = null;
let lastRenderedBuffCount = -1;

// Behavior tracking
let consecutiveTaps = 0;
let lastTapTime = 0;
let consecutiveCompiles = 0;
let lastCompileTime = 0;

function eventTick(dt) {
  if (activeEvent) return; // Don't spawn while event is active

  const now = Date.now();
  const elapsed = (now - gameState.lastEventTime) / 1000;
  const threshold = EVENT_SPAWN_MIN + Math.random() * (EVENT_SPAWN_MAX - EVENT_SPAWN_MIN);

  if (elapsed >= threshold) {
    spawnEvent();
    gameState.lastEventTime = now;
  }
}

function spawnEvent() {
  const eventIds = Object.keys(EVENT_DEFS);
  const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
  const def = EVENT_DEFS[eventId];

  activeEvent = { id: eventId, def, startTime: Date.now() };
  eventFixTaps = 0;
  gameState.eventStats.total++;

  // Apply instant effects
  if (def.effect.instant === 'compute') {
    gameState.compute += def.effect.amount;
  } else if (def.effect.instant === 'model') {
    const owned = getOwnedModels();
    if (owned.length > 0) {
      const randomModel = owned[Math.floor(Math.random() * owned.length)];
      randomModel.count++;
    }
  }

  // Apply timed buffs
  if (def.duration > 0) {
    activeBuffs.push({
      id: eventId,
      target: def.effect.target,
      multiplier: def.effect.multiplier,
      endTime: Date.now() + def.duration * 1000,
    });
    // Auto-resolve timed events
    activeEvent = null;
    lastRenderedEventId = null;
  }

  if (gameState.eventStats.total === 1 && def.type === 'negative') {
    if (typeof showToast === 'function') showToast('Red events slow you down — tap Fix to resolve and earn a bonus!', 'info');
  }

  renderEventBanner();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
}

function tapFixEvent() {
  if (!activeEvent) return;
  const def = activeEvent.def;
  if (!def.fixTaps || def.fixTaps <= 0) return;

  eventFixTaps++;

  // Immediate counter update (no full re-render)
  const counter = document.querySelector('.fix-counter');
  if (counter) counter.textContent = `${eventFixTaps}/${def.fixTaps}`;

  // Tap feedback on button
  const btn = document.querySelector('.fix-btn');
  if (btn) {
    btn.classList.add('tap-flash');
    setTimeout(() => btn.classList.remove('tap-flash'), 150);
  }

  if (eventFixTaps >= def.fixTaps) {
    // Event resolved — bonus
    gameState.eventStats.responded++;
    Analytics.eventResolved(activeEvent.id, activeEvent.def.type, def.fixTaps);
    activeBuffs.push({
      id: activeEvent.id + '_bonus',
      target: 'loc',
      multiplier: 2,
      endTime: Date.now() + 30000,
    });
    if (typeof showToast === 'function') showToast('Fixed! 2x Code for 30s', 'success');
    activeEvent = null;
    lastRenderedEventId = null;
    renderEventBanner();
    if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  }
}

function isHaltActive() {
  return activeEvent && activeEvent.def.effect.halt === true;
}

function isStopAutoProd() {
  return activeEvent && activeEvent.def.effect.stopAutoProd === true;
}

function getEventMultiplier(target) {
  let multiplier = 1;
  for (const buff of activeBuffs) {
    if (buff.target === target) {
      multiplier *= buff.multiplier;
    }
  }
  return multiplier;
}

function cleanupExpiredBuffs() {
  const now = Date.now();
  activeBuffs = activeBuffs.filter(b => b.endTime > now);

  // Auto-expire unfixed events after 2 minutes
  if (activeEvent && activeEvent.def.fixTaps > 0) {
    const eventAge = (now - activeEvent.startTime) / 1000;
    if (eventAge > 120) {
      activeEvent = null;
      lastRenderedEventId = null;
      renderEventBanner();
    }
  }
}

function renderEventBanner() {
  const banner = document.getElementById('event-banner');
  if (!banner) return;

  if (activeEvent) {
    const def = activeEvent.def;

    // Same fix-tap event: only update counter text (preserve DOM + click handlers)
    if (lastRenderedEventId === activeEvent.id && def.fixTaps > 0) {
      const counter = banner.querySelector('.fix-counter');
      if (counter) counter.textContent = `${eventFixTaps}/${def.fixTaps}`;
      return;
    }
    // Same non-fix event: skip re-render entirely
    if (lastRenderedEventId === activeEvent.id) return;

    lastRenderedEventId = activeEvent.id;
    lastRenderedBuffCount = -1;
    banner.style.display = 'flex';
    banner.className = 'event-banner ' + (def.type === 'positive' ? 'positive' : 'negative');
    let bannerHtml = `<span class="material-symbols-outlined">${def.type === 'positive' ? 'celebration' : 'warning'}</span>`;
    bannerHtml += `<span style="flex:1;font-size:12px"><strong>${def.name}</strong> ${def.desc}</span>`;
    if (def.fixTaps > 0) {
      bannerHtml += `<span class="fix-counter" style="font-family:var(--font-code);font-size:11px">${eventFixTaps}/${def.fixTaps}</span>`;
      bannerHtml += `<button class="btn btn-primary fix-btn" style="font-size:11px;padding:4px 10px;min-width:auto" onclick="tapFixEvent()">Fix!</button>`;
    }
    banner.innerHTML = bannerHtml;
  } else if (activeBuffs.length > 0) {
    const buff = activeBuffs[0];
    const remaining = Math.max(0, Math.ceil((buff.endTime - Date.now()) / 1000));

    // Buff timer: update only remaining seconds text
    if (lastRenderedBuffCount === activeBuffs.length && lastRenderedEventId === null) {
      const timerSpan = banner.querySelector('.buff-timer');
      if (timerSpan) { timerSpan.textContent = `${remaining}s`; return; }
    }

    lastRenderedEventId = null;
    lastRenderedBuffCount = activeBuffs.length;
    const def = EVENT_DEFS[buff.id] || { name: 'Buff Active', type: 'positive' };
    banner.style.display = 'flex';
    banner.className = 'event-banner ' + (buff.multiplier >= 1 ? 'positive' : 'negative');
    banner.innerHTML = `
      <span class="material-symbols-outlined">${buff.multiplier >= 1 ? 'trending_up' : 'trending_down'}</span>
      <span style="flex:1;font-size:12px"><strong>${def.name || 'Buff'}</strong> ${buff.multiplier}x ${TARGET_LABELS[buff.target] || buff.target} (<span class="buff-timer">${remaining}s</span>)</span>
    `;
  } else {
    lastRenderedEventId = null;
    lastRenderedBuffCount = -1;
    banner.style.display = 'none';
  }
}

// --- Behavior-triggered events ---
function trackTapBehavior() {
  const now = Date.now();
  if (now - lastTapTime > 3000) consecutiveTaps = 0;
  lastTapTime = now;
  consecutiveTaps++;
  if (consecutiveTaps === 20) {
    triggerBehaviorEvent('Flow State!', 'keyboard', 'loc', 3, 20);
    consecutiveTaps = 0;
  }
}

function trackCompileBehavior() {
  const now = Date.now();
  if (now - lastCompileTime > 60000) consecutiveCompiles = 0;
  lastCompileTime = now;
  consecutiveCompiles++;
  if (consecutiveCompiles === 5) {
    triggerBehaviorEvent('Hot Deploy!', 'rocket_launch', 'compile', 2, 30);
    consecutiveCompiles = 0;
  }
}

function triggerEureka() {
  if (gameState.eventStats.eurekaTriggered) return;
  gameState.eventStats.eurekaTriggered = true;
  triggerBehaviorEvent('Eureka!', 'lightbulb', 'loc', 5, 15);
}

function triggerBehaviorEvent(name, icon, target, multiplier, durationSec) {
  activeBuffs.push({
    id: 'behavior_' + Date.now(),
    target,
    multiplier,
    endTime: Date.now() + durationSec * 1000,
  });
  if (typeof showToast === 'function') showToast(`${name} ${multiplier}x ${TARGET_LABELS[target] || target} for ${durationSec}s`, 'success');
  if (typeof SFX !== 'undefined' && SFX.levelUp) SFX.levelUp();
  renderEventBanner();
}
