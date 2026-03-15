// debug.js - Developer debug panel (Ctrl+Shift+D to toggle)

const DEBUG_ENABLED = (() => {
  try { return localStorage.getItem('aiTycoon_debug') === '1'; } catch { return false; }
})();

let debugPanelVisible = false;
let gameSpeedMultiplier = 1;

const DEBUG_PRESETS = {
  early: {
    primitives: { loc: 500, compute: 200, papers: 10, totalLoc: 500, reputation: 100, tokens: 5, careerStage: 0, prestigeMultiplier: 1, gpuSlots: 1 },
    models: { chatbot: { count: 1, level: 1 } },
    upgradeLevel: 0
  },
  mid: {
    primitives: { loc: 50000, compute: 30000, papers: 50, totalLoc: 200000, reputation: 2000000, tokens: 8, careerStage: 3, prestigeMultiplier: 6.0, gpuSlots: 5 },
    models: { chatbot: {count:2,level:3}, translator: {count:1,level:2}, summarizer: {count:1,level:2}, imageGen: {count:1,level:2}, codeGen: {count:1,level:1} },
    upgradeLevel: 3
  },
  late: {
    primitives: { loc: 5000000, compute: 2000000, papers: 200, totalLoc: 50000000, reputation: 2000000000, tokens: 10, careerStage: 6, prestigeMultiplier: 25.0, gpuSlots: 8 },
    models: { chatbot:{count:3,level:5}, translator:{count:2,level:4}, summarizer:{count:2,level:4}, imageGen:{count:2,level:3}, codeGen:{count:2,level:3}, voiceAI:{count:1,level:3}, reasoning:{count:1,level:2}, multimodal:{count:1,level:2} },
    upgradeLevel: 7
  },
  endgame: {
    primitives: { loc: 100000000, compute: 50000000, papers: 500, totalLoc: 500000000, reputation: 50000000000, tokens: 10, careerStage: 7, prestigeMultiplier: 50.0, gpuSlots: 10 },
    models: { chatbot:{count:5,level:5}, translator:{count:3,level:5}, summarizer:{count:3,level:5}, imageGen:{count:3,level:5}, codeGen:{count:3,level:5}, voiceAI:{count:2,level:5}, reasoning:{count:2,level:5}, multimodal:{count:2,level:5}, agi:{count:1,level:3}, superAgi:{count:1,level:2} },
    upgradeLevel: 10
  }
};

function toggleDebugPanel() {
  const panel = document.getElementById('debug-panel');
  if (!panel) return;
  debugPanelVisible = !debugPanelVisible;
  panel.style.display = debugPanelVisible ? 'block' : 'none';
  if (debugPanelVisible) renderDebugPanel();
}

function enableDebugMode() {
  try { localStorage.setItem('aiTycoon_debug', '1'); } catch {}
  createDebugPanel();
}

function disableDebugMode() {
  try { localStorage.removeItem('aiTycoon_debug'); } catch {}
  const panel = document.getElementById('debug-panel');
  if (panel) panel.remove();
  debugPanelVisible = false;
}

