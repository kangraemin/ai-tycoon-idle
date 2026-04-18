// production.js - LoC production logic (idle + tap + compile)

let lastTickTime = 0;
let autoCompileTimer = 0;

function getLocPerSecond() {
  let total = 0;
  for (const model of gameState.models) {
    if (model.count > 0) {
      total += getModelLps(model);
    }
  }
  const toolUseBonus = 1 + getUpgradeEffect('agent', 'toolUse');
  const distBonus = 1 + getUpgradeEffect('infra', 'distTraining');
  const eventMult = typeof getEventMultiplier === 'function' ? getEventMultiplier('loc') : 1;
  return total * toolUseBonus * distBonus * gameState.prestigeMultiplier * eventMult;
}

function produceTick(dt) {
  // Halt event check (e.g. criticalBug)
  if (typeof isHaltActive === 'function' && isHaltActive()) return;

  const lps = getLocPerSecond();
  const produced = lps * dt;
  gameState.loc += produced;
  gameState.totalLoc += produced;
}

const BASE_AUTO_COMPILE_INTERVAL = 10; // seconds at Orchestrator Lv.1

function autoCompileTick(dt) {
  const orchLevel = gameState.upgrades.teamAgent.orchestrator;
  if (orchLevel === 0) return;
  if (typeof isHaltActive === 'function' && isHaltActive()) return;
  if (gameState.loc < 1) return;

  const speedMult = 1 + orchLevel * 0.15;
  autoCompileTimer += dt * speedMult;

  if (autoCompileTimer >= BASE_AUTO_COMPILE_INTERVAL) {
    compileData();
    autoCompileTimer = 0;
  }
}

function tapEditor(event) {
  if (typeof BGM !== 'undefined' && BGM.isEnabled() && !BGM.started) BGM.play();
  if (typeof SFX !== 'undefined' && SFX.tap) SFX.tap();
  if (typeof trackTapBehavior === 'function') trackTapBehavior();
  const tapPower = (1 + getUpgradeEffect('infra', 'batchSize')) * gameState.prestigeMultiplier;
  gameState.loc += tapPower;
  gameState.totalLoc += tapPower;
  gameState.reputation += 5;
  if (gameState.stats) gameState.stats.totalTaps++;
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'tap') advanceTutorial();

  {
    const editorEl = event ? event.currentTarget : document.getElementById('screen-editor');
    if (editorEl) {
      editorEl.classList.remove('tap-active');
      requestAnimationFrame(() => {
        editorEl.classList.add('tap-active');
        setTimeout(() => editorEl.classList.remove('tap-active'), 150);
      });

      if (typeof showFloatingText === 'function') {
        let fx, fy;
        if (event) {
          const rect = editorEl.getBoundingClientRect();
          fx = event.clientX - rect.left;
          fy = event.clientY - rect.top - 20;
        } else {
          fx = Math.random() * (editorEl.clientWidth * 0.6) + editorEl.clientWidth * 0.2;
          fy = Math.random() * (editorEl.clientHeight * 0.4) + editorEl.clientHeight * 0.2;
        }
        showFloatingText(fx, fy, '+' + formatNumber(tapPower) + ' Code');
        showFloatingText(fx + 4, fy + 18, '+5 Rep');
      }
    }
  }
  // Advance typing animation on tap (3-5 chars)
  if (typeof advanceTyping === 'function') {
    advanceTyping(3 + Math.floor(Math.random() * 3));
  }
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
}

function compileData() {
  if (gameState.loc <= 0) return;
  if (typeof SFX !== 'undefined') {
    if (SFX.compileKey) SFX.compileKey();
    if (SFX.sell) SFX.sell();
  }
  if (typeof trackCompileBehavior === 'function') trackCompileBehavior();
  const ragLevel = gameState.upgrades.skill.rag;
  const compileRate = 1 + (ragLevel * 0.15);
  const autoPipelineBonus = 1 + (gameState.upgrades.infra.autoPipeline * 0.15);
  const eventMult = typeof getEventMultiplier === 'function' ? getEventMultiplier('compile') : 1;
  const output = gameState.loc * compileRate * autoPipelineBonus * eventMult;

  if (gameState.editorTab === 'train') {
    // train.js → Papers (output/100, 최소 1)
    const papersEarned = Math.max(1, Math.floor(output / 100));
    gameState.papers += papersEarned;
    if (typeof showToast === 'function') showToast('+' + papersEarned + ' Papers', 'success');
  } else {
    // agent.py → Compute (기존)
    gameState.compute += output;
    if (gameState.stats) gameState.stats.totalCompute += output;
    // Paper reward every 10 compiles (check after increment to avoid firing at compile #1)
    if (gameState.stats && (gameState.stats.totalCompiles + 1) % 10 === 0) {
      gameState.papers += 1;
      if (typeof showToast === 'function') showToast('+1 Paper (compile bonus)', 'success');
    }
  }
  gameState.reputation += 50;
  // Floating +50 Rep feedback near rep-display in top bar
  const _repEl = document.getElementById('rep-display');
  if (_repEl) {
    const _rect = _repEl.getBoundingClientRect();
    const _ft = document.createElement('div');
    _ft.className = 'floating-text';
    _ft.textContent = '+50 Rep';
    _ft.style.position = 'fixed';
    _ft.style.left = (_rect.left + _rect.width / 2) + 'px';
    _ft.style.top = (_rect.bottom + 2) + 'px';
    _ft.style.transform = 'translateX(-50%)';
    _ft.style.color = 'var(--reputation)';
    _ft.style.fontSize = '13px';
    document.body.appendChild(_ft);
    setTimeout(() => _ft.remove(), 1000);
  }
  if (gameState.stats) gameState.stats.totalCompiles++;
  gameState.loc = 0;
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'sell') advanceTutorial();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();

  // compile-pulse: 탭에 따라 다른 엘리먼트에 적용
  const pulseId = gameState.editorTab === 'train' ? 'papers-display' : 'compute-display';
  const pulseEl = document.getElementById(pulseId);
  if (pulseEl) {
    pulseEl.classList.remove('compile-pulse');
    void pulseEl.offsetWidth;
    pulseEl.classList.add('compile-pulse');
  }

  const repEl = document.getElementById('rep-display');
  if (repEl) {
    repEl.classList.remove('compile-pulse');
    void repEl.offsetWidth;
    repEl.classList.add('compile-pulse');
    setTimeout(() => repEl.classList.remove('compile-pulse'), 600);
  }
}
