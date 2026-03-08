// offline.js - Offline earnings calculation

const MAX_OFFLINE_SECONDS = 8 * 3600;
const OFFLINE_EFFICIENCY = 0.5;

function calculateOfflineEarnings() {
  const now = Date.now();
  const elapsed = (now - gameState.lastSaveTime) / 1000;

  if (elapsed < 10) return null;

  const cappedElapsed = Math.min(elapsed, MAX_OFFLINE_SECONDS);
  const jps = getJellyPerSecond();
  const offlineJelly = jps * cappedElapsed * OFFLINE_EFFICIENCY;
  const offlineGold = offlineJelly * gameState.upgrades.jellyValue * 0.5;

  return {
    elapsed: cappedElapsed,
    jelly: offlineJelly,
    gold: offlineGold,
  };
}

function applyOfflineEarnings() {
  const earnings = calculateOfflineEarnings();
  if (!earnings || earnings.jelly <= 0) return;

  if (gameState.upgrades.autoSell > 0) {
    gameState.gold += earnings.gold;
    gameState.totalJelly += earnings.jelly;
    showModal(
      'Welcome Back!',
      `Auto-sold ${formatNumber(earnings.jelly)} jelly for ${formatNumber(earnings.gold)} gold while away (${formatTime(earnings.elapsed)})`,
      [{ text: 'Collect', primary: true }]
    );
  } else {
    gameState.jelly += earnings.jelly;
    gameState.totalJelly += earnings.jelly;
    showModal(
      'Welcome Back!',
      `You earned ${formatNumber(earnings.jelly)} jelly while away (${formatTime(earnings.elapsed)})`,
      [{ text: 'Collect', primary: true }]
    );
  }
}