function createDebugPanel() {
  if (document.getElementById('debug-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.display = 'none';
  document.body.appendChild(panel);
}

function renderDebugPanel() {
  const panel = document.getElementById('debug-panel');
  if (!panel) return;

  const owned = typeof getOwnedModels === 'function' ? getOwnedModels().length : '?';
  const stage = typeof CAREER_STAGES !== 'undefined' ? CAREER_STAGES[gameState.careerStage]?.name : gameState.careerStage;

  // Build event options
  const eventOptions = typeof EVENT_DEFS !== 'undefined'
    ? Object.keys(EVENT_DEFS).map(id => `<option value="${id}">${id}</option>`).join('')
    : '';

  // Build challenge options
  const challengeOptions = typeof CHALLENGE_TYPES !== 'undefined'
    ? Object.keys(CHALLENGE_TYPES).map(t => `<option value="${t}">${CHALLENGE_TYPES[t].name}</option>`).join('')
    : '';

  // Build quick save slot indicators
  const slotIndicators = [1, 2, 3].map(s => {
    const exists = !!localStorage.getItem(`aiTycoon_quicksave_${s}`);
    return exists ? '●' : '○';
  });

  panel.innerHTML = `
    <div class="debug-header">
      <span>🛠 Debug Panel</span>
      <button class="debug-close" onclick="toggleDebugPanel()">✕</button>
    </div>
    <div class="debug-body">

      <div class="debug-section">
        <div class="debug-section-title">State</div>
        <div class="debug-state-grid">
          <span>LoC</span><span class="debug-val">${formatNumber(gameState.loc)}</span>
          <span>Compute</span><span class="debug-val">${formatNumber(gameState.compute)}</span>
          <span>Papers</span><span class="debug-val">${formatNumber(gameState.papers)}</span>
          <span>Tokens</span><span class="debug-val">${gameState.tokens}</span>
          <span>Rep</span><span class="debug-val">${formatNumber(gameState.reputation)}</span>
          <span>Models</span><span class="debug-val">${owned}/${gameState.gpuSlots}</span>
          <span>Career</span><span class="debug-val">${stage}</span>
          <span>Speed</span><span class="debug-val">${gameSpeedMultiplier}x</span>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Presets</div>
        <div class="debug-btn-row">
          <button onclick="debugLoadPreset('early')">Early</button>
          <button onclick="debugLoadPreset('mid')">Mid</button>
          <button onclick="debugLoadPreset('late')">Late</button>
          <button onclick="debugLoadPreset('endgame')">Endgame</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Add Resources</div>
        <div class="debug-btn-row">
          <button onclick="debugAddResource('loc', 1000)">+1K LoC</button>
          <button onclick="debugAddResource('loc', 100000)">+100K LoC</button>
          <button onclick="debugAddResource('loc', 10000000)">+10M LoC</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugAddResource('compute', 1000)">+1K Compute</button>
          <button onclick="debugAddResource('compute', 100000)">+100K</button>
          <button onclick="debugAddResource('compute', 10000000)">+10M</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugAddResource('papers', 10)">+10 Papers</button>
          <button onclick="debugAddResource('papers', 100)">+100</button>
          <button onclick="debugAddResource('tokens', 10)">+10 Tokens</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugAddResource('reputation', 10000)">+10K Rep</button>
          <button onclick="debugAddResource('reputation', 1000000)">+1M Rep</button>
          <button onclick="debugAddResource('reputation', 10000000000)">+10B Rep</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Game Speed</div>
        <div class="debug-btn-row">
          <button onclick="debugSetSpeed(1)" class="${gameSpeedMultiplier === 1 ? 'active' : ''}">1x</button>
          <button onclick="debugSetSpeed(5)" class="${gameSpeedMultiplier === 5 ? 'active' : ''}">5x</button>
          <button onclick="debugSetSpeed(10)" class="${gameSpeedMultiplier === 10 ? 'active' : ''}">10x</button>
          <button onclick="debugSetSpeed(50)" class="${gameSpeedMultiplier === 50 ? 'active' : ''}">50x</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Unlock / Max</div>
        <div class="debug-btn-row">
          <button onclick="debugUnlockAllModels()">All Models</button>
          <button onclick="debugMaxUpgrades()">Max Upgrades</button>
          <button onclick="debugSetGpuSlots(10)">10 GPU Slots</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Trigger Event</div>
        <div class="debug-btn-row">
          <select id="debug-event-select" class="debug-select">${eventOptions}</select>
          <button onclick="debugTriggerSpecificEvent(document.getElementById('debug-event-select').value)">Trigger</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugTriggerEvent('positive')">+ Random</button>
          <button onclick="debugTriggerEvent('negative')">- Random</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Trigger Challenge</div>
        <div class="debug-btn-row">
          <select id="debug-challenge-select" class="debug-select">${challengeOptions}</select>
          <button onclick="debugTriggerSpecificChallenge(document.getElementById('debug-challenge-select').value)">Trigger</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Career</div>
        <div class="debug-btn-row">
          <button onclick="debugJumpCareer(1)">Career +1</button>
          <button onclick="debugJumpCareer(7)">Career Max</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Quick Save</div>
        <div class="debug-btn-row">
          <button onclick="debugQuickSave(1)">Save 1 ${slotIndicators[0]}</button>
          <button onclick="debugQuickSave(2)">Save 2 ${slotIndicators[1]}</button>
          <button onclick="debugQuickSave(3)">Save 3 ${slotIndicators[2]}</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugQuickLoad(1)">Load 1</button>
          <button onclick="debugQuickLoad(2)">Load 2</button>
          <button onclick="debugQuickLoad(3)">Load 3</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Time Skip</div>
        <div class="debug-btn-row">
          <button onclick="debugSkipTokenRecharge()">Max Tokens</button>
          <button onclick="debugSkipEventCooldown()">Reset Cooldowns</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Reset</div>
        <div class="debug-btn-row">
          <button onclick="debugResetTutorial()">Tutorial</button>
          <button onclick="debugResetAchievements()">Achievements</button>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-section-title">Save</div>
        <div class="debug-btn-row">
          <button onclick="debugExportSave()">Export</button>
          <button onclick="debugImportSave()">Import</button>
          <button onclick="debugResetSave()" class="debug-danger">Reset</button>
        </div>
      </div>

    </div>
  `;
}

// --- Debug Actions ---

function debugAddResource(resource, amount) {
  gameState[resource] = (gameState[resource] || 0) + amount;
  if (resource === 'loc') gameState.totalLoc += amount;
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  renderDebugPanel();
}

function debugSetSpeed(speed) {
  gameSpeedMultiplier = speed;

  // Patch game loop interval
  if (typeof gameLoopId !== 'undefined' && gameLoopId !== null) {
    clearInterval(gameLoopId);
  }
  // Override produceTick to multiply dt
  if (!window._originalProduceTick) {
    window._originalProduceTick = produceTick;
  }
  window.produceTick = function(dt) {
    window._originalProduceTick(dt * gameSpeedMultiplier);
  };

  renderDebugPanel();
}

function debugUnlockAllModels() {
  // Expand GPU slots if needed
  gameState.gpuSlots = Math.max(gameState.gpuSlots, 10);
  for (const model of gameState.models) {
    if (model.count === 0) model.count = 1;
  }
  if (gameState.stats) gameState.stats.modelsOwned = gameState.models.filter(m => m.count > 0).length;
  if (typeof renderModelsScreen === 'function') renderModelsScreen();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  renderDebugPanel();
}

function debugMaxUpgrades() {
  for (const cat of Object.keys(gameState.upgrades)) {
    for (const key of Object.keys(gameState.upgrades[cat])) {
      gameState.upgrades[cat][key] = 10;
    }
  }
  if (typeof renderUpgradeScreen === 'function') renderUpgradeScreen();
  renderDebugPanel();
}

function debugSetGpuSlots(slots) {
  gameState.gpuSlots = slots;
  if (typeof renderModelsScreen === 'function') renderModelsScreen();
  renderDebugPanel();
}

function debugTriggerEvent(type) {
  const events = Object.entries(EVENT_DEFS).filter(([, def]) => def.type === type);
  if (events.length === 0) return;
  const [id, def] = events[Math.floor(Math.random() * events.length)];

  // Force spawn this specific event
  activeEvent = { id, def, startTime: Date.now() };
  eventFixTaps = 0;
  gameState.eventStats.total++;

  if (def.effect.instant === 'compute') gameState.compute += def.effect.amount;
  if (def.effect.instant === 'model') {
    const owned = getOwnedModels();
    if (owned.length > 0) owned[Math.floor(Math.random() * owned.length)].count++;
  }
  if (def.duration > 0) {
    activeBuffs.push({ id, target: def.effect.target, multiplier: def.effect.multiplier, endTime: Date.now() + def.duration * 1000 });
    activeEvent = null;
    lastRenderedEventId = null;
  }

  if (typeof renderEventBanner === 'function') renderEventBanner();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  renderDebugPanel();
}

function debugTriggerChallenge() {
  if (typeof CHALLENGE_TYPES === 'undefined') return;
  const types = Object.keys(CHALLENGE_TYPES);
  const pick = types[Math.floor(Math.random() * types.length)];
  if (typeof startChallenge === 'function') startChallenge(pick);
}

function debugJumpCareer(targetStage) {
  if (targetStage > gameState.careerStage) {
    gameState.careerStage = targetStage;
    gameState.prestigeMultiplier = CAREER_STAGES[targetStage]?.multiplier || 1;
    if (typeof renderCareerScreen === 'function') renderCareerScreen();
    if (typeof applyCareerTheme === 'function') applyCareerTheme();
    renderDebugPanel();
  }
}

function debugExportSave() {
  const data = JSON.stringify(gameState, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-tycoon-save-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Save exported!', 'success');
}

function debugImportSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Basic validation
      if (typeof parsed.loc !== 'number' || !Array.isArray(parsed.models)) {
        if (typeof showToast === 'function') showToast('Invalid save file!', 'error');
        return;
      }
      await Storage.save(SAVE_KEY, parsed);
      location.reload();
    } catch (err) {
      if (typeof showToast === 'function') showToast('Import failed: ' + err.message, 'error');
    }
  };
  input.click();
}

