// prestige.js - Prestige/rebirth system

const PRESTIGE_THRESHOLD = 1000000;
const PRESTIGE_BONUS_PER_LEVEL = 0.1;
const PRESTIGE_GEM_REWARD = 5;

function canPrestige() {
  return gameState.totalJelly >= PRESTIGE_THRESHOLD;
}

function getPrestigePreview() {
  const newLevel = gameState.prestigeLevel + 1;
  const newMultiplier = 1 + (PRESTIGE_BONUS_PER_LEVEL * newLevel);
  return {
    newLevel,
    newMultiplier,
    gemsReward: PRESTIGE_GEM_REWARD * newLevel,
    currentMultiplier: gameState.prestigeMultiplier,
  };
}

function doPrestige() {
  if (!canPrestige()) return false;

  gameState.prestigeLevel++;
  gameState.prestigeMultiplier = 1 + (PRESTIGE_BONUS_PER_LEVEL * gameState.prestigeLevel);
  gameState.gems += PRESTIGE_GEM_REWARD * gameState.prestigeLevel;

  gameState.gold = 0;
  gameState.jelly = 0;
  gameState.totalJelly = 0;

  gameState.slimes = gameState.slimes.map(s => ({
    ...s,
    level: 1,
    count: s.id === 'normal' ? 1 : 0,
  }));

  gameState.upgrades = { tapPower: 1, productionSpeed: 1, jellyValue: 1 };
  gameState.ranchSlots = 5;

  return true;
}

function renderPrestigeScreen() {
  const container = document.getElementById('prestige-content');
  const preview = getPrestigePreview();
  const canDo = canPrestige();
  const progress = Math.min(gameState.totalJelly / PRESTIGE_THRESHOLD * 100, 100);

  container.innerHTML = `
    <div class="prestige-info">
      <div class="prestige-level">Prestige Level: ${gameState.prestigeLevel}</div>
      <div class="prestige-multiplier">Current Bonus: x${gameState.prestigeMultiplier.toFixed(1)}</div>

      <div class="prestige-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <div class="progress-text">${formatNumber(gameState.totalJelly)} / ${formatNumber(PRESTIGE_THRESHOLD)}</div>
      </div>

      <div class="prestige-preview">
        <h3>Next Prestige</h3>
        <div>New Multiplier: x${preview.newMultiplier.toFixed(1)}</div>
        <div>Gem Reward: +${preview.gemsReward}</div>
      </div>

      <button class="btn ${canDo ? 'btn-primary' : 'btn-disabled'}"
              onclick="confirmPrestige()" ${canDo ? '' : 'disabled'}>
        ${canDo ? 'Prestige Now' : 'Not Ready Yet'}
      </button>
    </div>
  `;
}

function confirmPrestige() {
  showModal('Prestige', 'Reset all progress for a permanent bonus?', [
    { text: 'Cancel' },
    { text: 'Prestige!', primary: true, onClick: () => {
      doPrestige();
      renderRanch();
      renderPrestigeScreen();
      updateCurrencyDisplay();
      saveGame();
    }},
  ]);
}
