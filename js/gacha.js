// gacha.js - Gacha pull system

const GACHA_COST = 10;

const GACHA_RATES = [
  { rarity: 'common',    weight: 40, label: 'C' },
  { rarity: 'uncommon',  weight: 30, label: 'U' },
  { rarity: 'rare',      weight: 20, label: 'R' },
  { rarity: 'epic',      weight: 8,  label: 'E' },
  { rarity: 'legendary', weight: 2,  label: 'L' },
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
      <div class="gacha-display" id="gacha-result">
        <div class="gacha-bubble-window">
          <div class="gacha-bubbles">
            <div class="gacha-bubble b-blue"></div>
            <div class="gacha-bubble b-green"></div>
            <div class="gacha-bubble b-purple"></div>
            <div class="gacha-bubble b-pink"></div>
            <div class="gacha-bubble b-orange"></div>
            <div class="gacha-bubble b-yellow"></div>
          </div>
          <div class="gacha-bubble-chute"></div>
        </div>
        <div class="gacha-pull-area">
          <button class="gacha-pull-btn" onclick="doGachaPull()">PULL!</button>
          <span class="gacha-pull-hint">${GACHA_COST} gems per pull</span>
        </div>
      </div>
      <div class="gacha-rates">
        <h3>Drop Rates</h3>
        <div class="rate-circles">
          ${GACHA_RATES.map(r => `
            <div class="rate-circle">
              <div class="rate-circle-badge ${r.rarity}">${r.label}</div>
              <span class="rate-circle-pct ${r.rarity}">${r.weight}%</span>
            </div>
          `).join('')}
        </div>
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
    <div class="gacha-pull-area" style="margin-top:16px">
      <button class="gacha-pull-btn" onclick="doGachaPull()">PULL!</button>
      <span class="gacha-pull-hint">${GACHA_COST} gems per pull</span>
    </div>
  `;

  updateCurrencyDisplay();
  renderRanch();
  renderUpgradeScreen();
}
