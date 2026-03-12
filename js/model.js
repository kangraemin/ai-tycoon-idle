// model.js - AI Model definitions (types, production, grades)

const MODEL_DEFS = {
  chatbot:     { name: 'Chatbot',       baseLps: 1,    unlockCost: 0,         rarity: 'common',    color: '#77dd77', codeTheme: 'NLP',           codeSnippet: 'response = model.generate(prompt)' },
  classifier:  { name: 'Classifier',    baseLps: 3,    unlockCost: 100,       rarity: 'common',    color: '#ff6b35', codeTheme: 'Classification', codeSnippet: 'label = model.predict(input_data)' },
  summarizer:  { name: 'Summarizer',    baseLps: 5,    unlockCost: 500,       rarity: 'uncommon',  color: '#74b9ff', codeTheme: 'Summarization',  codeSnippet: 'summary = model.summarize(document)' },
  translator:  { name: 'Translator',    baseLps: 8,    unlockCost: 2000,      rarity: 'uncommon',  color: '#a29bfe', codeTheme: 'Translation',    codeSnippet: 'text = model.translate(source, lang)' },
  codeAssist:  { name: 'Code Assistant', baseLps: 15,  unlockCost: 10000,     rarity: 'rare',      color: '#ffeaa7', codeTheme: 'CodeGen',        codeSnippet: 'code = model.complete(context)' },
  imageGen:    { name: 'Image Gen',     baseLps: 25,   unlockCost: 50000,     rarity: 'rare',      color: '#81ecec', codeTheme: 'Vision',         codeSnippet: 'img = model.generate_image(prompt)' },
  speechRec:   { name: 'Speech Rec',    baseLps: 50,   unlockCost: 250000,    rarity: 'epic',      color: '#e17055', codeTheme: 'Audio',          codeSnippet: 'text = model.transcribe(audio)' },
  recommender: { name: 'Recommender',   baseLps: 100,  unlockCost: 1000000,   rarity: 'epic',      color: '#dfe6e9', codeTheme: 'RecSys',         codeSnippet: 'items = model.recommend(user)' },
  agi:         { name: 'AGI',           baseLps: 250,  unlockCost: -1,        rarity: 'legendary', color: '#ffd700', codeTheme: 'General AI',     codeSnippet: 'result = agi.solve(any_problem)' },
  superAgi:    { name: 'Super AGI',     baseLps: 1000, unlockCost: -1,        rarity: 'legendary', color: '#e0f7fa', codeTheme: 'Superintelligence', codeSnippet: 'future = super_agi.optimize(world)' },
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
  const countBonus = modelState.count <= 1 ? modelState.count : Math.sqrt(modelState.count);
  return def.baseLps * modelState.level * countBonus;
}

function getModelLevelUpCost(modelState) {
  const def = MODEL_DEFS[modelState.id];
  const baseCost = def.unlockCost > 0 ? def.unlockCost : 100000;
  const raw = Math.floor(baseCost * Math.pow(1.5, modelState.level - 1));
  const discount = getUpgradeEffect('skill', 'fineTuning');
  return Math.max(1, Math.floor(raw * (1 - discount)));
}

function getOwnedModels() {
  return gameState.models.filter(m => m.count > 0);
}
