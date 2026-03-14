// debug.js - Developer debug panel (Ctrl+Shift+D to toggle)

const DEBUG_ENABLED = (() => {
  try { return localStorage.getItem('aiTycoon_debug') === '1'; } catch { return false; }
})();

let debugPanelVisible = false;
let gameSpeedMultiplier = 1;

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
        <div class="debug-section-title">Trigger</div>
        <div class="debug-btn-row">
          <button onclick="debugTriggerEvent('positive')">+ Event</button>
          <button onclick="debugTriggerEvent('negative')">- Event</button>
          <button onclick="debugTriggerChallenge()">Challenge</button>
        </div>
        <div class="debug-btn-row">
          <button onclick="debugJumpCareer(1)">Career +1</button>
          <button onclick="debugJumpCareer(7)">Career Max</button>
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
  state: () => gameState,
};
