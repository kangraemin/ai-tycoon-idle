// upgrade.js - AI upgrade system (4 categories, 13 upgrades)

const UPGRADE_DEFS = {
  agent: {
    toolUse:    { name: 'Tool Use',    baseCost: 500,  description: 'Better tool integration' },
    memory:     { name: 'Memory',      baseCost: 800,  description: 'Longer context retention' },
    planning:   { name: 'Planning',    baseCost: 1200, description: 'Multi-step reasoning' },
  },
  teamAgent: {
    multiAgent:   { name: 'Multi-Agent',   baseCost: 1000, description: 'Run parallel agents' },
    orchestrator: { name: 'Orchestrator',   baseCost: 1500, description: 'Coordinate agent teams' },
    delegation:   { name: 'Delegation',     baseCost: 2000, description: 'Smart task routing' },
  },
  skill: {
    rag:        { name: 'RAG',         baseCost: 300,  description: 'Retrieval-augmented generation' },
    fineTuning: { name: 'Fine-tuning', baseCost: 600,  description: 'Domain-specific training' },
    rlhf:       { name: 'RLHF',       baseCost: 1000, description: 'Human feedback alignment' },
  },
  infra: {
    batchSize:    { name: 'Batch Size',    baseCost: 50,   description: 'Larger training batches' },
    distTraining: { name: 'Distributed',   baseCost: 100,  description: 'Multi-GPU training' },
    quantization: { name: 'Quantization',  baseCost: 200,  description: 'Model compression' },
    autoPipeline: { name: 'Auto Pipeline', baseCost: 500,  description: 'Automated CI/CD for models' },
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
