// state.js - Game state management + localStorage save/load

const SAVE_KEY = 'aiTycoon';

function createDefaultState() {
  return {
    // Resources
    loc: 0,
    compute: 0,
    papers: 10,
    totalLoc: 0,
    reputation: 0,
    tokens: 5,
    lastTokenRecharge: Date.now(),

    // Models (10 types per spec)
    models: [
      { id: 'chatbot', level: 1, count: 1 },
      { id: 'translator', level: 1, count: 0 },
      { id: 'summarizer', level: 1, count: 0 },
      { id: 'imageGen', level: 1, count: 0 },
      { id: 'codeGen', level: 1, count: 0 },
      { id: 'voiceAI', level: 1, count: 0 },
      { id: 'reasoning', level: 1, count: 0 },
      { id: 'multimodal', level: 1, count: 0 },
      { id: 'agi', level: 1, count: 0 },
      { id: 'superAgi', level: 1, count: 0 },
    ],

    // Upgrades (4 categories)
    upgrades: {
      agent: { toolUse: 0, memory: 0, planning: 0 },
      teamAgent: { multiAgent: 0, orchestrator: 0, delegation: 0 },
      skill: { rag: 0, fineTuning: 0, rlhf: 0 },
      infra: { batchSize: 0, distTraining: 0, quantization: 0, autoPipeline: 0 },
    },

    // Systems
    gpuSlots: 1,
    careerStage: 0,
    careerHistory: [],
    prestigeMultiplier: 1,
    discoveredFusions: [],
    challengeStats: { played: 0, bestGrade: null },
    eventStats: { total: 0, responded: 0 },
    lastEventTime: Date.now(),

    // Stats
    stats: {
      totalTaps: 0,
      totalCompiles: 0,
      totalCompute: 0,
      modelsOwned: 1,
      gachaPulls: 0,
    },

    achievements: {},
    tutorialStep: 0,
    settings: { sfx: true, music: false, notifications: true },

    lastSaveTime: Date.now(),
    totalPlayTime: 0,
  };
}

let gameState = createDefaultState();

function saveGame() {
  gameState.lastSaveTime = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const defaults = createDefaultState();

      // Safe merge: primitives
      for (const key of ['loc', 'compute', 'papers', 'totalLoc',
                          'tokens', 'reputation', 'gpuSlots', 'careerStage',
                          'prestigeMultiplier', 'lastSaveTime', 'totalPlayTime',
                          'lastTokenRecharge', 'lastEventTime', 'tutorialStep']) {
        if (parsed[key] !== undefined) defaults[key] = parsed[key];
      }

      // Safe merge: arrays
      if (Array.isArray(parsed.careerHistory)) defaults.careerHistory = parsed.careerHistory;
      if (Array.isArray(parsed.discoveredFusions)) defaults.discoveredFusions = parsed.discoveredFusions;

      // Safe merge: upgrades (nested)
      if (parsed.upgrades) {
        for (const category of Object.keys(defaults.upgrades)) {
          if (parsed.upgrades[category]) {
            for (const key of Object.keys(defaults.upgrades[category])) {
              if (parsed.upgrades[category][key] !== undefined) {
                defaults.upgrades[category][key] = parsed.upgrades[category][key];
              }
            }
          }
        }
      }

      // Safe merge: settings
      if (parsed.settings) {
        for (const key of Object.keys(defaults.settings)) {
          if (parsed.settings[key] !== undefined) defaults.settings[key] = parsed.settings[key];
        }
      }

      // Safe merge: stats
      if (parsed.stats) {
        for (const key of Object.keys(defaults.stats)) {
          if (parsed.stats[key] !== undefined) defaults.stats[key] = parsed.stats[key];
        }
      }

      // Safe merge: achievements
      if (parsed.achievements) defaults.achievements = parsed.achievements;

      // Safe merge: challengeStats
      if (parsed.challengeStats) {
        for (const key of Object.keys(defaults.challengeStats)) {
          if (parsed.challengeStats[key] !== undefined) defaults.challengeStats[key] = parsed.challengeStats[key];
        }
      }

      // Safe merge: eventStats
      if (parsed.eventStats) {
        for (const key of Object.keys(defaults.eventStats)) {
          if (parsed.eventStats[key] !== undefined) defaults.eventStats[key] = parsed.eventStats[key];
        }
      }

      // Safe merge: models
      if (parsed.models) {
        for (const defaultModel of defaults.models) {
          const savedModel = parsed.models.find(m => m.id === defaultModel.id);
          if (savedModel) {
            defaultModel.level = savedModel.level || 1;
            defaultModel.count = savedModel.count || 0;
          }
        }
      }

      gameState = defaults;
      return true;
    }
  } catch (e) {
    console.warn('Load failed:', e);
  }
  return false;
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  gameState = createDefaultState();
}
