// production.js - Jelly production logic (idle + tap + auto-sell)

let lastTickTime = 0;
let autoSellTimer = 0;

function getJellyPerSecond() {
  let total = 0;
  for (const slime of gameState.slimes) {
    if (slime.count > 0) {
      total += getSlimeJellyPerSecond(slime);
    }
  }
  return total * gameState.upgrades.productionSpeed * gameState.prestigeMultiplier;
}

function getExpectedGold() {
  return gameState.jelly * gameState.upgrades.jellyValue * 0.5;
}

function produceTick(dt) {
  const jps = getJellyPerSecond();
  const produced = jps * dt;
  gameState.jelly += produced;
  gameState.totalJelly += produced;
}

function autoSellTick(dt) {
  if (gameState.upgrades.autoSell <= 0) return;
  const interval = Math.max(1, 11 - gameState.upgrades.autoSell);
  autoSellTimer += dt;
  if (autoSellTimer >= interval) {
    autoSellTimer -= interval;
    if (gameState.jelly > 0) {
      const goldEarned = getExpectedGold();
      gameState.gold += goldEarned;
      gameState.jelly = 0;
    }
  }
}

function tapSlime(event) {
  SFX.tap();
  const tapAmount = gameState.upgrades.tapPower * gameState.prestigeMultiplier;
  gameState.jelly += tapAmount;
  gameState.totalJelly += tapAmount;
  if (gameState.stats) gameState.stats.totalTaps++;

  if (event) {
    const slimeEl = event.currentTarget;
    slimeEl.classList.remove('tap-bounce');
    void slimeEl.offsetWidth;
    slimeEl.classList.add('tap-bounce');

    const rect = slimeEl.getBoundingClientRect();
    showFloatingText(
      event.clientX - rect.left,
      event.clientY - rect.top - 20,
      '+' + formatNumber(tapAmount)
    );
  }
  updateCurrencyDisplay();
}

function sellJelly() {
  if (gameState.jelly <= 0) return;
  SFX.sell();
  const goldEarned = getExpectedGold();
  gameState.gold += goldEarned;
  if (gameState.stats) {
    gameState.stats.totalSells++;
    gameState.stats.totalGold += goldEarned;
  }
  gameState.jelly = 0;
  updateCurrencyDisplay();

  const goldEl = document.getElementById('gold-display');
  if (goldEl) {
    goldEl.classList.remove('golden-pulse');
    void goldEl.offsetWidth;
    goldEl.classList.add('golden-pulse');
  }
}
