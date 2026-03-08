// achievements.js - Achievement system with gem rewards

const ACHIEVEMENT_DEFS = [
  // Tapping
  { id: 'tap_10', name: 'First Taps', desc: 'Tap slimes 10 times', icon: 'touch_app', gems: 2, check: s => s.totalTaps >= 10 },
  { id: 'tap_100', name: 'Tappy Fingers', desc: 'Tap slimes 100 times', icon: 'touch_app', gems: 5, check: s => s.totalTaps >= 100 },
  { id: 'tap_1000', name: 'Tap Master', desc: 'Tap slimes 1,000 times', icon: 'touch_app', gems: 10, check: s => s.totalTaps >= 1000 },

  // Selling
  { id: 'sell_10', name: 'First Sales', desc: 'Sell jelly 10 times', icon: 'sell', gems: 2, check: s => s.totalSells >= 10 },
  { id: 'sell_100', name: 'Merchant', desc: 'Sell jelly 100 times', icon: 'sell', gems: 5, check: s => s.totalSells >= 100 },

  // Gold
  { id: 'gold_1k', name: 'Gold Rush', desc: 'Earn 1,000 total gold', icon: 'monetization_on', gems: 5, check: s => s.totalGold >= 1000 },
  { id: 'gold_100k', name: 'Gold Mine', desc: 'Earn 100,000 total gold', icon: 'monetization_on', gems: 10, check: s => s.totalGold >= 100000 },

  // Slimes
  { id: 'slimes_3', name: 'Collector', desc: 'Own 3 different slimes', icon: 'pets', gems: 5, check: s => s.slimesOwned >= 3 },
  { id: 'slimes_6', name: 'Rancher', desc: 'Own 6 different slimes', icon: 'pets', gems: 10, check: s => s.slimesOwned >= 6 },
  { id: 'slimes_10', name: 'Full Ranch', desc: 'Own all 10 slimes', icon: 'pets', gems: 15, check: s => s.slimesOwned >= 10 },

  // Gacha
  { id: 'gacha_5', name: 'Lucky Draw', desc: 'Pull gacha 5 times', icon: 'featured_seasonal_and_gifts', gems: 5, check: s => s.gachaPulls >= 5 },
  { id: 'gacha_20', name: 'Gacha Addict', desc: 'Pull gacha 20 times', icon: 'featured_seasonal_and_gifts', gems: 10, check: s => s.gachaPulls >= 20 },

  // Prestige
  { id: 'prestige_1', name: 'Reborn', desc: 'Prestige for the first time', icon: 'military_tech', gems: 10, check: () => gameState.prestigeLevel >= 1 },
  { id: 'prestige_5', name: 'Star Rancher', desc: 'Reach prestige level 5', icon: 'military_tech', gems: 12, check: () => gameState.prestigeLevel >= 5 },
];

function getStats() {
  return gameState.stats || {};
}

function updateLiveStats() {
  if (!gameState.stats) return;
  gameState.stats.slimesOwned = getOwnedSlimes().length;
}

let lastAchievementCheck = 0;

function checkAchievements() {
  const now = Date.now();
  if (now - lastAchievementCheck < 1000) return;
  lastAchievementCheck = now;

  if (!gameState.achievements) gameState.achievements = {};
  if (!gameState.stats) return;

  updateLiveStats();
  const stats = gameState.stats;

  for (const ach of ACHIEVEMENT_DEFS) {
    if (gameState.achievements[ach.id]) continue;
    if (ach.check(stats)) {
      gameState.achievements[ach.id] = Date.now();
      gameState.gems += ach.gems;
      SFX.achievement();
      showToast(`🏆 ${ach.name} — +${ach.gems} gems!`, 'success');
      updateCurrencyDisplay();
    }
  }
}

function getAchievementProgress() {
  const total = ACHIEVEMENT_DEFS.length;
  const unlocked = Object.keys(gameState.achievements || {}).length;
  return { total, unlocked };
}

function renderAchievementList() {
  let html = '<div style="text-align:left;max-height:300px;overflow-y:auto;margin:0 -8px">';
  for (const ach of ACHIEVEMENT_DEFS) {
    const done = gameState.achievements && gameState.achievements[ach.id];
    html += `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;opacity:${done ? 1 : 0.5};border-bottom:1px solid var(--border-light)">
        <span class="material-symbols-outlined" style="font-size:20px;color:${done ? 'var(--gold)' : 'var(--text-muted)'}">${ach.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13px">${ach.name} ${done ? '✓' : ''}</div>
          <div style="font-size:11px;color:var(--text-secondary)">${ach.desc}</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--gem)">+${ach.gems}💎</div>
      </div>
    `;
  }
  html += '</div>';
  return html;
}