function debugResetSave() {
  if (confirm('Reset ALL game progress? This cannot be undone.')) {
    if (typeof resetGame === 'function') {
      resetGame().then(() => location.reload());
    }
  }
}

function debugRefreshAllUI() {
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  if (typeof renderModelsScreen === 'function') renderModelsScreen();
  if (typeof renderUpgradeScreen === 'function') renderUpgradeScreen();
  if (typeof renderCareerScreen === 'function') renderCareerScreen();
  if (typeof renderEventBanner === 'function') renderEventBanner();
  if (typeof applyCareerTheme === 'function') applyCareerTheme();
  renderDebugPanel();
}

function debugLoadPreset(name) {
  const preset = DEBUG_PRESETS[name];
  if (!preset) return;
  gameState = createDefaultState();
  Object.assign(gameState, preset.primitives);
  for (const m of gameState.models) {
    const p = preset.models[m.id];
    if (p) { m.count = p.count; m.level = p.level; }
    else { m.count = 0; m.level = 1; }
  }
  for (const cat of Object.keys(gameState.upgrades))
    for (const key of Object.keys(gameState.upgrades[cat]))
      gameState.upgrades[cat][key] = preset.upgradeLevel;
  gameState.stats.modelsOwned = gameState.models.filter(m => m.count > 0).length;
  debugRefreshAllUI();
  if (typeof showToast === 'function') showToast(`Preset: ${name}`, 'success');
}

