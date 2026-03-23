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
  SALTED: 'Salted',
  UNDER_CONSTRUCTION: 'Under Construction',
  HARPOON: 'Harpoon Protocol'
};

export const NODE_OWNERS = {
  NEUTRAL: 'neutral',
  PLAYER: 'player',
  ENEMY: 'enemy'
};

export const COSTS = {
  EXPAND: 500, // 10x multiplier
  CONVERT: 250, // 10x multiplier
  UPGRADE_ADVANCE: 2000, // 10x multiplier
};

export const CONSTRUCTION_TIMES_MS = {
  [NODE_STATES.PRODUCTIVE]: 30000,
  [NODE_STATES.DEFENSIVE]: 40000,
  [NODE_STATES.OFFENSIVE]: 45000,
  [NODE_STATES.ADVANCE]: 15000,
};

export const MAX_HP = {
  [NODE_STATES.EMPTY]: 50,
  [NODE_STATES.BORDER]: 50,
  [NODE_STATES.PRODUCTIVE]: 75,
  [NODE_STATES.OFFENSIVE]: 75,
  [NODE_STATES.ADVANCE]: 150,
  [NODE_STATES.DEFENSIVE]: 200,
  [NODE_STATES.CORE]: 500,
  [NODE_STATES.SALTED]: 50,
  [NODE_STATES.UNDER_CONSTRUCTION]: 50,
  [NODE_STATES.HARPOON]: 150
};

export const NODE_DESCRIPTIONS = {
  [NODE_STATES.PRODUCTIVE]: 'Generates Bits (λ) passively over time to fund the war effort.',
  [NODE_STATES.DEFENSIVE]: 'Heavily armored bastion. High HP.',
  [NODE_STATES.OFFENSIVE]: 'Manufacturing hub. Each node adds +1 parallel factory thread for assembling ordnance.',
  [NODE_STATES.ADVANCE]: 'Upgraded command node. Doubles HP and reinforces grid authority.'
};

export const STRIKES = {
  STANDARD: { name: 'Standard Missile', cost: 400, dmg: 25, effect: 'stun', duration: 2000, prodTime: 15000, desc: 'Forged in the fires of Dundee. Deals moderate damage and briefly stuns enemy goblins... er, nodes.' },
  INCENDIARY: { name: 'Incendiary Missile', cost: 200, dmg: 10, effect: 'fire', duration: 6000, tickDps: 3, prodTime: 20000, desc: 'By the power of the Astral Hammer! Ignites the target hex. Deals low initial damage but burns continuously like cosmic chaos.' },
  COBALT: { name: 'Cobalt-60 Warhead', cost: 1000, dmg: 15, effect: 'radioactive', duration: 30000, prodTime: 20000, desc: 'A toxic spell straight from Zargothrax himself. Irradiates the target, halving enemy production and regeneration for 30s.' },
  EMP: { name: 'EMP Cruise Missile', cost: 1500, dmg: 5, effect: 'blackout', duration: 12000, radius: 1, prodTime: 25000, desc: 'Powered by the cybernetic heart of the Hootsman. Massive blackout radius. Disables all node functions and defenses temporarily.' },
  ICBM: { name: 'ICBM (Silo-Breaker)', cost: 4500, dmg: 60, effect: 'bunker_buster', multiplier: 2.5, prodTime: 40000, desc: 'The legendary Laser Dragon Fire. Heavy bunker buster. Deals 2.5x damage against Defensive structures.' },
  HARPOON: { name: 'Protocol Node', cost: 8000, dmg: 0, effect: 'instant_claim', prodTime: 60000, desc: 'Fly high, Space Knights of Crail! Fires an expansion pod into enemy territory, instantly converting it to a Player Border.' },
  FOR_AMERICA: { name: 'FOR AMERICA!!!!', cost: 10000, dmg: 0, effect: 'freedom', radius: 3, prodTime: 0, desc: 'FOR THE KING OF SPACE DUNDEE!!!! OBLITERATION.' }
};

export const GAME_CONSTANTS = {
  BPS_PER_PROD: 50,
  BASE_EXPANSION_MS: 10000,
  DEFENSIVE_BONUS_MULT: 0.5,
  CORE_EXPANSION_MS: 180000,
  REGEN_DELAY_MS: 15000,
  REGEN_RATE_PER_SEC: 2,
  OFFENSIVE_MISSILE_CAP: 10
};
