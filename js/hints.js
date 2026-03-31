// hints.js - Context-aware hint system (AI Tycoon)

const HINTS = [
  {
    id: 'write-code',
    check: () => gameState.totalLoc < 10,
    text: 'Tap the editor to write code!',
    screen: 'editor',
    icon: 'code',
  },
  {
    id: 'compile-code',
    check: () => gameState.loc >= 10 && gameState.compute < 10,
    text: 'Compile your code to earn Compute!',
    screen: null,
    icon: 'memory',
  },
  {
    id: 'buy-upgrade',
    check: () => {
      if (typeof UPGRADE_DEFS === 'undefined') return false;
      for (const cat of Object.keys(UPGRADE_DEFS)) {
        for (const id of Object.keys(UPGRADE_DEFS[cat])) {
          if (typeof getUpgradeCost === 'function' && gameState.compute >= getUpgradeCost(cat, id)) return true;
        }
      }
      return false;
    },
    text: 'You can afford an upgrade!',
    screen: 'upgrade',
    icon: 'trending_up',
  },
  {
    id: 'do-research',
    check: () => gameState.papers >= 10,
    text: 'Research new AI models!',
    screen: 'research',
    icon: 'science',
  },
  {
    id: 'try-challenge',
    check: () => gameState.tokens >= 1 && typeof canStartChallenge === 'function' && canStartChallenge(),
    text: 'Try a coding challenge!',
    screen: 'editor',
    icon: 'emoji_events',
  },
  {
    id: 'try-fusion',
    check: () => typeof getOwnedModels === 'function' && getOwnedModels().length >= 2,
    text: 'Try fusing two models!',
    screen: 'fusion',
    icon: 'merge',
  },
  {
    id: 'career-ready',
    check: () => typeof canPromote === 'function' && canPromote(),
    text: 'You can advance your career!',
    screen: 'career',
    icon: 'work',
  },
  {
    id: 'gpu-expand',
    check: () => {
      const owned = typeof getOwnedModels === 'function' ? getOwnedModels().length : 0;
      return owned >= gameState.gpuSlots && gameState.compute >= (typeof getGpuSlotCost === 'function' ? getGpuSlotCost() : Infinity);
    },
    text: 'GPU slots full — expand to fit more models!',
    screen: 'models',
    icon: 'developer_board',
  },
  {
    id: 'fix-event',
    check: () => typeof isHaltActive === 'function' && isHaltActive(),
    text: 'Production halted! Fix the event now!',
    screen: null,
    icon: 'warning',
  },
  {
    id: 'train-tab',
    check: () => gameState.editorTab !== 'train' && gameState.stats && gameState.stats.totalCompiles >= 2 && gameState.papers < 20,
    text: 'Switch to train.js tab to earn Papers!',
    screen: 'editor',
    icon: 'code',
  },
  {
    id: 'level-up-model',
    check: () => {
      if (typeof MODEL_DEFS === 'undefined' || typeof getOwnedModels !== 'function') return false;
      const owned = getOwnedModels();
      return owned.some(m => m.count >= 2);
    },
    text: 'Duplicate models? Fuse them to level up!',
    screen: 'fusion',
    icon: 'merge',
  },
  {
    id: 'explore-codex',
    check: () => gameState.discoveredFusions && gameState.discoveredFusions.length >= 1 && gameState.discoveredFusions.length < 7,
    text: 'Discover more fusion recipes in the Codex!',
    screen: 'fusion',
    icon: 'auto_stories',
  },
  {
    id: 'challenge-s-rank',
    check: () => gameState.challengeStats && gameState.challengeStats.played >= 3 && gameState.challengeStats.bestGrade !== 'S',
    text: 'Aim for an S-rank in challenges for bonus Papers!',
    screen: 'editor',
    icon: 'star',
  },
  {
    id: 'earn-compute',
    check: () => gameState.loc > 0 && gameState.compute < 100,
    text: 'Compile code to earn Compute for upgrades',
    screen: null,
    icon: 'memory',
  },
  {
    id: 'keep-coding',
    check: () => true,
    text: 'Keep coding to build your AI empire!',
    screen: 'editor',
    icon: 'code',
  },
];

let currentHint = null;

function updateHintBanner() {
  const banner = document.getElementById('hint-banner');
  if (!banner) return;

  // event-banner가 활성화되어 있으면 hint-banner 숨김 (배너 중첩 방지)
  const eventBanner = document.getElementById('event-banner');
  if (eventBanner && eventBanner.style.display !== 'none') {
    banner.style.display = 'none';
    return;
  }

  for (const hint of HINTS) {
    try {
      if (hint.check()) {
        if (currentHint !== hint.id) {
          currentHint = hint.id;
          banner.innerHTML = '<span class="material-symbols-outlined hint-icon">' + hint.icon + '</span><span class="hint-text">' + hint.text + '</span><span class="material-symbols-outlined hint-arrow">chevron_right</span>';
          banner.dataset.screen = hint.screen || '';
          banner.style.display = 'flex';
        }
        return;
      }
    } catch (e) { /* ignore */ }
  }

  banner.style.display = 'none';
  currentHint = null;
}
