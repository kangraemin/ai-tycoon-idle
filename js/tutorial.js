// tutorial.js - First-play onboarding (AI Tycoon, 6 steps)

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Welcome to AI Tycoon!',
    message: 'Build AI models, write code, and climb the career ladder! Let me show you how.',
    btnText: "Let's Go!",
  },
  {
    id: 'tap-editor',
    type: 'spotlight',
    selector: '.editor-body',
    message: 'Tap here to write code!',
    position: 'below',
    trigger: 'tap',
  },
  {
    id: 'compile',
    type: 'spotlight',
    selector: '.compile-btn',
    message: 'Compile your code into Compute!',
    position: 'below',
    trigger: 'sell',
  },
  {
    id: 'go-upgrade',
    type: 'spotlight',
    selector: '[data-screen="upgrade"]',
    message: 'Check out Upgrades!',
    position: 'above',
    trigger: 'navigate',
  },
  {
    id: 'buy-upgrade',
    type: 'spotlight',
    selector: '.upgrade-card:first-child .btn',
    message: 'Buy your first upgrade!',
    position: 'below',
    trigger: 'buy',
  },
  {
    id: 'complete',
    type: 'modal',
    title: "You're Ready!",
    message: 'Explore Research, Fusion, Challenges, and Career. Build your AI empire!',
    btnText: 'Start Playing!',
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
  gameState.tutorialStep = TUTORIAL_STEPS.length;
  if (typeof saveGame === 'function') saveGame();
  endTutorial();
}

function endTutorial() {
  tutorialActive = false;
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
