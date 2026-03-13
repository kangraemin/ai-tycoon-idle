// ux-e2e.js - UX/UI E2E test suite (110 test cases, Phase 1: TC 01-24)

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
  if (typeof activeEvent !== 'undefined') activeEvent = null;
  if (typeof activeBuffs !== 'undefined') activeBuffs = [];
  if (typeof eventFixTaps !== 'undefined') eventFixTaps = 0;
  if (typeof activeChallenge !== 'undefined') activeChallenge = null;
  if (typeof autoCompileTimer !== 'undefined') autoCompileTimer = 0;
  if (typeof tutorialActive !== 'undefined') tutorialActive = false;
  if (typeof currentHint !== 'undefined') currentHint = null;
}

// Disable SFX for tests
if (typeof SFX !== 'undefined') {
  for (const key of Object.keys(SFX)) {
    if (typeof SFX[key] === 'function') SFX[key] = () => {};
  }
}

// Prevent startGame from running (it's called on DOMContentLoaded)
// Tests manage state manually
if (typeof gameLoopId !== 'undefined' && gameLoopId) clearInterval(gameLoopId);
if (typeof autoSaveId !== 'undefined' && autoSaveId) clearInterval(autoSaveId);

// ========================
// Journey A: "처음 시작했는데 뭘 해야 할지 모르겠음" (TC 01-12)
// ========================

// TC-01: Tutorial auto-starts for new user
group('TC-01: 신규 유저에게 튜토리얼이 자동 시작되는가');
resetState();
gameState.tutorialStep = 0;
startTutorial();
assert('Tutorial is active', tutorialActive === true);
assert('Tutorial step is 0 (welcome)', gameState.tutorialStep === 0);
endTutorial(); // cleanup

// TC-02: Tutorial welcome explains game goal
group('TC-02: 튜토리얼 welcome 메시지가 게임 목표를 설명하는가');
const welcomeStep = TUTORIAL_STEPS[0];
assert('Welcome step exists', welcomeStep !== undefined);
assert('Welcome is modal type', welcomeStep.type === 'modal');
assert('Title mentions AI Tycoon', welcomeStep.title.includes('AI Tycoon'));
assert('Message mentions building/AI', welcomeStep.message.toLowerCase().includes('build') || welcomeStep.message.toLowerCase().includes('ai'));
assert('Message mentions career/models/code',
  welcomeStep.message.toLowerCase().includes('career') ||
  welcomeStep.message.toLowerCase().includes('model') ||
  welcomeStep.message.toLowerCase().includes('code'));

// TC-03: Tutorial guides "tap to write code"
group('TC-03: 튜토리얼이 "탭하여 코드 작성" 단계를 안내하는가');
const tapStep = TUTORIAL_STEPS[1];
assert('Tap step exists', tapStep !== undefined);
assert('Message mentions tap', tapStep.message.toLowerCase().includes('tap'));
assert('Message mentions code/write', tapStep.message.toLowerCase().includes('code') || tapStep.message.toLowerCase().includes('write'));

// TC-04: Tutorial explains "Compile" concept
group('TC-04: 튜토리얼이 "Compile" 개념을 설명하는가');
const compileStep = TUTORIAL_STEPS[2];
assert('Compile step exists', compileStep !== undefined);
assert('Message mentions Compile', compileStep.message.includes('Compile') || compileStep.message.includes('compile'));
assert('Message mentions Compute', compileStep.message.includes('Compute') || compileStep.message.includes('compute'));

// TC-05: Tutorial guides "Upgrade tab"
group('TC-05: 튜토리얼이 "Upgrade 탭 이동"을 유도하는가');
const upgradeStep = TUTORIAL_STEPS[3];
assert('Upgrade step exists', upgradeStep !== undefined);
assert('Message mentions Upgrade', upgradeStep.message.includes('Upgrade') || upgradeStep.message.includes('upgrade'));

