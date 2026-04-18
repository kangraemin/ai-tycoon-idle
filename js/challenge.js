// challenge.js - Skill challenge system (5 types, graded rewards)

const CHALLENGE_TYPES = {
  promptWriting: { name: 'Prompt Writing', time: 30, icon: 'edit_note' },
  bugFix:        { name: 'Bug Fix',        time: 45, icon: 'bug_report' },
  codeComplete:  { name: 'Code Complete',  time: 30, icon: 'code' },
  naming:        { name: 'Naming',         time: 20, icon: 'label' },
  speedTyping:   { name: 'Speed Typing',   time: 15, icon: 'keyboard' },
};

const GRADE_THRESHOLDS = [
  { grade: 'S', min: 90, multiplier: 3 },
  { grade: 'A', min: 70, multiplier: 2 },
  { grade: 'B', min: 50, multiplier: 1.5 },
  { grade: 'C', min: 30, multiplier: 1 },
  { grade: 'F', min: 0,  multiplier: 0.5 },
];

const CHALLENGE_PROBLEMS = {
  promptWriting: [
    { prompt: 'Write a prompt to make an AI summarize a long article', keywords: ['summarize', 'article', 'key points', 'concise'] },
    { prompt: 'Write a prompt for generating Python unit tests', keywords: ['test', 'function', 'assert', 'edge case'] },
    { prompt: 'Write a prompt to translate code from Python to JavaScript', keywords: ['translate', 'python', 'javascript', 'convert'] },
    { prompt: 'Write a prompt for an AI code review assistant', keywords: ['review', 'code', 'bugs', 'improvements'] },
    { prompt: 'Write a prompt to generate API documentation', keywords: ['api', 'documentation', 'endpoints', 'parameters'] },
  ],
  bugFix: [
    { code: 'for (let i = 0; i <= arr.length; i++)', answer: 'i < arr.length', hint: 'Off-by-one error' },
    { code: 'if (x = 5) { doSomething(); }', answer: 'x === 5', hint: 'Assignment vs comparison' },
    { code: 'const result = arr.filter(x => x > 0).length === 0', answer: '.length > 0', hint: 'Wrong comparison' },
    { code: 'setTimeout(doTask(), 1000)', answer: 'setTimeout(doTask, 1000)', hint: 'Immediate invocation' },
    { code: 'JSON.parse(undefined)', answer: 'check for undefined first', hint: 'Missing null check' },
  ],
  codeComplete: [
    { code: 'const doubled = arr.___(x => x * 2)', answer: 'map', hint: 'Array transformation' },
    { code: 'const sum = arr.___(( a, b) => a + b, 0)', answer: 'reduce', hint: 'Array aggregation' },
    { code: 'const found = arr.___(x => x.id === targetId)', answer: 'find', hint: 'Find element' },
    { code: 'const valid = arr.___(x => x > 0)', answer: 'every', hint: 'All elements check' },
    { code: 'const flat = nested.___()', answer: 'flat', hint: 'Flatten array' },
  ],
  naming: [
    { desc: 'A function that checks if a user is authenticated', answer: 'isAuthenticated', convention: 'boolean prefix' },
    { desc: 'A variable storing the total number of items', answer: 'totalItems', convention: 'descriptive noun' },
    { desc: 'A function that converts celsius to fahrenheit', answer: 'toFahrenheit', convention: 'conversion prefix' },
    { desc: 'A constant for maximum retry attempts', answer: 'MAX_RETRIES', convention: 'UPPER_SNAKE_CASE' },
    { desc: 'A function that fetches user data from API', answer: 'fetchUserData', convention: 'verb + noun' },
  ],
  speedTyping: [
    { text: 'const data = await fetch(url)' },
    { text: 'function handleClick(event) {' },
    { text: 'export default class App {' },
    { text: 'if (err) throw new Error(msg)' },
    { text: 'return arr.filter(Boolean)' },
  ],
};

let activeChallenge = null;
let challengeTimerId = null;
let lastChallengeCompleteTime = 0;
const CHALLENGE_COOLDOWN = 30000;

const DAILY_FREE_CHALLENGES = 5;

