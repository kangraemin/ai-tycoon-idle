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

  // Auto-open Research sub-tab for do-research step
  if (s.id === 'do-research' && typeof switchModelsSubTab === 'function') {
    setTimeout(() => switchModelsSubTab('research'), 100);
  }

  if (s.type === 'modal') {
    overlay.classList.add('active');
    if (spotlight) spotlight.style.display = 'none';
    bubble.className = 'tutorial-bubble tutorial-modal-mode';
    bubble.innerHTML = '<div class="tutorial-modal-title">' + s.title + '</div><div class="tutorial-modal-msg">' + s.message + '</div><button class="btn btn-primary tutorial-next-btn" onclick="advanceTutorial()">' + s.btnText + '</button><button class="tutorial-skip" onclick="skipTutorial()">Skip Tutorial</button>';
  } else if (s.type === 'spotlight') {
    overlay.classList.add('active');
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
    bubble.innerHTML = '<div class="tutorial-msg">' + s.message + '</div><button class="tutorial-skip" onclick="skipTutorial()">Skip</button>';

    target.style.position = 'relative';
    target.style.zIndex = '1001';
    target.dataset.tutorialTarget = 'true';
  }
}

function advanceTutorial() {
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
  tutorialActive = false;
  Analytics.tutorialStep(gameState.tutorialStep, 'complete');
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.remove('active');
}

function isTutorialActive() {
  return tutorialActive;
}

function getTutorialTrigger() {
  if (!tutorialActive) return null;
  const step = TUTORIAL_STEPS[gameState.tutorialStep];
  return step ? step.trigger : null;
}
