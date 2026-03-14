// achievements.js - AI Tycoon achievement system (22 achievements)

const ACHIEVEMENT_DEFS = [
  // Tapping
  { id: 'tap_10',      name: 'Hello World',        desc: 'Write 10 lines of code',         icon: 'code',          papers: 2,  check: s => s.totalTaps >= 10 },
  { id: 'tap_100',     name: 'Script Kiddie',       desc: 'Write 100 lines of code',        icon: 'code',          papers: 5,  check: s => s.totalTaps >= 100 },
  { id: 'tap_1000',    name: 'Code Monkey',         desc: 'Write 1,000 lines of code',      icon: 'code',          papers: 10, check: s => s.totalTaps >= 1000 },
  { id: 'tap_10000',   name: '10x Developer',       desc: 'Write 10,000 lines of code',     icon: 'code',          papers: 20, check: s => s.totalTaps >= 10000 },

  // Compiling
  { id: 'compile_10',  name: 'First Build',         desc: 'Compile 10 times',               icon: 'build',         papers: 2,  check: s => s.totalCompiles >= 10 },
  { id: 'compile_100', name: 'Build Master',         desc: 'Compile 100 times',              icon: 'build',         papers: 10, check: s => s.totalCompiles >= 100 },

  // Models
  { id: 'models_3',    name: 'Model Zoo',           desc: 'Own 3 different models',          icon: 'smart_toy',     papers: 5,  check: s => s.modelsOwned >= 3 },
  { id: 'models_5',    name: 'AI Portfolio',        desc: 'Own 5 different models',          icon: 'smart_toy',     papers: 10, check: s => s.modelsOwned >= 5 },
  { id: 'models_10',   name: 'Full Stack AI',       desc: 'Own all 10 models',               icon: 'smart_toy',     papers: 20, check: s => s.modelsOwned >= 10 },

  // Research
  { id: 'research_5',  name: 'Lab Rat',             desc: 'Do 5 research pulls',             icon: 'science',       papers: 5,  check: s => s.gachaPulls >= 5 },
  { id: 'research_20', name: 'Research Director',   desc: 'Do 20 research pulls',            icon: 'science',       papers: 10, check: s => s.gachaPulls >= 20 },

  // Compute
  { id: 'compute_1k',  name: 'GPU Warm',            desc: 'Earn 1,000 total compute',        icon: 'memory',        papers: 5,  check: s => s.totalCompute >= 1000 },
  { id: 'compute_1m',  name: 'Datacenter',          desc: 'Earn 1,000,000 total compute',    icon: 'memory',        papers: 15, check: s => s.totalCompute >= 1000000 },

  // Career
  { id: 'career_1',    name: 'Promoted',            desc: 'Advance career once',             icon: 'work',          papers: 10, check: () => gameState.careerStage >= 1 },
  { id: 'career_3',    name: 'Career Climber',      desc: 'Reach career stage 3',            icon: 'work',          papers: 15, check: () => gameState.careerStage >= 3 },
  { id: 'career_7',    name: 'Founder',             desc: 'Reach the final career stage',    icon: 'rocket_launch', papers: 30, check: () => gameState.careerStage >= 7 },

  // Challenge
  { id: 'challenge_1', name: 'First Challenge',     desc: 'Complete a challenge',            icon: 'emoji_events',  papers: 3,  check: () => gameState.challengeStats.played >= 1 },
  { id: 'challenge_s', name: 'S-Rank',              desc: 'Get an S grade in a challenge',   icon: 'star',          papers: 15, check: () => gameState.challengeStats.bestGrade === 'S' },

  // Fusion
  { id: 'fusion_1',    name: 'First Fusion',        desc: 'Fuse two models',                 icon: 'merge',         papers: 5,  check: () => gameState.discoveredFusions.length >= 1 },
  { id: 'fusion_all',  name: 'Fusion Master',       desc: 'Discover all fusion recipes',     icon: 'merge',         papers: 20, check: () => gameState.discoveredFusions.length >= 7 },

  // Events
  { id: 'event_5',     name: 'Incident Responder',  desc: 'Respond to 5 events',             icon: 'notifications', papers: 5,  check: () => gameState.eventStats.responded >= 5 },
  { id: 'event_20',    name: 'On-Call Hero',         desc: 'Respond to 20 events',            icon: 'notifications', papers: 15, check: () => gameState.eventStats.responded >= 20 },
];