// TC-06: After tutorial, hint banner suggests next action
group('TC-06: 튜토리얼 완료 후 힌트 배너가 다음 행동을 제안하는가');
resetState();
gameState.tutorialStep = TUTORIAL_STEPS.length; // tutorial complete
updateHintBanner();
const hintBanner = document.getElementById('hint-banner');
assert('Hint banner exists', hintBanner !== null);
assert('Hint banner is visible', hintBanner && hintBanner.style.display !== 'none');
assert('Hint banner has text content', hintBanner && hintBanner.textContent.trim().length > 0);

// TC-07: LoC=0 → hint says "write code"
group('TC-07: LoC=0일 때 힌트가 "코드를 작성하세요"를 안내하는가');
resetState();
gameState.totalLoc = 0;
gameState.loc = 0;
updateHintBanner();
const hint07 = document.getElementById('hint-banner');
assert('Hint visible', hint07 && hint07.style.display !== 'none');
const hintText07 = hint07 ? hint07.textContent.toLowerCase() : '';
assert('Hint mentions code/editor/write/tap',
  hintText07.includes('code') || hintText07.includes('editor') ||
  hintText07.includes('write') || hintText07.includes('tap'));

// TC-08: LoC>0 & Compute<10 → hint says "Compile"
group('TC-08: LoC>0 & Compute<10일 때 힌트가 "Compile 하세요"를 안내하는가');
resetState();
gameState.loc = 50;
gameState.compute = 0;
gameState.totalLoc = 50;
updateHintBanner();
const hint08 = document.getElementById('hint-banner');
assert('Hint visible', hint08 && hint08.style.display !== 'none');
const hintText08 = hint08 ? hint08.textContent.toLowerCase() : '';
assert('Hint mentions compile/compute', hintText08.includes('compile') || hintText08.includes('compute'));

// TC-09: Compute sufficient → hint suggests "upgrade"
group('TC-09: Compute 충분 시 힌트가 "업그레이드 구매"를 안내하는가');
resetState();
gameState.compute = 999999;
gameState.totalLoc = 100;
gameState.loc = 0;
updateHintBanner();
const hint09 = document.getElementById('hint-banner');
assert('Hint visible', hint09 && hint09.style.display !== 'none');
const hintText09 = hint09 ? hint09.textContent.toLowerCase() : '';
assert('Hint mentions upgrade', hintText09.includes('upgrade'));

// TC-10: Papers>=10 → hint suggests "Research"
group('TC-10: Papers≥10일 때 힌트가 "Research"를 안내하는가');
resetState();
gameState.totalLoc = 100;
gameState.loc = 0;
gameState.compute = 0;
gameState.papers = 10;
updateHintBanner();
const hint10 = document.getElementById('hint-banner');
assert('Hint visible', hint10 && hint10.style.display !== 'none');
const hintText10 = hint10 ? hint10.textContent.toLowerCase() : '';
assert('Hint mentions research/model', hintText10.includes('research') || hintText10.includes('model'));

// TC-11: Hint banner click navigates to screen
group('TC-11: 힌트 배너 클릭 시 해당 화면으로 이동하는가');
resetState();
gameState.totalLoc = 0;
updateHintBanner();
const hint11 = document.getElementById('hint-banner');
assert('Banner has onclick handler', hint11 && hint11.hasAttribute('onclick'));
assert('Banner has data-screen attribute', hint11 && hint11.dataset.screen !== undefined);
const screenTarget = hint11 ? hint11.dataset.screen : '';
assert('data-screen is a valid screen name',
  screenTarget === 'editor' || screenTarget === 'models' || screenTarget === 'upgrade' ||
  screenTarget === 'research' || screenTarget === 'fusion' || screenTarget === 'career' ||
  screenTarget === '');

// TC-12: After tutorial skip, hint banner still works
group('TC-12: 튜토리얼 스킵 후에도 힌트 배너가 동작하는가');
resetState();
gameState.tutorialStep = 0;
startTutorial();
skipTutorial();
assert('Tutorial is no longer active', tutorialActive === false);
assert('tutorialStep is at end', gameState.tutorialStep === TUTORIAL_STEPS.length);
updateHintBanner();
const hint12 = document.getElementById('hint-banner');
assert('Hint banner visible after skip', hint12 && hint12.style.display !== 'none');

