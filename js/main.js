// main.js - App initialization + game loop

const AUTO_SAVE_INTERVAL = 30000;

const UPGRADE_ICONS = {
  toolUse:       { icon: 'build',         bg: 'agent-bg',  category: 'agent' },
  memory:        { icon: 'psychology',     bg: 'agent-bg',  category: 'agent' },
  planning:      { icon: 'account_tree',   bg: 'agent-bg',  category: 'agent' },
  multiAgent:    { icon: 'groups',         bg: 'team-bg',   category: 'teamAgent' },
  orchestrator:  { icon: 'hub',            bg: 'team-bg',   category: 'teamAgent' },
  delegation:    { icon: 'share',          bg: 'team-bg',   category: 'teamAgent' },
  rag:           { icon: 'search',         bg: 'skill-bg',  category: 'skill' },
  fineTuning:    { icon: 'tune',           bg: 'skill-bg',  category: 'skill' },
  rlhf:          { icon: 'thumb_up',       bg: 'skill-bg',  category: 'skill' },
  batchSize:     { icon: 'data_array',     bg: 'infra-bg',  category: 'infra' },
  distTraining:  { icon: 'lan',            bg: 'infra-bg',  category: 'infra' },
  quantization:  { icon: 'compress',       bg: 'infra-bg',  category: 'infra' },
  autoPipeline:  { icon: 'conveyor_belt',  bg: 'infra-bg',  category: 'infra' },
};

const MODEL_ICON_STYLES = [
  { bg: 'agent-bg',  icon: 'chat' },         // chatbot
  { bg: 'skill-bg',  icon: 'translate' },     // translator
  { bg: 'team-bg',   icon: 'summarize' },     // summarizer
  { bg: 'agent-bg',  icon: 'image' },         // imageGen
  { bg: 'infra-bg',  icon: 'code' },          // codeGen
  { bg: 'skill-bg',  icon: 'mic' },           // voiceAI
  { bg: 'team-bg',   icon: 'psychology' },    // reasoning
  { bg: 'infra-bg',  icon: 'hub' },           // multimodal
  { bg: 'agent-bg',  icon: 'auto_awesome' },  // agi
  { bg: 'skill-bg',  icon: 'bolt' },          // superAgi
];

// Code snippets for editor display
const CODE_LINES = [
  { text: 'import torch', type: 'keyword' },
  { text: 'from transformers import AutoModel', type: 'keyword' },
  { text: '', type: 'default' },
  { text: 'class AIAgent:', type: 'type' },
  { text: '    def __init__(self, model_name):', type: 'function' },
  { text: '        self.model = AutoModel.from_pretrained(model_name)', type: 'string' },
  { text: '        self.tokenizer = AutoTokenizer.from_pretrained(model_name)', type: 'string' },
  { text: '', type: 'default' },
  { text: '    def generate(self, prompt, max_tokens=512):', type: 'function' },
  { text: '        inputs = self.tokenizer(prompt, return_tensors="pt")', type: 'variable' },
  { text: '        outputs = self.model.generate(**inputs, max_new_tokens=max_tokens)', type: 'variable' },
  { text: '        return self.tokenizer.decode(outputs[0])', type: 'string' },
  { text: '', type: 'default' },
  { text: '    # TODO: Add memory module', type: 'comment' },
  { text: '    def train(self, dataset, epochs=3):', type: 'function' },
  { text: '        for epoch in range(epochs):', type: 'keyword' },
  { text: '            loss = self.compute_loss(dataset)', type: 'function' },
  { text: '            loss.backward()', type: 'function' },
  { text: '            self.optimizer.step()', type: 'function' },
];

let gameLoopId = null;
let autoSaveId = null;
let currentCodeLine = 0;

function gameLoop() {
  const now = performance.now();
  if (lastTickTime === 0) lastTickTime = now;
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  if (dt > 0 && dt < 10) {
    produceTick(dt);
    autoCompileTick(dt);
    if (typeof tokenTick === 'function') tokenTick();
    if (typeof eventTick === 'function') eventTick(dt);
    if (typeof cleanupExpiredBuffs === 'function') cleanupExpiredBuffs();
  }
  updateCurrencyDisplay();
  if (typeof updateHintBanner === 'function') updateHintBanner();
  if (typeof checkAchievements === 'function') checkAchievements();
}

