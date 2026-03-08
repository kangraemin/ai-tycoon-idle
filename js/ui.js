// ui.js - DOM rendering + UI updates

let currentScreen = 'ranch';

function switchScreen(screen) {
  SFX.navigate();
  currentScreen = screen;
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(el => {
    el.classList.remove('active');
    const icon = el.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.remove('fill-1');
  });

  const activeBtn = document.querySelector(`[data-screen="${screen}"]`);
  activeBtn.classList.add('active');
  const activeIcon = activeBtn.querySelector('.material-symbols-outlined');
  if (activeIcon) activeIcon.classList.add('fill-1');
}

function updateCurrencyDisplay() {
  document.getElementById('gold-display').textContent = formatNumber(gameState.gold);
  document.getElementById('gems-display').textContent = formatNumber(gameState.gems);
  document.getElementById('jelly-display').textContent = formatNumber(gameState.jelly);
  document.getElementById('jps-display').textContent = formatNumber(getJellyPerSecond()) + '/s';

  const sellBtn = document.querySelector('.sell-btn');
  if (sellBtn) {
    const expectedGold = getExpectedGold();
    if (gameState.jelly > 0) {
      sellBtn.textContent = `Sell (${formatNumber(expectedGold)})`;
      sellBtn.disabled = false;
      sellBtn.classList.remove('btn-disabled');
    } else {
      sellBtn.textContent = 'Sell';
      sellBtn.disabled = true;
      sellBtn.classList.add('btn-disabled');
    }
  }
}

function showFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.getElementById('screen-ranch').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showModal(title, message, buttons) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;

  const btnContainer = document.getElementById('modal-buttons');
  btnContainer.innerHTML = '';
  buttons.forEach(btn => {
    const el = document.createElement('button');
    el.className = 'btn ' + (btn.primary ? 'btn-primary' : 'btn-secondary');
    el.textContent = btn.text;
    el.onclick = () => {
      overlay.classList.remove('active');
      if (btn.onClick) btn.onClick();
    };
    btnContainer.appendChild(el);
  });

  overlay.classList.add('active');
}

function showSettings() {
  const sfxState = gameState.settings?.sfxEnabled !== false;
  showModal('Settings', '', [
    { text: `SFX: ${sfxState ? 'ON' : 'OFF'}`, onClick: () => {
      if (!gameState.settings) gameState.settings = {};
      gameState.settings.sfxEnabled = !sfxState;
      if (typeof SFX !== 'undefined') SFX.enabled = gameState.settings.sfxEnabled;
      saveGame();
      showSettings();
    }},
    { text: 'Reset Data', onClick: () => {
      showModal('Reset Data', 'Are you sure? All progress will be lost!', [
        { text: 'Cancel' },
        { text: 'Reset', primary: true, onClick: () => {
          localStorage.removeItem(SAVE_KEY);
          location.reload();
        }},
      ]);
    }},
    { text: 'Close', primary: true },
  ]);
}

function initUI() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
  switchScreen('ranch');
}