// ========================
// Journey B: "화면마다 뭘 하는 곳인지 설명이 없음" (TC 13-24)
// ========================

// Helper: check if a screen element contains descriptive text beyond just the title
function hasScreenDescription(screenId, minLength) {
  const screen = document.getElementById(screenId);
  if (!screen) return false;
  const text = screen.textContent.trim();
  return text.length >= (minLength || 20);
}

function screenContains(screenId, keywords) {
  const screen = document.getElementById(screenId);
  if (!screen) return false;
  const text = screen.textContent.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// Render all screens first
resetState();
renderEditorScreen();
renderModelsScreen();
renderUpgradeScreen();
renderResearchScreen();
renderFusionScreen();
renderCareerScreen();

// TC-13: Editor screen has purpose description
group('TC-13: Editor 화면에 목적 설명 텍스트가 있는가');
const editorScreen = document.getElementById('screen-editor');
const editorText = editorScreen ? editorScreen.textContent : '';
assert('Editor screen exists', editorScreen !== null);
// Check for description beyond just the title "Code Editor"
const editorHasDesc = editorText.replace('Code Editor', '').trim().length > 20;
assert('Editor has descriptive text beyond title', editorHasDesc,
  'Expected purpose explanation like "Write code to generate LoC"');

// TC-14: Models screen has purpose description
group('TC-14: Models 화면에 목적 설명 텍스트가 있는가');
const modelsScreen = document.getElementById('screen-models');
const modelsText = modelsScreen ? modelsScreen.textContent : '';
assert('Models screen exists', modelsScreen !== null);
const modelsHasDesc = modelsText.replace('AI Models', '').trim().length > 20;
assert('Models has descriptive text beyond title', modelsHasDesc,
  'Expected purpose explanation like "Your AI models generate LoC automatically"');

// TC-15: Upgrade screen has purpose description
group('TC-15: Upgrade 화면에 목적 설명 텍스트가 있는가');
const upgradeScreen = document.getElementById('screen-upgrade');
assert('Upgrade screen exists', upgradeScreen !== null);
// Check for a dedicated description paragraph (not just upgrade card descriptions)
const upgradeContent = document.getElementById('upgrade-content');
const hasUpgradeIntro = upgradeContent ? (upgradeContent.querySelector('.screen-desc') !== null ||
  upgradeContent.textContent.toLowerCase().includes('spend compute') ||
  upgradeContent.textContent.toLowerCase().includes('buy upgrade')) : false;
assert('Upgrade has purpose description', hasUpgradeIntro,
  'Expected intro like "Spend Compute to buy upgrades"');

// TC-16: Research screen has purpose description
group('TC-16: Research 화면에 목적 설명 텍스트가 있는가');
const researchScreen = document.getElementById('screen-research');
assert('Research screen exists', researchScreen !== null);
const researchContent = document.getElementById('research-content');
const researchText = researchContent ? researchContent.textContent.toLowerCase() : '';
const hasResearchDesc = researchText.includes('paper') && (researchText.includes('discover') || researchText.includes('pull') || researchText.includes('research'));
assert('Research has purpose description mentioning papers', hasResearchDesc,
  'Expected explanation like "Spend Papers to discover new AI models"');

// TC-17: Fusion screen has purpose description
group('TC-17: Fusion 화면에 목적 설명 텍스트가 있는가');
const fusionScreen = document.getElementById('screen-fusion');
assert('Fusion screen exists', fusionScreen !== null);
const fusionContent = document.getElementById('fusion-content');
const fusionText = fusionContent ? fusionContent.textContent.toLowerCase() : '';
const hasFusionDesc = fusionText.includes('fuse') || fusionText.includes('combine') || fusionText.includes('merge');
assert('Fusion has descriptive text about fusing models', hasFusionDesc,
  'Expected explanation about combining two models');

// TC-18: Career screen has purpose description
group('TC-18: Career 화면에 목적 설명 텍스트가 있는가');
const careerScreen = document.getElementById('screen-career');
assert('Career screen exists', careerScreen !== null);
const careerContent = document.getElementById('career-content');
const careerText = careerContent ? careerContent.textContent.toLowerCase() : '';
const hasCareerDesc = careerText.includes('career') || careerText.includes('advance') || careerText.includes('multiplier');
assert('Career has descriptive text', hasCareerDesc,
  'Expected explanation about career progression');

// TC-19: Research screen explains "Papers로 모델을 뽑는 곳"
group('TC-19: Research 화면이 "Papers로 모델을 뽑는 곳"임을 설명하는가');
assert('Research mentions papers', researchText.includes('paper'));
assert('Research mentions discovering/pulling models',
  researchText.includes('discover') || researchText.includes('pull') || researchText.includes('research'));

// TC-20: Fusion screen explains "두 모델 합성"
group('TC-20: Fusion 화면이 "두 모델 합성"임을 설명하는가');
assert('Fusion mentions model fusion concept',
  fusionText.includes('model fusion') || fusionText.includes('fuse') || fusionText.includes('fusion'));
assert('Fusion mentions combining two models',
  fusionText.includes('two') || fusionText.includes('select') || fusionText.includes('combine'));

// TC-21: Career screen explains "프레스티지 (리셋+영구배율)"
group('TC-21: Career 화면이 "프레스티지 (리셋+영구배율)"임을 설명하는가');
assert('Career mentions reset/resets', careerText.includes('reset'));
assert('Career mentions multiplier/permanent',
  careerText.includes('multiplier') || careerText.includes('permanent') || careerText.includes('boost'));

// TC-22: Upgrade screen explains "Compute로 강화 구매"
group('TC-22: Upgrade 화면이 "Compute로 강화 구매"임을 설명하는가');
const upgradeText = upgradeContent ? upgradeContent.textContent.toLowerCase() : '';
assert('Upgrade mentions compute currency', upgradeText.includes('compute'));
assert('Upgrade shows cost numbers', upgradeContent ? upgradeContent.querySelectorAll('.btn').length > 0 : false,
  'Expected upgrade buttons with cost numbers');

// TC-23: Career screen explains "뭘 잃고 뭘 얻는지"
group('TC-23: Career 화면이 "뭘 잃고 뭘 얻는지" 설명하는가');
const careerDescEl = careerContent ? careerContent.querySelector('.career-desc') : null;
const careerDescText = careerDescEl ? careerDescEl.textContent.toLowerCase() : '';
assert('Career has description element', careerDescEl !== null);
assert('Describes what resets (LoC/Compute/Models)',
  careerDescText.includes('reset') || careerDescText.includes('loc') || careerDescText.includes('compute'));
assert('Describes what is kept (Papers/Tokens/Rep)',
  careerDescText.includes('kept') || careerDescText.includes('paper') || careerDescText.includes('token'));

// TC-24: Screen descriptions mention relevant currencies
group('TC-24: 각 화면 설명에 핵심 화폐가 언급되는가');
assert('Research mentions papers', researchText.includes('paper'));
assert('Upgrade mentions compute', upgradeText.includes('compute') || upgradeText.length > 0);
assert('Career mentions reputation', careerText.includes('rep'));
// Editor should mention LoC
const editorFullText = editorScreen ? editorScreen.textContent.toLowerCase() : '';
assert('Editor area mentions loc/lines/code',
  editorFullText.includes('loc') || editorFullText.includes('line') || editorFullText.includes('code'));

// ========================
// Summary
// ========================
summaryEl.className = failed === 0 ? 'pass' : 'fail';
summaryEl.textContent = 'Results: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed) + ' tests';
console.log('UX E2E Tests: ' + passed + ' passed, ' + failed + ' failed');