function startGame() {
  const loaded = loadGame();

  initUI();
  renderEditorScreen();
  renderModelsScreen();
  renderUpgradeScreen();
  renderResearchScreen();
  renderFusionScreen();
  renderCareerScreen();
  updateCurrencyDisplay();

  if (loaded) {
    applyOfflineEarnings();
  }

  if (gameState.tutorialStep < 6) {
    startTutorial();
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Skip if modal or challenge is active
    if (document.getElementById('modal-overlay')?.classList.contains('active')) return;
    if (document.getElementById('challenge-overlay')?.style.display !== 'none') return;

    if (e.code === 'Space') {
      e.preventDefault();
      tapEditor(null);
    } else if (e.code === 'Enter') {
      e.preventDefault();
      compileData();
    }
  });

  lastTickTime = performance.now();
  gameLoopId = setInterval(gameLoop, 100);
  autoSaveId = setInterval(saveGame, AUTO_SAVE_INTERVAL);
}

function updateGpuSlotCount() {
  const owned = getOwnedModels();
  const el = document.getElementById('gpu-slot-count');
  if (el) el.textContent = `${owned.length}/${gameState.gpuSlots} GPU`;
  const modelEl = document.getElementById('model-slot-count');
  if (modelEl) modelEl.textContent = `${owned.length}/${gameState.gpuSlots} GPU`;
}

function renderEditorScreen() {
  const container = document.getElementById('editor-content');
  if (!container) return;

  let html = '<div class="code-editor">';
  html += '<div class="editor-tab-bar">';
  html += '<button class="editor-tab active"><span class="editor-tab-icon">PY</span> agent.py</button>';
  html += '<button class="editor-tab"><span class="editor-tab-icon">JS</span> train.js</button>';
  html += '</div>';
  html += '<div class="editor-body" onclick="tapEditor(event)">';
  html += '<div class="line-numbers">';
  CODE_LINES.forEach((_, i) => {
    html += `<div class="line-number ${i === currentCodeLine ? 'active' : ''}">${i + 1}</div>`;
  });
  html += '</div>';
  html += '<div class="code-content">';
  CODE_LINES.forEach((line, i) => {
    const activeClass = i === currentCodeLine ? ' active-line' : '';
    html += `<div class="code-line${activeClass}"><span class="code-${line.type}">${line.text}</span>${i === currentCodeLine ? '<span class="editor-cursor"></span>' : ''}</div>`;
  });
  html += '</div>';
  html += '</div>';
  html += '<div class="editor-status-bar">';
  html += '<div class="editor-status-left"><span class="editor-status-item">Python</span></div>';
  html += `<div class="editor-status-right"><span class="editor-status-item">Ln ${currentCodeLine + 1}</span></div>`;
  html += '</div>';
  html += '</div>';

  container.innerHTML = html;
}

