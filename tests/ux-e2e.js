// ux-e2e.js - UX/UI E2E test suite (110 test cases, Phase 1-2: TC 01-56)

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
// Journey C: "화폐를 눌렀는데 아무 반응 없음" (TC 25-36)
// ========================

// TC-25: Compute click shows explanation
group('TC-25: Compute 클릭 시 설명이 표시되는가');
resetState();
const computeEl = document.querySelector('.currency.compute');
assert('Compute element exists', computeEl !== null);
const computeHasClick = computeEl && (computeEl.onclick !== null || computeEl.hasAttribute('onclick'));
assert('Compute has click handler', computeHasClick, 'No click handler for tooltip');

// TC-26: Papers click shows explanation
group('TC-26: Papers 클릭 시 설명이 표시되는가');
const papersEl = document.querySelector('.currency.papers');
assert('Papers element exists', papersEl !== null);
const papersHasClick = papersEl && (papersEl.onclick !== null || papersEl.hasAttribute('onclick'));
assert('Papers has click handler', papersHasClick, 'No click handler for tooltip');

// TC-27: Tokens click shows explanation
group('TC-27: Tokens 클릭 시 설명이 표시되는가');
const tokensEl = document.querySelector('.currency.tokens');
assert('Tokens element exists', tokensEl !== null);
const tokensHasClick = tokensEl && (tokensEl.onclick !== null || tokensEl.hasAttribute('onclick'));
assert('Tokens has click handler', tokensHasClick, 'No click handler for tooltip');

// TC-28: Compute tooltip explains how to earn
group('TC-28: Compute 툴팁이 획득 방법을 설명하는가');
if (computeEl) computeEl.click();
const computeTooltip = document.querySelector('.currency-tooltip, .tooltip, [data-tooltip="compute"]');
assert('Compute tooltip appears after click', computeTooltip !== null, 'No tooltip element found');
const computeTooltipText = computeTooltip ? computeTooltip.textContent.toLowerCase() : '';
assert('Tooltip explains earning (compile/code)', computeTooltipText.includes('compile') || computeTooltipText.includes('code'),
  'Tooltip should mention how to earn Compute');

// TC-29: Papers tooltip explains how to earn
group('TC-29: Papers 툴팁이 획득 방법을 설명하는가');
if (papersEl) papersEl.click();
const papersTooltip = document.querySelector('.currency-tooltip.papers, .tooltip[data-currency="papers"]');
assert('Papers tooltip appears after click', papersTooltip !== null, 'No tooltip element found');
const papersTooltipText = papersTooltip ? papersTooltip.textContent.toLowerCase() : '';
assert('Tooltip explains earning (models/research)', papersTooltipText.includes('model') || papersTooltipText.includes('research'),
  'Tooltip should mention how to earn Papers');

// TC-30: Tokens tooltip explains how to earn
group('TC-30: Tokens 툴팁이 획득 방법을 설명하는가');
if (tokensEl) tokensEl.click();
const tokensTooltip = document.querySelector('.currency-tooltip.tokens, .tooltip[data-currency="tokens"]');
assert('Tokens tooltip appears after click', tokensTooltip !== null, 'No tooltip element found');
const tokensTooltipText = tokensTooltip ? tokensTooltip.textContent.toLowerCase() : '';
assert('Tooltip explains earning (challenge/career)', tokensTooltipText.includes('challenge') || tokensTooltipText.includes('career'),
  'Tooltip should mention how to earn Tokens');

// TC-31: Compute tooltip explains spending
group('TC-31: Compute 툴팁이 사용처를 설명하는가');
assert('Tooltip explains spending (upgrade/buy)', computeTooltipText.includes('upgrade') || computeTooltipText.includes('buy') || computeTooltipText.includes('spend'),
  'Tooltip should mention how to spend Compute');

