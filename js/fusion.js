// fusion.js - Model fusion system (recipes + codex)

const FUSION_RECIPES = [
  { inputs: ['chatbot', 'translator'],    result: 'summarizer',  cost: 300 },
  { inputs: ['summarizer', 'imageGen'],   result: 'multimodal',  cost: 500000 },
  { inputs: ['codeGen', 'reasoning'],     result: 'agi',         cost: 5000000 },
  { inputs: ['summarizer', 'codeGen'],    result: 'reasoning',   cost: 100000 },
  { inputs: ['voiceAI', 'imageGen'],      result: 'multimodal',  cost: 500000 },
  { inputs: ['chatbot', 'codeGen'],       result: 'reasoning',   cost: 200000 },
  { inputs: ['agi', 'multimodal'],        result: 'superAgi',    cost: 50000000 },
];

let fusionSlotA = null;
let fusionSlotB = null;

function findRecipe(a, b) {
  return FUSION_RECIPES.find(r =>
    (r.inputs[0] === a && r.inputs[1] === b) ||
    (r.inputs[0] === b && r.inputs[1] === a)
  ) || null;
}

function getFusionCost(recipe) {
  const delegationDiscount = typeof getUpgradeEffect === 'function' ? getUpgradeEffect('teamAgent', 'delegation') : 0;
  return Math.floor(recipe.cost * (1 - delegationDiscount));
}

function canFuse(recipe) {
  const modelA = getModelState(recipe.inputs[0]);
  const modelB = getModelState(recipe.inputs[1]);
  if (!modelA || !modelB) return false;
  if (modelA.count < 1 || modelB.count < 1) return false;
  return gameState.compute >= getFusionCost(recipe);
}

function doFusion(recipe) {
  if (!canFuse(recipe)) return false;

  const modelA = getModelState(recipe.inputs[0]);
  const modelB = getModelState(recipe.inputs[1]);
  const resultModel = getModelState(recipe.result);
  if (!resultModel) return false;

  // Check GPU slots for new model
  if (resultModel.count === 0) {
    const owned = getOwnedModels().length;
    const maxSlots = typeof getEffectiveGpuSlots === 'function' ? getEffectiveGpuSlots() : gameState.gpuSlots;
    // We're removing 2 models and adding 1, so net change is -1 if both are count=1
    const netChange = (modelA.count === 1 ? -1 : 0) + (modelB.count === 1 ? -1 : 0) + 1;
    if (owned + netChange > maxSlots) {
      if (typeof showToast === 'function') showToast('GPU slots full!', 'error');
      return false;
    }
  }

  const cost = getFusionCost(recipe);
  gameState.compute -= cost;
  modelA.count--;
  modelB.count--;
  resultModel.count++;
  gameState.reputation += 500;

  // Track discovered fusions
  const recipeKey = recipe.inputs.sort().join('+') + '=' + recipe.result;
  if (!gameState.discoveredFusions.includes(recipeKey)) {
    gameState.discoveredFusions.push(recipeKey);
  }

  return true;
}

function doSameFusion(modelId) {
  const modelState = getModelState(modelId);
  if (!modelState || modelState.count < 2) return false;
  const def = getModelDef(modelId);
  if (!def) return false;

  const cost = (def.unlockCost > 0 ? def.unlockCost : 100000) * 2;
  const delegationDiscount = typeof getUpgradeEffect === 'function' ? getUpgradeEffect('teamAgent', 'delegation') : 0;
  const finalCost = Math.floor(cost * (1 - delegationDiscount));

  if (gameState.compute < finalCost) return false;

  gameState.compute -= finalCost;
  modelState.count--;
  modelState.level++;
  gameState.reputation += 200;

  return true;
}

