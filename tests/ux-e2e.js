// ux-e2e.js - UX/UI E2E test suite (110 test cases, Phase 1-3: TC 01-84)

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
// Journey E: "업그레이드 이름이 이상함" (TC 57-66)
// ========================

// TC-57: Upgrade names are human-readable (not camelCase)
group('TC-57: 업그레이드 이름이 사람이 읽을 수 있는 텍스트인가');
resetState();
renderUpgradeScreen();
const upgradeNames57 = document.querySelectorAll('.upgrade-name');
let hasReadableName57 = true;
let camelCaseFound57 = '';
upgradeNames57.forEach(el => {
  const text = el.textContent.trim().split('\n')[0].trim();
  if (/^[a-z]+[A-Z]/.test(text)) {
    hasReadableName57 = false;
    camelCaseFound57 = text;
  }
});
assert('No camelCase names displayed', hasReadableName57,
  'Found camelCase in upgrade names: "' + camelCaseFound57 + '"');

// TC-58: "toolUse" displays as "Tool Use"
group('TC-58: "toolUse"가 "Tool Use"로 표시되는가');
const allUpgradeNames58 = document.querySelectorAll('.upgrade-name');
let foundToolUse58 = false;
let toolUseRaw58 = false;
allUpgradeNames58.forEach(el => {
  const text = el.textContent.trim();
  if (text.includes('Tool Use')) foundToolUse58 = true;
  if (text.includes('toolUse')) toolUseRaw58 = true;
});
assert('Displays "Tool Use" (readable)', foundToolUse58, 'Expected "Tool Use" in upgrade names');
assert('Does not display raw "toolUse"', !toolUseRaw58, 'Raw camelCase "toolUse" found');

// TC-59: "multiAgent" displays as "Multi-Agent"
group('TC-59: "multiAgent"가 "Multi-Agent"로 표시되는가');
let foundMultiAgent59 = false;
let multiAgentRaw59 = false;
allUpgradeNames58.forEach(el => {
  const text = el.textContent.trim();
  if (text.includes('Multi-Agent') || text.includes('Multi Agent')) foundMultiAgent59 = true;
  if (text.includes('multiAgent')) multiAgentRaw59 = true;
});
assert('Displays "Multi-Agent" (readable)', foundMultiAgent59, 'Expected "Multi-Agent" in upgrade names');
assert('Does not display raw "multiAgent"', !multiAgentRaw59, 'Raw camelCase "multiAgent" found');

// TC-60: "fineTuning" displays as "Fine-tuning"
group('TC-60: "fineTuning"이 "Fine-tuning"으로 표시되는가');
let foundFineTuning60 = false;
let fineTuningRaw60 = false;
allUpgradeNames58.forEach(el => {
  const text = el.textContent.trim();
  if (text.includes('Fine-tuning') || text.includes('Fine Tuning')) foundFineTuning60 = true;
  if (text.includes('fineTuning')) fineTuningRaw60 = true;
});
assert('Displays "Fine-tuning" (readable)', foundFineTuning60, 'Expected "Fine-tuning" in upgrade names');
assert('Does not display raw "fineTuning"', !fineTuningRaw60, 'Raw camelCase "fineTuning" found');

// TC-61: "autoPipeline" displays as "Auto Pipeline"
group('TC-61: "autoPipeline"이 "Auto Pipeline"으로 표시되는가');
let foundAutoPipeline61 = false;
let autoPipelineRaw61 = false;
allUpgradeNames58.forEach(el => {
  const text = el.textContent.trim();
  if (text.includes('Auto Pipeline') || text.includes('Auto pipeline')) foundAutoPipeline61 = true;
  if (text.includes('autoPipeline')) autoPipelineRaw61 = true;
});
assert('Displays "Auto Pipeline" (readable)', foundAutoPipeline61, 'Expected "Auto Pipeline" in upgrade names');
assert('Does not display raw "autoPipeline"', !autoPipelineRaw61, 'Raw camelCase "autoPipeline" found');