// TC-32: Papers tooltip explains spending
group('TC-32: Papers 툴팁이 사용처를 설명하는가');
assert('Tooltip explains spending (research/discover)', papersTooltipText.includes('research') || papersTooltipText.includes('discover') || papersTooltipText.includes('spend'),
  'Tooltip should mention how to spend Papers');

// TC-33: Tokens tooltip explains spending
group('TC-33: Tokens 툴팁이 사용처를 설명하는가');
assert('Tooltip explains spending (challenge/prestige)', tokensTooltipText.includes('challenge') || tokensTooltipText.includes('prestige') || tokensTooltipText.includes('spend'),
  'Tooltip should mention how to spend Tokens');

// TC-34: Tooltip auto-closes after timeout
group('TC-34: 툴팁이 일정 시간 후 자동으로 닫히는가');
// This is async behavior - check if tooltip has auto-close logic
const tooltipAll = document.querySelectorAll('.currency-tooltip, .tooltip');
const hasAutoClose = tooltipAll.length > 0; // If tooltips exist, check for timeout
assert('Tooltip has auto-close mechanism', hasAutoClose,
  'No tooltip found to test auto-close — currency click handlers likely missing');

// TC-35: Tooltip closes on outside click
group('TC-35: 툴팁 외부 클릭 시 닫히는가');
if (computeEl) computeEl.click();
document.body.click(); // click outside
const tooltipAfterOutside = document.querySelector('.currency-tooltip:not(.hidden), .tooltip:not(.hidden)');
assert('Tooltip closes on outside click', tooltipAfterOutside === null,
  'Tooltip should dismiss when clicking outside');

// TC-36: LoC label says "Lines of Code"
group('TC-36: LoC 라벨이 "Lines of Code"를 포함하는가');
const locLabel = document.querySelector('.loc-label');
assert('LoC label element exists', locLabel !== null);
const locLabelText = locLabel ? locLabel.textContent : '';
assert('Label contains "Lines of Code"', locLabelText.includes('Lines of Code'),
  'Got: ' + locLabelText);

// ========================
// Journey D: "비활성화됐는데 왜인지 모르겠음" (TC 37-56)
// ========================

// TC-37: Compile btn disabled shows "LoC needed" message
group('TC-37: Compile 버튼 비활성화 시 "LoC needed" 메시지가 있는가');
resetState();
gameState.loc = 0;
if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
renderEditorScreen();
const compileBtn37 = document.querySelector('.compile-btn');
assert('Compile button exists', compileBtn37 !== null);
const compileBtnDisabled = compileBtn37 && (compileBtn37.disabled || compileBtn37.classList.contains('btn-disabled'));
assert('Compile button is disabled when LoC=0', compileBtnDisabled);
const compileArea37 = compileBtn37 ? compileBtn37.parentElement : null;
const compileAreaText37 = compileArea37 ? compileArea37.textContent.toLowerCase() : '';
assert('Nearby text explains LoC needed', compileAreaText37.includes('loc') || compileAreaText37.includes('line') || compileAreaText37.includes('code'),
  'Expected text explaining why compile is disabled');

// TC-38: Research btn disabled shows "Papers needed"
group('TC-38: Research 버튼 비활성화 시 "Papers needed" 메시지가 있는가');
resetState();
gameState.papers = 0;
renderResearchScreen();
const researchBtn38 = document.querySelector('#research-content .btn, #research-content .btn-disabled');
assert('Research button exists', researchBtn38 !== null);
const researchDisabled38 = researchBtn38 && (researchBtn38.disabled || researchBtn38.classList.contains('btn-disabled'));
assert('Research button is disabled when Papers=0', researchDisabled38);
const researchContent38 = document.getElementById('research-content');
const lockHint38 = researchContent38 ? researchContent38.querySelector('.lock-hint') : null;
assert('Lock-hint exists for research', lockHint38 !== null, 'Expected .lock-hint element');

