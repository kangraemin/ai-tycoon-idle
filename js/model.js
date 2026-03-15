// model.js - AI Model definitions (types, production, grades)

const MODEL_DEFS = {
  chatbot:    { name: 'Chatbot',            baseLps: 1,       unlockCost: 0,       rarity: 'common',    color: '#77dd77', codeTheme: 'NLP',              description: 'Generates human-like text responses' },
  translator: { name: 'Translator',         baseLps: 5,       unlockCost: 100,     rarity: 'common',    color: '#74b9ff', codeTheme: 'Translation',      description: 'Translates text between languages' },
  summarizer: { name: 'Summarizer',         baseLps: 25,      unlockCost: 500,     rarity: 'uncommon',  color: '#a29bfe', codeTheme: 'Summarization',    description: 'Condenses long documents into key points' },
  imageGen:   { name: 'Image Gen',          baseLps: 125,     unlockCost: 2000,    rarity: 'uncommon',  color: '#fd79a8', codeTheme: 'Vision',           description: 'Creates images from text descriptions' },
  codeGen:    { name: 'Code Gen',           baseLps: 625,     unlockCost: 10000,   rarity: 'rare',      color: '#fdcb6e', codeTheme: 'CodeGen',          description: 'Writes and completes source code' },
  voiceAI:    { name: 'Voice AI',           baseLps: 3125,    unlockCost: 50000,   rarity: 'rare',      color: '#e17055', codeTheme: 'Audio',            description: 'Converts speech to text and back' },
  reasoning:  { name: 'Reasoning',          baseLps: 15625,   unlockCost: 250000,  rarity: 'epic',      color: '#6c5ce7', codeTheme: 'Reasoning',        description: 'Solves complex problems step by step' },
  multimodal: { name: 'Multimodal',         baseLps: 78125,   unlockCost: 1000000, rarity: 'epic',      color: '#00cec9', codeTheme: 'Multimodal',       description: 'Understands text, images, and audio together' },
  agi:        { name: 'AGI',                baseLps: 390625,  unlockCost: -1,      rarity: 'legendary', color: '#ffd700', codeTheme: 'General AI',       description: 'Handles any intellectual task autonomously' },
  superAgi:   { name: 'Super Intelligence', baseLps: 1953125, unlockCost: -1,      rarity: 'legendary', color: '#ff6348', codeTheme: 'Superintelligence', description: 'Optimizes and improves entire systems' },
};

const RARITY_COLORS = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

function getModelState(id) {
  return gameState.models.find(m => m.id === id);
}

function getModelDef(id) {
  return MODEL_DEFS[id];
}

function getModelLps(modelState) {
  const def = MODEL_DEFS[modelState.id];
  if (!def) return 0;
  const countBonus = modelState.count <= 1 ? modelState.count : Math.sqrt(modelState.count);
  return def.baseLps * modelState.level * countBonus;
}

function getModelLevelUpCost(modelState) {
  const def = MODEL_DEFS[modelState.id];
  if (!def) return Infinity;
  const baseCost = def.unlockCost > 0 ? def.unlockCost : 100000;
  const raw = Math.floor(baseCost * Math.pow(1.5, modelState.level - 1));
  const discount = getUpgradeEffect('skill', 'fineTuning');
  return Math.max(1, Math.floor(raw * (1 - discount)));
}

function getOwnedModels() {
  return gameState.models.filter(m => m.count > 0);
}