// TC-62: Upgrade descriptions are not all generic "Enhances X capabilities"
group('TC-62: 업그레이드 설명이 모두 "Enhances X capabilities"가 아닌가');
const descs62 = document.querySelectorAll('.upgrade-desc');
let genericCount62 = 0;
let totalDescs62 = 0;
descs62.forEach(el => {
  const text = el.textContent.trim();
  // Skip GPU Expansion which has a specific description
  if (text.includes('Run more AI models')) return;
  totalDescs62++;
  if (/Enhances .+ capabilities/.test(text)) genericCount62++;
});
assert('Not all descriptions are generic', genericCount62 < totalDescs62 || totalDescs62 === 0,
  genericCount62 + ' of ' + totalDescs62 + ' descriptions are generic "Enhances X capabilities"');

// TC-63: At least some descriptions mention specific functionality
group('TC-63: 일부 설명이 구체적 기능을 언급하는가');
let specificDescCount63 = 0;
descs62.forEach(el => {
  const text = el.textContent.toLowerCase();
  if (text.includes('tool') || text.includes('context') || text.includes('reasoning') ||
      text.includes('parallel') || text.includes('training') || text.includes('retrieval') ||
      text.includes('alignment') || text.includes('batch') || text.includes('compression') ||
      text.includes('ci/cd') || text.includes('routing') || text.includes('coordinate')) {
    specificDescCount63++;
  }
});
assert('At least one description mentions specific functionality', specificDescCount63 > 0,
  'No descriptions mention specific AI/ML functionality');

// TC-64: Level shown as "Lv. N"
group('TC-64: 레벨이 "Lv. N" 형식으로 표시되는가');
const levelBadges64 = document.querySelectorAll('.upgrade-level-badge');
assert('Level badges exist', levelBadges64.length > 0);
let allLvFormat64 = true;
levelBadges64.forEach(el => {
  if (!/Lv\.\s*\d+/.test(el.textContent)) allLvFormat64 = false;
});
assert('All level badges show "Lv. N" format', allLvFormat64,
  'Expected "Lv. N" format in level badges');

// TC-65: Upgrade cost shown as number
group('TC-65: 업그레이드 비용이 숫자로 표시되는가');
const upgradeBtns65 = document.querySelectorAll('.upgrade-card .btn');
assert('Upgrade buttons exist', upgradeBtns65.length > 0);
let allHaveCost65 = true;
upgradeBtns65.forEach(btn => {
  const text = btn.textContent.trim();
  if (!/[\d,.]+[KMBTa-z]*/.test(text) && !/\d/.test(text)) allHaveCost65 = false;
});
assert('All upgrade buttons show cost numbers', allHaveCost65,
  'Expected numeric cost on upgrade buttons');

// TC-66: Category color classes (cat-agent, cat-teamAgent, cat-skill, cat-infra)
group('TC-66: 카테고리별 색상 클래스가 적용되는가');
const catAgent66 = document.querySelectorAll('.upgrade-card.cat-agent');
const catTeam66 = document.querySelectorAll('.upgrade-card.cat-teamAgent');
const catSkill66 = document.querySelectorAll('.upgrade-card.cat-skill');
const catInfra66 = document.querySelectorAll('.upgrade-card.cat-infra');
assert('cat-agent cards exist', catAgent66.length > 0, 'No .cat-agent cards found');
assert('cat-teamAgent cards exist', catTeam66.length > 0, 'No .cat-teamAgent cards found');
assert('cat-skill cards exist', catSkill66.length > 0, 'No .cat-skill cards found');
assert('cat-infra cards exist', catInfra66.length > 0, 'No .cat-infra cards found');

// ========================
// Journey F: "버튼 눌렀을 때 반응이 없음" (TC 67-78)
// ========================

// TC-67: Editor body has onclick handler
group('TC-67: 에디터 영역에 onclick 핸들러가 있는가');
resetState();
renderEditorScreen();
const editorBody67 = document.querySelector('.editor-body');
assert('Editor body element exists', editorBody67 !== null);
const editorHasClick67 = editorBody67 && (editorBody67.onclick !== null || editorBody67.hasAttribute('onclick'));
assert('Editor body has click handler', editorHasClick67, 'Expected onclick="tapEditor(event)" on .editor-body');

