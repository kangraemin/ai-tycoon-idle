// state.js - Game state management + localStorage save/load

const SAVE_KEY = 'slimeRanchIdle';

function createDefaultState() {
  return {
    gold: 0,
    jelly: 0,
    gems: 10,
    totalJelly: 0,

    slimes: [
      { id: 'normal', level: 1, count: 1 },
      { id: 'fire', level: 1, count: 0 },
      { id: 'ice', level: 1, count: 0 },
      { id: 'poison', level: 1, count: 0 },
      { id: 'electric', level: 1, count: 0 },
      { id: 'water', level: 1, count: 0 },
      { id: 'earth', level: 1, count: 0 },
      { id: 'wind', level: 1, count: 0 },
      { id: 'gold', level: 1, count: 0 },
      { id: 'diamond', level: 1, count: 0 },
    ],

    upgrades: {
      tapPower: 1,
      productionSpeed: 1,
      jellyValue: 1,
      autoSell: 0,
    },

    ranchSlots: 5,
    prestigeLevel: 0,
    prestigeMultiplier: 1,

    lastSaveTime: Date.now(),
    totalPlayTime: 0,
    settings: {
      musicOn: true,
      sfxOn: true,
    },

    stats: {
      totalTaps: 0,
      totalSells: 0,
      totalGold: 0,
      gachaPulls: 0,
      slimesOwned: 1,
    },

    achievements: {},
    tutorialStep: 0,
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
      for (const key of ['gold', 'jelly', 'gems', 'totalJelly', 'ranchSlots',
                          'prestigeLevel', 'prestigeMultiplier', 'lastSaveTime', 'totalPlayTime', 'tutorialStep']) {
        if (parsed[key] !== undefined) defaults[key] = parsed[key];
      }

      // Safe merge: upgrades (preserve new keys from defaults)
      if (parsed.upgrades) {
        for (const key of Object.keys(defaults.upgrades)) {
          if (parsed.upgrades[key] !== undefined) defaults.upgrades[key] = parsed.upgrades[key];
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
      if (parsed.achievements) {
        defaults.achievements = parsed.achievements;
      }

      // Safe merge: slimes (restore saved data + keep new slime types)
      if (parsed.slimes) {
        for (const defaultSlime of defaults.slimes) {
          const savedSlime = parsed.slimes.find(s => s.id === defaultSlime.id);
          if (savedSlime) {
            defaultSlime.level = savedSlime.level || 1;
            defaultSlime.count = savedSlime.count || 0;
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