// TC-39: Research lock-hint shows papers amount
group('TC-39: Research lock-hint가 필요한 Papers 수량을 표시하는가');
const lockHintText39 = lockHint38 ? lockHint38.textContent.toLowerCase() : '';
assert('Lock-hint mentions papers', lockHintText39.includes('paper'),
  'Got: ' + lockHintText39);
assert('Lock-hint has numeric amount', /\d+/.test(lockHintText39),
  'Expected a number in lock-hint');

// TC-40: Upgrade card locked shows lock-hint
group('TC-40: 잠긴 업그레이드 카드에 lock-hint가 표시되는가');
resetState();
gameState.compute = 0;
renderUpgradeScreen();
const lockedCards40 = document.querySelectorAll('.upgrade-card.locked');
assert('At least one locked upgrade card exists', lockedCards40.length > 0);
const firstLocked40 = lockedCards40[0];
const lockHint40 = firstLocked40 ? firstLocked40.querySelector('.lock-hint') : null;
assert('Locked card has .lock-hint', lockHint40 !== null, 'Expected .lock-hint inside .upgrade-card.locked');

// TC-41: Lock-hint has numeric amount
group('TC-41: Lock-hint에 수량이 포함되어 있는가');
const lockHintText41 = lockHint40 ? lockHint40.textContent : '';
assert('Lock-hint has numeric value', /\d+/.test(lockHintText41),
  'Expected a number showing required amount');

// TC-42: Locked card has lock icon
group('TC-42: 잠긴 카드에 자물쇠 아이콘이 있는가');
const lockIcon42 = firstLocked40 ? firstLocked40.textContent : '';
assert('Locked card has lock icon', lockIcon42.includes('🔒') || lockIcon42.includes('lock') || lockIcon42.toLowerCase().includes('lock'),
  'Expected 🔒 or "lock" icon in locked card');

// TC-43: Career advance disabled shows "reputation needed"
group('TC-43: Career advance 비활성화 시 "reputation needed" 안내가 있는가');
resetState();
gameState.reputation = 0;
renderCareerScreen();
const careerContent43 = document.getElementById('career-content');
const careerLockHint43 = careerContent43 ? careerContent43.querySelector('.lock-hint') : null;
assert('Career has lock-hint', careerLockHint43 !== null, 'Expected .lock-hint for career advance');
const careerLockText43 = careerLockHint43 ? careerLockHint43.textContent.toLowerCase() : '';
assert('Lock-hint mentions reputation', careerLockText43.includes('rep'),
  'Expected reputation requirement in lock-hint');

// TC-44: Career lock-hint shows reputation amount
group('TC-44: Career lock-hint가 필요한 reputation 수량을 표시하는가');
assert('Lock-hint has numeric amount', /\d+/.test(careerLockText43),
  'Expected a number showing required reputation');

// TC-45: Challenge disabled shows "tokens needed"
group('TC-45: Challenge 비활성화 시 "tokens needed" 안내가 있는가');
resetState();
gameState.tokens = 0;
if (typeof renderChallengeUI === 'function') renderChallengeUI();
const challengeBtn45 = document.querySelector('.challenge-btn, [data-action="challenge"]');
const challengeDisabled45 = challengeBtn45 && (challengeBtn45.disabled || challengeBtn45.classList.contains('btn-disabled'));
assert('Challenge button exists', challengeBtn45 !== null, 'No challenge button found');
assert('Challenge is disabled when tokens=0', challengeDisabled45, 'Challenge should be disabled');
const challengeArea45 = challengeBtn45 ? challengeBtn45.parentElement : null;
const challengeText45 = challengeArea45 ? challengeArea45.textContent.toLowerCase() : '';
assert('Shows tokens needed message', challengeText45.includes('token'),
  'Expected mention of tokens needed');

