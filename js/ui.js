// ui.js - DOM rendering + UI updates

let currentScreen = 'editor';

function switchScreen(screen) {
  // 제거된 탭 → Models 서브탭으로 리다이렉트
  if (screen === 'research') { switchScreen('models'); switchModelsSubTab('research'); return; }
  if (screen === 'fusion') { switchScreen('models'); switchModelsSubTab('fusion'); return; }
  if (screen === 'achievements') { switchScreen('career'); switchCareerSubTab('career-awards'); return; }

  if (currentScreen === screen) return;
  const btn = document.querySelector(`[data-screen="${screen}"]`);
  if (btn && btn.classList.contains('nav-locked')) {
    const unlockCond = btn.dataset.unlock;
    let msg = 'Keep playing to unlock this!';
    if (unlockCond === 'career') {
      msg = 'Earn 5,000 Rep to unlock Career (you have ' + formatNumber(gameState.reputation) + ')';
    }
    Analytics.lockedTabClick('career', gameState.reputation);
    if (typeof showToast === 'function') showToast(msg, 'info');
    return;
  }
  if (typeof SFX !== 'undefined' && SFX.navigate) SFX.navigate();
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'navigate' && screen === 'upgrade') advanceTutorial();

  const oldScreen = document.getElementById('screen-' + currentScreen);
  const newScreen = document.getElementById('screen-' + screen);
  currentScreen = screen;
  Analytics.screenView(screen);

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

let currentModelsSubTab = 'models-grid';
function switchModelsSubTab(subTab) {
  const btn = document.querySelector(`[data-subtab="${subTab}"]`);
  if (btn && btn.classList.contains('sub-tab-locked')) {
    const unlockCond = btn.dataset.subUnlock;
    let msg = 'Keep playing to unlock this!';
    if (unlockCond === 'papers') {
      msg = 'Collect 10 Papers to unlock Research (you have ' + formatNumber(gameState.papers) + ')';
    } else if (unlockCond === 'fusion') {
      msg = 'Own 2+ models to unlock Fusion (you have ' + getOwnedModels().length + ')';
    }
    Analytics.lockedTabClick(subTab, 0);
    showToast(msg, 'info');
    return;
  }
  if (typeof SFX !== 'undefined' && SFX.navigate) SFX.navigate();
  currentModelsSubTab = subTab;
  Analytics.screenView('models/' + subTab);
  document.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.sub-panel').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('sub-' + subTab);
  if (panel) panel.classList.add('active');
}

let currentCareerSubTab = 'career-main';
function switchCareerSubTab(subTab) {
  if (typeof SFX !== 'undefined' && SFX.navigate) SFX.navigate();
  currentCareerSubTab = subTab;
  document.querySelectorAll('#career-sub-tabs .sub-tab').forEach(el => el.classList.remove('active'));
  const btn = document.querySelector('#career-sub-tabs [data-subtab="' + subTab + '"]');
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.models-sub-content .sub-panel').forEach(el => {
    if (el.id.startsWith('sub-career')) el.classList.remove('active');
  });
  const panel = document.getElementById('sub-' + subTab);
  if (panel) panel.classList.add('active');
  if (subTab === 'career-awards' && typeof renderCareerAwardsPanel === 'function') renderCareerAwardsPanel();
}

