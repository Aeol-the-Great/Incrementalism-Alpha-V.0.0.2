import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  generateInitialMap, 
  getNeighbors, 
  distance,
  getNodesInRange
} from '../utils/hexUtils';
import { 
  NODE_STATES, 
  NODE_OWNERS, 
  COSTS, 
  MAX_HP, 
  GAME_CONSTANTS,
  STRIKES,
  CONSTRUCTION_TIMES_MS,
  UPGRADES
} from '../utils/constants';

export function useGameEngine() {
  const [nodes, setNodes] = useState(() => generateInitialMap());
  const nodesRef = useRef(nodes);
  const [bits, setBits] = useState(100);
  const [bps, setBps] = useState(0);
  const [inventory, setInventory] = useState({
    STANDARD: 0, INCENDIARY: 0, COBALT: 0, EMP: 0, ICBM: 0, HARPOON: 0, FOR_AMERICA: 0
  });
  const [upgrades, setUpgrades] = useState({
    BPS: 0, HP: 0, EXPANSION: 0, ASSEMBLY: 0, DAMAGE: 0, REGEN: 0
  });

  // Sync ref to state
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const upgradesRef = useRef(upgrades);
  useEffect(() => { upgradesRef.current = upgrades; }, [upgrades]);

  // High-frequency volatile state kept in refs to avoid mass re-rendering
  const activeExpansionsRef = useRef({}); 
  const activeConstructionRef = useRef({});
  const ammoQueueRef = useRef([]);
  const strikesRef = useRef([]);
  const explosionsRef = useRef([]);

  // Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let tickAccumulator = 0;

    const loop = (time) => {
      const dt = time - lastTime;
      lastTime = time;
      tickAccumulator += dt;

      let nodesChanged = false;
      const nextNodes = { ...nodesRef.current };

      // 1. Process Active Expansions
      for (const targetKey in activeExpansionsRef.current) {
        const exp = activeExpansionsRef.current[targetKey];
        // Calculate dynamic speed based on number of sources
        const speedMult = exp.speedMult * (1.0 + (0.10 * (exp.sources.length - 1))) * (exp.owner === NODE_OWNERS.PLAYER ? 1 + upgradesRef.current.EXPANSION * 0.10 : 1);
        
        // Check for Hot zones (Cobalt-60)
        const targetNode = nextNodes[targetKey];
        const isHot = targetNode?.statusEffects.some(e => e.type === 'radioactive' && e.endsAt > time);
        if (isHot) continue; // Pause expansion

        exp.progress += (dt / exp.baseDuration) * speedMult;

        if (exp.progress >= 1) {
          // Claim Node!
          nodesChanged = true;
          const owner = nextNodes[exp.sources[0]].owner;
          const oldState = nextNodes[targetKey].state;
          const hpMult = owner === NODE_OWNERS.PLAYER ? 1 + upgradesRef.current.HP * 0.15 : 1;
          const newMax = Math.floor(MAX_HP[NODE_STATES.BORDER] * hpMult);
          
          nextNodes[targetKey] = {
            ...nextNodes[targetKey],
            owner,
            state: NODE_STATES.BORDER,
            hp: newMax,
            maxHp: newMax
          };
          
          delete activeExpansionsRef.current[targetKey];
        }
      }

      // 1b. Process Nodes Under Construction
      for (const key in activeConstructionRef.current) {
         const build = activeConstructionRef.current[key];
         build.progress += dt / build.totalTime;
         if (build.progress >= 1) {
             const hpMult = nextNodes[key].owner === NODE_OWNERS.PLAYER ? 1 + upgradesRef.current.HP * 0.15 : 1;
             const baseMax = MAX_HP[build.type] || nextNodes[key].maxHp;
             const newMax = Math.floor(baseMax * hpMult);
             nextNodes[key] = {
                ...nextNodes[key],
                state: build.type,
                hp: newMax,
                maxHp: newMax
             };
             delete activeConstructionRef.current[key];
             nodesChanged = true;
         }
      }

      // 1c. Process Ammo Production
      let offensiveCount = 0;
      for (const k in nextNodes) {
         if (nextNodes[k].owner === NODE_OWNERS.PLAYER && nextNodes[k].state === NODE_STATES.OFFENSIVE) {
            const isBlackedOut = nextNodes[k].statusEffects.some(e => e.type === 'blackout');
            if (!isBlackedOut) offensiveCount++;
         }
      }

      let activeBuilders = 0;
      for (let i = 0; i < ammoQueueRef.current.length; i++) {
         if (activeBuilders >= offensiveCount) break; // Throttle to factory count
         const item = ammoQueueRef.current[i];
         const assemblyMult = 1 + upgradesRef.current.ASSEMBLY * 0.15;
         item.progress += (dt * assemblyMult) / item.totalTime;
         if (item.progress >= 1) {
            const t = item.type;
            setInventory(prev => ({ ...prev, [t]: (prev[t] || 0) + 1 }));
            ammoQueueRef.current.splice(i, 1);
            i--; // adjust loop index after splice
         }
         activeBuilders++;
      }

      // 2. Process Strikes hitting
      for (let i = strikesRef.current.length - 1; i >= 0; i--) {
        const strike = strikesRef.current[i];
        strike.progress += dt / strike.flightTime;

        if (strike.progress >= 1) {
           // Impact!
           const targetNode = nextNodes[strike.target];
           if (targetNode) {
              nodesChanged = true;
              const strikeData = STRIKES[strike.type];
              
              let accDelay = 0;
              for (let ex = 0; ex < 3; ex++) {
                 accDelay += 200 + Math.random() * 300;
                 explosionsRef.current.push({
                    id: Math.random().toString(),
                    target: strike.target,
                    delayStartsAt: time + accDelay,
                    duration: 500,
                    progress: 0,
                    offsetX: (Math.random() - 0.5) * 25,
                    offsetY: (Math.random() - 0.5) * 25
                 });
              }
              
              let damage = strikeData.dmg * (strike.owner === NODE_OWNERS.PLAYER ? 1 + upgradesRef.current.DAMAGE * 0.15 : 1);
              if (strikeData.effect === 'bunker_buster' && 
                  (targetNode.state === NODE_STATES.DEFENSIVE || targetNode.state === NODE_STATES.OFFENSIVE)) {
                 damage *= strikeData.multiplier;
              }

              if (strikeData.effect === 'instant_claim' && targetNode.state === NODE_STATES.EMPTY) {
                 const hpMult = strike.owner === NODE_OWNERS.PLAYER ? 1 + upgradesRef.current.HP * 0.15 : 1;
                 const newMax = Math.floor(MAX_HP[NODE_STATES.BORDER] * hpMult);
                 nextNodes[strike.target] = {
                   ...targetNode,
                   owner: strike.owner,
                   state: NODE_STATES.BORDER,
                   hp: newMax,
                   maxHp: newMax
                 };
              } else if (damage > 0) {
                 let updatedNode = { ...targetNode, hp: targetNode.hp - damage, lastDamagedAt: time };
                 
                 if (updatedNode.hp <= 0) {
                    updatedNode = {
                       ...updatedNode,
                       owner: NODE_OWNERS.NEUTRAL,
                       state: NODE_STATES.EMPTY,
                       hp: MAX_HP[NODE_STATES.EMPTY],
                       maxHp: MAX_HP[NODE_STATES.EMPTY]
                    };
                    // Cancel expansions if it was a source
                    for (const key in activeExpansionsRef.current) {
                       const exp = activeExpansionsRef.current[key];
                       exp.sources = exp.sources.filter(s => s !== strike.target);
                       if (exp.sources.length === 0) {
                         delete activeExpansionsRef.current[key];
                       }
                    }
                 }
                 nextNodes[strike.target] = updatedNode;
              }

              // Apply status effects
              if (strikeData.duration) {
                 if (strikeData.effect === 'blackout') {
                    const qArr = strike.target.split(',');
                    const rq = parseInt(qArr[0]), rr = parseInt(qArr[1]);
                    const affected = getNodesInRange(rq, rr, strikeData.radius || 1);
                    affected.forEach(pos => {
                       const k = `${pos.q},${pos.r}`;
                       if (nextNodes[k]) {
                          nextNodes[k] = {
                             ...nextNodes[k],
                             statusEffects: [
                               ...nextNodes[k].statusEffects,
                               { type: strikeData.effect, endsAt: time + strikeData.duration }
                             ]
                          };
                       }
                    });
                 } else {
                    const nodeToUpdate = nextNodes[strike.target] || targetNode;
                    nextNodes[strike.target] = {
                       ...nodeToUpdate,
                       statusEffects: [
                          ...nodeToUpdate.statusEffects,
                          { type: strikeData.effect, endsAt: time + strikeData.duration, tickDps: strikeData.tickDps || 0 }
                       ]
                    };
                 }
              }
           }
           strikesRef.current.splice(i, 1);
        }
      }

      // 2b. Process Explosions
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const ex = explosionsRef.current[i];
        if (time >= ex.delayStartsAt) {
            ex.progress += dt / ex.duration;
            if (ex.progress >= 1) {
                explosionsRef.current.splice(i, 1);
            }
        }
      }

      // 3. Economy and Status Ticks (1/sec roughly)
      if (tickAccumulator >= 1000) {
         let currentBps = 0;
         let playerHasProd = false;

         for (const key in nextNodes) {
           let n = nextNodes[key];
           let nChanged = false;
           
           // Clean old status effects
           if (n.statusEffects.length > 0) {
             const preLen = n.statusEffects.length;
             const nextStatus = n.statusEffects.filter(e => e.endsAt > time);
             
             if (preLen !== nextStatus.length) {
               n = { ...n, statusEffects: nextStatus };
               nChanged = true;
             }
             
             // Apply fire DPS
             const fireEff = n.statusEffects.find(e => e.type === 'fire');
             if (fireEff) {
               n = { ...n, hp: n.hp - fireEff.tickDps, lastDamagedAt: time };
               nChanged = true;
               if (n.hp <= 0) {
                 n = {
                   ...n,
                   owner: NODE_OWNERS.NEUTRAL,
                   state: NODE_STATES.EMPTY,
                   hp: MAX_HP[NODE_STATES.EMPTY],
                   maxHp: MAX_HP[NODE_STATES.EMPTY]
                 };
               }
             }
           }

           const isBlackedOut = n.statusEffects.some(e => e.type === 'blackout');

           if (n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.PRODUCTIVE && !isBlackedOut) {
             currentBps += GAME_CONSTANTS.BPS_PER_PROD * (1 + upgradesRef.current.BPS * 0.1);
             playerHasProd = true;
           }

           // Regen
           if (n.owner !== NODE_OWNERS.NEUTRAL && n.hp < n.maxHp && (time - n.lastDamagedAt) > GAME_CONSTANTS.REGEN_DELAY_MS) {
              if (n.owner === NODE_OWNERS.ENEMY || playerHasProd) {
                 const regenBonus = n.owner === NODE_OWNERS.PLAYER ? upgradesRef.current.REGEN : 0;
                 n = {
                   ...n,
                   hp: Math.min(n.maxHp, n.hp + GAME_CONSTANTS.REGEN_RATE_PER_SEC + regenBonus)
                 };
                 nChanged = true;
              }
           }

           if (nChanged) {
             nextNodes[key] = n;
             nodesChanged = true;
           }
         }

         setBps(currentBps);
         setBits(b => b + currentBps);
         tickAccumulator -= 1000;
      }

      if (nodesChanged) {
        setNodes(nextNodes);
      }

      requestAnimationFrame(loop);
    };

    const requestId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestId);
  }, []);

  // Actions
  const startExpansion = useCallback((sourceNode, targetNode, isAI = false) => {
    const sKey = `${sourceNode.q},${sourceNode.r}`;
    const tKey = `${targetNode.q},${targetNode.r}`;
    
    const executeExpansion = () => {
         let baseDuration = GAME_CONSTANTS.BASE_EXPANSION_MS;
         if (nodesRef.current[tKey]?.state === NODE_STATES.CORE) baseDuration = GAME_CONSTANTS.CORE_EXPANSION_MS;

         let speedMult = 1.0;
         const nbs = getNeighbors(sourceNode.q, sourceNode.r);
         for (const nb of nbs) {
           const nk = `${nb.q},${nb.r}`;
           if (nodesRef.current[nk]?.state === NODE_STATES.DEFENSIVE && nodesRef.current[nk]?.owner === nodesRef.current[sKey]?.owner) {
             const isBlackedOut = nodesRef.current[nk].statusEffects.some(e => e.type === 'blackout');
             if (!isBlackedOut) {
               speedMult += GAME_CONSTANTS.DEFENSIVE_BONUS_MULT;
               break;
             }
           }
         }

         if (activeExpansionsRef.current[tKey]) {
            if (!activeExpansionsRef.current[tKey].sources.includes(sKey)) {
               activeExpansionsRef.current[tKey].sources.push(sKey);
            }
         } else {
            activeExpansionsRef.current[tKey] = {
               target: tKey,
               sources: [sKey],
               progress: 0,
               baseDuration,
               speedMult,
               owner: nodesRef.current[sKey].owner
            };
         }
    };

    if (isAI) {
      executeExpansion();
    } else {
      setBits(b => {
        if (b >= COSTS.EXPAND) {
           executeExpansion();
           return b - COSTS.EXPAND;
        }
        return b;
      });
    }
  }, []);

  const convertNode = useCallback((q, r, newState, isAI = false) => {
    const key = `${q},${r}`;
    let cost = COSTS.CONVERT;
    if (newState === NODE_STATES.ADVANCE) cost = COSTS.UPGRADE_ADVANCE;

    const executeConvert = () => {
         const buildTime = CONSTRUCTION_TIMES_MS[newState] || 1000;
         activeConstructionRef.current[key] = {
            target: key,
            type: newState,
            progress: 0,
            totalTime: buildTime
         };
         
         setNodes(prev => ({
           ...prev,
           [key]: {
             ...prev[key],
             state: NODE_STATES.UNDER_CONSTRUCTION
           }
         }));
    };

    if (isAI) {
       executeConvert();
    } else {
      setBits(b => {
        if (b >= cost) {
           executeConvert();
           return b - cost;
        }
        return b;
      });
    }
  }, []);

  const launchStrike = useCallback((type, sourceQ, sourceR, targetQ, targetR, isAI = false) => {
    const sData = STRIKES[type];
    const tKey = `${targetQ},${targetR}`;
    const sKey = `${sourceQ},${sourceR}`;
    const dist = distance(sourceQ, sourceR, targetQ, targetR);
    const flightTime = Math.max(500, dist * 100); 

    const executeStrike = () => {
         if (type === 'FOR_AMERICA') {
            const affected = getNodesInRange(targetQ, targetR, sData.radius);
            affected.forEach(pos => {
               const nk = `${pos.q},${pos.r}`;
               if (nodesRef.current[nk] && nodesRef.current[nk].state !== NODE_STATES.EMPTY) {
                  const distToNode = distance(sourceQ, sourceR, pos.q, pos.r);
                  strikesRef.current.push({
                     id: Math.random().toString(),
                     type: 'STANDARD', 
                     owner: nodesRef.current[sKey]?.owner || NODE_OWNERS.PLAYER,
                     source: sKey,
                     target: nk,
                     progress: 0,
                     flightTime: Math.max(500, distToNode * 100) * (0.5 + Math.random() * 1.5) // Fanned-out barrage stagger
                  });
               }
            });
         } else {
             strikesRef.current.push({
               id: Math.random().toString(),
               type,
               owner: nodesRef.current[sKey]?.owner || NODE_OWNERS.PLAYER,
               source: sKey,
               target: tKey,
               progress: 0,
               flightTime
             });
         }
    };

    if (isAI) {
       executeStrike();
    } else {
       if (type === 'FOR_AMERICA') {
           setBits(b => {
             if (b >= STRIKES[type].cost) { executeStrike(); return b - STRIKES[type].cost; }
             return b;
           });
       } else {
           setInventory(inv => {
             if (inv[type] > 0) {
               executeStrike();
               return { ...inv, [type]: inv[type] - 1 };
             }
             return inv;
           });
       }
    }
  }, []);

  const produceMissile = useCallback((type) => {
     const sData = STRIKES[type];
     if (!sData) return;
     setBits(b => {
        if (b >= sData.cost) {
           ammoQueueRef.current.push({
             id: Math.random().toString(),
             type,
             progress: 0,
             totalTime: sData.prodTime
           });
           return b - sData.cost;
        }
        return b;
     });
  }, []);

  const purchaseUpgrade = useCallback((type) => {
     const upgData = UPGRADES[type];
     if (!upgData) return;
     setBits(b => {
        const level = upgradesRef.current[type];
        const cost = Math.floor(upgData.baseCost * Math.pow(upgData.scale, level));
        if (b >= cost) {
           setUpgrades(prev => {
              const next = { ...prev, [type]: prev[type] + 1 };
              if (type === 'HP') {
                 setNodes(nMap => {
                    const nextMap = { ...nMap };
                    for (const k in nextMap) {
                       if (nextMap[k].owner === NODE_OWNERS.PLAYER) {
                          const baseMax = MAX_HP[nextMap[k].state] || 50;
                          const newMax = Math.floor(baseMax * (1 + next.HP * 0.15));
                          const diff = newMax - nextMap[k].maxHp;
                          nextMap[k] = { ...nextMap[k], maxHp: newMax, hp: nextMap[k].hp + diff };
                       }
                    }
                    return nextMap;
                 });
              }
              return next;
           });
           return b - cost;
        }
        return b;
     });
  }, []);

  return {
    nodes,
    bits,
    bps,
    inventory,
    upgrades,
    activeExpansionsRef,
    activeConstructionRef,
    ammoQueueRef,
    strikesRef,
    explosionsRef,
    purchaseUpgrade,
    startExpansion,
    convertNode,
    launchStrike,
    produceMissile,
    // Provide a way to manually force a bit change for enemy AI or testing
    modifyBits: (amt) => setBits(b => Math.max(0, b + amt))
  };
}
