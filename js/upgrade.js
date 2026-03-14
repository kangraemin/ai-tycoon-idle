// upgrade.js - AI upgrade system (4 categories, 13 upgrades)

const UPGRADE_DEFS = {
  agent: {
    toolUse:    { name: 'Tool Use',    baseCost: 500,  description: '+20% LoC/s per level' },
    memory:     { name: 'Memory',      baseCost: 800,  description: '+1h max offline time per level' },
    planning:   { name: 'Planning',    baseCost: 1200, description: '+1 challenge hint per level' },
  },
  teamAgent: {
    multiAgent:   { name: 'Multi-Agent',   baseCost: 1000, description: '+1 GPU slot per level' },
    orchestrator: { name: 'Orchestrator',   baseCost: 1500, description: '-15% auto-compile interval per level' },
    delegation:   { name: 'Delegation',     baseCost: 2000, description: '-10% fusion cost per level' },
  },
  skill: {
    rag:        { name: 'RAG',         baseCost: 300,  description: '+15% compile rate per level' },
    fineTuning: { name: 'Fine-tuning', baseCost: 600,  description: '-10% model level-up cost per level' },
    rlhf:       { name: 'RLHF',       baseCost: 1000, description: '+20% challenge rewards per level' },
  },
  infra: {
    batchSize:    { name: 'Batch Size',    baseCost: 50,   description: '+1 LoC per tap' },
    distTraining: { name: 'Distributed',   baseCost: 100,  description: '+10% LoC/s per level' },
    quantization: { name: 'Quantization',  baseCost: 200,  description: '-5% upgrade costs per level' },
    autoPipeline: { name: 'Auto Pipeline', baseCost: 500,  description: '+15% manual Compile bonus per level' },
  },
};

function getUpgradeEffect(category, id) {
  const level = gameState.upgrades[category][id];
  const effects = {
    'agent.toolUse':       level * 0.20,
    'agent.memory':        level * 3600,
    'agent.planning':      level,
    'teamAgent.multiAgent':   level,
    'teamAgent.orchestrator': level * 0.15,
    'teamAgent.delegation':   level * 0.10,
    'skill.rag':           level * 0.15,
    'skill.fineTuning':    level * 0.10,
    'skill.rlhf':          level * 0.20,
    'infra.batchSize':     level,
    'infra.distTraining':  level * 0.10,
    'infra.quantization':  level * 0.05,
    'infra.autoPipeline':  level,
  };
  return effects[category + '.' + id] || 0;
}

function getUpgradeCost(category, id) {
  const def = UPGRADE_DEFS[category][id];
  const level = gameState.upgrades[category][id];
  const raw = Math.floor(def.baseCost * Math.pow(1.5, level));
  const discount = getUpgradeEffect('infra', 'quantization');
  return Math.max(1, Math.floor(raw * (1 - discount)));
}

function getEffectiveGpuSlots() {
  return gameState.gpuSlots + getUpgradeEffect('teamAgent', 'multiAgent');
}

function buyUpgrade(category, id) {
  const cost = getUpgradeCost(category, id);
  if (gameState.compute < cost) return false;
  gameState.compute -= cost;
  gameState.upgrades[category][id]++;
  return true;
}

function getGpuSlotCost() {
  return Math.floor(1000 * Math.pow(2, gameState.gpuSlots - 1));
}

function buyGpuSlot() {
  const cost = getGpuSlotCost();
  if (gameState.compute < cost) return false;
  gameState.compute -= cost;
  gameState.gpuSlots++;
  return true;
}
