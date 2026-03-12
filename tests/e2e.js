// e2e.js - AI Tycoon E2E test suite (24 test cases)

const output = document.getElementById('test-output');
const summaryEl = document.getElementById('summary');
let passed = 0, failed = 0;

function group(name) {
  const el = document.createElement('div');
  el.className = 'group';
  el.textContent = '\u25b8 ' + name;
  output.appendChild(el);
}

function assert(name, condition, detail) {
  const el = document.createElement('div');
  el.className = 'result ' + (condition ? 'pass' : 'fail');
  el.textContent = (condition ? '\u2705' : '\u274c') + ' ' + name + (detail ? ' \u2014 ' + detail : '');
  output.appendChild(el);
  if (condition) passed++; else failed++;
  if (!condition) console.error('FAIL:', name, detail);
}

function resetState() {
  gameState = createDefaultState();
  // Reset event state
  if (typeof activeEvent !== 'undefined') activeEvent = null;
  if (typeof activeBuffs !== 'undefined') activeBuffs = [];
  if (typeof eventFixTaps !== 'undefined') eventFixTaps = 0;
  if (typeof activeChallenge !== 'undefined') activeChallenge = null;
  if (typeof autoCompileTimer !== 'undefined') autoCompileTimer = 0;
}

// Disable SFX for tests
if (typeof SFX !== 'undefined') {
  for (const key of Object.keys(SFX)) {
    if (typeof SFX[key] === 'function') SFX[key] = () => {};
  }
}

// ========================
// TC-01: Initial state
// ========================
group('TC-01: Initial State');
resetState();
assert('All fields exist', gameState.loc !== undefined && gameState.compute !== undefined && gameState.papers !== undefined);
assert('10 models', gameState.models.length === 10);
assert('Model IDs match spec', gameState.models.map(m => m.id).join(',') === 'chatbot,translator,summarizer,imageGen,codeGen,voiceAI,reasoning,multimodal,agi,superAgi');
assert('Chatbot count=1', gameState.models[0].count === 1);
assert('Upgrades 4 categories', Object.keys(gameState.upgrades).length === 4);
assert('12 upgrade keys', Object.values(gameState.upgrades).reduce((a, c) => a + Object.keys(c).length, 0) === 12);
assert('Papers=10', gameState.papers === 10);
assert('Tokens=5', gameState.tokens === 5);
assert('SAVE_KEY=aiTycoon', SAVE_KEY === 'aiTycoon');

// ========================
// TC-02: Model LPS
// ========================
group('TC-02: Model LPS');
resetState();
const chatbot = getModelState('chatbot');
assert('Chatbot lv1 count1 LPS=1', getModelLps(chatbot) === 1);
chatbot.level = 2;
assert('Chatbot lv2 count1 LPS=2', getModelLps(chatbot) === 2);
chatbot.level = 1;
chatbot.count = 4;
assert('Chatbot lv1 count4 LPS=2', getModelLps(chatbot) === 2, 'sqrt(4)=2');
chatbot.count = 1;

// ========================
// TC-03: Tap -> LoC
// ========================
group('TC-03: Tap \u2192 LoC');
resetState();
const prevLoc = gameState.loc;
const prevRep = gameState.reputation;
tapEditor(null);
assert('LoC increased', gameState.loc > prevLoc);
assert('Tap power = (1+batchSize)*prestige', gameState.loc === 1, 'batchSize=0, prestige=1');
assert('Rep +1', gameState.reputation === prevRep + 1);
assert('totalTaps++', gameState.stats.totalTaps === 1);

// ========================
// TC-04: Compile -> Compute
// ========================
group('TC-04: Compile \u2192 Compute');
resetState();
gameState.loc = 100;
compileData();
assert('Compute=100 (rag=0)', gameState.compute === 100);
assert('LoC=0 after compile', gameState.loc === 0);
assert('totalCompiles++', gameState.stats.totalCompiles === 1);
assert('Rep +10', gameState.reputation === 10);

resetState();
gameState.loc = 100;
gameState.upgrades.skill.rag = 2;
compileData();
assert('Compute=130 (rag=2)', gameState.compute === 130, '100*(1+2*0.15)=130');

// ========================
// TC-05: Auto-compile
// ========================
group('TC-05: Auto-compile');
resetState();
gameState.loc = 1000;
autoCompileTick(1);
assert('autoPipeline=0 \u2192 no change', gameState.compute === 0);