function debugTriggerSpecificEvent(eventId) {
  const def = EVENT_DEFS[eventId];
  if (!def) return;
  activeEvent = { id: eventId, def, startTime: Date.now() };
  eventFixTaps = 0;
  gameState.eventStats.total++;
  if (def.effect.instant === 'compute') gameState.compute += def.effect.amount;
  if (def.effect.instant === 'model') {
    const owned = getOwnedModels();
    if (owned.length > 0) owned[Math.floor(Math.random() * owned.length)].count++;
  }
  if (def.duration > 0) {
    activeBuffs.push({ id: eventId, target: def.effect.target, multiplier: def.effect.multiplier, endTime: Date.now() + def.duration * 1000 });
    activeEvent = null;
    lastRenderedEventId = null;
  }
  if (typeof renderEventBanner === 'function') renderEventBanner();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  renderDebugPanel();
  if (typeof showToast === 'function') showToast(`Event: ${eventId}`, 'success');
}

function debugTriggerSpecificChallenge(type) {
  if (typeof CHALLENGE_TYPES === 'undefined' || !CHALLENGE_TYPES[type]) return;
  if (typeof startChallenge === 'function') startChallenge(type);
}

function debugQuickSave(slot) {
  try {
    localStorage.setItem(`aiTycoon_quicksave_${slot}`, JSON.stringify(gameState));
    if (typeof showToast === 'function') showToast(`Saved to slot ${slot}`, 'success');
    renderDebugPanel();
  } catch (e) {
    if (typeof showToast === 'function') showToast('Save failed: ' + e.message, 'error');
  }
}

