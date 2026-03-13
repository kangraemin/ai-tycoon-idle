// career.js - Career progression system (8 stages)

const CAREER_STAGES = [
  { name: 'NullPointer',     multiplier: 1.0,  repReq: 0,           icon: 'bug_report' },
  { name: 'BugFarm',         multiplier: 2.0,  repReq: 10000,       icon: 'pest_control' },
  { name: 'StackUnderflow',  multiplier: 3.5,  repReq: 100000,      icon: 'layers' },
  { name: 'Cloudish',        multiplier: 6.0,  repReq: 1000000,     icon: 'cloud' },
  { name: 'ChatJBT',         multiplier: 10.0, repReq: 10000000,    icon: 'chat' },
  { name: 'FAANG',           multiplier: 15.0, repReq: 100000000,   icon: 'corporate_fare',
    variants: ['Goggles', 'Mapple', 'Megaa', 'Amazoom', 'Netflex'] },
  { name: 'AI Lab',          multiplier: 25.0, repReq: 1000000000,  icon: 'science',
    variants: ['ClosedAI', 'ShallowMind', 'Anthropomorphic'] },
  { name: 'Founder',         multiplier: 50.0, repReq: 10000000000, icon: 'rocket_launch' },
];

function getCurrentCareer() {
  return CAREER_STAGES[gameState.careerStage] || CAREER_STAGES[0];
}

function getNextCareer() {
  if (gameState.careerStage >= CAREER_STAGES.length - 1) return null;
  return CAREER_STAGES[gameState.careerStage + 1];
}

function canPromote() {
  const next = getNextCareer();
  if (!next) return false;
  return gameState.reputation >= next.repReq;
}

function getCareerDisplayName(stage) {
  const career = CAREER_STAGES[stage];
  if (!career) return 'Unknown';
  if (career.variants) {
    // Use careerHistory to get consistent name, or pick random
    const historyEntry = gameState.careerHistory.find(h => h.stage === stage);
    if (historyEntry) return historyEntry.name;
    return career.variants[Math.floor(Math.random() * career.variants.length)];
  }
  return career.name;
}

function doCareerAdvance() {
  if (!canPromote()) return false;

  const nextStage = gameState.careerStage + 1;
  const next = CAREER_STAGES[nextStage];

  // Record history
  const displayName = getCareerDisplayName(nextStage);
  gameState.careerHistory.push({
    stage: nextStage,
    name: displayName,
    time: Date.now(),
  });

  // Reset (lose these)
  gameState.loc = 0;
  gameState.compute = 0;
  gameState.totalLoc = 0;

  // Reset models: only chatbot lv1 count1, rest count=0
  for (const model of gameState.models) {
    if (model.id === 'chatbot') {
      model.level = 1;
      model.count = 1;
    } else {
      model.level = 1;
      model.count = 0;
    }
  }

  // Reset upgrades
  for (const cat of Object.keys(gameState.upgrades)) {
    for (const key of Object.keys(gameState.upgrades[cat])) {
      gameState.upgrades[cat][key] = 0;
    }
  }

  gameState.gpuSlots = 1;

  // Keep these
  // papers, tokens, reputation, discoveredFusions, achievements — preserved
  // Bonus papers
  gameState.papers += 10 * gameState.careerHistory.length;

  // Apply new stage
  gameState.careerStage = nextStage;
  gameState.prestigeMultiplier = next.multiplier;

  return true;
}