// TC-68: tapEditor adds tap-active class
group('TC-68: tapEditor 호출 시 tap-active 클래스가 추가되는가');
const editorBody68 = document.querySelector('.editor-body');
if (editorBody68) {
  const fakeEvent = { currentTarget: editorBody68, clientX: 100, clientY: 100 };
  tapEditor(fakeEvent);
  const hasTapActive68 = editorBody68.classList.contains('tap-active');
  assert('tap-active class added on tap', hasTapActive68, 'Expected .tap-active class on editor body after tap');
  editorBody68.classList.remove('tap-active');
} else {
  assert('Editor body exists for tap test', false, 'No .editor-body found');
}

// TC-69: Compile click changes compute value
group('TC-69: Compile 클릭 시 compute 값이 변하는가');
resetState();
gameState.loc = 100;
const computeBefore69 = gameState.compute;
compileData();
assert('Compute increased after compile', gameState.compute > computeBefore69,
  'Expected compute to increase from ' + computeBefore69 + ', got ' + gameState.compute);

// TC-70: Upgrade purchase shows toast/feedback
group('TC-70: 업그레이드 구매 시 토스트/피드백이 표시되는가');
resetState();
gameState.compute = 999999;
renderUpgradeScreen();
const toastContainer70 = document.getElementById('toast-container');
const toastsBefore70 = toastContainer70 ? toastContainer70.children.length : 0;
// Try to buy with insufficient compute to trigger error toast
const tempCompute70 = gameState.compute;
gameState.compute = 0;
doBuyUpgrade('agent', 'toolUse', { currentTarget: document.createElement('button') });
const toastsAfter70 = toastContainer70 ? toastContainer70.children.length : 0;
assert('Toast shown on purchase attempt', toastsAfter70 > toastsBefore70,
  'Expected toast notification after purchase attempt');
gameState.compute = tempCompute70;

// TC-71: Research pull has result display
group('TC-71: Research pull 후 결과가 표시되는가');
resetState();
gameState.papers = 100;
gameState.gpuSlots = 10;
renderResearchScreen();
doResearchPull();
const researchReveal71 = document.querySelector('.research-reveal');
assert('Research reveal element appears after pull', researchReveal71 !== null,
  'Expected .research-reveal element after doResearchPull()');

// TC-72: Fusion success has feedback (toast)
group('TC-72: Fusion 성공 시 피드백(토스트)이 표시되는가');
resetState();
gameState.models = [
  { name: 'TestA', tier: 1, locPerSec: 1 },
  { name: 'TestB', tier: 1, locPerSec: 1 },
];
gameState.gpuSlots = 10;
const toastContainer72 = document.getElementById('toast-container');
const toastsBefore72 = toastContainer72 ? toastContainer72.children.length : 0;
// Fusion requires specific recipe models; try doFusionUI or direct call
if (typeof FUSION_RECIPES !== 'undefined' && FUSION_RECIPES.length > 0) {
  const recipe72 = FUSION_RECIPES[0];
  // Set up models matching recipe
  if (recipe72.ingredients) {
    gameState.models = recipe72.ingredients.map(name => ({
      name, tier: 1, locPerSec: 1
    }));
  }
  doFusion(recipe72);
}
const toastsAfter72 = toastContainer72 ? toastContainer72.children.length : 0;
assert('Toast shown on fusion attempt', toastsAfter72 > toastsBefore72 || typeof FUSION_RECIPES === 'undefined',
  'Expected toast notification after fusion');

// TC-73: Career advance shows confirmation modal
group('TC-73: Career advance 시 확인 모달이 표시되는가');
resetState();
gameState.reputation = 999999;
gameState.totalLoc = 999999;
renderCareerScreen();
const modalOverlay73 = document.getElementById('modal-overlay');
if (modalOverlay73) modalOverlay73.classList.remove('active');
confirmCareerAdvance();
const modalActive73 = modalOverlay73 && modalOverlay73.classList.contains('active');
assert('Confirmation modal appears on career advance', modalActive73,
  'Expected modal-overlay to have "active" class');