function hasFreeChallenge() {
  const now = new Date();
  const last = new Date(gameState.lastFreeChallengeReset || 0);
  if (now.toDateString() !== last.toDateString()) {
    gameState.freeChallengesUsed = 0;
    gameState.lastFreeChallengeReset = now.getTime();
  }
  return gameState.freeChallengesUsed < DAILY_FREE_CHALLENGES;
}

function canStartChallenge() {
  if (Date.now() - lastChallengeCompleteTime < CHALLENGE_COOLDOWN) return false;
  return (gameState.tokens > 0 || hasFreeChallenge()) && !activeChallenge;
}

function getChallengeCooldown() {
  const remaining = CHALLENGE_COOLDOWN - (Date.now() - lastChallengeCompleteTime);
  return remaining > 0 ? remaining : 0;
}

function startChallenge(type) {
  if (!canStartChallenge()) return;

  const isFree = hasFreeChallenge();
  if (isFree) {
    gameState.freeChallengesUsed++;
  } else {
    gameState.tokens--;
  }
  const typeDef = CHALLENGE_TYPES[type];
  const problems = CHALLENGE_PROBLEMS[type];
  const problem = problems[Math.floor(Math.random() * problems.length)];

  activeChallenge = {
    type,
    problem,
    startTime: Date.now(),
    timeLimit: typeDef.time,
    answered: false,
  };

  Analytics.challengeStart(type, !isFree, gameState.tokens);

  renderChallengeOverlay(type, problem, typeDef.time);
  startChallengeTimer(typeDef.time);
}

async function tryStartChallengeWithAd(type) {
  // 쿨다운 중이면 무시
  if (typeof getChallengeCooldown === 'function' && getChallengeCooldown() > 0) return;
  // 무료 or 토큰 있으면 바로 시작
  if (hasFreeChallenge() || gameState.tokens > 0) {
    startChallenge(type);
    return;
  }
  // 광고 없으면 토스트
  if (!window.AdMobManager?.ready) {
    if (typeof showToast === 'function') showToast('No tokens! Keep playing to earn more.', 'info');
    return;
  }
  // 광고 제안
  if (typeof showModal === 'function') {
    showModal('No Tokens', 'Watch a short ad to get 1 free challenge attempt!', [
      { text: 'Cancel' },
      { text: '🎬 Watch Ad', primary: true, onClick: async () => {
        const success = await window.AdMobManager.showRewarded('challenge_extra');
        if (success) {
          gameState.freeChallengesUsed = Math.max(0, gameState.freeChallengesUsed - 1);
          startChallenge(type);
        } else {
          if (typeof showToast === 'function') showToast('Ad not available', 'info');
        }
      }}
    ]);
  }
}

function startChallengeTimer(seconds) {
  if (challengeTimerId) clearInterval(challengeTimerId);
  let remaining = seconds;
  const timerEl = document.getElementById('challenge-timer');

  challengeTimerId = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = remaining + 's';
    if (remaining <= 0) {
      clearInterval(challengeTimerId);
      submitChallenge('');
    }
  }, 1000);
}

