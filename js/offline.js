// offline.js - Offline earnings calculation

const BASE_MAX_OFFLINE_SECONDS = 8 * 3600;
const OFFLINE_EFFICIENCY = 0.5;

function calculateOfflineEarnings() {
  const now = Date.now();
  const elapsed = (now - gameState.lastSaveTime) / 1000;
  if (elapsed < 10) return null;

  const memoryBonus = getUpgradeEffect('agent', 'memory');
  const maxOffline = BASE_MAX_OFFLINE_SECONDS + memoryBonus;
  const cappedElapsed = Math.min(elapsed, maxOffline);

  const lps = getLocPerSecond();
  const offlineLoc = lps * cappedElapsed * OFFLINE_EFFICIENCY;

  let offlineCompute = 0;
  if (gameState.upgrades.infra.autoPipeline > 0) {
    const ragLevel = gameState.upgrades.skill.rag;
    const compileRate = 1 + (ragLevel * 0.15);
    const autoPipelineLevel = gameState.upgrades.infra.autoPipeline;
    const convertRatio = autoPipelineLevel * 0.05;
    offlineCompute = offlineLoc * compileRate * convertRatio;
  }

  return {
    elapsed: cappedElapsed,
    loc: offlineLoc,
    compute: offlineCompute,
  };
}

function applyOfflineEarnings() {
  const earnings = calculateOfflineEarnings();
  if (!earnings || earnings.loc <= 0) return;

  gameState.loc += earnings.loc;
  gameState.totalLoc += earnings.loc;

  if (earnings.compute > 0) {
    gameState.compute += earnings.compute;
    showModal(
      'Welcome Back!',
      `Auto-compiled ${formatNumber(earnings.loc)} LoC into ${formatNumber(earnings.compute)} compute while away (${formatTime(earnings.elapsed)})`,
      [{ text: 'Collect', primary: true }]
    );
  } else {
    showModal(
      'Welcome Back!',
      `You wrote ${formatNumber(earnings.loc)} LoC while away (${formatTime(earnings.elapsed)})`,
      [{ text: 'Collect', primary: true }]
    );
  }
}
