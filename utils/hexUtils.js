import { MAP_WIDTH, MAP_HEIGHT, NODE_STATES, NODE_OWNERS, MAX_HP } from './constants';

export function hexToPixel(q, r, size) {
  // Pointy-top orientation with a 2/3rds node visual gap spacing
  const gap = 1.666;
  const x = size * gap * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * gap * ((3 / 2) * r);
  return { x, y };
}

export function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 }
  ];
}

export function distance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

export function getNodesInRange(q, r, range) {
  let results = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
      results.push({ q: q + dq, r: r + dr });
    }
  }
  return results;
}

export function generateInitialMap() {
  const nodes = {};

  // Generate an interlocking rectangular field
  for (let r = 0; r < MAP_HEIGHT; r++) {
    let r_offset = Math.floor(r / 2);
    for (let q = -r_offset; q < MAP_WIDTH - r_offset; q++) {
      const key = `${q},${r}`;
      nodes[key] = {
        q,
        r,
        state: NODE_STATES.EMPTY,
        owner: NODE_OWNERS.NEUTRAL,
        hp: MAX_HP[NODE_STATES.EMPTY],
        maxHp: MAX_HP[NODE_STATES.EMPTY],
        lastDamagedAt: 0,
        statusEffects: [] // e.g. { type: 'fire', endsAt: timestamp, source: id }
      };
    }
  }

  // Setup Cores
  const setupBase = (centerR, isPlayer) => {
    const r_offset = Math.floor(centerR / 2);
    const centerQ = Math.floor(MAP_WIDTH / 2) - r_offset;
    const owner = isPlayer ? NODE_OWNERS.PLAYER : NODE_OWNERS.ENEMY;

    // Core
    const coreKey = `${centerQ},${centerR}`;
    if (nodes[coreKey]) {
      nodes[coreKey] = {
        ...nodes[coreKey],
        state: NODE_STATES.CORE,
        owner: owner,
        hp: MAX_HP[NODE_STATES.CORE],
        maxHp: MAX_HP[NODE_STATES.CORE]
      };

      // Starting ring of Productive nodes
      const neighbors = getNeighbors(centerQ, centerR);
      neighbors.forEach(n => {
        const nKey = `${n.q},${n.r}`;
        if (nodes[nKey]) {
          nodes[nKey] = {
            ...nodes[nKey],
            state: NODE_STATES.PRODUCTIVE,
            owner: owner,
            hp: MAX_HP[NODE_STATES.PRODUCTIVE],
            maxHp: MAX_HP[NODE_STATES.PRODUCTIVE]
          };
        }
      });
    }
  };

  // Player Base near top/bottom (let's say Player bottom, Enemy top)
  setupBase(MAP_HEIGHT - 5, true);
  setupBase(4, false);

  return nodes;
}