function renderCareerScreen() {
  const container = document.getElementById('career-content');
  if (!container) return;

  const current = getCurrentCareer();
  const next = getNextCareer();
  const currentName = getCareerDisplayName(gameState.careerStage);

  let html = '<div class="screen-desc">Advance your career for a permanent multiplier. Resets LoC, Compute, Models & Upgrades. Papers, Tokens and Rep are kept.</div>';
  html += '<div class="career-info">';
  html += '<div class="career-hero">';
  html += '<div class="career-star-wrap"><span class="material-symbols-outlined">' + current.icon + '</span></div>';
  html += '<div class="career-level">' + currentName + '</div>';
  html += '<div class="career-multiplier">' + current.multiplier.toFixed(1) + 'x Multiplier</div>';
  html += '</div>';

  // Progress to next
  if (next) {
    const progress = Math.min(gameState.reputation / next.repReq * 100, 100);
    html += '<div class="career-progress">';
    html += '<div class="progress-header">';
    html += '<span class="progress-header-label">Next: ' + next.name + '</span>';
    html += '<span class="progress-header-value">' + (typeof formatNumber === 'function' ? formatNumber(gameState.reputation) : gameState.reputation) + ' / ' + (typeof formatNumber === 'function' ? formatNumber(next.repReq) : next.repReq) + ' Rep</span>';
    html += '</div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
    html += '</div>';
  }

  // Stats cards
  html += '<div class="career-cards">';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--accent)">trending_up</span><span class="career-card-label">Multiplier</span></div>';
  html += '<div class="career-card-value">' + current.multiplier.toFixed(1) + 'x</div></div>';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--reputation)">star</span><span class="career-card-label">Reputation</span></div>';
  html += '<div class="career-card-value">' + (typeof formatNumber === 'function' ? formatNumber(gameState.reputation) : gameState.reputation) + '</div></div>';
  html += '</div>';

  // Promote button
  if (next) {
    const canDo = canPromote();
    html += '<div class="career-btn-area">';
    if (!canDo) html += '<div class="lock-hint" style="margin-bottom:12px">Need ' + (typeof formatNumber === 'function' ? formatNumber(next.repReq - gameState.reputation) : (next.repReq - gameState.reputation)) + ' more reputation</div>';
    html += '<button class="btn ' + (canDo ? 'btn-primary' : 'btn-disabled') + '" onclick="confirmCareerAdvance()" ' + (canDo ? '' : 'disabled') + '>' + (canDo ? 'Advance Career' : 'Not Ready Yet') + '</button>';
    html += '<div class="career-desc">Advancing resets LoC, Compute, Models, and Upgrades. Papers, Tokens, Rep, and Fusions are kept. Bonus: +' + (10 * (gameState.careerHistory.length + 1)) + ' papers.</div>';
    html += '</div>';
  } else {
    html += '<div class="career-btn-area"><div class="career-desc" style="color:var(--accent);font-weight:700">You\'ve reached the top!</div></div>';
  }

  // Timeline
  html += '<div class="section-header" style="margin-top:24px"><span class="material-symbols-outlined">timeline</span><h2>Career Path</h2></div>';
  CAREER_STAGES.forEach((stage, i) => {
    const isCurrent = i === gameState.careerStage;
    const isPast = i < gameState.careerStage;
    const opacity = isPast || isCurrent ? '1' : '0.4';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;opacity:' + opacity + '">';
    html += '<span class="material-symbols-outlined" style="color:' + (isCurrent ? 'var(--accent)' : isPast ? 'var(--success)' : 'var(--text-muted)') + '">' + stage.icon + '</span>';
    html += '<div style="flex:1"><div style="font-weight:700;font-size:13px;color:' + (isCurrent ? 'var(--accent)' : 'var(--text-primary)') + '">' + stage.name + '</div>';
    html += '<div style="font-size:11px;color:var(--text-secondary)">' + stage.multiplier + 'x | ' + (typeof formatNumber === 'function' ? formatNumber(stage.repReq) : stage.repReq) + ' Rep</div></div>';
    if (isCurrent) html += '<span style="color:var(--accent);font-size:11px;font-weight:700">CURRENT</span>';
    if (isPast) html += '<span style="color:var(--success);font-size:11px;font-weight:700">DONE</span>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

function confirmCareerAdvance() {
  if (typeof showModal === 'function') {
    showModal('Advance Career', 'Reset progress for a permanent multiplier boost?', [
      { text: 'Cancel' },
      { text: 'Advance!', primary: true, onClick: () => {
        if (typeof SFX !== 'undefined' && SFX.prestige) SFX.prestige();
        doCareerAdvance();
        renderCareerScreen();
        if (typeof renderModelsScreen === 'function') renderModelsScreen();
        if (typeof renderUpgradeScreen === 'function') renderUpgradeScreen();
        if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
        if (typeof saveGame === 'function') saveGame();
      }},
    ]);
  }
}

// Backward compatibility alias
const renderPrestigeScreen = renderCareerScreen;
