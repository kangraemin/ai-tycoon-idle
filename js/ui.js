// ui.js - DOM rendering + UI updates

let currentScreen = 'editor';

function switchScreen(screen) {
  if (currentScreen === screen) return;
  if (typeof SFX !== 'undefined' && SFX.navigate) SFX.navigate();
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'navigate' && screen === 'upgrade') advanceTutorial();

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
  document.getElementById('compute-display').textContent = formatNumber(gameState.compute);
  document.getElementById('papers-display').textContent = formatNumber(gameState.papers);
  document.getElementById('tokens-display').textContent = formatNumber(gameState.tokens);
  document.getElementById('loc-display').textContent = formatNumber(gameState.loc);
  document.getElementById('lps-display').textContent = formatNumber(getLocPerSecond()) + '/s';

  const compileBtn = document.querySelector('.compile-btn');
  if (compileBtn) {
    if (gameState.loc > 0) {
      compileBtn.textContent = `Compile`;
      compileBtn.disabled = false;
      compileBtn.classList.remove('btn-disabled');
    } else {
      compileBtn.textContent = 'Compile';
      compileBtn.disabled = true;
      compileBtn.classList.add('btn-disabled');
    }
  }
}

function showFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.getElementById('screen-editor').appendChild(el);
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
  const sfxState = gameState.settings?.sfx !== false;
  showModal('Settings', '', [
    { text: `SFX: ${sfxState ? 'ON' : 'OFF'}`, onClick: () => {
      if (!gameState.settings) gameState.settings = {};
      gameState.settings.sfx = !sfxState;
      saveGame();
      showSettings();
    }},
    { text: `Achievements (${getAchievementProgress().unlocked}/${getAchievementProgress().total})`, onClick: () => {
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').textContent = 'Achievements';
      document.getElementById('modal-message').innerHTML = renderAchievementList();
      const btnContainer = document.getElementById('modal-buttons');
      btnContainer.innerHTML = '';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-primary';
      closeBtn.textContent = 'Close';
      closeBtn.onclick = () => overlay.classList.remove('active');
      btnContainer.appendChild(closeBtn);
      overlay.classList.add('active');
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
    { text: 'Shortcuts: Space=Type, Enter=Compile' },
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

const CURRENCY_INFO = {
  compute: { name: 'Compute', earn: 'Earned by compiling your code', spend: 'Spend on upgrades and GPU expansion' },
  papers:  { name: 'Papers',  earn: 'Earned from career advances and achievements', spend: 'Spend on Research to discover new AI models' },
  tokens:  { name: 'Tokens',  earn: 'Recharges 1 every 10 min (max 10)', spend: 'Spend on coding challenges for rewards' },
};

function showCurrencyTooltip(el, type) {
  dismissCurrencyTooltip();
  const info = CURRENCY_INFO[type];
  if (!info) return;

  const tooltip = document.createElement('div');
  tooltip.className = 'currency-tooltip ' + type;
  tooltip.innerHTML = '<div class="tooltip-title">' + info.name + '</div>'
    + '<div class="tooltip-body">'
    + '<div>' + info.earn + '</div>'
    + '<div>' + info.spend + '</div>'
    + '</div>';
  document.body.appendChild(tooltip);

  const rect = el.getBoundingClientRect();
  tooltip.style.top = (rect.bottom + 6) + 'px';
  tooltip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 200)) + 'px';

  setTimeout(dismissCurrencyTooltip, 3000);
  setTimeout(() => {
    document.addEventListener('click', dismissCurrencyTooltip, { once: true, capture: true });
  }, 50);
}

function dismissCurrencyTooltip() {
  const existing = document.querySelector('.currency-tooltip');
  if (existing) existing.remove();
}

function initUI() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });

  document.querySelectorAll('.currency').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = function(e) {
      e.stopPropagation();
      const type = this.classList.contains('compute') ? 'compute'
                 : this.classList.contains('papers') ? 'papers' : 'tokens';
      showCurrencyTooltip(this, type);
    };
  });

  currentScreen = 'editor';
}
