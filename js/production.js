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

function autoCompileTick(dt) {
  const autoPipelineLevel = gameState.upgrades.infra.autoPipeline;
  if (autoPipelineLevel <= 0) return;

  // stopAutoProd event check (e.g. hallucination)
  if (typeof isStopAutoProd === 'function' && isStopAutoProd()) return;

  const baseInterval = 11 - autoPipelineLevel;
  const orchBonus = 1 - getUpgradeEffect('teamAgent', 'orchestrator');
  const interval = Math.max(1, baseInterval * orchBonus);

  autoCompileTimer += dt;
  if (autoCompileTimer >= interval) {
    autoCompileTimer -= interval;
    if (gameState.loc > 0) {
      const ragLevel = gameState.upgrades.skill.rag;
      const compileRate = 1 + (ragLevel * 0.15);
      const eventMult = typeof getEventMultiplier === 'function' ? getEventMultiplier('compile') : 1;
      const convertRatio = autoPipelineLevel * 0.05;
      const locToConvert = gameState.loc * convertRatio;
      const computeEarned = locToConvert * compileRate * eventMult;
      gameState.compute += computeEarned;
      gameState.loc -= locToConvert;
      if (gameState.stats) gameState.stats.totalCompute += computeEarned;
    }
  }
}

function tapEditor(event) {
  if (typeof SFX !== 'undefined' && SFX.tap) SFX.tap();
  const tapPower = (1 + getUpgradeEffect('infra', 'batchSize')) * gameState.prestigeMultiplier;
  gameState.loc += tapPower;
  gameState.totalLoc += tapPower;
  gameState.reputation += 1;
  if (gameState.stats) gameState.stats.totalTaps++;
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'tap') advanceTutorial();

  if (event) {
    const editorEl = event.currentTarget;
    editorEl.classList.remove('tap-active');
    void editorEl.offsetWidth;
    editorEl.classList.add('tap-active');
    setTimeout(() => editorEl.classList.remove('tap-active'), 150);

    const rect = editorEl.getBoundingClientRect();
    if (typeof showFloatingText === 'function') {
      showFloatingText(
        event.clientX - rect.left,
        event.clientY - rect.top - 20,
        '+' + formatNumber(tapPower) + ' LoC'
      );
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
  if (typeof SFX !== 'undefined' && SFX.sell) SFX.sell();
  const ragLevel = gameState.upgrades.skill.rag;
  const compileRate = 1 + (ragLevel * 0.15);
  const eventMult = typeof getEventMultiplier === 'function' ? getEventMultiplier('compile') : 1;
  const computeEarned = gameState.loc * compileRate * eventMult;
  gameState.compute += computeEarned;
  gameState.reputation += 10;
  if (gameState.stats) {
    gameState.stats.totalCompiles++;
    gameState.stats.totalCompute += computeEarned;
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
