// career.js - Career progression system (8 stages)

const CAREER_STAGES = [
  { name: 'NullPointer',     multiplier: 1.0,  repReq: 0,           icon: 'bug_report' },
  { name: 'BugFarm',         multiplier: 2.0,  repReq: 2000,        icon: 'pest_control' },
  { name: 'StackUnderflow',  multiplier: 3.5,  repReq: 20000,       icon: 'layers' },
  { name: 'Cloudish',        multiplier: 6.0,  repReq: 200000,      icon: 'cloud' },
  { name: 'ChatJBT',         multiplier: 10.0, repReq: 2000000,     icon: 'chat' },
  { name: 'FAANG',           multiplier: 15.0, repReq: 20000000,    icon: 'corporate_fare',
    variants: ['Goggles', 'Mapple', 'Megaa', 'Amazoom', 'Netflex'] },
  { name: 'AI Lab',          multiplier: 25.0, repReq: 200000000,   icon: 'science',
    variants: ['ClosedAI', 'ShallowMind', 'Anthropomorphic'] },
  { name: 'Founder',         multiplier: 50.0, repReq: 2000000000,  icon: 'rocket_launch' },
];

function getCurrentCareer() {
  return CAREER_STAGES[gameState.careerStage] || CAREER_STAGES[0];
}

function getNextCareer() {
  if (gameState.careerStage >= CAREER_STAGES.length - 1) return null;
  return CAREER_STAGES[gameState.careerStage + 1];
}

function getRepRate() {
  const orchLevel = gameState.upgrades?.teamAgent?.orchestrator || 0;
  if (orchLevel === 0) return null;
  const speedMult = 1 + orchLevel * 0.15;
  const firesPerHour = (3600 / BASE_AUTO_COMPILE_INTERVAL) * speedMult;
  return Math.round(firesPerHour * 50 * (gameState.prestigeMultiplier || 1));
}

function getTimeToAdvance(repRate) {
  const next = getNextCareer();
  if (!next || !repRate || repRate <= 0) return null;
  const repNeeded = next.repReq - gameState.reputation;
  if (repNeeded <= 0) return 'Ready!';
  const hoursNeeded = repNeeded / repRate;
  if (hoursNeeded < 1 / 60) return '<1m';
  if (hoursNeeded < 1) return '~' + Math.round(hoursNeeded * 60) + 'm';
  if (hoursNeeded < 24) return '~' + hoursNeeded.toFixed(1) + 'h';
  return '~' + Math.round(hoursNeeded / 24) + 'd';
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

  gameState.gpuSlots = 2;
  if (gameState.stats) gameState.stats.gachaPulls = 0;

  // Keep these
  // papers, tokens, reputation, discoveredFusions, achievements — preserved
  // Bonus papers
  gameState.papers += 10 * gameState.careerHistory.length;

  // Apply new stage
  gameState.careerStage = nextStage;
  gameState.prestigeMultiplier = next.multiplier;
  Analytics.careerAdvance(nextStage, next.multiplier, gameState.reputation, gameState.careerHistory.length);

  // Interstitial 광고 (Career advance는 희귀 이벤트 — 사용자 부담 최소)
  if (window.AdMobManager?.ready) {
    setTimeout(() => window.AdMobManager.showInterstitial('career_advance'), 800);
  }

  return true;
}