function debugQuickLoad(slot) {
  try {
    const data = localStorage.getItem(`aiTycoon_quicksave_${slot}`);
    if (!data) {
      if (typeof showToast === 'function') showToast(`Slot ${slot} is empty`, 'error');
      return;
    }
    const parsed = JSON.parse(data);
    Object.assign(gameState, parsed);
    debugRefreshAllUI();
    if (typeof showToast === 'function') showToast(`Loaded slot ${slot}`, 'success');
  } catch (e) {
    if (typeof showToast === 'function') showToast('Load failed: ' + e.message, 'error');
  }
}

function debugSkipTokenRecharge() {
  gameState.tokens = 10;
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  renderDebugPanel();
  if (typeof showToast === 'function') showToast('Tokens maxed!', 'success');
}

function debugSkipEventCooldown() {
  gameState.lastEventTime = 0;
  gameState.freeChallengesUsed = 0;
  renderDebugPanel();
  if (typeof showToast === 'function') showToast('Cooldowns reset!', 'success');
}

function debugResetTutorial() {
  gameState.tutorialStep = 0;
  if (typeof startTutorial === 'function') startTutorial();
  if (typeof showToast === 'function') showToast('Tutorial reset!', 'success');
}

function debugResetAchievements() {
  gameState.achievements = {};
  renderDebugPanel();
  if (typeof showToast === 'function') showToast('Achievements reset!', 'success');
}

// --- Initialization ---

document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D to toggle debug panel
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
    e.preventDefault();
    if (!document.getElementById('debug-panel')) {
      enableDebugMode();
    }
    toggleDebugPanel();
  }
});

// Auto-show if previously enabled
if (DEBUG_ENABLED) {
  document.addEventListener('DOMContentLoaded', () => {
    createDebugPanel();
  });
}

// URL parameter handling: ?debug=1&preset=mid
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    enableDebugMode();
    toggleDebugPanel();
  }
  const preset = params.get('preset');
  if (preset && DEBUG_PRESETS[preset]) {
    setTimeout(() => debugLoadPreset(preset), 500);
  }
});

// Expose to console for quick access
window.debugGame = {
  enable: enableDebugMode,
  disable: disableDebugMode,
  toggle: toggleDebugPanel,
  addResource: debugAddResource,
  speed: debugSetSpeed,
  unlockAll: debugUnlockAllModels,
  maxUpgrades: debugMaxUpgrades,
  export: debugExportSave,
  import: debugImportSave,
  reset: debugResetSave,
  loadPreset: debugLoadPreset,
  refreshUI: debugRefreshAllUI,
  triggerEvent: debugTriggerSpecificEvent,
  triggerChallenge: debugTriggerSpecificChallenge,
  quickSave: debugQuickSave,
  quickLoad: debugQuickLoad,
  skipTokens: debugSkipTokenRecharge,
  skipCooldowns: debugSkipEventCooldown,
  resetTutorial: debugResetTutorial,
  resetAchievements: debugResetAchievements,
  state: () => gameState,
};
