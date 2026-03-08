// upgrade.js - Upgrade system

const UPGRADE_DEFS = {
  tapPower: {
    name: 'Tap Power',
    description: 'Increase jelly per tap',
    baseCost: 50,
    icon: 'tap',
  },
  productionSpeed: {
    name: 'Production Speed',
    description: 'Boost all slime production',
    baseCost: 100,
    icon: 'speed',
  },
  jellyValue: {
    name: 'Jelly Value',
    description: 'Increase gold per jelly sold',
    baseCost: 200,
    icon: 'value',
  },
  autoSell: {
    name: 'Auto Sell',
    description: 'Auto-sell jelly periodically',
    baseCost: 500,
    icon: 'autoSell',
  },
};

function getUpgradeCost(upgradeId) {
  const def = UPGRADE_DEFS[upgradeId];
  const level = gameState.upgrades[upgradeId];
  return Math.floor(def.baseCost * Math.pow(1.5, level));
}

function getUpgradeEffect(upgradeId) {
  const level = gameState.upgrades[upgradeId];
  if (upgradeId === 'autoSell') {
    if (level === 0) return 'Off';
    const interval = Math.max(1, 11 - level);
    return `Every ${interval}s`;
  }
  return level;
}

function getUpgradeNextEffect(upgradeId) {
  const level = gameState.upgrades[upgradeId] + 1;
  if (upgradeId === 'autoSell') {
    const interval = Math.max(1, 11 - level);
    return `Every ${interval}s`;
  }
  return level;
}

function buyUpgrade(upgradeId) {
  const cost = getUpgradeCost(upgradeId);
  if (gameState.gold < cost) return false;
  gameState.gold -= cost;
  gameState.upgrades[upgradeId]++;
  return true;
}

function buySlime(slimeId) {
  const def = SLIME_DEFS[slimeId];
  if (def.unlockCost < 0) return false;
  if (gameState.gold < def.unlockCost) return false;

  const owned = getOwnedSlimes().length;
  if (owned >= gameState.ranchSlots) return false;

  const slimeState = getSlimeState(slimeId);
  if (slimeState.count > 0) return false;

  gameState.gold -= def.unlockCost;
  slimeState.count = 1;
  return true;
}

function levelUpSlime(slimeId) {
  const slimeState = getSlimeState(slimeId);
  if (slimeState.count <= 0) return false;
  const cost = getSlimeLevelUpCost(slimeState);
  if (gameState.gold < cost) return false;
  gameState.gold -= cost;
  slimeState.level++;
  return true;
}

function buyRanchSlot() {
  const cost = getRanchSlotCost();
  if (gameState.gold < cost) return false;
  gameState.gold -= cost;
  gameState.ranchSlots++;
  return true;
}

function getRanchSlotCost() {
  return Math.floor(1000 * Math.pow(2, gameState.ranchSlots - 5));
}
