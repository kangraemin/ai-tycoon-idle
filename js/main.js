// main.js - App initialization + game loop

const AUTO_SAVE_INTERVAL = 30000;

const UPGRADE_ICONS = {
  tapPower: { icon: 'touch_app', bg: 'pink-bg', border: 'pastel-pink' },
  productionSpeed: { icon: 'speed', bg: 'blue-bg', border: 'pastel-blue' },
  jellyValue: { icon: 'paid', bg: 'yellow-bg', border: 'pastel-yellow' },
  autoSell: { icon: 'sell', bg: 'green-bg', border: 'pastel-green' },
};

const SLIME_ICON_STYLES = [
  { bg: 'pink-bg', border: 'pastel-pink', icon: 'capture' },
  { bg: 'blue-bg', border: 'pastel-blue', icon: 'bubble_chart' },
  { bg: 'purple-bg', border: 'pastel-purple', icon: 'auto_awesome' },
  { bg: 'green-bg', border: 'pastel-green', icon: 'eco' },
  { bg: 'orange-bg', border: 'pastel-orange', icon: 'local_fire_department' },
  { bg: 'yellow-bg', border: 'pastel-yellow', icon: 'star' },
  { bg: 'pink-bg', border: 'pastel-pink', icon: 'pets' },
  { bg: 'blue-bg', border: 'pastel-blue', icon: 'water_drop' },
  { bg: 'purple-bg', border: 'pastel-purple', icon: 'diamond' },
  { bg: 'green-bg', border: 'pastel-green', icon: 'park' },
];

let gameLoopId = null;
let autoSaveId = null;

function gameLoop() {
  const now = performance.now();
  if (lastTickTime === 0) lastTickTime = now;
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  if (dt > 0 && dt < 10) {
    produceTick(dt);
    autoSellTick(dt);
  }
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

  lastTickTime = performance.now();
  gameLoopId = setInterval(gameLoop, 100);
  autoSaveId = setInterval(saveGame, AUTO_SAVE_INTERVAL);
}

function updateRanchSlotCount() {
  const owned = getOwnedSlimes();
  const el = document.getElementById('ranch-slot-count');
  if (el) el.textContent = `${owned.length}/${gameState.ranchSlots} Slots`;
}

function renderRanch() {
  const grid = document.getElementById('slime-grid');
  grid.innerHTML = '';

  const owned = getOwnedSlimes();
  updateRanchSlotCount();

  owned.forEach(slime => {
    const def = SLIME_DEFS[slime.id];
    const el = document.createElement('div');
    el.className = 'slime-slot';
    el.innerHTML = `
      <div class="slime-level-badge">Lv.${slime.level}</div>
      ${slime.count > 1 ? `<div class="slime-count-badge">x${slime.count}</div>` : ''}
      <div class="slime ${slime.id}" style="--color1:${def.color1};--color2:${def.color2}"
           onclick="tapSlime(event)">
        <div class="slime-eye left"></div>
        <div class="slime-eye right"></div>
      </div>
      <div class="slime-name">${def.name}</div>
      <div class="slime-jps">${formatNumber(getSlimeJellyPerSecond(slime))}/s</div>
    `;
    grid.appendChild(el);
  });

  for (let i = owned.length; i < gameState.ranchSlots; i++) {
    const el = document.createElement('div');
    el.className = 'slime-slot empty';
    el.innerHTML = `
      <div class="empty-slot">
        <span class="material-symbols-outlined">add</span>
      </div>
      <div class="empty-slot-label">Unlock</div>
    `;
    el.onclick = () => switchScreen('upgrade');
    grid.appendChild(el);
  }
}