gameState.upgrades.infra.autoPipeline = 1;
autoCompileTimer = 100; // Force trigger
autoCompileTick(1);
assert('autoPipeline=1 \u2192 compute > 0', gameState.compute > 0);

// ========================
// TC-06: Upgrade purchase
// ========================
group('TC-06: Upgrade Purchase');
resetState();
gameState.compute = 10;
assert('Buy fails (not enough)', !buyUpgrade('agent', 'toolUse'));
gameState.compute = 10000;
const prevCompute = gameState.compute;
assert('Buy succeeds', buyUpgrade('agent', 'toolUse'));
assert('Level=1', gameState.upgrades.agent.toolUse === 1);
assert('Compute decreased', gameState.compute < prevCompute);
assert('getEffectiveGpuSlots', getEffectiveGpuSlots() === 1 + gameState.upgrades.teamAgent.multiAgent);

// ========================
// TC-07: Research
// ========================
group('TC-07: Research');
resetState();
gameState.papers = 10;
const resResult = pullResearch();
assert('Research result not null', resResult !== null);
if (resResult && !resResult.hallucination && !resResult.slotFull) {
  assert('Papers decreased', gameState.papers < 10);
  assert('gachaPulls++', gameState.stats.gachaPulls >= 1);
}

resetState();
gameState.papers = 5;
assert('Papers<10 \u2192 fail', pullResearch() === null);

// Probability test (100 pulls)
resetState();
gameState.papers = 10000;
const rarityCount = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
for (let i = 0; i < 100; i++) {
  gameState.papers = 100;
  const r = pullResearch();
  if (r && r.rarity && !r.hallucination) rarityCount[r.rarity]++;
}
assert('Common most frequent', rarityCount.common >= rarityCount.legendary, JSON.stringify(rarityCount));

// ========================
// TC-08: Token recharge
// ========================
group('TC-08: Token Recharge');
resetState();
gameState.tokens = 0;
gameState.lastTokenRecharge = Date.now() - 11 * 60 * 1000;
tokenTick();
assert('Token +1 after 10min', gameState.tokens >= 1);

resetState();
gameState.tokens = 10;
gameState.lastTokenRecharge = Date.now() - 11 * 60 * 1000;
tokenTick();
assert('Capped at 10', gameState.tokens === 10);

// ========================
// TC-09: Challenge flow
// ========================
group('TC-09: Challenge Flow');
resetState();
gameState.tokens = 0;
assert('canStartChallenge=false (no tokens)', !canStartChallenge());

gameState.tokens = 1;
assert('canStartChallenge=true', canStartChallenge());
startChallenge('speedTyping');
assert('Token consumed', gameState.tokens === 0);
assert('activeChallenge set', activeChallenge !== null);

// Score test
const score = scoreAnswer('speedTyping', activeChallenge.problem.text);
assert('Perfect score in range', score >= 0 && score <= 100);

const grade95 = getGrade(95);
assert('95 \u2192 S', grade95.grade === 'S');
const grade75 = getGrade(75);
assert('75 \u2192 A', grade75.grade === 'A');
const grade55 = getGrade(55);
assert('55 \u2192 B', grade55.grade === 'B');
const grade35 = getGrade(35);
assert('35 \u2192 C', grade35.grade === 'C');
const grade15 = getGrade(15);
assert('15 \u2192 F', grade15.grade === 'F');

// Submit and check rewards
submitChallenge(activeChallenge.problem.text);
assert('challengeStats.played++', gameState.challengeStats.played === 1);

// ========================
// TC-10: Fusion recipe matching
// ========================
group('TC-10: Fusion Recipe Matching');
const recipe1 = findRecipe('chatbot', 'translator');
assert('chatbot+translator \u2192 summarizer', recipe1 && recipe1.result === 'summarizer');
const recipe2 = findRecipe('translator', 'chatbot');
assert('Reverse order works', recipe2 && recipe2.result === 'summarizer');
assert('Same model \u2192 null', findRecipe('chatbot', 'chatbot') === null);

