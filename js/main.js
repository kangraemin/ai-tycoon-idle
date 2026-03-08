// main.js - App initialization + game loop

const AUTO_SAVE_INTERVAL = 30000;

let gameLoopId = null;
let autoSaveId = null;

function gameLoop() {
  produceTick();
  updateCurrencyDisplay();
}

function startGame() {
  const loaded = loadGame();

  initUI();
  renderRanch();
  renderUpgradeScreen();
  renderGachaScreen();
  renderPrestigeScreen();
  updateCurrencyDisplay();

  if (loaded) {
    applyOfflineEarnings();
  }

  gameLoopId = setInterval(gameLoop, 1000);
  autoSaveId = setInterval(saveGame, AUTO_SAVE_INTERVAL);
}

function renderRanch() {
  const grid = document.getElementById('slime-grid');
  grid.innerHTML = '';

  const owned = getOwnedSlimes();
  owned.forEach(slime => {
    const def = SLIME_DEFS[slime.id];
    const el = document.createElement('div');
    el.className = 'slime-slot';
    el.innerHTML = `
      <div class="slime ${slime.id}" style="--color1:${def.color1};--color2:${def.color2}"
           onclick="tapSlime(event)">
        <div class="slime-eye left"></div>
        <div class="slime-eye right"></div>
      </div>
      <div class="slime-name">${def.name}</div>
      <div class="slime-info">Lv.${slime.level} x${slime.count}</div>
      <div class="slime-jps">${formatNumber(getSlimeJellyPerSecond(slime))}/s</div>
    `;
    grid.appendChild(el);
  });

  for (let i = owned.length; i < gameState.ranchSlots; i++) {
    const el = document.createElement('div');
    el.className = 'slime-slot empty';
    el.innerHTML = '<div class="empty-slot">+</div>';
    grid.appendChild(el);
  }
}

function renderUpgradeScreen() {
  const container = document.getElementById('upgrade-content');
  let html = '<h2 class="section-title">Upgrades</h2>';

  for (const [id, def] of Object.entries(UPGRADE_DEFS)) {
    const cost = getUpgradeCost(id);
    const level = gameState.upgrades[id];
    const canBuy = gameState.gold >= cost;
    html += `
      <div class="upgrade-card ${canBuy ? '' : 'locked'}">
        <div class="upgrade-info">
          <div class="upgrade-name">${def.name} (Lv.${level})</div>
          <div class="upgrade-desc">${def.description}</div>
        </div>
        <button class="btn ${canBuy ? 'btn-primary' : 'btn-disabled'}"
                onclick="doBuyUpgrade('${id}')" ${canBuy ? '' : 'disabled'}>
          ${formatNumber(cost)} Gold
        </button>
      </div>
    `;
  }

  html += '<h2 class="section-title">Slimes</h2>';

  for (const [id, def] of Object.entries(SLIME_DEFS)) {
    if (def.unlockCost < 0) continue;
    const slimeState = getSlimeState(id);

    if (slimeState.count > 0) {
      const lvCost = getSlimeLevelUpCost(slimeState);
      const canLv = gameState.gold >= lvCost;
      html += `
        <div class="upgrade-card ${canLv ? '' : 'locked'}">
          <div class="upgrade-info">
            <div class="upgrade-name">${def.name} (Lv.${slimeState.level})</div>
            <div class="upgrade-desc">${formatNumber(getSlimeJellyPerSecond(slimeState))}/s</div>
          </div>
          <button class="btn ${canLv ? 'btn-primary' : 'btn-disabled'}"
                  onclick="doLevelUpSlime('${id}')" ${canLv ? '' : 'disabled'}>
            ${formatNumber(lvCost)} Gold
          </button>
        </div>
      `;
    } else {
      const canBuy = gameState.gold >= def.unlockCost && getOwnedSlimes().length < gameState.ranchSlots;
      html += `
        <div class="upgrade-card ${canBuy ? '' : 'locked'}">
          <div class="upgrade-info">
            <div class="upgrade-name">${def.name}</div>
            <div class="upgrade-desc">${formatNumber(def.baseJelly)}/s base • <span class="rarity-text ${def.rarity}">${def.rarity}</span></div>
          </div>
          <button class="btn ${canBuy ? 'btn-secondary' : 'btn-disabled'}"
                  onclick="doBuySlime('${id}')" ${canBuy ? '' : 'disabled'}>
            ${formatNumber(def.unlockCost)} Gold
          </button>
        </div>
      `;
    }
  }

  html += `
    <h2 class="section-title">Ranch</h2>
    <div class="upgrade-card">
      <div class="upgrade-info">
        <div class="upgrade-name">Ranch Slot (${gameState.ranchSlots} slots)</div>
        <div class="upgrade-desc">Add more room for slimes</div>
      </div>
      <button class="btn ${gameState.gold >= getRanchSlotCost() ? 'btn-primary' : 'btn-disabled'}"
              onclick="doBuyRanchSlot()" ${gameState.gold >= getRanchSlotCost() ? '' : 'disabled'}>
        ${formatNumber(getRanchSlotCost())} Gold
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function doBuyUpgrade(id) {
  if (buyUpgrade(id)) {
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doLevelUpSlime(id) {
  if (levelUpSlime(id)) {
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doBuySlime(id) {
  if (buySlime(id)) {
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doBuyRanchSlot() {
  if (buyRanchSlot()) {
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

window.addEventListener('DOMContentLoaded', startGame);