function renderModelsScreen() {
  const grid = document.getElementById('model-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const owned = getOwnedModels();
  updateGpuSlotCount();

  owned.forEach((model, idx) => {
    const def = MODEL_DEFS[model.id];
    const style = MODEL_ICON_STYLES[idx % MODEL_ICON_STYLES.length];
    const el = document.createElement('div');
    el.className = 'model-slot';
    el.innerHTML = `
      <div class="model-level-badge">Lv.${model.level}</div>
      ${model.count > 1 ? `<div class="model-count-badge">x${model.count}</div>` : ''}
      <div class="model-visual" style="--model-color:${def.color}"></div>
      <div class="model-name">${def.name}</div>
      <div class="model-lps">${formatNumber(getModelLps(model))}/s</div>
    `;
    grid.appendChild(el);
  });

  for (let i = owned.length; i < gameState.gpuSlots; i++) {
    const el = document.createElement('div');
    el.className = 'model-slot empty';
    el.innerHTML = `
      <div class="empty-slot">
        <span class="material-symbols-outlined">add</span>
      </div>
      <div class="empty-slot-label">Empty</div>
    `;
    el.onclick = () => switchScreen('research');
    grid.appendChild(el);
  }
}

function renderUpgradeScreen() {
  const container = document.getElementById('upgrade-content');
  if (!container) return;
  let html = '';

  const categories = {
    agent: { name: 'Agent', icon: 'smart_toy' },
    teamAgent: { name: 'Team Agent', icon: 'groups' },
    skill: { name: 'Skill', icon: 'school' },
    infra: { name: 'Infra', icon: 'dns' },
  };

  for (const [catId, catDef] of Object.entries(categories)) {
    html += `<div class="section-header"><span class="material-symbols-outlined">${catDef.icon}</span><h2>${catDef.name}</h2></div>`;

    for (const [id, upgradeIcon] of Object.entries(UPGRADE_ICONS)) {
      if (upgradeIcon.category !== catId) continue;
      const level = gameState.upgrades[catId][id];
      const cost = getUpgradeCost(catId, id);
      const canBuy = gameState.compute >= cost;

      html += `
        <div class="upgrade-card cat-${catId} ${canBuy ? '' : 'locked'}">
          <div class="upgrade-card-top">
            <div class="upgrade-icon-wrap ${upgradeIcon.bg}">
              <span class="material-symbols-outlined">${upgradeIcon.icon}</span>
            </div>
            <div class="upgrade-info">
              <div class="upgrade-name">
                ${id}
                <span class="upgrade-level-badge">Lv. ${level}</span>
              </div>
              <div class="upgrade-desc">Enhances ${catDef.name.toLowerCase()} capabilities</div>
            </div>
          </div>
          <div class="upgrade-card-bottom">
            <div class="upgrade-next-info">Level ${level} → ${level + 1}</div>
            ${!canBuy ? `<div class="lock-hint">Need ${formatNumber(cost - gameState.compute)} more compute</div>` : ''}
            <button class="btn ${canBuy ? 'btn-primary' : 'btn-disabled'}"
                    onclick="doBuyUpgrade('${catId}', '${id}', event)" ${canBuy ? '' : 'disabled'}>
              ${formatNumber(cost)}
            </button>
          </div>
        </div>
      `;
    }
  }

  // GPU Expansion
  html += `<div class="section-header"><span class="material-symbols-outlined">memory</span><h2>GPU Expansion</h2></div>`;
  const gpuCost = getGpuSlotCost();
  html += `
    <div class="upgrade-card cat-infra">
      <div class="upgrade-card-top">
        <div class="upgrade-icon-wrap infra-bg">
          <span class="material-symbols-outlined">developer_board</span>
        </div>
        <div class="upgrade-info">
          <div class="upgrade-name">GPU Slot (${gameState.gpuSlots} slots)</div>
          <div class="upgrade-desc">Run more AI models simultaneously</div>
        </div>
      </div>
      <div class="upgrade-card-bottom">
        <div class="upgrade-next-info">+1 slot</div>
        <button class="btn ${gameState.compute >= gpuCost ? 'btn-primary' : 'btn-disabled'}"
                onclick="doBuyGpuSlot(event)" ${gameState.compute >= gpuCost ? '' : 'disabled'}>
          ${formatNumber(gpuCost)}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderResearchScreen() {
  const container = document.getElementById('research-content');
  if (!container) return;
  if (typeof renderGachaScreen === 'function') {
    renderGachaScreen();
  }
}

function renderFusionScreen() {
  const container = document.getElementById('fusion-content');
  if (!container) return;
  container.innerHTML = '<div class="placeholder-message">Coming Soon: Model Fusion</div>';
}

function renderCareerScreen() {
  const container = document.getElementById('career-content');
  if (!container) return;
  if (typeof renderPrestigeScreen === 'function') {
    renderPrestigeScreen();
  }
}

function flashPurchase(btnEl, success) {
  if (!btnEl) return;
  const card = btnEl.closest('.upgrade-card');
  if (!card) return;
  if (success) {
    card.classList.add('purchase-success');
    setTimeout(() => card.classList.remove('purchase-success'), 400);
  } else {
    card.classList.add('purchase-fail');
    setTimeout(() => card.classList.remove('purchase-fail'), 400);
  }
}

function doBuyUpgrade(category, id, event) {
  const btn = event ? event.currentTarget : null;
  if (buyUpgrade(category, id)) {
    if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
    if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'buy') advanceTutorial();
    flashPurchase(btn, true);
    renderUpgradeScreen();
    updateCurrencyDisplay();
  } else {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    flashPurchase(btn, false);
    showToast('Not enough compute!', 'error');
  }
}

function doBuyGpuSlot(event) {
  const btn = event ? event.currentTarget : null;
  if (buyGpuSlot()) {
    if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
    flashPurchase(btn, true);
    renderModelsScreen();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  } else {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    flashPurchase(btn, false);
    showToast('Not enough compute!', 'error');
  }
}

window.addEventListener('DOMContentLoaded', startGame);