// ========================
// TC-11: Fusion execution
// ========================
group('TC-11: Fusion Execution');
resetState();
getModelState('chatbot').count = 1;
getModelState('translator').count = 1;
gameState.compute = 300;
const fusionRecipe = findRecipe('chatbot', 'translator');
assert('Can fuse', canFuse(fusionRecipe));
assert('doFusion succeeds', doFusion(fusionRecipe));
assert('Summarizer count+1', getModelState('summarizer').count === 1);
assert('Chatbot count=0', getModelState('chatbot').count === 0);
assert('Translator count=0', getModelState('translator').count === 0);
assert('Compute=0', gameState.compute === 0);
assert('Rep+500', gameState.reputation === 500);
assert('discoveredFusions has entry', gameState.discoveredFusions.length === 1);

// Delegation discount
resetState();
getModelState('chatbot').count = 1;
getModelState('translator').count = 1;
gameState.compute = 10000;
gameState.upgrades.teamAgent.delegation = 2;
const discountedCost = getFusionCost(fusionRecipe);
assert('Delegation discount', discountedCost === Math.floor(300 * (1 - 0.20)), 'cost=' + discountedCost);

// ========================
// TC-12: Same model fusion
// ========================
group('TC-12: Same Model Fusion');
resetState();
getModelState('chatbot').count = 2;
gameState.compute = 100000;
assert('doSameFusion succeeds', doSameFusion('chatbot'));
assert('Count=1', getModelState('chatbot').count === 1);
assert('Level=2', getModelState('chatbot').level === 2);

// ========================
// TC-13: Codex
// ========================
group('TC-13: Codex');
resetState();
assert('Initial: 0 discovered', gameState.discoveredFusions.length === 0);

// ========================
// TC-14: Event spawn
// ========================
group('TC-14: Event Spawn');
resetState();
gameState.lastEventTime = Date.now() - 600 * 1000; // 10 min ago
eventTick(0);
// Event may or may not have spawned (random), but no error
assert('eventTick runs without error', true);

// ========================
// TC-15: Positive event effects
// ========================
group('TC-15: Positive Event Effects');
resetState();
activeBuffs = [];
activeBuffs.push({ id: 'viral', target: 'loc', multiplier: 5, endTime: Date.now() + 30000 });
assert('getEventMultiplier loc=5', getEventMultiplier('loc') === 5);
assert('getEventMultiplier compile=1', getEventMultiplier('compile') === 1);

// ========================
// TC-16: Negative event + fix
// ========================
group('TC-16: Negative Event + Fix');
resetState();
activeEvent = { id: 'criticalBug', def: EVENT_DEFS.criticalBug, startTime: Date.now() };
eventFixTaps = 0;
assert('isHaltActive=true', isHaltActive());
for (let i = 0; i < 30; i++) tapFixEvent();
assert('Event resolved after 30 taps', activeEvent === null);

resetState();
activeEvent = { id: 'hallucination', def: EVENT_DEFS.hallucination, startTime: Date.now() };
assert('isStopAutoProd=true', isStopAutoProd());

// ========================
// TC-17: Buff expiry
// ========================
group('TC-17: Buff Expiry');
resetState();
activeBuffs = [{ id: 'test', target: 'loc', multiplier: 2, endTime: Date.now() - 1000 }];
cleanupExpiredBuffs();
assert('Expired buff removed', activeBuffs.length === 0);
assert('Default multiplier=1', getEventMultiplier('loc') === 1);

// ========================
// TC-18: Career promotion condition
// ========================
group('TC-18: Career Promotion');
resetState();
gameState.reputation = 49999;
assert('Rep<50K \u2192 cannot promote', !canPromote());
gameState.reputation = 50000;
assert('Rep=50K \u2192 can promote', canPromote());

// ========================
// TC-19: Career advance
// ========================
group('TC-19: Career Advance');
resetState();
gameState.reputation = 100000;
gameState.compute = 5000;
gameState.loc = 1000;
getModelState('translator').count = 1;
gameState.upgrades.agent.toolUse = 3;
const prevPapers = gameState.papers;
doCareerAdvance();
assert('Stage=1', gameState.careerStage === 1);
assert('LoC=0', gameState.loc === 0);
assert('Compute=0', gameState.compute === 0);
assert('Chatbot lv1 count1', getModelState('chatbot').level === 1 && getModelState('chatbot').count === 1);
assert('Translator count=0', getModelState('translator').count === 0);
assert('Upgrades reset', gameState.upgrades.agent.toolUse === 0);
assert('gpuSlots=1', gameState.gpuSlots === 1);
assert('Papers kept+bonus', gameState.papers >= prevPapers);
assert('Reputation kept', gameState.reputation === 100000);
assert('Multiplier=1.2', gameState.prestigeMultiplier === 1.2);

