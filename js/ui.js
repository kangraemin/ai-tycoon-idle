// ui.js - DOM rendering + UI updates

let currentScreen = 'editor';

function switchScreen(screen) {
  if (currentScreen === screen) return;
  const btn = document.querySelector(`[data-screen="${screen}"]`);
  if (btn && btn.classList.contains('nav-locked')) {
    if (typeof showToast === 'function') showToast('Complete earlier goals to unlock!', 'info');
    return;
  }
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
  const musicState = gameState.settings?.music === true;
  showModal('Settings', 'Shortcuts: Space = Type, Enter = Compile', [
    { text: `SFX: ${sfxState ? 'ON' : 'OFF'}`, onClick: () => {
      if (!gameState.settings) gameState.settings = {};
      gameState.settings.sfx = !sfxState;
      saveGame();
      showSettings();
    }},
    { text: `Music: ${musicState ? 'ON' : 'OFF'}`, onClick: () => {
      if (typeof BGM !== 'undefined') BGM.toggle();
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
  tokens:  { name: 'Tokens',  earn: 'Recharges 1 every 5 min (max 10) + 3 free challenges/day', spend: 'Spend on coding challenges for rewards' },
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

function showOfflineModal(earnings) {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const msgEl = document.getElementById('modal-message');
  const btnEl = document.getElementById('modal-buttons');
  titleEl.textContent = 'Welcome Back!';
  msgEl.innerHTML = `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">While you were away (${formatTime(earnings.elapsed)})</div>
      <div style="font-size:24px;font-weight:700;color:var(--loc)" id="offline-loc">0</div>
      <div style="font-size:11px;color:var(--text-secondary)">Lines of Code</div>
      ${earnings.compute > 0 ? `
        <div style="font-size:20px;font-weight:700;color:var(--compute);margin-top:8px" id="offline-compute">0</div>
        <div style="font-size:11px;color:var(--text-secondary)">Compute</div>
      ` : ''}
    </div>
  `;
  btnEl.innerHTML = '';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-primary';
  closeBtn.textContent = 'Collect';
  closeBtn.onclick = () => overlay.classList.remove('active');
  btnEl.appendChild(closeBtn);
  overlay.classList.add('active');

  // Count-up animation
  const duration = 1500;
  const start = performance.now();
  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const locEl = document.getElementById('offline-loc');
    if (locEl) locEl.textContent = formatNumber(Math.floor(earnings.loc * eased));
    const compEl = document.getElementById('offline-compute');
    if (compEl) compEl.textContent = formatNumber(Math.floor(earnings.compute * eased));
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function showCelebration(title, subtitle) {
  const el = document.createElement('div');
  el.className = 'celebration-overlay';
  el.innerHTML = `
    <div class="celebration-content">
      <span class="material-symbols-outlined" style="font-size:64px;color:var(--accent)">celebration</span>
      <div class="celebration-title">${title}</div>
      <div class="celebration-subtitle">${subtitle}</div>
    </div>
  `;
  document.body.appendChild(el);
  if (typeof SFX !== 'undefined' && SFX.celebrate) SFX.celebrate();
  setTimeout(() => {
    el.classList.add('celebration-exit');
    el.addEventListener('animationend', () => el.remove());
  }, 2500);
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

let lastTabUnlockCheck = 0;
function checkTabUnlock() {
  const now = Date.now();
  if (now - lastTabUnlockCheck < 2000) return;
  lastTabUnlockCheck = now;

  document.querySelectorAll('.nav-btn[data-unlock]').forEach(btn => {
    const cond = btn.dataset.unlock;
    let unlocked = false;
    if (cond === 'papers' && gameState.papers >= 10) unlocked = true;
    if (cond === 'fusion' && getOwnedModels().length >= 2) unlocked = true;
    if (cond === 'career' && gameState.reputation >= 5000) unlocked = true;

    if (unlocked && btn.classList.contains('nav-locked')) {
      btn.classList.remove('nav-locked');
      if (typeof showToast === 'function') showToast(`${btn.querySelector('.nav-label').textContent} unlocked!`, 'success');
    }
  });
}