function renderFusionScreen() {
  const container = document.getElementById('fusion-content');
  if (!container) return;

  const ownedModels = getOwnedModels();

  let html = '<div class="section-header"><span class="material-symbols-outlined">merge</span><h2>Model Fusion</h2></div>';
  html += '<div class="screen-desc">Combine two models to create a stronger one, or fuse duplicates to level up.</div>';

  // Fusion slots
  html += '<div style="display:flex;gap:12px;align-items:center;justify-content:center;margin:16px 0">';

  // Slot A
  html += '<div style="flex:1;max-width:140px">';
  html += '<select id="fusion-slot-a" onchange="updateFusionPreview()" style="width:100%;padding:8px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;font-size:13px">';
  html += '<option value="">Select...</option>';
  ownedModels.forEach(m => {
    const def = getModelDef(m.id);
    html += `<option value="${m.id}" ${fusionSlotA === m.id ? 'selected' : ''}>${def.name} (x${m.count})</option>`;
  });
  html += '</select></div>';

  html += '<span class="material-symbols-outlined" style="color:var(--accent);font-size:24px">add</span>';

  // Slot B
  html += '<div style="flex:1;max-width:140px">';
  html += '<select id="fusion-slot-b" onchange="updateFusionPreview()" style="width:100%;padding:8px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;font-size:13px">';
  html += '<option value="">Select...</option>';
  ownedModels.forEach(m => {
    const def = getModelDef(m.id);
    html += `<option value="${m.id}" ${fusionSlotB === m.id ? 'selected' : ''}>${def.name} (x${m.count})</option>`;
  });
  html += '</select></div>';

  html += '</div>';

  // Fusion preview
  html += '<div id="fusion-preview" style="text-align:center;margin:12px 0"></div>';

  // Codex
  html += '<div class="section-header" style="margin-top:24px"><span class="material-symbols-outlined">menu_book</span><h2>Codex</h2></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
  FUSION_RECIPES.forEach(recipe => {
    const recipeKey = [...recipe.inputs].sort().join('+') + '=' + recipe.result;
    const discovered = gameState.discoveredFusions.includes(recipeKey);
    const defA = getModelDef(recipe.inputs[0]);
    const defB = getModelDef(recipe.inputs[1]);
    const defR = getModelDef(recipe.result);

    html += `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:8px;padding:10px;font-size:11px">`;
    if (discovered) {
      html += `<div style="color:var(--text-primary);font-weight:700">${defA.name} + ${defB.name}</div>`;
      html += `<div style="color:var(--accent);margin-top:4px">→ ${defR.name}</div>`;
    } else {
      html += `<div style="color:var(--text-muted)">??? + ???</div>`;
      html += `<div style="color:var(--text-muted);margin-top:4px">→ ???</div>`;
    }
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

function updateFusionPreview() {
  const slotA = document.getElementById('fusion-slot-a');
  const slotB = document.getElementById('fusion-slot-b');
  const preview = document.getElementById('fusion-preview');
  if (!slotA || !slotB || !preview) return;

  fusionSlotA = slotA.value || null;
  fusionSlotB = slotB.value || null;

  if (!fusionSlotA || !fusionSlotB) {
    preview.innerHTML = '<div style="color:var(--text-muted);font-size:12px">Select two models to fuse</div>';
    return;
  }

  // Same model fusion
  if (fusionSlotA === fusionSlotB) {
    const modelState = getModelState(fusionSlotA);
    const def = getModelDef(fusionSlotA);
    if (modelState && modelState.count >= 2) {
      const cost = (def.unlockCost > 0 ? def.unlockCost : 100000) * 2;
      const delegationDiscount = typeof getUpgradeEffect === 'function' ? getUpgradeEffect('teamAgent', 'delegation') : 0;
      const finalCost = Math.floor(cost * (1 - delegationDiscount));
      const canDo = gameState.compute >= finalCost;
      preview.innerHTML = `
        <div style="color:var(--accent);font-weight:700;margin-bottom:8px">${def.name} Level Up!</div>
        <div style="color:var(--text-secondary);font-size:12px;margin-bottom:8px">Lv.${modelState.level} → Lv.${modelState.level + 1}</div>
        <button class="btn ${canDo ? 'btn-primary' : 'btn-disabled'}" onclick="doSameFusionUI()" ${canDo ? '' : 'disabled'}>
          Fuse (${typeof formatNumber === 'function' ? formatNumber(finalCost) : finalCost} Compute)
        </button>
      `;
    } else {
      preview.innerHTML = '<div style="color:var(--coral);font-size:12px">Need 2+ copies</div>';
    }
    return;
  }

  const recipe = findRecipe(fusionSlotA, fusionSlotB);
  if (recipe) {
    const cost = getFusionCost(recipe);
    const resultDef = getModelDef(recipe.result);
    const canDo = canFuse(recipe);
    const previewIcon = (MODEL_ICON_STYLES[Object.keys(MODEL_DEFS).indexOf(recipe.result)] || MODEL_ICON_STYLES[0]).icon;
    preview.innerHTML = `
      <div class="model-visual rarity-${resultDef.rarity}" style="--model-color:${resultDef.color};width:48px;height:48px;margin:0 auto 8px">
        <span class="material-symbols-outlined">${previewIcon}</span>
      </div>
      <div style="color:var(--accent);font-weight:700;margin-bottom:8px">→ ${resultDef.name}</div>
      <div class="rarity-badge ${resultDef.rarity}" style="margin-bottom:8px">${resultDef.rarity}</div>
      <button class="btn ${canDo ? 'btn-primary' : 'btn-disabled'}" onclick="doFusionUI()" ${canDo ? '' : 'disabled'}>
        Fuse (${typeof formatNumber === 'function' ? formatNumber(cost) : cost} Compute)
      </button>
    `;
  } else {
    preview.innerHTML = '<div style="color:var(--text-muted);font-size:12px">No recipe found</div>';
  }
}

function doFusionUI() {
  if (!fusionSlotA || !fusionSlotB) return;
  const recipe = findRecipe(fusionSlotA, fusionSlotB);
  if (!recipe) return;

  if (doFusion(recipe)) {
    if (typeof SFX !== 'undefined' && SFX.fusion) SFX.fusion();
    if (typeof showToast === 'function') showToast(`Fused ${getModelDef(recipe.result).name}!`, 'success');

    // Flash animation
    const container = document.getElementById('fusion-content');
    if (container) {
      container.classList.add('fusion-success-flash');
      setTimeout(() => container.classList.remove('fusion-success-flash'), 600);
    }

    fusionSlotA = null;
    fusionSlotB = null;
    setTimeout(() => {
      renderFusionScreen();
      if (typeof renderModelsScreen === 'function') renderModelsScreen();
      if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
    }, 600);
  }
}

function doSameFusionUI() {
  if (!fusionSlotA) return;
  if (doSameFusion(fusionSlotA)) {
    if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
    if (typeof showToast === 'function') showToast('Model leveled up!', 'success');
    fusionSlotA = null;
    fusionSlotB = null;
    renderFusionScreen();
    if (typeof renderModelsScreen === 'function') renderModelsScreen();
    if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
  }
}
