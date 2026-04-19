// tutorial.js - First-play onboarding (AI Tycoon, 10 steps)

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Welcome to AI Tycoon!',
    message: "You're an AI engineer. Write code, train models, and grow your startup into an AI empire!",
    btnText: "Let's Build!",
  },
  {
    id: 'tap-editor',
    type: 'spotlight',
    selector: '.editor-body',
    message: 'Tap the editor to write Lines of Code (LoC) — your raw material!',
    position: 'below',
    trigger: 'tap',
  },
  {
    id: 'got-loc',
    type: 'spotlight',
    selector: '.compile-btn-mini',
    message: 'Tap Compile to convert LoC into Compute — the currency for upgrades!',
    position: 'below',
    trigger: 'sell',
  },
  {
    id: 'models-passive',
    type: 'modal',
    title: 'Your AI Models Auto-Code!',
    message: 'Your Chatbot generates LoC automatically over time. Unlock more models for faster idle production!',
    btnText: 'Nice!',
  },
  {
    id: 'go-upgrade',
    type: 'spotlight',
    selector: '[data-screen="upgrade"]',
    message: 'Go to Upgrades to boost your efficiency!',
    position: 'above',
    trigger: 'navigate',
  },
  {
    id: 'buy-upgrade',
    type: 'spotlight',
    selector: '.upgrade-card:first-child .btn',
    message: 'Buy Batch Size — more LoC per tap!',
    position: 'below',
    trigger: 'buy',
  },
  {
    id: 'train-tab',
    type: 'spotlight',
    selector: '.editor-tab:last-child',
    message: 'Switch to train.js — compiling here earns Papers for Research!',
    position: 'below',
    trigger: 'tab',
  },
  {
    id: 'go-research',
    type: 'spotlight',
    selector: '[data-screen="models"]',
    message: 'Head to Models — use Papers to discover new AI!',
    position: 'above',
    trigger: 'navigate-models',
  },
  {
    id: 'do-research',
    type: 'spotlight',
    selector: '.research-pull-btn',
    message: 'Pull to discover a new AI model!',
    position: 'below',
    trigger: 'buy',
  },
  {
    id: 'complete',
    type: 'modal',
    title: "You're Ready!",
    message: 'Try Challenges in the editor for bonus Compute. Build Rep to unlock Career for a 2× production multiplier. Check the Mission Card anytime for guidance!',
    btnText: 'Start Building!',
  },
];

let tutorialActive = false;

function startTutorial() {
  if (gameState.tutorialStep >= TUTORIAL_STEPS.length) return;
  // Guard: returning player with real progress but tutorialStep stuck at 0
  if (gameState.tutorialStep === 0 && (
    (gameState.stats && gameState.stats.totalCompiles > 0) ||
    gameState.reputation > 0
  )) {
    gameState.tutorialStep = TUTORIAL_STEPS.length;
    if (typeof saveGame === 'function') saveGame();
    return;
  }
  tutorialActive = true;
  showTutorialStep(gameState.tutorialStep);
}

