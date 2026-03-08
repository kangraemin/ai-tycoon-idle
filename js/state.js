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
      gameState = Object.assign(createDefaultState(), parsed);
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