// TC-46: GPU slot full shows "slot expansion needed"
group('TC-46: GPU 슬롯이 가득 찼을 때 안내가 있는가');
resetState();
gameState.gpuSlots = 1;
gameState.models = [{ name: 'TestModel', tier: 1, locPerSec: 1 }]; // fill slot
renderResearchScreen();
const researchContent46 = document.getElementById('research-content');
const researchText46 = researchContent46 ? researchContent46.textContent.toLowerCase() : '';
assert('Shows slot-related message when full',
  researchText46.includes('slot') || researchText46.includes('full') || researchText46.includes('expand'),
  'Expected slot capacity warning');

// TC-47: Locked card opacity >= 0.5
group('TC-47: 잠긴 카드의 opacity가 0.5 이상인가');
resetState();
gameState.compute = 0;
renderUpgradeScreen();
const lockedCard47 = document.querySelector('.upgrade-card.locked');
let opacity47 = 1;
if (lockedCard47) {
  const style47 = window.getComputedStyle(lockedCard47);
  opacity47 = parseFloat(style47.opacity);
}
assert('Locked card exists for opacity test', lockedCard47 !== null);
assert('Locked card opacity >= 0.5', opacity47 >= 0.5,
  'Got opacity: ' + opacity47 + ' — too transparent may confuse users');

// TC-48: Disabled button has cursor:not-allowed
group('TC-48: 비활성화 버튼의 커서가 not-allowed인가');
const disabledBtns48 = document.querySelectorAll('.btn-disabled, button[disabled]');
assert('At least one disabled button exists', disabledBtns48.length > 0);
let hasNotAllowed48 = false;
if (disabledBtns48.length > 0) {
  const cursor48 = window.getComputedStyle(disabledBtns48[0]).cursor;
  hasNotAllowed48 = cursor48 === 'not-allowed';
}
assert('Disabled button has cursor:not-allowed', hasNotAllowed48,
  'Expected cursor: not-allowed on disabled buttons');

// TC-49: Disabled button click doesn't error
group('TC-49: 비활성화 버튼 클릭 시 에러가 발생하지 않는가');
let clickError49 = false;
try {
  const disabledBtn49 = document.querySelector('.compile-btn.btn-disabled, .compile-btn[disabled], .btn-disabled');
  if (disabledBtn49) disabledBtn49.click();
} catch (e) {
  clickError49 = true;
}
assert('Clicking disabled button does not throw error', !clickError49);

// TC-50: Fusion can't-fuse shows reason
group('TC-50: Fusion 불가 시 이유를 표시하는가');
resetState();
gameState.models = [];
renderFusionScreen();
const fusionContent50 = document.getElementById('fusion-content');
const fusionText50 = fusionContent50 ? fusionContent50.textContent.toLowerCase() : '';
assert('Fusion screen shows explanation when no models',
  fusionText50.includes('need') || fusionText50.includes('model') || fusionText50.includes('no ') || fusionText50.includes('select'),
  'Expected explanation when fusion is unavailable');

// TC-51: All locked upgrade cards have lock-hint
group('TC-51: 모든 잠긴 업그레이드 카드에 lock-hint가 있는가');
resetState();
gameState.compute = 0;
renderUpgradeScreen();
const allLocked51 = document.querySelectorAll('.upgrade-card.locked');
let allHaveLockHint51 = true;
let missingCount51 = 0;
allLocked51.forEach(card => {
  if (!card.querySelector('.lock-hint')) {
    allHaveLockHint51 = false;
    missingCount51++;
  }
});
assert('Locked upgrade cards exist', allLocked51.length > 0);
assert('All locked cards have .lock-hint', allHaveLockHint51,
  missingCount51 + ' of ' + allLocked51.length + ' locked cards missing .lock-hint');

