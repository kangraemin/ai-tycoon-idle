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
  return total * gameState.prestigeMultiplier;
}

function produceTick(dt) {
  const lps = getLocPerSecond();
  const produced = lps * dt;
  gameState.loc += produced;
  gameState.totalLoc += produced;
}

function autoCompileTick(dt) {
  const autoPipelineLevel = gameState.upgrades.infra.autoPipeline;
  if (autoPipelineLevel <= 0) return;
  const interval = Math.max(1, 11 - autoPipelineLevel);
  autoCompileTimer += dt;
  if (autoCompileTimer >= interval) {
    autoCompileTimer -= interval;
    if (gameState.loc > 0) {
      const ragLevel = gameState.upgrades.skill.rag;
      const compileRate = 1 + (ragLevel * 0.15);
      const computeEarned = gameState.loc * compileRate * 0.15;
      gameState.compute += computeEarned;
    }
  }
}

function tapEditor(event) {
  SFX.tap();
  const tapPower = 1 * gameState.prestigeMultiplier;
  gameState.loc += tapPower;
  gameState.totalLoc += tapPower;
  if (gameState.stats) gameState.stats.totalTaps++;
  if (getTutorialTrigger() === 'tap') advanceTutorial();

  if (event) {
    const editorEl = event.currentTarget;
    editorEl.classList.remove('tap-active');
    void editorEl.offsetWidth;
    editorEl.classList.add('tap-active');
    setTimeout(() => editorEl.classList.remove('tap-active'), 150);

    const rect = editorEl.getBoundingClientRect();
    showFloatingText(
      event.clientX - rect.left,
      event.clientY - rect.top - 20,
      '+' + formatNumber(tapPower) + ' LoC'
    );
  }
  updateCurrencyDisplay();
}

function compileData() {
  if (gameState.loc <= 0) return;
  SFX.sell();
  const ragLevel = gameState.upgrades.skill.rag;
  const compileRate = 1 + (ragLevel * 0.15);
  const computeEarned = gameState.loc * compileRate;
  gameState.compute += computeEarned;
  if (gameState.stats) {
    gameState.stats.totalSells++;
    gameState.stats.totalGold += computeEarned;
  }
  gameState.loc = 0;
  if (getTutorialTrigger() === 'sell') advanceTutorial();
  updateCurrencyDisplay();

  const computeEl = document.getElementById('compute-display');
  if (computeEl) {
    computeEl.classList.remove('compile-pulse');
    void computeEl.offsetWidth;
    computeEl.classList.add('compile-pulse');
  }
}
