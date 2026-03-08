// tutorial.js - First-play onboarding tutorial (6 steps)

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Welcome to Slime Ranch!',
    message: 'Raise slimes, harvest jelly, and build your dream ranch! Let me show you how.',
    btnText: 'Let\'s Go!',
  },
  {
    id: 'tap-slime',
    type: 'spotlight',
    selector: '.slime-slot:first-child .slime',
    message: 'Tap your slime to produce jelly!',
    position: 'below',
    trigger: 'tap',
  },
  {
    id: 'sell-jelly',
    type: 'spotlight',
    selector: '.sell-btn',
    message: 'Sell jelly to earn gold!',
    position: 'below',
    trigger: 'sell',
  },
  {
    id: 'go-upgrade',
    type: 'spotlight',
    selector: '[data-screen="upgrade"]',
    message: 'Go to the Upgrade tab!',
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
    title: 'You\'re Ready!',
    message: 'Explore gacha, prestige, and more. Have fun ranching!',
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
    spotlight.style.display = 'none';
    bubble.className = 'tutorial-bubble tutorial-modal-mode';
    bubble.innerHTML = `
      <div class="tutorial-modal-title">${s.title}</div>
      <div class="tutorial-modal-msg">${s.message}</div>
      <button class="btn btn-primary tutorial-next-btn" onclick="advanceTutorial()">${s.btnText}</button>
      <button class="tutorial-skip" onclick="skipTutorial()">Skip Tutorial</button>
    `;
  } else if (s.type === 'spotlight') {
    overlay.classList.add('active');
    const target = document.querySelector(s.selector);
    if (!target) {
      advanceTutorial();
      return;
    }

    const rect = target.getBoundingClientRect();
    const pad = 8;
    spotlight.style.display = 'block';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.width = (rect.width + pad * 2) + 'px';
    spotlight.style.height = (rect.height + pad * 2) + 'px';

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
    bubble.innerHTML = `
      <div class="tutorial-msg">${s.message}</div>
      <button class="tutorial-skip" onclick="skipTutorial()">Skip</button>
    `;

    // Make target clickable above overlay
    target.style.position = 'relative';
    target.style.zIndex = '1001';
    target.dataset.tutorialTarget = 'true';
  }
}

function advanceTutorial() {
  // Clean up previous spotlight target
  const prevTarget = document.querySelector('[data-tutorial-target]');
  if (prevTarget) {
    prevTarget.style.zIndex = '';
    delete prevTarget.dataset.tutorialTarget;
  }

  gameState.tutorialStep++;
  saveGame();

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
  saveGame();
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
