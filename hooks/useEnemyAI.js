import { useEffect, useRef } from 'react';
import { getNeighbors } from '../utils/hexUtils';
import { NODE_OWNERS, NODE_STATES, COSTS, STRIKES } from '../utils/constants';

export function useEnemyAI(engine, difficulty) {
  const { nodes, startExpansion, launchStrike } = engine;
  const aiBitsRef = useRef(2000); // 10x mapped to new economy
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    let speedMult = 1;
    let cheatBps = 50;
    if (difficulty === 'easy') { speedMult = 1.5; cheatBps = 20; }
    if (difficulty === 'normal') { speedMult = 1; cheatBps = 75; }
    if (difficulty === 'hard') { speedMult = 0.6; cheatBps = 150; }
    if (difficulty === 'insane') { speedMult = 0.3; cheatBps = 300; }

    const interval = setInterval(() => {
      aiBitsRef.current += cheatBps;
      
      const currentNodes = nodesRef.current;
      const enemyNodes = [];
      const enemyOffensive = [];
      const playerNodes = [];

      for (const key in currentNodes) {
        const n = currentNodes[key];
        if (n.owner === NODE_OWNERS.ENEMY) {
          enemyNodes.push(n);
          if (n.state === NODE_STATES.OFFENSIVE || n.state === NODE_STATES.CORE) enemyOffensive.push(n);
        } else if (n.owner === NODE_OWNERS.PLAYER) {
          playerNodes.push(n);
        }
      }

      // Action 1: Expansion
      if (aiBitsRef.current >= COSTS.EXPAND && enemyNodes.length > 0) {
        const source = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];
        const nbs = getNeighbors(source.q, source.r);
        const validTargets = nbs.filter(nb => {
          const targetNode = currentNodes[`${nb.q},${nb.r}`];
          return targetNode && targetNode.owner !== NODE_OWNERS.ENEMY;
        });

        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(Math.random() * validTargets.length)];
          startExpansion(source, currentNodes[`${target.q},${target.r}`], true);
          aiBitsRef.current -= COSTS.EXPAND;
        }
      }

      // Action 2: Strike
      if (aiBitsRef.current >= STRIKES.STANDARD.cost && enemyOffensive.length > 0 && playerNodes.length > 0) {
        if (Math.random() > 0.4) {
            const source = enemyOffensive[Math.floor(Math.random() * enemyOffensive.length)];
            const target = playerNodes[Math.floor(Math.random() * playerNodes.length)];
            launchStrike('STANDARD', source.q, source.r, target.q, target.r, true);
            aiBitsRef.current -= STRIKES.STANDARD.cost;
        }
      }
    }, 2000 * speedMult);

    return () => clearInterval(interval);
  }, [difficulty, startExpansion, launchStrike]);
}
