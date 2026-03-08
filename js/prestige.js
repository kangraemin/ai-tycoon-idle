// prestige.js - Prestige/rebirth system

const BASE_PRESTIGE_THRESHOLD = 1000000;
const PRESTIGE_BONUS_PER_LEVEL = 0.1;
const PRESTIGE_GEM_REWARD = 5;

function getPrestigeThreshold() {
  return BASE_PRESTIGE_THRESHOLD * Math.pow(3, gameState.prestigeLevel);
}

function canPrestige() {
  return gameState.totalJelly >= getPrestigeThreshold();
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

  gameState.upgrades = { tapPower: 1, productionSpeed: 1, jellyValue: 1, autoSell: 0 };
  gameState.ranchSlots = 5;

  return true;
}

function renderPrestigeScreen() {
  const container = document.getElementById('prestige-content');
  const preview = getPrestigePreview();
  const canDo = canPrestige();
  const progress = Math.min(gameState.totalJelly / getPrestigeThreshold() * 100, 100);
  const increase = (preview.newMultiplier - gameState.prestigeMultiplier).toFixed(1);

  let progressMsg = '';
  if (progress >= 85) progressMsg = 'Almost there, Rancher!';
  else if (progress >= 50) progressMsg = 'Halfway there!';
  else if (progress >= 25) progressMsg = 'Keep going!';
  else progressMsg = 'Just getting started';

  container.innerHTML = `
    <div class="prestige-info">
      <div class="prestige-hero">
        <div class="prestige-star-wrap">
          <span class="material-symbols-outlined">stars</span>
        </div>
        <div class="prestige-level">Level ${gameState.prestigeLevel}</div>
        <div class="prestige-multiplier">Multiplier: ${gameState.prestigeMultiplier.toFixed(1)}x</div>
        <div class="prestige-flavor">Ready to reach for the stars? Reset for a permanent bonus!</div>
      </div>

      <div class="prestige-progress">
        <div class="progress-header">
          <span class="progress-header-label">Progress to Prestige</span>
          <span class="progress-header-value">${formatNumber(gameState.totalJelly)} / ${formatNumber(getPrestigeThreshold())}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <div class="progress-text">${progressMsg}</div>
      </div>

      <div class="prestige-cards">
        <div class="prestige-card">
          <div class="prestige-card-header">
            <span class="material-symbols-outlined" style="color:var(--accent)">trending_up</span>
            <span class="prestige-card-label">Next Boost</span>
          </div>
          <div class="prestige-card-value">x${preview.newMultiplier.toFixed(1)}</div>
          <div class="prestige-card-sub green">+${increase}x increase</div>
        </div>
        <div class="prestige-card">
          <div class="prestige-card-header">
            <span class="material-symbols-outlined" style="color:var(--gold)">diamond</span>
            <span class="prestige-card-label">Gem Reward</span>
          </div>
          <div class="prestige-card-value">${preview.gemsReward}</div>
          <div class="prestige-card-sub amber">Shiny bonus</div>
        </div>
      </div>

      <div class="prestige-btn-area">
        <button class="btn ${canDo ? 'btn-primary' : 'btn-disabled'}"
                onclick="confirmPrestige()" ${canDo ? '' : 'disabled'}>
          ${canDo ? 'Prestige Now' : 'Not Ready Yet'}
        </button>
        <div class="prestige-desc">
          Resetting your progress will grant you a permanent multiplier and gems. Your slimes will be faster and hungrier than ever before!
        </div>
      </div>
    </div>
  `;
}

function confirmPrestige() {
  showModal('Prestige', 'Reset all progress for a permanent bonus?', [
    { text: 'Cancel' },
    { text: 'Prestige!', primary: true, onClick: () => {
      SFX.prestige();
      doPrestige();
      renderRanch();
      renderPrestigeScreen();
      updateCurrencyDisplay();
      saveGame();
    }},
  ]);
}
