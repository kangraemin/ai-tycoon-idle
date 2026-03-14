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

function autoCompileTick() {
  // Removed: auto-compile was confusing users (LoC silently decreasing)
}

function tapEditor(event) {
  if (typeof BGM !== 'undefined' && BGM.isEnabled() && !BGM.started) BGM.play();
  if (typeof SFX !== 'undefined' && SFX.tap) SFX.tap();
  if (typeof trackTapBehavior === 'function') trackTapBehavior();
  const tapPower = (1 + getUpgradeEffect('infra', 'batchSize')) * gameState.prestigeMultiplier;
  gameState.loc += tapPower;
  gameState.totalLoc += tapPower;
  gameState.reputation += 1;
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
        showFloatingText(fx, fy, '+' + formatNumber(tapPower) + ' LoC');
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
  const computeEarned = gameState.loc * compileRate * autoPipelineBonus * eventMult;
  gameState.compute += computeEarned;
  gameState.reputation += 10;
  if (gameState.stats) {
    gameState.stats.totalCompiles++;
    gameState.stats.totalCompute += computeEarned;
  }
  // Paper reward every 10 compiles
  if (gameState.stats && gameState.stats.totalCompiles % 10 === 0) {
    gameState.papers += 1;
    if (typeof showToast === 'function') showToast('+1 Paper (compile bonus)', 'success');
  }
  gameState.loc = 0;
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'sell') advanceTutorial();
  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();

  const computeEl = document.getElementById('compute-display');
  if (computeEl) {
    computeEl.classList.remove('compile-pulse');
    void computeEl.offsetWidth;
    computeEl.classList.add('compile-pulse');
  }
}
