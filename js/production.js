// production.js - Jelly production logic (idle + tap)

function getJellyPerSecond() {
  let total = 0;
  for (const slime of gameState.slimes) {
    if (slime.count > 0) {
      total += getSlimeJellyPerSecond(slime);
    }
  }
  return total * gameState.upgrades.productionSpeed * gameState.prestigeMultiplier;
}

function produceTick() {
  const jps = getJellyPerSecond();
  gameState.jelly += jps;
  gameState.totalJelly += jps;
}

function tapSlime(event) {
  const tapAmount = gameState.upgrades.tapPower * gameState.prestigeMultiplier;
  gameState.jelly += tapAmount;
  gameState.totalJelly += tapAmount;

  if (event) {
    const rect = event.currentTarget.getBoundingClientRect();
    showFloatingText(
      event.clientX - rect.left,
      event.clientY - rect.top - 20,
      '+' + formatNumber(tapAmount)
    );
  }
}

function sellJelly() {
  if (gameState.jelly <= 0) return;
  const goldEarned = gameState.jelly * gameState.upgrades.jellyValue * 0.1;
  gameState.gold += goldEarned;
  gameState.jelly = 0;
}