function showTutorialStep(step) {
  const overlay = document.getElementById('tutorial-overlay');
  const bubble = document.getElementById('tutorial-bubble');
  const spotlight = document.getElementById('tutorial-spotlight');
  if (!overlay || !bubble) return;

  if (step >= TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }

  const s = TUTORIAL_STEPS[step];

  // Return to editor screen so train.js tab is visible and selectable
  if (s.id === 'train-tab' && typeof switchScreen === 'function') {
    if (typeof currentScreen !== 'undefined' && currentScreen !== 'editor') {
      switchScreen('editor');
      setTimeout(() => showTutorialStep(step), 300);
      return;
    }
  }
  // Auto-open Research sub-tab for do-research step
  if (s.id === 'do-research' && typeof switchModelsSubTab === 'function') {
    setTimeout(() => switchModelsSubTab('research'), 100);
  }

  const progressPct = Math.round((step + 1) / TUTORIAL_STEPS.length * 100);
  const progressHTML = '<div class="tutorial-step-label">Step ' + (step + 1) + ' of ' + TUTORIAL_STEPS.length + '</div><div class="tutorial-progress"><div class="tutorial-progress-bar" style="width:' + progressPct + '%"></div></div>';

  if (s.type === 'modal') {
    overlay.classList.add('active');
    overlay.classList.remove('spotlight-mode');
    if (spotlight) spotlight.style.display = 'none';
    bubble.className = 'tutorial-bubble tutorial-modal-mode';
    bubble.innerHTML = progressHTML + '<div class="tutorial-modal-title">' + s.title + '</div><div class="tutorial-modal-msg">' + s.message + '</div><button class="btn btn-primary tutorial-next-btn" onclick="advanceTutorial()">' + s.btnText + '</button><button class="tutorial-skip" onclick="skipTutorial()">Skip Tutorial</button>';
  } else if (s.type === 'spotlight') {
    overlay.classList.add('active');
    overlay.classList.add('spotlight-mode');
    const target = document.querySelector(s.selector);
    if (!target) { advanceTutorial(); return; }

    const rect = target.getBoundingClientRect();
    const pad = 8;
    if (spotlight) {
      spotlight.style.display = 'block';
      spotlight.style.top = (rect.top - pad) + 'px';
      spotlight.style.left = (rect.left - pad) + 'px';
      spotlight.style.width = (rect.width + pad * 2) + 'px';
      spotlight.style.height = (rect.height + pad * 2) + 'px';
    }

    const isAbove = s.position === 'above';
    bubble.className = 'tutorial-bubble tutorial-spotlight-mode';
    if (isAbove) {
      bubble.style.top = 'auto';
      bubble.style.bottom = (window.innerHeight - rect.top + 16) + 'px';
    } else {
      bubble.style.top = (rect.bottom + 16) + 'px';
      bubble.style.bottom = 'auto';
    }
    bubble.style.left = '50%';
    bubble.style.transform = 'translateX(-50%)';
    const arrowUp = '<div class="tutorial-arrow-up"></div>';
    const arrowDown = '<div class="tutorial-arrow-down"></div>';
    bubble.innerHTML = (isAbove ? '' : arrowUp) + progressHTML + '<div class="tutorial-msg">' + s.message + '</div><button class="tutorial-skip" onclick="skipTutorial()">Skip</button>' + (isAbove ? arrowDown : '');

    target.style.position = 'relative';
    target.style.zIndex = '1001';
    target.dataset.tutorialTarget = 'true';
    liftAncestorStackingContexts(target);
  }
}

function liftAncestorStackingContexts(target) {
  let el = target.parentElement;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const zi = parseInt(style.zIndex);
    const pos = style.position;
    const isPositioned = pos === 'relative' || pos === 'absolute' || pos === 'fixed' || pos === 'sticky';
    const hasStackingTrigger = style.transform !== 'none' || style.filter !== 'none' ||
      parseFloat(style.opacity) < 1 || style.isolation === 'isolate';
    if ((isPositioned || hasStackingTrigger) && (isNaN(zi) || zi < 1000)) {
      el.dataset.tutorialZSave = el.style.zIndex;
      el.style.zIndex = '1002';
    }
    el = el.parentElement;
  }
}

function restoreAncestorStackingContexts() {
  document.querySelectorAll('[data-tutorial-z-save]').forEach(el => {
    el.style.zIndex = el.dataset.tutorialZSave;
    delete el.dataset.tutorialZSave;
  });
}

function advanceTutorial() {
  restoreAncestorStackingContexts();
  const prevTarget = document.querySelector('[data-tutorial-target]');
  if (prevTarget) {
    prevTarget.style.zIndex = '';
    delete prevTarget.dataset.tutorialTarget;
  }
  gameState.tutorialStep++;
  if (typeof saveGame === 'function') saveGame();
  if (gameState.tutorialStep >= TUTORIAL_STEPS.length) {
    endTutorial();
  } else {
    showTutorialStep(gameState.tutorialStep);
  }
}

function skipTutorial() {
  restoreAncestorStackingContexts();
  const prevTarget = document.querySelector('[data-tutorial-target]');
  if (prevTarget) {
    prevTarget.style.zIndex = '';
    delete prevTarget.dataset.tutorialTarget;
  }
  Analytics.tutorialStep(gameState.tutorialStep, 'skip');
  gameState.tutorialStep = TUTORIAL_STEPS.length;
  if (typeof saveGame === 'function') saveGame();
  endTutorial();
}

function endTutorial() {
  restoreAncestorStackingContexts();
  tutorialActive = false;
  Analytics.tutorialStep(gameState.tutorialStep, 'complete');
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.remove('active', 'spotlight-mode');
}

function isTutorialActive() {
  return tutorialActive;
}

function getTutorialTrigger() {
  if (!tutorialActive) return null;
  const step = TUTORIAL_STEPS[gameState.tutorialStep];
  return step ? step.trigger : null;
}