function renderUpgradeScreen() {
  const container = document.getElementById('upgrade-content');
  let html = '';

  // Upgrades section
  html += `<div class="section-header"><span class="material-symbols-outlined">bolt</span><h2>Upgrades</h2></div>`;

  for (const [id, def] of Object.entries(UPGRADE_DEFS)) {
    const cost = getUpgradeCost(id);
    const level = gameState.upgrades[id];
    const canBuy = gameState.gold >= cost;
    const style = UPGRADE_ICONS[id] || { icon: 'upgrade', bg: 'green-bg', border: 'pastel-green' };
    html += `
      <div class="upgrade-card ${style.border} ${canBuy ? '' : 'locked'}">
        <div class="upgrade-card-top">
          <div class="upgrade-icon-wrap ${style.bg}">
            <span class="material-symbols-outlined">${style.icon}</span>
          </div>
          <div class="upgrade-info">
            <div class="upgrade-name">
              ${def.name}
              <span class="upgrade-level-badge">Lv. ${level}</span>
            </div>
            <div class="upgrade-desc">${def.description}</div>
          </div>
        </div>
        <div class="upgrade-card-bottom">
          <div class="upgrade-next-info">${getUpgradeEffect(id)} → ${getUpgradeNextEffect(id)}</div>
          <button class="btn ${canBuy ? 'btn-primary' : 'btn-disabled'}"
                  onclick="doBuyUpgrade('${id}')" ${canBuy ? '' : 'disabled'}>
            ${formatNumber(cost)}
          </button>
        </div>
      </div>
    `;
  }

  // Slimes section
  html += `<div class="section-header"><span class="material-symbols-outlined">pets</span><h2>Slime Management</h2></div>`;

  let slimeIdx = 0;
  for (const [id, def] of Object.entries(SLIME_DEFS)) {
    if (def.unlockCost < 0) continue;
    const slimeState = getSlimeState(id);
    const style = SLIME_ICON_STYLES[slimeIdx % SLIME_ICON_STYLES.length];
    slimeIdx++;

    if (slimeState.count > 0) {
      const lvCost = getSlimeLevelUpCost(slimeState);
      const canLv = gameState.gold >= lvCost;
      html += `
        <div class="upgrade-card ${style.border} ${canLv ? '' : 'locked'}">
          <div class="upgrade-card-top">
            <div class="upgrade-icon-wrap ${style.bg}">
              <span class="material-symbols-outlined">${style.icon}</span>
            </div>
            <div class="upgrade-info">
              <div class="upgrade-name">
                ${def.name}
                <span class="upgrade-level-badge">Lv. ${slimeState.level}</span>
              </div>
              <div class="upgrade-desc">${formatNumber(getSlimeJellyPerSecond(slimeState))}/s production</div>
            </div>
          </div>
          <div class="upgrade-card-bottom">
            <div class="upgrade-next-info">Next: +jelly boost</div>
            <button class="btn ${canLv ? 'btn-primary' : 'btn-disabled'}"
                    onclick="doLevelUpSlime('${id}')" ${canLv ? '' : 'disabled'}>
              ${formatNumber(lvCost)}
            </button>
          </div>
        </div>
      `;
    } else {
      const canBuy = gameState.gold >= def.unlockCost && getOwnedSlimes().length < gameState.ranchSlots;
      html += `
        <div class="upgrade-card ${style.border} ${canBuy ? '' : 'locked'}">
          <div class="upgrade-card-top">
            <div class="upgrade-icon-wrap ${style.bg}">
              <span class="material-symbols-outlined">${style.icon}</span>
            </div>
            <div class="upgrade-info">
              <div class="upgrade-name">${def.name}</div>
              <div class="upgrade-desc">${formatNumber(def.baseJelly)}/s base &bull; <span class="rarity-text ${def.rarity}">${def.rarity}</span></div>
            </div>
          </div>
          <div class="upgrade-card-bottom">
            <div class="upgrade-next-info">Unlock new slime</div>
            <button class="btn ${canBuy ? 'btn-secondary' : 'btn-disabled'}"
                    onclick="doBuySlime('${id}')" ${canBuy ? '' : 'disabled'}>
              ${formatNumber(def.unlockCost)}
            </button>
          </div>
        </div>
      `;
    }
  }

  // Ranch expansion section
  html += `<div class="section-header"><span class="material-symbols-outlined">grid_view</span><h2>Ranch Expansion</h2></div>`;
  html += `
    <div class="upgrade-card pastel-yellow">
      <div class="upgrade-card-top">
        <div class="upgrade-icon-wrap yellow-bg">
          <span class="material-symbols-outlined">holiday_village</span>
        </div>
        <div class="upgrade-info">
          <div class="upgrade-name">Ranch Slot (${gameState.ranchSlots} slots)</div>
          <div class="upgrade-desc">Unlock more room for slimes</div>
        </div>
      </div>
      <div class="upgrade-card-bottom">
        <div class="upgrade-next-info">+1 slot</div>
        <button class="btn ${gameState.gold >= getRanchSlotCost() ? 'btn-primary' : 'btn-disabled'}"
                onclick="doBuyRanchSlot()" ${gameState.gold >= getRanchSlotCost() ? '' : 'disabled'}>
          ${formatNumber(getRanchSlotCost())}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function doBuyUpgrade(id) {
  if (buyUpgrade(id)) {
    SFX.buy();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doLevelUpSlime(id) {
  if (levelUpSlime(id)) {
    SFX.levelUp();
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doBuySlime(id) {
  if (buySlime(id)) {
    SFX.buy();
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

function doBuyRanchSlot() {
  if (buyRanchSlot()) {
    SFX.buy();
    renderRanch();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  }
}

window.addEventListener('DOMContentLoaded', startGame);
