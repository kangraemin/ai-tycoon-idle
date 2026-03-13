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

const CODE_SNIPPET_SETS = {
  NLP: [
    { text: 'from transformers import pipeline', type: 'keyword' },
    { text: 'from datasets import load_dataset', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class SentimentAnalyzer:', type: 'type' },
    { text: '    def __init__(self):', type: 'function' },
    { text: '        self.pipe = pipeline("sentiment-analysis")', type: 'string' },
    { text: '', type: 'default' },
    { text: '    def analyze(self, texts):', type: 'function' },
    { text: '        results = self.pipe(texts)', type: 'variable' },
    { text: '        return [r["label"] for r in results]', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    # Batch processing for efficiency', type: 'comment' },
    { text: '    def train_classifier(self, dataset):', type: 'function' },
    { text: '        tokenized = self.tokenize(dataset)', type: 'function' },
    { text: '        self.model.train(tokenized)', type: 'function' },
    { text: '        metrics = self.evaluate()', type: 'function' },
    { text: '        return metrics["f1_score"]', type: 'string' },
  ],
  Vision: [
    { text: 'import torch.nn as nn', type: 'keyword' },
    { text: 'from torchvision import models', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class ImageClassifier(nn.Module):', type: 'type' },
    { text: '    def __init__(self, num_classes=10):', type: 'function' },
    { text: '        super().__init__()', type: 'function' },
    { text: '        self.backbone = models.resnet50(pretrained=True)', type: 'string' },
    { text: '', type: 'default' },
    { text: '    def forward(self, x):', type: 'function' },
    { text: '        features = self.backbone(x)', type: 'variable' },
    { text: '        return self.classifier(features)', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    # Fine-tune on custom data', type: 'comment' },
    { text: '    def fit(self, loader, epochs=5):', type: 'function' },
    { text: '        for epoch in range(epochs):', type: 'keyword' },
    { text: '            for batch in loader:', type: 'keyword' },
    { text: '                loss = self.step(batch)', type: 'function' },
  ],
  CodeGen: [
    { text: 'from openai import OpenAI', type: 'keyword' },
    { text: 'import ast', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class CodeAssistant:', type: 'type' },
    { text: '    def __init__(self, model="gpt-4"):', type: 'function' },
    { text: '        self.client = OpenAI()', type: 'variable' },
    { text: '        self.model = model', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    def complete(self, context, lang="python"):', type: 'function' },
    { text: '        resp = self.client.chat.completions.create(', type: 'function' },
    { text: '            model=self.model,', type: 'string' },
    { text: '            messages=[{"role": "user", "content": context}]', type: 'string' },
    { text: '        )', type: 'default' },
    { text: '        code = resp.choices[0].message.content', type: 'variable' },
    { text: '        # Validate generated code', type: 'comment' },
    { text: '        ast.parse(code)', type: 'function' },
    { text: '        return code', type: 'variable' },
  ],
};

let gameLoopId = null;
let autoSaveId = null;
let currentCodeLine = 0;
let currentCharIndex = 0;
let autoTypeAccum = 0;
let currentChallengeType = null;

// Advance typing by N characters in the editor
function advanceTyping(chars) {
  const line = CODE_LINES[currentCodeLine];
  if (!line) return;

  const fullText = line.text;
  currentCharIndex += chars;

  // Move to next line(s) if current line is complete
  while (currentCharIndex >= CODE_LINES[currentCodeLine].text.length) {
    const overflow = currentCharIndex - CODE_LINES[currentCodeLine].text.length;
    currentCodeLine = (currentCodeLine + 1) % CODE_LINES.length;
    currentCharIndex = 0;

    // If we wrapped around, swap snippet & reset display
    if (currentCodeLine === 0) {
      const owned = typeof getOwnedModels === 'function' ? getOwnedModels() : [];
      const themes = owned.map(m => MODEL_DEFS[m.id]?.codeTheme).filter(Boolean);
      const available = Object.keys(CODE_SNIPPET_SETS);
      const candidates = themes.filter(t => available.includes(t));
      const pick = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : available[Math.floor(Math.random() * available.length)];
      const newLines = CODE_SNIPPET_SETS[pick];
      if (newLines) {
        CODE_LINES.length = 0;
        newLines.forEach(l => CODE_LINES.push(l));
      }
      renderEditorScreen();
      return;
    }

    // Skip empty lines automatically
    if (CODE_LINES[currentCodeLine].text.length === 0) {
      updateEditorLine(currentCodeLine - 1, true);
      currentCharIndex = 0;
      continue;
    }

    currentCharIndex = Math.min(overflow, CODE_LINES[currentCodeLine].text.length);
  }

  updateEditorDOM();
}

// Update only the changed parts of the editor DOM (no full re-render)
function updateEditorDOM() {
  const codeContent = document.querySelector('.code-content');
  const lineNumbers = document.querySelector('.line-numbers');
  if (!codeContent || !lineNumbers) return;

  const codeLines = codeContent.querySelectorAll('.code-line');
  const lineNums = lineNumbers.querySelectorAll('.line-number');

  codeLines.forEach((el, i) => {
    const line = CODE_LINES[i];
    const isActive = i === currentCodeLine;
    const isPast = i < currentCodeLine;

    // Update active states
    el.classList.toggle('active-line', isActive);
    el.classList.toggle('typing', isActive);
    if (lineNums[i]) lineNums[i].classList.toggle('active', isActive);

    if (isActive) {
      // Show partial text with cursor
      const visibleText = line.text.substring(0, currentCharIndex);
      el.innerHTML = `<span class="code-${line.type}">${escapeHtml(visibleText)}</span><span class="editor-cursor"></span>`;
    } else if (isPast) {
      // Completed lines show full text
      el.innerHTML = `<span class="code-${line.type}">${escapeHtml(line.text)}</span>`;
    }
    // Future lines stay as-is (dimmed/empty from render)
  });

  // Update status bar line number
  const statusRight = document.querySelector('.editor-status-right .editor-status-item');
  if (statusRight) statusRight.textContent = `Ln ${currentCodeLine + 1}`;

  // Auto-scroll to keep current line visible
  const editorBody = document.querySelector('.editor-body');
  const activeLine = codeContent.querySelector('.code-line.active-line');
  if (editorBody && activeLine) {
    const bodyRect = editorBody.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    if (lineRect.bottom > bodyRect.bottom || lineRect.top < bodyRect.top) {
      activeLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}

function updateEditorLine(lineIndex, completed) {
  const codeContent = document.querySelector('.code-content');
  if (!codeContent) return;
  const codeLines = codeContent.querySelectorAll('.code-line');
  if (codeLines[lineIndex]) {
    const line = CODE_LINES[lineIndex];
    codeLines[lineIndex].innerHTML = `<span class="code-${line.type}">${escapeHtml(line.text)}</span>`;
    codeLines[lineIndex].classList.remove('active-line', 'typing');
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenTick() {
  const now = Date.now();
  const elapsed = now - gameState.lastTokenRecharge;
  const rechargeInterval = 5 * 60 * 1000; // 5 minutes
  if (elapsed >= rechargeInterval && gameState.tokens < 10) {
    const charges = Math.floor(elapsed / rechargeInterval);
    gameState.tokens = Math.min(10, gameState.tokens + charges);
    gameState.lastTokenRecharge = now;
  }
}

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

    // Auto-typing: advance characters based on LPS
    const lps = getLocPerSecond();
    if (lps > 0) {
      autoTypeAccum += lps * dt * 0.5; // 0.5 chars per LoC for readable speed
      const chars = Math.floor(autoTypeAccum);
      if (chars > 0) {
        autoTypeAccum -= chars;
        advanceTyping(Math.min(chars, 3)); // Cap at 3 chars per tick for readability
      }
    }
  } else {
    lastTickTime = now;
  }
  updateCurrencyDisplay();
  if (typeof updateHintBanner === 'function') updateHintBanner();
  if (typeof renderEventBanner === 'function') renderEventBanner();
  if (typeof checkAchievements === 'function') checkAchievements();
  if (typeof checkTabUnlock === 'function') checkTabUnlock();
}

function startGame() {
  const loaded = loadGame();

  initUI();

  // Unlock tabs for returning players
  if (loaded && typeof checkTabUnlock === 'function') {
    lastTabUnlockCheck = 0; // force check
    checkTabUnlock();
  }

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

  if (gameState.tutorialStep < (typeof TUTORIAL_STEPS !== 'undefined' ? TUTORIAL_STEPS.length : 6)) {
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
  html += '<div class="editor-tab active"><span class="editor-tab-icon">PY</span> agent.py</div>';
  html += '<div class="editor-tab" style="opacity:0.35;cursor:default;pointer-events:none"><span class="editor-tab-icon">JS</span> train.js</div>';
  html += '</div>';
  html += '<div class="editor-body" onclick="tapEditor(event)">';
  html += '<div class="line-numbers">';
  CODE_LINES.forEach((_, i) => {
    html += `<div class="line-number ${i === currentCodeLine ? 'active' : ''}">${i + 1}</div>`;
  });
  html += '</div>';
  html += '<div class="code-content">';
  CODE_LINES.forEach((line, i) => {
    const isActive = i === currentCodeLine;
    const isPast = i < currentCodeLine;
    const activeClass = isActive ? ' active-line typing' : '';
    const dimClass = !isPast && !isActive ? ' code-line-future' : '';

    if (isActive) {
      const visibleText = line.text.substring(0, currentCharIndex);
      html += `<div class="code-line${activeClass}"><span class="code-${line.type}">${escapeHtml(visibleText)}</span><span class="editor-cursor"></span></div>`;
    } else if (isPast) {
      html += `<div class="code-line"><span class="code-${line.type}">${escapeHtml(line.text)}</span></div>`;
    } else {
      html += `<div class="code-line${dimClass}"><span class="code-${line.type}" style="opacity:0.3">${escapeHtml(line.text)}</span></div>`;
    }
  });
  html += '</div>';
  html += '</div>';
  html += '<div class="editor-challenge-area" style="padding:8px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">';
  const challengeTypes = typeof CHALLENGE_TYPES !== 'undefined' ? Object.keys(CHALLENGE_TYPES) : [];
  const canChallenge = typeof canStartChallenge === 'function' && canStartChallenge();
  const freeLeft = typeof hasFreeChallenge === 'function' && hasFreeChallenge()
    ? (DAILY_FREE_CHALLENGES - (gameState.freeChallengesUsed || 0)) : 0;
  const costLabel = freeLeft > 0 ? `Free (${freeLeft} left)` : '1 Token';
  if (challengeTypes.length > 0) {
    if (!currentChallengeType || !challengeTypes.includes(currentChallengeType)) {
      currentChallengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    }
    const cooldown = typeof getChallengeCooldown === 'function' ? getChallengeCooldown() : 0;
    const isOnCooldown = cooldown > 0;
    const btnDisabled = !canChallenge || isOnCooldown;
    const btnLabel = isOnCooldown
      ? `<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">hourglass_top</span> ${Math.ceil(cooldown / 1000)}s`
      : `<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">code</span> Challenge (${costLabel})`;
    html += `<button class="btn ${btnDisabled ? 'btn-disabled' : 'btn-primary'}" onclick="startChallenge('${currentChallengeType}')" ${btnDisabled ? 'disabled' : ''} style="font-size:12px;padding:6px 16px">`;
    html += btnLabel;
    html += '</button>';
  }
  html += '</div>';
  html += '<div class="editor-status-bar">';
  html += '<div class="editor-status-left"><span class="editor-status-item">Python</span></div>';
  html += `<div class="editor-status-right"><span class="editor-status-item">Ln ${currentCodeLine + 1}</span></div>`;
  html += '</div>';
  html += '</div>';

  container.innerHTML = html;
  if (typeof applyCareerTheme === 'function') applyCareerTheme();
}

function renderModelsScreen() {
  const grid = document.getElementById('model-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const owned = getOwnedModels();
  updateGpuSlotCount();

  const modelKeys = Object.keys(MODEL_DEFS);
  owned.forEach((model) => {
    const def = MODEL_DEFS[model.id];
    const modelIndex = modelKeys.indexOf(model.id);
    const style = MODEL_ICON_STYLES[modelIndex] || MODEL_ICON_STYLES[0];
    const el = document.createElement('div');
    el.className = 'model-slot';
    el.innerHTML = `
      <div class="model-level-badge">Lv.${model.level}</div>
      ${model.count > 1 ? `<div class="model-count-badge">x${model.count}</div>` : ''}
      <div class="model-visual rarity-${def.rarity}" style="--model-color:${def.color}">
        <span class="material-symbols-outlined">${style.icon}</span>
      </div>
      <div class="model-name">${def.name}</div>
      <div class="model-lps">${formatNumber(getModelLps(model))}/s</div>
    `;
    el.style.cursor = 'pointer';
    el.onclick = () => showModelDetail(model.id);
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

  // GPU Slot Expand button
  const gpuCost = getGpuSlotCost();
  const expandEl = document.createElement('div');
  expandEl.className = 'model-slot gpu-expand';
  expandEl.innerHTML = `
    <div class="gpu-expand-icon">
      <span class="material-symbols-outlined">add_circle</span>
    </div>
    <div class="gpu-expand-label">Expand GPU</div>
    <div class="gpu-expand-cost">${formatNumber(gpuCost)} Compute</div>
  `;
  expandEl.onclick = () => {
    if (buyGpuSlot()) {
      if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
      renderModelsScreen();
      updateCurrencyDisplay();
    } else {
      if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
      showToast(`Need ${formatNumber(gpuCost)} Compute!`, 'error');
    }
  };
  grid.appendChild(expandEl);
}

function showModelDetail(modelId) {
  const def = MODEL_DEFS[modelId];
  const model = getModelState(modelId);
  if (!def || !model) return;
  const lps = formatNumber(getModelLps(model));
  const modelIndex = Object.keys(MODEL_DEFS).indexOf(modelId);
  const style = MODEL_ICON_STYLES[modelIndex] || MODEL_ICON_STYLES[0];

  const html = `
    <div class="model-detail">
      <div class="model-detail-header">
        <div class="model-visual rarity-${def.rarity}" style="--model-color:${def.color};width:64px;height:64px">
          <span class="material-symbols-outlined" style="font-size:32px">${style.icon}</span>
        </div>
        <div class="rarity-badge ${def.rarity}">${def.rarity}</div>
      </div>
      <div class="model-detail-stats">
        <div class="model-detail-row">
          <span class="model-detail-label">Level</span>
          <span class="model-detail-value">${model.level}</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Count</span>
          <span class="model-detail-value">x${model.count}</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Output</span>
          <span class="model-detail-value accent">${lps} LoC/s</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Domain</span>
          <span class="model-detail-value">${def.codeTheme}</span>
        </div>
      </div>
      <div class="model-detail-snippet">
        <code>${def.codeSnippet}</code>
      </div>
    </div>
  `;

  showModalHtml(def.name, html, [
    { text: 'Close', primary: true }
  ]);
}

function renderUpgradeScreen() {
  const container = document.getElementById('upgrade-content');
  if (!container) return;
  let html = '<div class="screen-desc">Spend Compute to buy upgrades and boost your AI capabilities.</div>';

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
                ${UPGRADE_DEFS[catId][id].name}
                <span class="upgrade-level-badge">Lv. ${level}</span>
              </div>
              <div class="upgrade-desc">${UPGRADE_DEFS[catId][id].description}</div>
            </div>
          </div>
          <div class="upgrade-card-bottom">
            <div class="upgrade-next-info">Level ${level} → ${level + 1}</div>
            ${!canBuy ? `<div class="lock-hint"><span class="material-symbols-outlined" style="font-size:14px">lock</span> Need ${formatNumber(cost - gameState.compute)} more compute</div>` : ''}
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

// renderResearchScreen is now defined in research.js

// renderFusionScreen is now defined in fusion.js

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