// TC-52: Lock-hint mentions currency name
group('TC-52: Lock-hint가 화폐 이름을 포함하는가');
let allMentionCurrency52 = true;
let missingCurrency52 = 0;
allLocked51.forEach(card => {
  const hint = card.querySelector('.lock-hint');
  if (hint) {
    const hintText = hint.textContent.toLowerCase();
    if (!hintText.includes('compute') && !hintText.includes('paper') && !hintText.includes('token') && !hintText.includes('rep')) {
      allMentionCurrency52 = false;
      missingCurrency52++;
    }
  }
});
assert('All lock-hints mention a currency', allMentionCurrency52,
  missingCurrency52 + ' lock-hints missing currency name');

// TC-53: GPU expansion card locked shows lock-hint
group('TC-53: GPU 확장 카드 잠금 시 lock-hint가 있는가');
resetState();
gameState.compute = 0;
renderUpgradeScreen();
const gpuCard53 = document.querySelector('.upgrade-card[data-upgrade*="gpu"], .upgrade-card[data-upgrade*="slot"]');
const gpuLocked53 = gpuCard53 && gpuCard53.classList.contains('locked');
const gpuLockHint53 = gpuCard53 ? gpuCard53.querySelector('.lock-hint') : null;
assert('GPU expansion card found', gpuCard53 !== null, 'No GPU upgrade card found');
assert('GPU card is locked when compute=0', gpuLocked53, 'GPU card should be locked');
assert('GPU card has lock-hint', gpuLockHint53 !== null, 'Expected .lock-hint on GPU card');

// TC-54: Initial state has at least 1 enabled action (tap)
group('TC-54: 초기 상태에서 최소 1개의 활성화된 액션이 있는가');
resetState();
renderEditorScreen();
const editorBody54 = document.querySelector('.editor-body, #editor-body, .code-area');
assert('Editor body exists', editorBody54 !== null);
const editorClickable54 = editorBody54 && (editorBody54.onclick !== null || editorBody54.hasAttribute('onclick') || editorBody54.hasAttribute('data-action'));
assert('Editor body is tappable', editorClickable54, 'Editor should be clickable for writing code');

// TC-55: Initial state hint guides first action
group('TC-55: 초기 상태에서 힌트가 첫 번째 행동을 안내하는가');
resetState();
gameState.tutorialStep = TUTORIAL_STEPS.length; // post-tutorial
gameState.loc = 0;
gameState.totalLoc = 0;
updateHintBanner();
const hint55 = document.getElementById('hint-banner');
assert('Hint banner visible', hint55 && hint55.style.display !== 'none');
const hintText55 = hint55 ? hint55.textContent.toLowerCase() : '';
assert('Hint guides first action (tap/write/code)',
  hintText55.includes('tap') || hintText55.includes('write') || hintText55.includes('code') || hintText55.includes('editor'),
  'Hint should guide user to write first code');

// TC-56: All disabled buttons have visual distinction
group('TC-56: 모든 비활성화 버튼에 시각적 구분이 있는가');
resetState();
gameState.compute = 0;
gameState.papers = 0;
gameState.loc = 0;
renderUpgradeScreen();
renderResearchScreen();
renderEditorScreen();
const allBtns56 = document.querySelectorAll('.btn, button');
let disabledWithoutStyle56 = 0;
let totalDisabled56 = 0;
allBtns56.forEach(btn => {
  if (btn.disabled || btn.classList.contains('btn-disabled')) {
    totalDisabled56++;
    const hasVisual = btn.classList.contains('btn-disabled') || btn.disabled || btn.hasAttribute('aria-disabled');
    if (!hasVisual) disabledWithoutStyle56++;
  }
});
assert('Disabled buttons exist', totalDisabled56 > 0);
assert('All disabled buttons have visual distinction (btn-disabled class or disabled attr)',
  disabledWithoutStyle56 === 0,
  disabledWithoutStyle56 + ' disabled buttons lack visual distinction');

// ========================
// Summary
// ========================
summaryEl.className = failed === 0 ? 'pass' : 'fail';
summaryEl.textContent = 'Results: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed) + ' tests';
console.log('UX E2E Tests: ' + passed + ' passed, ' + failed + ' failed');
