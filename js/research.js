// research.js - Research Lab (model acquisition via papers)

const RESEARCH_COST = 10;
const HALLUCINATION_CHANCE = 0.05;

const RESEARCH_RATES = [
  { rarity: 'common',    weight: 40, label: 'C' },
  { rarity: 'uncommon',  weight: 30, label: 'U' },
  { rarity: 'rare',      weight: 20, label: 'R' },
  { rarity: 'epic',      weight: 8,  label: 'E' },
  { rarity: 'legendary', weight: 2,  label: 'L' },
];

function getModelsByRarity(rarity) {
  return Object.entries(MODEL_DEFS)
    .filter(([_, def]) => def.rarity === rarity)
    .map(([id]) => id);
}

function rollResearch() {
  // First-pull pity: guarantee uncommon+ and skip hallucination
  if (gameState.stats && gameState.stats.gachaPulls === 0) {
    const pityRates = [
      { rarity: 'uncommon', weight: 70 },
      { rarity: 'rare',     weight: 30 },
    ];
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const rate of pityRates) {
      cumulative += rate.weight;
      if (roll < cumulative) {
        const candidates = getModelsByRarity(rate.rarity);
        if (candidates.length > 0) {
          const modelId = candidates[Math.floor(Math.random() * candidates.length)];
          return { modelId, rarity: rate.rarity, hallucination: false };
        }
      }
    }
  }

  // Hallucination check
  if (Math.random() < HALLUCINATION_CHANCE) {
    return { modelId: null, rarity: null, hallucination: true };
  }

  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rate of RESEARCH_RATES) {
    cumulative += rate.weight;
    if (roll < cumulative) {
      const candidates = getModelsByRarity(rate.rarity);
      if (candidates.length === 0) continue;
      const modelId = candidates[Math.floor(Math.random() * candidates.length)];
      return { modelId, rarity: rate.rarity, hallucination: false };
    }
  }
  return { modelId: 'chatbot', rarity: 'common', hallucination: false };
}

function pullResearch() {
  if (gameState.papers < RESEARCH_COST) return null;

  const result = rollResearch();

  if (result.hallucination) {
    // Papers refunded on hallucination
    if (gameState.stats) gameState.stats.gachaPulls++;
    return result;
  }

  const modelState = getModelState(result.modelId);
  if (!modelState) return null;
  result.isNew = modelState.count === 0;

  // GPU slot check for new models
  if (modelState.count === 0) {
    const owned = getOwnedModels().length;
    const maxSlots = typeof getEffectiveGpuSlots === 'function' ? getEffectiveGpuSlots() : gameState.gpuSlots;
    if (owned >= maxSlots) {
      result.slotFull = true;
      return result;
    }
  }

  gameState.papers -= RESEARCH_COST;
  if (gameState.stats) gameState.stats.gachaPulls++;
  modelState.count++;
  result.newCount = modelState.count;

  return result;
}

function renderResearchScreen() {
  const container = document.getElementById('research-content');
  if (!container) return;

  const maxSlots = typeof getEffectiveGpuSlots === 'function' ? getEffectiveGpuSlots() : gameState.gpuSlots;
  const ownedCount = getOwnedModels().length;

  container.innerHTML = `
    <div class="screen-desc">Use Papers to discover new AI models. Each discovery costs ${RESEARCH_COST} Papers.</div>
    <div class="research-machine">
      <div class="research-display" id="research-result">
        <div class="research-bubble-window">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--papers)">science</span>
        </div>
        ${ownedCount >= maxSlots ? `<div class="lock-hint" style="margin:8px 0;cursor:pointer;text-decoration:underline" onclick="switchScreen('upgrade')"><span class="material-symbols-outlined" style="font-size:14px">lock</span> GPU full — <strong>Go to Upgrades</strong> (${formatNumber(getGpuSlotCost())} Compute)</div>` : ''}
        <div class="research-pull-area">
          <button class="research-pull-btn ${gameState.papers < RESEARCH_COST ? 'btn-disabled' : ''}"
                  onclick="doResearchPull()" ${gameState.papers < RESEARCH_COST ? 'disabled' : ''}>
            Research!
          </button>
          <span class="research-pull-hint">${RESEARCH_COST} Papers per discovery</span>
          ${gameState.papers < RESEARCH_COST ? `<div class="lock-hint" style="margin-top:8px">Need ${RESEARCH_COST - gameState.papers} more Papers</div>` : ''}
        </div>
      </div>
      <div class="research-rates">
        <h3>Discovery Rates</h3>
        <div class="rate-circles">
          ${RESEARCH_RATES.map(r => `
            <div class="rate-circle">
              <div class="rate-circle-badge ${r.rarity}">${r.label}</div>
              <span class="rate-circle-pct ${r.rarity}">${r.weight}%</span>
            </div>
          `).join('')}
        </div>
        ${(!gameState.stats || gameState.stats.gachaPulls === 0) ? `
        <div style="margin-top:8px;padding:6px 10px;background:var(--bg-card);border:1px solid var(--accent);border-radius:6px;font-size:11px;color:var(--accent);text-align:center">
          ✦ First pull guaranteed Uncommon (70%) or Rare (30%)
        </div>` : ''}
      </div>
    </div>
  `;
}

