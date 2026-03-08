// ui.js - DOM rendering + UI updates

let currentScreen = 'ranch';

function switchScreen(screen) {
  if (currentScreen === screen) return;
  SFX.navigate();

  const oldScreen = document.getElementById('screen-' + currentScreen);
  const newScreen = document.getElementById('screen-' + screen);
  currentScreen = screen;

  if (oldScreen) {
    oldScreen.classList.add('screen-exit');
    oldScreen.addEventListener('animationend', function handler() {
      oldScreen.classList.remove('active', 'screen-exit');
      oldScreen.removeEventListener('animationend', handler);
    }, { once: true });
  }

  if (newScreen) {
    newScreen.classList.add('active', 'screen-enter');
    newScreen.addEventListener('animationend', function handler() {
      newScreen.classList.remove('screen-enter');
      newScreen.removeEventListener('animationend', handler);
    }, { once: true });
  }

  document.querySelectorAll('.nav-btn').forEach(el => {
    el.classList.remove('active');
    const icon = el.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.remove('fill-1');
  });

  const activeBtn = document.querySelector(`[data-screen="${screen}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    const activeIcon = activeBtn.querySelector('.material-symbols-outlined');
    if (activeIcon) activeIcon.classList.add('fill-1');
  }
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
      sellBtn.textContent = `Sell → ${formatNumber(expectedGold)} gold`;
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
  const sfxState = gameState.settings?.sfxOn !== false;
  showModal('Settings', '', [
    { text: `SFX: ${sfxState ? 'ON' : 'OFF'}`, onClick: () => {
      if (!gameState.settings) gameState.settings = {};
      gameState.settings.sfxOn = !sfxState;
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

function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 1800);
}

function initUI() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
  // Ranch is already active via HTML class; just sync nav state
  currentScreen = 'ranch';
}
