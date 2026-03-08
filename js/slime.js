// slime.js - Slime definitions (types, production, grades)

const SLIME_DEFS = {
  normal:   { name: 'Green Slime',    baseJelly: 1,    unlockCost: 0,         rarity: 'common',    color1: '#77dd77', color2: '#4caf50', emoji: '' },
  fire:     { name: 'Fire Slime',     baseJelly: 3,    unlockCost: 100,       rarity: 'common',    color1: '#ff6b35', color2: '#ff4500', emoji: '' },
  ice:      { name: 'Ice Slime',      baseJelly: 5,    unlockCost: 500,       rarity: 'uncommon',  color1: '#74b9ff', color2: '#0984e3', emoji: '' },
  poison:   { name: 'Poison Slime',   baseJelly: 8,    unlockCost: 2000,      rarity: 'uncommon',  color1: '#a29bfe', color2: '#6c5ce7', emoji: '' },
  electric: { name: 'Electric Slime', baseJelly: 15,   unlockCost: 10000,     rarity: 'rare',      color1: '#ffeaa7', color2: '#fdcb6e', emoji: '' },
  water:    { name: 'Water Slime',    baseJelly: 25,   unlockCost: 50000,     rarity: 'rare',      color1: '#81ecec', color2: '#00cec9', emoji: '' },
  earth:    { name: 'Earth Slime',    baseJelly: 50,   unlockCost: 250000,    rarity: 'epic',      color1: '#e17055', color2: '#d63031', emoji: '' },
  wind:     { name: 'Wind Slime',     baseJelly: 100,  unlockCost: 1000000,   rarity: 'epic',      color1: '#dfe6e9', color2: '#b2bec3', emoji: '' },
  gold:     { name: 'Gold Slime',     baseJelly: 250,  unlockCost: -1,        rarity: 'legendary', color1: '#ffd700', color2: '#ff8c00', emoji: '' },
  diamond:  { name: 'Diamond Slime',  baseJelly: 1000, unlockCost: -1,        rarity: 'legendary', color1: '#e0f7fa', color2: '#80deea', emoji: '' },
};

const RARITY_COLORS = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

function getSlimeState(id) {
  return gameState.slimes.find(s => s.id === id);
}

function getSlimeDef(id) {
  return SLIME_DEFS[id];
}

function getSlimeJellyPerSecond(slimeState) {
  const def = SLIME_DEFS[slimeState.id];
  return def.baseJelly * slimeState.level * slimeState.count;
}

function getSlimeLevelUpCost(slimeState) {
  const def = SLIME_DEFS[slimeState.id];
  const baseCost = def.unlockCost > 0 ? def.unlockCost : 100000;
  return Math.floor(baseCost * Math.pow(1.5, slimeState.level - 1));
}

function getOwnedSlimes() {
  return gameState.slimes.filter(s => s.count > 0);
}