function renderChallengeOverlay(type, problem, time) {
  const overlay = document.getElementById('challenge-overlay');
  if (!overlay) return;

  const titleEl = document.getElementById('challenge-title');
  const timerEl = document.getElementById('challenge-timer');
  const bodyEl = document.getElementById('challenge-body');
  const resultEl = document.getElementById('challenge-result');

  titleEl.textContent = CHALLENGE_TYPES[type].name;
  timerEl.textContent = time + 's';
  resultEl.style.display = 'none';

  // Planning hints
  const planningLevel = typeof getUpgradeEffect === 'function' ? getUpgradeEffect('agent', 'planning') : 0;

  let bodyHtml = '';
  switch (type) {
    case 'promptWriting':
      bodyHtml = `<p style="color:var(--text-secondary);margin-bottom:12px">${problem.prompt}</p>`;
      if (planningLevel > 0) {
        const hints = problem.keywords.slice(0, planningLevel);
        bodyHtml += `<p style="color:var(--accent);font-size:11px;margin-bottom:8px">Hints: ${hints.join(', ')}</p>`;
      }
      bodyHtml += `<textarea id="challenge-input" style="width:100%;height:100px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;padding:8px;font-family:var(--font-code);font-size:13px;resize:none" placeholder="Write your prompt..."></textarea>`;
      break;
    case 'bugFix':
      bodyHtml = `<pre style="background:var(--bg-elevated);padding:12px;border-radius:8px;color:var(--coral);font-family:var(--font-code);font-size:13px;margin-bottom:8px">${problem.code}</pre>`;
      if (planningLevel > 0) bodyHtml += `<p style="color:var(--accent);font-size:11px;margin-bottom:8px">Hint: ${problem.hint}</p>`;
      bodyHtml += `<input id="challenge-input" type="text" style="width:100%;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;padding:8px;font-family:var(--font-code);font-size:13px" placeholder="Fix the bug...">`;
      break;
    case 'codeComplete':
      bodyHtml = `<pre style="background:var(--bg-elevated);padding:12px;border-radius:8px;color:var(--text-primary);font-family:var(--font-code);font-size:13px;margin-bottom:8px">${problem.code}</pre>`;
      if (planningLevel > 0) bodyHtml += `<p style="color:var(--accent);font-size:11px;margin-bottom:8px">Hint: ${problem.hint}</p>`;
      bodyHtml += `<input id="challenge-input" type="text" style="width:100%;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;padding:8px;font-family:var(--font-code);font-size:13px" placeholder="Fill in the blank...">`;
      break;
    case 'naming':
      bodyHtml = `<p style="color:var(--text-secondary);margin-bottom:12px">${problem.desc}</p>`;
      if (planningLevel > 0) bodyHtml += `<p style="color:var(--accent);font-size:11px;margin-bottom:8px">Convention: ${problem.convention}</p>`;
      bodyHtml += `<input id="challenge-input" type="text" style="width:100%;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;padding:8px;font-family:var(--font-code);font-size:13px" placeholder="Name it...">`;
      break;
    case 'speedTyping':
      bodyHtml = `<pre style="background:var(--bg-elevated);padding:12px;border-radius:8px;color:var(--accent);font-family:var(--font-code);font-size:13px;margin-bottom:8px">${problem.text}</pre>`;
      bodyHtml += `<input id="challenge-input" type="text" style="width:100%;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-light);border-radius:8px;padding:8px;font-family:var(--font-code);font-size:13px" placeholder="Type the code above..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`;
      break;
  }
  bodyHtml += `<button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="submitChallenge()">Submit</button>`;

  bodyEl.innerHTML = bodyHtml;
  overlay.style.display = 'flex';

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('challenge-input');
    if (input) input.focus();
  }, 100);
}

