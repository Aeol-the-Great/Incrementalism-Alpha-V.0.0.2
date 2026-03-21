export const MAP_WIDTH = 30;
export const MAP_HEIGHT = 60;
export const HEX_SIZE = 30;

export const NODE_STATES = {
  EMPTY: 'Empty',
  BORDER: 'Border',
  PRODUCTIVE: 'Productive',
  OFFENSIVE: 'Offensive',
  DEFENSIVE: 'Defensive',
  ADVANCE: 'Advance',
  CORE: 'Core',
  SALTED: 'Salted'
};

export const NODE_OWNERS = {
  NEUTRAL: 'neutral',
  PLAYER: 'player',
  ENEMY: 'enemy'
};

export const COSTS = {
  EXPAND: 50,
  CONVERT: 25,
  UPGRADE_ADVANCE: 200,
};

export const MAX_HP = {
  [NODE_STATES.EMPTY]: 50,
  [NODE_STATES.BORDER]: 50,
  [NODE_STATES.PRODUCTIVE]: 75,
  [NODE_STATES.OFFENSIVE]: 75,
  [NODE_STATES.ADVANCE]: 150,
  [NODE_STATES.DEFENSIVE]: 200,
  [NODE_STATES.CORE]: 500,
  [NODE_STATES.SALTED]: 50
};

export const STRIKES = {
  STANDARD: { name: 'Standard Missile', cost: 40, dmg: 25, effect: 'stun', duration: 2000 },
  INCENDIARY: { name: 'Incendiary Missile', cost: 20, dmg: 10, effect: 'fire', duration: 6000, tickDps: 3 },
  COBALT: { name: 'Cobalt-60 Warhead', cost: 100, dmg: 15, effect: 'radioactive', duration: 30000 },
  EMP: { name: 'EMP Cruise Missile', cost: 150, dmg: 5, effect: 'blackout', duration: 12000, radius: 1 },
  ICBM: { name: 'ICBM (Silo-Breaker)', cost: 450, dmg: 60, effect: 'bunker_buster', multiplier: 2.5 },
  HARPOON: { name: 'Kinetic Harpoon', cost: 800, dmg: 0, effect: 'instant_claim' }
};

export const GAME_CONSTANTS = {
  BPS_PER_PROD: 5,
  BASE_EXPANSION_MS: 10000,
  DEFENSIVE_BONUS_MULT: 0.5,
  CORE_EXPANSION_MS: 180000,
  REGEN_DELAY_MS: 15000,
  REGEN_RATE_PER_SEC: 2,
  OFFENSIVE_MISSILE_CAP: 10
};