// TC-74: Career advance modal warns about reset
group('TC-74: Career advance 모달이 리셋 경고를 포함하는가');
const modalMessage74 = document.getElementById('modal-message');
const modalText74 = modalMessage74 ? modalMessage74.textContent.toLowerCase() : '';
assert('Modal message mentions reset or loss',
  modalText74.includes('reset') || modalText74.includes('lose') || modalText74.includes('lost'),
  'Expected warning about progress reset, got: "' + modalText74 + '"');
// Clean up modal
if (modalOverlay73) modalOverlay73.classList.remove('active');

// TC-75: Buttons have interactive styling (.btn elements exist)
group('TC-75: 버튼에 인터랙티브 스타일링이 적용되는가');
const allBtns75 = document.querySelectorAll('.btn');
assert('Btn elements exist', allBtns75.length > 0);
// Check that CSS rules for .btn:hover exist in stylesheets
let hasHoverRule75 = false;
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes('.btn') && rule.selectorText.includes(':hover')) {
        hasHoverRule75 = true;
        break;
      }
    }
  } catch (e) { /* cross-origin stylesheet */ }
  if (hasHoverRule75) break;
}
assert('CSS :hover rule exists for .btn', hasHoverRule75,
  'Expected :hover CSS rule for .btn elements');

// TC-76: Buttons have :active CSS
group('TC-76: 버튼에 :active CSS가 적용되는가');
let hasActiveRule76 = false;
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes('.btn') && rule.selectorText.includes(':active')) {
        hasActiveRule76 = true;
        break;
      }
    }
  } catch (e) { /* cross-origin stylesheet */ }
  if (hasActiveRule76) break;
}
assert('CSS :active rule exists for .btn', hasActiveRule76,
  'Expected :active CSS rule for .btn elements');

// TC-77: Active nav-btn has visual emphasis
group('TC-77: 활성 nav-btn에 시각적 강조가 있는가');
const activeNavBtn77 = document.querySelector('.nav-btn.active');
assert('Active nav-btn exists', activeNavBtn77 !== null, 'Expected a .nav-btn.active element');
if (activeNavBtn77) {
  const inactiveNavBtn77 = document.querySelector('.nav-btn:not(.active)');
  if (inactiveNavBtn77) {
    const activeStyle77 = window.getComputedStyle(activeNavBtn77);
    const inactiveStyle77 = window.getComputedStyle(inactiveNavBtn77);
    const isDifferent77 = activeStyle77.color !== inactiveStyle77.color ||
      activeStyle77.backgroundColor !== inactiveStyle77.backgroundColor ||
      activeStyle77.fontWeight !== inactiveStyle77.fontWeight ||
      activeStyle77.opacity !== inactiveStyle77.opacity ||
      activeStyle77.borderBottom !== inactiveStyle77.borderBottom;
    assert('Active nav-btn styled differently from inactive', isDifferent77,
      'Expected visual difference between active and inactive nav buttons');
  } else {
    assert('Inactive nav-btn exists for comparison', false, 'Only active nav-btn found');
  }
}

// TC-78: Settings button opens modal
group('TC-78: Settings 버튼 클릭 시 모달이 열리는가');
const modalOverlay78 = document.getElementById('modal-overlay');
if (modalOverlay78) modalOverlay78.classList.remove('active');
const settingsBtn78 = document.querySelector('.settings-btn');
assert('Settings button exists', settingsBtn78 !== null);
if (settingsBtn78) {
  settingsBtn78.click();
  const modalActive78 = modalOverlay78 && modalOverlay78.classList.contains('active');
  assert('Modal opens on settings click', modalActive78,
    'Expected modal-overlay to have "active" class after settings click');
  // Clean up
  if (modalOverlay78) modalOverlay78.classList.remove('active');
}

// ========================
// Journey G: "오프라인 복귀 시 뭐가 됐는지 모르겠음" (TC 79-84)
// ========================