function renderCareerScreen() {
  const container = document.getElementById('career-content');
  if (!container) return;

  const current = getCurrentCareer();
  const next = getNextCareer();
  const currentName = getCareerDisplayName(gameState.careerStage);

  let html = '<div class="screen-desc">Advance your career for a permanent multiplier.<br>Resets: Code, Compute, Models, Upgrades.<br>Keeps: Papers, Tokens, Rep.</div>';
  html += '<div class="career-info">';
  html += '<div class="career-hero">';
  html += '<div class="career-star-wrap"><span class="material-symbols-outlined">' + current.icon + '</span></div>';
  html += '<div class="career-level">' + currentName + '</div>';
  html += '<div class="career-multiplier">' + current.multiplier.toFixed(1) + 'x Multiplier</div>';
  html += '</div>';

  // Progress to next
  if (next) {
    const progress = Math.min(gameState.reputation / next.repReq * 100, 100);
    const isReady = progress >= 80;
    const toastKey = 'prestige-ready-' + gameState.careerStage;
    if (isReady && !gameState.shownUnlockModals.includes(toastKey)) {
      gameState.shownUnlockModals.push(toastKey);
      if (typeof showToast === 'function') showToast('Almost there! Advance career at ' + (typeof formatNumber === 'function' ? formatNumber(next.repReq) : next.repReq) + ' Rep.', 'success');
    }
    html += '<div class="career-progress">';
    html += '<div class="progress-header">';
    html += '<span class="progress-header-label">Next: ' + next.name + '</span>';
    if (isReady) html += '<span style="background:var(--accent);color:#000;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:6px">🚀 Ready!</span>';
    html += '<span class="progress-header-value">' + (typeof formatNumber === 'function' ? formatNumber(gameState.reputation) : gameState.reputation) + ' / ' + (typeof formatNumber === 'function' ? formatNumber(next.repReq) : next.repReq) + ' Rep</span>';
    html += '</div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
    html += '</div>';
  }

  // Stats cards
  const repRate = getRepRate();
  // Estimate manual rep/hr: 30 compiles/hr × 50 Rep × prestige multiplier
  const MANUAL_REP_EST = Math.round(1500 * gameState.prestigeMultiplier);
  const displayRepRate = repRate || MANUAL_REP_EST;
  const timeToAdv = next ? getTimeToAdvance(displayRepRate) : null;
  const timeIsEst = next && !repRate;
  html += '<div class="career-cards">';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--accent)">trending_up</span><span class="career-card-label">Multiplier</span></div>';
  html += '<div class="career-card-value">' + current.multiplier.toFixed(1) + 'x</div></div>';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--reputation)">star</span><span class="career-card-label">Reputation</span></div>';
  html += '<div class="career-card-value">' + (typeof formatNumber === 'function' ? formatNumber(gameState.reputation) : gameState.reputation) + '</div></div>';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--accent-green)">speed</span><span class="career-card-label">Rep / hr</span></div>';
  html += '<div class="career-card-value">' + (typeof formatNumber === 'function' ? formatNumber(displayRepRate) : displayRepRate) + (timeIsEst ? '<span style="font-size:11px;opacity:0.6">~</span>' : '') + '</div>';
  html += '<div class="career-card-sub ' + (repRate ? 'green' : '') + '">' + (repRate ? 'via Orchestrator' : 'est. 30 compiles/hr') + '</div></div>';
  html += '<div class="career-card"><div class="career-card-header"><span class="material-symbols-outlined" style="color:var(--reputation)">schedule</span><span class="career-card-label">Advance In</span></div>';
  html += '<div class="career-card-value" style="font-size:18px">' + (timeToAdv || (next ? '--' : 'Max!')) + '</div>';
  if (!next) html += '<div class="career-card-sub green">Top rank!</div>';
  else if (timeIsEst) html += '<div class="career-card-sub">est. at 30 compiles/hr</div>';
  html += '</div>';
  html += '</div>';

  // Promote button
  if (next) {
    const canDo = canPromote();
    html += '<div class="career-btn-area">';
    if (!canDo) html += '<div class="lock-hint" style="margin-bottom:12px">Need ' + (typeof formatNumber === 'function' ? formatNumber(next.repReq - gameState.reputation) : (next.repReq - gameState.reputation)) + ' more reputation</div>';
    html += '<button class="btn ' + (canDo ? 'btn-primary' : 'btn-disabled') + '" onclick="confirmCareerAdvance()" ' + (canDo ? '' : 'disabled') + '>' + (canDo ? 'Advance Career' : 'Not Ready Yet') + '</button>';
    html += '<div class="career-desc">Resets Code, Compute, Models, and Upgrades. Keeps Papers, Tokens, Rep, and Fusions. Bonus: +' + (10 * (gameState.careerHistory.length + 1)) + ' Papers.</div>';
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
    showModal('Advance Career', 'Reset progress for a permanent boost to all earnings?', [
      { text: 'Cancel' },
      { text: 'Advance!', primary: true, onClick: () => {
        if (typeof SFX !== 'undefined' && SFX.prestige) SFX.prestige();
        doCareerAdvance();
        renderCareerScreen();
        if (typeof applyCareerTheme === 'function') applyCareerTheme();
        if (typeof renderModelsScreen === 'function') renderModelsScreen();
        if (typeof renderUpgradeScreen === 'function') renderUpgradeScreen();
        if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
        if (typeof saveGame === 'function') saveGame();
      }},
    ]);
  }
}

const CAREER_THEMES = [
  '',                // 0: NullPointer — default (VSCode Dark)
  'theme-monokai',   // 1: BugFarm
  'theme-dracula',   // 2: StackUnderflow
  'theme-solarized', // 3: Cloudish
  'theme-nord',      // 4: ChatJBT
  'theme-github-dark', // 5: FAANG
  'theme-synthwave', // 6: AI Lab
  'theme-golden',    // 7: Founder
];

function applyCareerTheme() {
  const editor = document.querySelector('.code-editor');
  if (!editor) return;
  // Remove all theme classes
  CAREER_THEMES.forEach(t => { if (t) editor.classList.remove(t); });
  const theme = CAREER_THEMES[gameState.careerStage] || '';
  if (theme) editor.classList.add(theme);
}

// Backward compatibility alias
const renderPrestigeScreen = renderCareerScreen;