function scoreAnswer(type, answer) {
  if (!activeChallenge) return 0;
  const problem = activeChallenge.problem;
  const timeTaken = (Date.now() - activeChallenge.startTime) / 1000;
  const timeLimit = activeChallenge.timeLimit;

  let score = 0;
  switch (type) {
    case 'promptWriting': {
      const words = answer.trim().split(/\s+/).length;
      const lengthScore = Math.min(30, words * 2);
      let keywordScore = 0;
      for (const kw of problem.keywords) {
        if (answer.toLowerCase().includes(kw.toLowerCase())) keywordScore += 15;
      }
      keywordScore = Math.min(60, keywordScore);
      const timeBonus = Math.max(0, 10 * (1 - timeTaken / timeLimit));
      score = lengthScore + keywordScore + timeBonus;
      break;
    }
    case 'bugFix': {
      const similarity = answer.toLowerCase().trim() === problem.answer.toLowerCase().trim() ? 80 :
                         answer.toLowerCase().includes(problem.answer.toLowerCase().split(' ')[0]) ? 40 : 0;
      const timeBonus = Math.max(0, 20 * (1 - timeTaken / timeLimit));
      score = similarity + timeBonus;
      break;
    }
    case 'codeComplete': {
      const correct = answer.trim().toLowerCase() === problem.answer.toLowerCase();
      const partial = answer.trim().toLowerCase().includes(problem.answer.toLowerCase().substring(0, 3));
      score = correct ? 90 : partial ? 40 : 0;
      const timeBonus = Math.max(0, 10 * (1 - timeTaken / timeLimit));
      score += timeBonus;
      break;
    }
    case 'naming': {
      const exact = answer.trim() === problem.answer;
      const close = answer.trim().toLowerCase() === problem.answer.toLowerCase();
      score = exact ? 95 : close ? 70 : 0;
      if (!exact && !close && answer.length > 3) score = 20;
      const timeBonus = Math.max(0, 5 * (1 - timeTaken / timeLimit));
      score += timeBonus;
      break;
    }
    case 'speedTyping': {
      const target = problem.text;
      let correct = 0;
      for (let i = 0; i < Math.min(answer.length, target.length); i++) {
        if (answer[i] === target[i]) correct++;
      }
      const accuracy = target.length > 0 ? correct / target.length : 0;
      const speedBonus = Math.max(0, 20 * (1 - timeTaken / timeLimit));
      score = accuracy * 80 + speedBonus;
      break;
    }
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getGrade(score) {
  for (const g of GRADE_THRESHOLDS) {
    if (score >= g.min) return g;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

function submitChallenge(forcedAnswer) {
  if (!activeChallenge || activeChallenge.answered) return;
  activeChallenge.answered = true;
  clearInterval(challengeTimerId);

  const input = document.getElementById('challenge-input');
  const answer = forcedAnswer !== undefined ? forcedAnswer : (input ? input.value : '');
  const score = scoreAnswer(activeChallenge.type, answer);
  const gradeInfo = getGrade(score);

  // Calculate rewards
  const rlhfBonus = typeof getUpgradeEffect === 'function' ? 1 + getUpgradeEffect('skill', 'rlhf') : 1;
  const prestige = gameState.prestigeMultiplier || 1;
  const locReward = Math.floor(100 * gradeInfo.multiplier * rlhfBonus * prestige);
  const computeReward = Math.floor(50 * gradeInfo.multiplier * rlhfBonus * prestige);
  const repReward = Math.floor(100 * gradeInfo.multiplier * prestige);
  const paperReward = gradeInfo.grade === 'S' ? 3 : gradeInfo.grade === 'A' ? 1 : 0;

  // Apply rewards
  gameState.loc += locReward;
  gameState.totalLoc += locReward;
  gameState.compute += computeReward;
  gameState.reputation += repReward;
  if (paperReward > 0) gameState.papers += paperReward;

  // Update stats
  gameState.challengeStats.played++;
  Analytics.challengeComplete(activeChallenge.type, gradeInfo.grade, score);
  if (!gameState.challengeStats.bestGrade ||
      GRADE_THRESHOLDS.findIndex(g => g.grade === gradeInfo.grade) <
      GRADE_THRESHOLDS.findIndex(g => g.grade === gameState.challengeStats.bestGrade)) {
    gameState.challengeStats.bestGrade = gradeInfo.grade;
  }

  // Show result
  const resultEl = document.getElementById('challenge-result');
  const bodyEl = document.getElementById('challenge-body');
  if (bodyEl) bodyEl.style.display = 'none';
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="challenge-grade">
        <div class="challenge-grade-letter grade-${gradeInfo.grade}">${gradeInfo.grade}</div>
        <div style="color:var(--text-secondary);font-size:14px;margin:8px 0">Score: ${score}/100</div>
        <div style="color:var(--loc);font-size:13px">+${locReward} Code</div>
        <div style="color:var(--compute);font-size:13px">+${computeReward} Compute</div>
        <div style="color:var(--reputation);font-size:13px">+${repReward} Rep</div>
        ${paperReward > 0 ? `<div style="color:var(--papers);font-size:13px">+${paperReward} Papers</div>` : ''}
        <button class="btn btn-primary" style="width:100%;margin-top:16px" onclick="closeChallengeOverlay()">Close</button>
      </div>
    `;
  }

  if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
}

function closeChallengeOverlay() {
  if (challengeTimerId) { clearInterval(challengeTimerId); challengeTimerId = null; }
  const overlay = document.getElementById('challenge-overlay');
  if (overlay) overlay.style.display = 'none';
  lastChallengeCompleteTime = Date.now();
  activeChallenge = null;
  const bodyEl = document.getElementById('challenge-body');
  if (bodyEl) bodyEl.style.display = 'block';
  if (typeof renderEditorScreen === 'function') renderEditorScreen();
}
