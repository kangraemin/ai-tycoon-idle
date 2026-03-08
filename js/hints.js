// hints.js - Context-aware "next goal" hint system

const HINTS = [
  {
    id: 'tap-slime',
    check: () => gameState.totalJelly < 10,
    text: 'Tap your slime to produce jelly!',
    screen: 'ranch',
    icon: 'touch_app',
  },
  {
    id: 'sell-jelly',
    check: () => gameState.jelly >= 5 && gameState.gold < 10,
    text: 'Sell your jelly for gold!',
    screen: null,
    icon: 'sell',
  },
  {
    id: 'buy-upgrade',
    check: () => {
      for (const id of Object.keys(UPGRADE_DEFS)) {
        if (gameState.gold >= getUpgradeCost(id)) return true;
      }
      return false;
    },
    text: 'You can afford an upgrade!',
    screen: 'upgrade',
    icon: 'bolt',
  },
  {
    id: 'buy-slime',
    check: () => {
      const owned = getOwnedSlimes();
      if (owned.length >= gameState.ranchSlots) return false;
      for (const [, def] of Object.entries(SLIME_DEFS)) {
        if (def.unlockCost >= 0 && def.unlockCost <= gameState.gold) {
          const s = getSlimeState(def.name ? Object.keys(SLIME_DEFS).find(k => SLIME_DEFS[k] === def) : '');
          if (!s || s.count === 0) return true;
        }
      }
      return false;
    },
    text: 'Unlock a new slime!',
    screen: 'upgrade',
    icon: 'pets',
  },
  {
    id: 'try-gacha',
    check: () => gameState.gems >= GACHA_COST,
    text: 'Try the gacha for rare slimes!',
    screen: 'gacha',
    icon: 'featured_seasonal_and_gifts',
  },
  {
    id: 'prestige-ready',
    check: () => canPrestige(),
    text: 'You can prestige for a bonus!',
    screen: 'prestige',
    icon: 'military_tech',
  },
  {
    id: 'earn-gold',
    check: () => gameState.jelly > 0 && gameState.gold < 50,
    text: 'Sell jelly to earn gold for upgrades',
    screen: null,
    icon: 'monetization_on',
  },
  {
    id: 'keep-tapping',
    check: () => true,
    text: 'Keep tapping to produce more jelly!',
    screen: 'ranch',
    icon: 'touch_app',
  },
];

let currentHint = null;

function updateHintBanner() {
  const banner = document.getElementById('hint-banner');
  if (!banner) return;

  for (const hint of HINTS) {
    if (hint.check()) {
      if (currentHint !== hint.id) {
        currentHint = hint.id;
        banner.innerHTML = `
          <span class="material-symbols-outlined hint-icon">${hint.icon}</span>
          <span class="hint-text">${hint.text}</span>
          <span class="material-symbols-outlined hint-arrow">chevron_right</span>
        `;
        banner.dataset.screen = hint.screen || '';
        banner.style.display = 'flex';
      }
      return;
    }
  }

  banner.style.display = 'none';
  currentHint = null;
}