function getStats() {
  return gameState.stats || {};
}

function updateLiveStats() {
  if (!gameState.stats) return;
  gameState.stats.modelsOwned = typeof getOwnedModels === 'function' ? getOwnedModels().length : 0;
}

let lastAchievementCheck = 0;

function checkAchievements() {
  const now = Date.now();
  if (now - lastAchievementCheck < 1000) return;
  lastAchievementCheck = now;

  if (!gameState.achievements) gameState.achievements = {};
  if (!gameState.stats) return;

  updateLiveStats();
  const stats = gameState.stats;

  const MILESTONE_IDS = ['tap_10000', 'models_10', 'career_7', 'fusion_all', 'compute_1m'];

  for (const ach of ACHIEVEMENT_DEFS) {
    if (gameState.achievements[ach.id]) continue;
    try {
      if (ach.check(stats)) {
        gameState.achievements[ach.id] = Date.now();
        gameState.papers += ach.papers;
        if (MILESTONE_IDS.includes(ach.id)) {
          if (typeof SFX !== 'undefined' && SFX.celebrate) SFX.celebrate();
          if (typeof showCelebration === 'function') showCelebration(ach.name, ach.desc + ' — +' + ach.papers + ' Papers!');
        } else {
          if (typeof SFX !== 'undefined' && SFX.achievement) SFX.achievement();
          if (typeof showToast === 'function') showToast(ach.name + ' — +' + ach.papers + ' papers!', 'success');
        }
        if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
      }
    } catch (e) { /* ignore check errors */ }
  }
}

function getAchievementProgress() {
  const total = ACHIEVEMENT_DEFS.length;
  const unlocked = Object.keys(gameState.achievements || {}).length;
  return { total, unlocked };
}

function renderAchievementList() {
  let html = '<div style="text-align:left;max-height:300px;overflow-y:auto;margin:0 -8px">';
  for (const ach of ACHIEVEMENT_DEFS) {
    const done = gameState.achievements && gameState.achievements[ach.id];
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px;opacity:' + (done ? 1 : 0.5) + ';border-bottom:1px solid var(--border-light)">';
    html += '<span class="material-symbols-outlined" style="font-size:20px;color:' + (done ? 'var(--accent)' : 'var(--text-muted)') + '">' + ach.icon + '</span>';
    html += '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">' + ach.name + (done ? ' ✓' : '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-secondary)">' + ach.desc + '</div></div>';
    html += '<div style="font-size:12px;font-weight:700;color:var(--papers)">+' + ach.papers + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderCareerAwardsPanel() {
  const container = document.getElementById('career-awards-content');
  if (!container) return;
  const { unlocked, total } = getAchievementProgress();
  let html = '<div class="screen-desc">Track your AI journey milestones. Earn Papers for each achievement.</div>';
  html += '<div style="text-align:center;margin-bottom:12px;font-weight:700;color:var(--accent)">' + unlocked + '/' + total + ' Unlocked</div>';
  html += renderAchievementList();
  container.innerHTML = html;
}

function renderAchievementScreen() {
  const grid = document.getElementById('achievement-grid');
  if (!grid) return;
  const prog = document.getElementById('achievement-progress');
  if (prog) prog.textContent = `${getAchievementProgress().unlocked}/${getAchievementProgress().total}`;

  let html = '';
  for (const ach of ACHIEVEMENT_DEFS) {
    const done = gameState.achievements && gameState.achievements[ach.id];
    html += `<div class="achievement-card ${done ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">
        <span class="material-symbols-outlined">${ach.icon}</span>
      </div>
      <div class="achievement-info">
        <div class="achievement-name">${ach.name}${done ? ' ✓' : ''}</div>
        <div class="achievement-desc">${ach.desc}</div>
      </div>
      <div class="achievement-reward">+${ach.papers}</div>
    </div>`;
  }
  grid.innerHTML = html;
}