function doResearchPull() {
  if (typeof SFX !== 'undefined' && SFX.gachaPull) SFX.gachaPull();
  const result = pullResearch();
  if (!result) {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    if (typeof showToast === 'function') showToast('Not enough Papers!', 'error');
    return;
  }

  if (result.slotFull) {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    if (typeof showToast === 'function') showToast(`GPU slots full! Going to Upgrades... (${formatNumber(getGpuSlotCost())} Compute needed)`, 'info');
    setTimeout(() => { if (typeof switchScreen === 'function') switchScreen('upgrade'); }, 800);
    return;
  }

  Analytics.researchPull(result.rarity, result.hallucination, RESEARCH_COST);

  const resultEl = document.getElementById('research-result');
  if (!resultEl) return;

  // Phase 1: Spinner (1.5s)
  resultEl.innerHTML = `
    <div class="research-spinner">
      <span class="material-symbols-outlined gacha-spin">science</span>
      <div style="color:var(--text-secondary);font-size:12px;margin-top:8px">Analyzing...</div>
    </div>
  `;

  setTimeout(() => {
    if (result.hallucination) {
      resultEl.innerHTML = `
        <div class="research-reveal">
          <span class="material-symbols-outlined" style="font-size:64px;color:var(--coral)">error</span>
          <div class="research-name" style="color:var(--coral)">Hallucination!</div>
          <div style="color:var(--text-secondary);font-size:12px;margin-top:4px">The AI produced nonsense... Papers refunded.</div>
        </div>
        <div class="research-pull-area" style="margin-top:16px">
          <button class="research-pull-btn ${gameState.papers < RESEARCH_COST ? 'btn-disabled' : ''}"
                  onclick="doResearchPull()" ${gameState.papers < RESEARCH_COST ? 'disabled' : ''}>Research!</button>
          <span class="research-pull-hint">${RESEARCH_COST} Papers per discovery</span>
        </div>
      `;
      return;
    }

    const def = MODEL_DEFS[result.modelId];
    if (!def) return;
    if (typeof triggerEureka === 'function') triggerEureka();

    const isHighRarity = result.rarity === 'epic' || result.rarity === 'legendary';
    const isDuplicate = !result.isNew && result.newCount >= 2;
    let levelUpHTML = '';
    if (isDuplicate) {
      const dupModelState = getModelState(result.modelId);
      const levelUpCost = dupModelState ? getModelLevelUpCost(dupModelState) : Infinity;
      const canLevelUp = gameState.compute >= levelUpCost;
      levelUpHTML = `
      <div id="research-levelup-confirm"></div>
      <div id="research-levelup-btn" style="margin-top:10px">
        <button class="btn ${canLevelUp ? 'btn-primary' : 'btn-disabled'}" style="font-size:13px;padding:8px 20px"
                ${canLevelUp ? `onclick="doResearchRevealLevelUp('${result.modelId}')"` : 'disabled'}>
          ${canLevelUp ? `Level Up! (${formatNumber(levelUpCost)} Compute)` : `Level Up (need ${formatNumber(levelUpCost)} Compute)`}
        </button>
      </div>`;
    }
    resultEl.innerHTML = `
      <div class="research-reveal ${result.rarity} ${isHighRarity ? 'gacha-flash' : 'gacha-fade'}">
        <div class="model-visual rarity-${result.rarity}" style="--model-color:${def.color}">
          <span class="material-symbols-outlined">${(MODEL_ICON_STYLES[Object.keys(MODEL_DEFS).indexOf(result.modelId)] || MODEL_ICON_STYLES[0]).icon}</span>
        </div>
        <div class="research-name">${def.name}</div>
        <div class="rarity-badge ${result.rarity}">${result.rarity[0].toUpperCase() + result.rarity.slice(1)}</div>
        <div style="color:var(--text-secondary);font-size:12px;margin-top:6px">
          ${result.isNew ? 'New model discovered!' : `Duplicate \u2014 now x${result.newCount}`}
        </div>
      </div>
      ${levelUpHTML}
      <div class="research-pull-area" style="margin-top:16px">
        <button class="research-pull-btn ${gameState.papers < RESEARCH_COST ? 'btn-disabled' : ''}"
                onclick="doResearchPull()" ${gameState.papers < RESEARCH_COST ? 'disabled' : ''}>Research!</button>
        <span class="research-pull-hint">${RESEARCH_COST} Papers per discovery</span>
      </div>
    `;

    if (isHighRarity) {
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }

    if (typeof SFX !== 'undefined' && SFX.gachaReveal) SFX.gachaReveal(result.rarity);
    if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
    if (typeof renderModelsScreen === 'function') renderModelsScreen();
  }, 1500);
}

function doResearchRevealLevelUp(modelId) {
  const modelState = getModelState(modelId);
  const def = MODEL_DEFS[modelId];
  if (!modelState || !def) return;

  const success = doSameFusion(modelId);
  if (!success) {
    if (typeof showToast === 'function') showToast('Not enough Compute!', 'error');
    return;
  }

  const confirmEl = document.getElementById('research-levelup-confirm');
  if (confirmEl) {
    confirmEl.innerHTML = `<div style="color:var(--accent-green);font-size:13px;margin-top:8px;font-weight:700">✓ Leveled up! ${def.name} → Lv.${modelState.level}</div>`;
  }
  const btnEl = document.getElementById('research-levelup-btn');
  if (btnEl) btnEl.style.display = 'none';

  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  if (typeof renderModelsScreen === 'function') renderModelsScreen();
  if (typeof saveGame === 'function') saveGame();
}

// Alias for backward compatibility (main.js calls renderResearchScreen via renderGachaScreen check)
const renderGachaScreen = renderResearchScreen;
