import { useEffect, useRef } from 'react';
import { getNeighbors } from '../utils/hexUtils';
import { NODE_OWNERS, NODE_STATES, COSTS, STRIKES } from '../utils/constants';

export function useEnemyAI(nodes, startExpansion, launchStrike) {
  const aiBitsRef = useRef(200);
  const nodesRef = useRef(nodes);

  // Sync ref to avoid creating closures on setInterval
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Passive AI Income (Sandboxed)
      aiBitsRef.current += 15;
      
      const currentNodes = nodesRef.current;
      const enemyNodes = [];
      const enemyOffensive = [];
      const playerNodes = [];

      for (const key in currentNodes) {
        const n = currentNodes[key];
        if (n.owner === NODE_OWNERS.ENEMY) {
          enemyNodes.push(n);
          if (n.state === NODE_STATES.OFFENSIVE || n.state === NODE_STATES.CORE) {
            enemyOffensive.push(n);
          }
        } else if (n.owner === NODE_OWNERS.PLAYER) {
          playerNodes.push(n);
        }
      }

      // Action 1: Expansion
      if (aiBitsRef.current >= COSTS.EXPAND && enemyNodes.length > 0) {
        // Pick a random enemy node
        const source = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];
        const nbs = getNeighbors(source.q, source.r);
        
        // Find adjacent empty or player nodes
        const validTargets = nbs.filter(nb => {
          const nk = `${nb.q},${nb.r}`;
          const targetNode = currentNodes[nk];
          return targetNode && targetNode.owner !== NODE_OWNERS.ENEMY;
        });

        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(Math.random() * validTargets.length)];
          const targetNode = currentNodes[`${target.q},${target.r}`];
          startExpansion(source, targetNode, true); // true = isAI flag
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
    }, 2000);

    return () => clearInterval(interval);
  }, [startExpansion, launchStrike]);
}