// ========================
// TC-20: Career stage names
// ========================
group('TC-20: Career Stage Names');
assert('Stage 5 = FAANG', CAREER_STAGES[5].name === 'FAANG');
assert('FAANG has variants', CAREER_STAGES[5].variants.length === 5);
assert('Stage 6 = AI Lab', CAREER_STAGES[6].name === 'AI Lab');
assert('AI Lab has variants', CAREER_STAGES[6].variants.length === 3);
assert('Stage 7 = Founder', CAREER_STAGES[7].name === 'Founder');

// ========================
// TC-21: Save/Load
// ========================
group('TC-21: Save/Load');
resetState();
gameState.loc = 42;
gameState.compute = 999;
gameState.reputation = 12345;
gameState.careerStage = 2;
saveGame();
const savedState = JSON.parse(JSON.stringify(gameState));
gameState = createDefaultState();
loadGame();
assert('LoC restored', gameState.loc === 42);
assert('Compute restored', gameState.compute === 999);
assert('Reputation restored', gameState.reputation === 12345);
assert('CareerStage restored', gameState.careerStage === 2);
assert('SAVE_KEY=aiTycoon', SAVE_KEY === 'aiTycoon');
// Clean up
localStorage.removeItem(SAVE_KEY);

// ========================
// TC-22: Full game flow
// ========================
group('TC-22: Full Game Flow');
resetState();
for (let i = 0; i < 10; i++) tapEditor(null);
assert('After 10 taps: loc\u226510', gameState.loc >= 10);
compileData();
assert('After compile: compute\u226510', gameState.compute >= 10);

// Buy batchSize
gameState.compute = 10000;
buyUpgrade('infra', 'batchSize');
const prevLocFlow = gameState.loc;
tapEditor(null);
assert('After batchSize: tap LoC > 1', gameState.loc - prevLocFlow > 1);

// Research
gameState.papers = 10;
const rr = pullResearch();
assert('Research works', rr !== null);

// Challenge
gameState.tokens = 1;
startChallenge('naming');
submitChallenge('isValid');
assert('Challenge completed', gameState.challengeStats.played >= 1);

// ========================
// TC-23: Achievement trigger
// ========================
group('TC-23: Achievements');
resetState();
gameState.stats.totalTaps = 10;
// Reset throttle so checkAchievements fires immediately
if (typeof lastAchievementCheck !== 'undefined') lastAchievementCheck = 0;
checkAchievements();
assert('tap_10 unlocked', gameState.achievements.tap_10 !== undefined);
assert('Papers rewarded', gameState.papers > 10);
// No duplicate
const papersBefore = gameState.papers;
lastAchievementCheck = 0;
checkAchievements();
assert('No duplicate trigger', gameState.papers === papersBefore);

// ========================
// TC-24: Offline earnings
// ========================
group('TC-24: Offline Earnings');
resetState();
getModelState('chatbot').count = 1;
gameState.lastSaveTime = Date.now() - 2 * 3600 * 1000; // 2h ago
const earnings = calculateOfflineEarnings();
assert('Offline earnings exist', earnings !== null);
assert('LoC > 0', earnings.loc > 0);
const expectedLoc = getLocPerSecond() * 7200 * 0.5;
assert('LoC = lps*7200*0.5', Math.abs(earnings.loc - expectedLoc) < 1, 'got=' + earnings.loc + ' expected=' + expectedLoc);

// Memory upgrade extends time
resetState();
getModelState('chatbot').count = 1;
gameState.upgrades.agent.memory = 2;
gameState.lastSaveTime = Date.now() - 2 * 3600 * 1000;
const earnings2 = calculateOfflineEarnings();
assert('Memory bonus works', earnings2 !== null && earnings2.loc > 0);

// ========================
// Summary
// ========================
summaryEl.className = failed === 0 ? 'pass' : 'fail';
summaryEl.textContent = 'Results: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed) + ' tests';
console.log('E2E Tests: ' + passed + ' passed, ' + failed + ' failed');