function updateCurrencyDisplay() {
  document.getElementById('compute-display').textContent = formatNumber(gameState.compute);
  document.getElementById('papers-display').textContent = formatNumber(gameState.papers);
  if (gameState.tokens >= 10) {
    document.getElementById('tokens-display').textContent = formatNumber(gameState.tokens);
  }
  document.getElementById('loc-display').textContent = formatNumber(gameState.loc);
  document.getElementById('lps-display').textContent = formatNumber(getLocPerSecond()) + '/s';

  const compileBtn = document.querySelector('.compile-btn-mini');
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

const MAX_FLOATING = 5;

function showFloatingText(x, y, text) {
  const container = document.getElementById('screen-editor');
  if (!container) return;

  const existing = container.querySelectorAll('.floating-text');
  if (existing.length >= MAX_FLOATING) {
    existing[0].remove();
  }

  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  container.appendChild(el);
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

function showModalHtml(title, htmlContent, buttons) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').innerHTML = htmlContent;

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
  const sfxVol = Math.round((gameState.settings?.sfxVolume ?? 0.3) * 100);
  const musicVol = Math.round((gameState.settings?.musicVolume ?? 0.3) * 100);

  const html = `
    <div class="settings-panel">
      <div class="settings-row">
        <span>SFX</span>
        <div class="settings-controls">
          <input type="range" min="0" max="100" value="${sfxVol}" class="settings-slider" id="sfx-volume-slider"
            oninput="settingsUpdateSfxVolume(this.value)" ${sfxState ? '' : 'disabled'}>
          <button class="btn btn-small ${sfxState ? 'btn-primary' : 'btn-secondary'}" onclick="settingsToggleSfx()">${sfxState ? 'ON' : 'OFF'}</button>
        </div>
      </div>
      <div class="settings-row">
        <span>Music</span>
        <div class="settings-controls">
          <input type="range" min="0" max="100" value="${musicVol}" class="settings-slider" id="music-volume-slider"
            oninput="settingsUpdateMusicVolume(this.value)" ${musicState ? '' : 'disabled'}>
          <button class="btn btn-small ${musicState ? 'btn-primary' : 'btn-secondary'}" onclick="settingsToggleMusic()">${musicState ? 'ON' : 'OFF'}</button>
        </div>
      </div>
      <div class="settings-divider"></div>
      <div class="settings-row">
        <span>Save Data</span>
        <div class="settings-controls">
          <button class="btn btn-small btn-secondary" onclick="settingsExportSave()">Export</button>
          <button class="btn btn-small btn-secondary" onclick="settingsImportSave()">Import</button>
        </div>
      </div>
      <div class="settings-divider"></div>
      <div class="settings-info">Enter = Compile &nbsp;|&nbsp; Ctrl+Shift+D = Dev Tools</div>
    </div>
  `;

  showModalHtml('Settings', html, [
    { text: 'Achievements', onClick: () => { switchScreen('career'); switchCareerSubTab('career-awards'); } },
    { text: 'Reset Data', onClick: () => {
      showModal('Reset Data', 'Are you sure? All progress will be lost!', [
        { text: 'Cancel' },
        { text: 'Reset', primary: true, onClick: async () => {
          await Storage.remove(SAVE_KEY);
          location.reload();
        }},
      ]);
    }},
    { text: 'Close', primary: true },
  ]);
}

function settingsToggleSfx() {
  if (!gameState.settings) gameState.settings = {};
  gameState.settings.sfx = gameState.settings.sfx === false ? true : false;
  saveGame();
  showSettings();
}

function settingsToggleMusic() {
  if (typeof BGM !== 'undefined') BGM.toggle();
  saveGame();
  showSettings();
}

function settingsUpdateSfxVolume(val) {
  if (!gameState.settings) gameState.settings = {};
  gameState.settings.sfxVolume = val / 100;
  if (typeof SFX !== 'undefined' && SFX._setVolume) SFX._setVolume(val / 100);
}

function settingsUpdateMusicVolume(val) {
  if (!gameState.settings) gameState.settings = {};
  gameState.settings.musicVolume = val / 100;
  if (typeof BGM !== 'undefined' && BGM.setVolume) BGM.setVolume(val / 100);
  saveGame();
}

function settingsExportSave() {
  if (typeof debugExportSave === 'function') {
    debugExportSave();
  } else {
    const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-tycoon-save.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Save exported!', 'success');
  }
}

function settingsImportSave() {
  if (typeof debugImportSave === 'function') {
    debugImportSave();
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await Storage.save(SAVE_KEY, parsed);
        location.reload();
      } catch (err) {
        showToast('Import failed!', 'error');
      }
    };
    input.click();
  }
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
  loc:     { name: 'Lines of Code', earn: 'Earned by typing or idle coding', spend: 'Compiled into Compute' },
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
  }, 200);
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
      <div style="font-size:11px;color:var(--text-secondary)">Code Written</div>
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
      const type = this.classList.contains('loc') ? 'loc'
                 : this.classList.contains('compute') ? 'compute'
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

  // 메인 네비 (Career만 남음)
  document.querySelectorAll('.nav-btn[data-unlock]').forEach(btn => {
    const cond = btn.dataset.unlock;
    let unlocked = false;
    if (cond === 'career' && gameState.reputation >= 5000) unlocked = true;
    if (unlocked && btn.classList.contains('nav-locked')) {
      btn.classList.remove('nav-locked');
      if (typeof showToast === 'function') showToast(`${btn.querySelector('.nav-label').textContent} unlocked!`, 'success');
    }
  });
  // Models 서브탭 언락
  document.querySelectorAll('.sub-tab[data-sub-unlock]').forEach(btn => {
    const cond = btn.dataset.subUnlock;
    let unlocked = false;
    if (cond === 'papers' && gameState.papers >= 10) unlocked = true;
    if (cond === 'fusion' && getOwnedModels().length >= 2) unlocked = true;
    if (unlocked && btn.classList.contains('sub-tab-locked')) {
      btn.classList.remove('sub-tab-locked');
      if (typeof showToast === 'function') showToast(`${btn.textContent.trim()} unlocked!`, 'success');
    }
  });
}

function showAchievementsModal() {
  const { unlocked, total } = getAchievementProgress();
  const html = renderAchievementList();
  showModalHtml(`Achievements (${unlocked}/${total})`, html, [{ text: 'Close', primary: true }]);
}