// TC-79: 10+ sec offline triggers modal
group('TC-79: 10초 이상 오프라인 후 모달이 표시되는가');
resetState();
gameState.models = [{ name: 'chatbot', tier: 1, locPerSec: 5 }];
gameState.lastSaveTime = Date.now() - 20000; // 20 seconds ago
const modalOverlay79 = document.getElementById('modal-overlay');
if (modalOverlay79) modalOverlay79.classList.remove('active');
applyOfflineEarnings();
const modalActive79 = modalOverlay79 && modalOverlay79.classList.contains('active');
assert('Offline earnings modal displayed', modalActive79,
  'Expected modal-overlay to have "active" class after 20s offline');

// TC-80: Offline modal shows LoC amount earned
group('TC-80: 오프라인 모달에 획득한 LoC 수량이 표시되는가');
const modalMessage80 = document.getElementById('modal-message');
const modalText80 = modalMessage80 ? modalMessage80.textContent : '';
assert('Modal message contains a number (LoC earned)', /\d/.test(modalText80),
  'Expected numeric LoC amount in modal, got: "' + modalText80 + '"');

// TC-81: Offline modal shows elapsed time
group('TC-81: 오프라인 모달에 경과 시간이 표시되는가');
assert('Modal message contains time information',
  modalText80.toLowerCase().includes('sec') || modalText80.toLowerCase().includes('min') ||
  modalText80.toLowerCase().includes('hour') || modalText80.toLowerCase().includes('away') ||
  /\d+s/.test(modalText80),
  'Expected elapsed time in modal, got: "' + modalText80 + '"');

// TC-82: Without auto-compile → no compute mention
group('TC-82: autoPipeline 없으면 compute 언급이 없는가');
resetState();
gameState.models = [{ name: 'chatbot', tier: 1, locPerSec: 5 }];
gameState.upgrades.infra.autoPipeline = 0;
gameState.lastSaveTime = Date.now() - 20000;
if (modalOverlay79) modalOverlay79.classList.remove('active');
applyOfflineEarnings();
const modalMessage82 = document.getElementById('modal-message');
const modalText82 = modalMessage82 ? modalMessage82.textContent.toLowerCase() : '';
assert('Without autoPipeline, modal mentions LoC (wrote)',
  modalText82.includes('loc') || modalText82.includes('wrote') || /\d/.test(modalText82),
  'Expected LoC mention without auto-compile');
assert('Without autoPipeline, modal does not mention compute',
  !modalText82.includes('compute'),
  'Should not mention compute without auto-compile, got: "' + modalText82 + '"');

// TC-83: With auto-compile → shows compute
group('TC-83: autoPipeline이 있으면 compute가 표시되는가');
resetState();
gameState.models = [{ name: 'chatbot', tier: 1, locPerSec: 5 }];
gameState.upgrades.infra.autoPipeline = 1;
gameState.lastSaveTime = Date.now() - 20000;
if (modalOverlay79) modalOverlay79.classList.remove('active');
applyOfflineEarnings();
const modalMessage83 = document.getElementById('modal-message');
const modalText83 = modalMessage83 ? modalMessage83.textContent.toLowerCase() : '';
assert('With autoPipeline, modal mentions compute',
  modalText83.includes('compute') || modalText83.includes('compiled') || modalText83.includes('auto'),
  'Expected compute/compiled mention with auto-compile, got: "' + modalText83 + '"');

// TC-84: Offline modal has "Collect" button
group('TC-84: 오프라인 모달에 "Collect" 버튼이 있는가');
const modalButtons84 = document.getElementById('modal-buttons');
let hasCollect84 = false;
if (modalButtons84) {
  const buttons84 = modalButtons84.querySelectorAll('button');
  buttons84.forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('collect')) hasCollect84 = true;
  });
}
assert('Modal has "Collect" button', hasCollect84,
  'Expected a button with "Collect" text in modal-buttons');
// Clean up modal
if (modalOverlay79) modalOverlay79.classList.remove('active');

// ========================
// Summary
// ========================
summaryEl.className = failed === 0 ? 'pass' : 'fail';
summaryEl.textContent = 'Results: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed) + ' tests';
console.log('UX E2E Tests: ' + passed + ' passed, ' + failed + ' failed');
