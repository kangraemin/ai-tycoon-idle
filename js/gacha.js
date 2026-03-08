// gacha.js - Gacha pull system

const GACHA_COST = 10;

const GACHA_RATES = [
  { rarity: 'common',    weight: 40 },
  { rarity: 'uncommon',  weight: 30 },
  { rarity: 'rare',      weight: 20 },
  { rarity: 'epic',      weight: 8 },
  { rarity: 'legendary', weight: 2 },
];

function getSlimesByRarity(rarity) {
  return Object.entries(SLIME_DEFS)
    .filter(([_, def]) => def.rarity === rarity)
    .map(([id]) => id);
}

function rollGacha() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rate of GACHA_RATES) {
    cumulative += rate.weight;
    if (roll < cumulative) {
      const candidates = getSlimesByRarity(rate.rarity);
      const slimeId = candidates[Math.floor(Math.random() * candidates.length)];
      return { slimeId, rarity: rate.rarity };
    }
  }
  return { slimeId: 'normal', rarity: 'common' };
}

function pullGacha() {
  if (gameState.gems < GACHA_COST) return null;
  gameState.gems -= GACHA_COST;

  const result = rollGacha();
  const slimeState = getSlimeState(result.slimeId);
  slimeState.count++;

  return result;
}

function renderGachaScreen() {
  const container = document.getElementById('gacha-content');
  container.innerHTML = `
    <div class="gacha-machine">
      <div class="gacha-display" id="gacha-result"></div>
      <button class="btn btn-primary gacha-pull-btn" onclick="doGachaPull()">
        Pull (${GACHA_COST} Gems)
      </button>
      <div class="gacha-rates">
        <h3>Drop Rates</h3>
        ${GACHA_RATES.map(r => `
          <div class="rate-row">
            <span class="rarity-badge ${r.rarity}">${r.rarity}</span>
            <span>${r.weight}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function doGachaPull() {
  const result = pullGacha();
  if (!result) {
    showModal('Not Enough Gems', 'You need ' + GACHA_COST + ' gems to pull.', [
      { text: 'OK', primary: true }
    ]);
    return;
  }

  const def = SLIME_DEFS[result.slimeId];
  const resultEl = document.getElementById('gacha-result');
  resultEl.innerHTML = `
    <div class="gacha-reveal ${result.rarity}">
      <div class="slime ${result.slimeId}" style="--color1:${def.color1};--color2:${def.color2}">
        <div class="slime-eye left"></div>
        <div class="slime-eye right"></div>
      </div>
      <div class="gacha-name">${def.name}</div>
      <div class="rarity-badge ${result.rarity}">${result.rarity}</div>
    </div>
  `;
}
