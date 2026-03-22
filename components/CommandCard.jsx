import React, { useState, useEffect } from 'react';
import { NODE_STATES, NODE_OWNERS, COSTS, STRIKES, NODE_DESCRIPTIONS } from '../utils/constants';

const CommandCard = ({ 
  selectedNodeKeys, 
  bits, 
  nodes, 
  inventory, 
  produceMissile, 
  ammoQueueRef, 
  activeConstructionRef, 
  onConvert, 
  onExpand, 
  targetableNodes, 
  isTargeting, 
  setIsTargeting 
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let frameId;
    const loop = () => {
      setTick(t => t + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const isPlayerOwned = selectedNodeKeys.every(k => nodes[k] && nodes[k].owner === NODE_OWNERS.PLAYER);
  const firstNode = selectedNodeKeys.length > 0 ? nodes[selectedNodeKeys[0]] : null;
  const isMulti = selectedNodeKeys.length > 1;

  if (selectedNodeKeys.length === 0 || !isPlayerOwned) {
    return <div className="fixed bottom-0 left-0 w-full h-[25vh] bg-[#050505] border-t-2 border-[#1a1a1a] z-[99999] pointer-events-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"></div>;
  }

  const playerOffensiveCount = Object.values(nodes).filter(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.OFFENSIVE).length;

  const handleMassAction = (newState) => {
     selectedNodeKeys.forEach(key => {
        const [q, r] = key.split(',').map(Number);
        onConvert(q, r, newState);
     });
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-[25vh] bg-[#050505] border-t-2 border-cyan-900/80 z-[99999] pointer-events-auto grid grid-cols-12 select-none shadow-[0_-10px_40px_rgba(0,255,255,0.05)]">
       {/* LEFT PANEL: Telemetry */}
       <div className="col-span-2 flex flex-col h-full border-r-2 border-[#1a1a1a] p-4 text-[#0ff] font-mono">
           <h3 className="font-bold text-xs mb-2 border-b border-cyan-900/50 pb-1">SELECTED ASSETS</h3>
           {isMulti ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                 <span className="text-5xl font-black mb-1 drop-shadow-[0_0_10px_cyan] text-white">{selectedNodeKeys.length}</span>
                 <span className="text-[10px] opacity-70 tracking-widest">NODES ONLINE</span>
              </div>
           ) : (
              firstNode && (
                <div className="flex flex-col gap-2 relative mt-2 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-50">CLASS:</span>
                    <span className="font-bold uppercase text-white">{firstNode.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">LOC:</span>
                    <span className="font-bold">({firstNode.q}, {firstNode.r})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">INTEGRITY:</span>
                    <span className="font-bold text-white">{Math.floor(firstNode.hp)}/{firstNode.maxHp}</span>
                  </div>
                  {firstNode.statusEffects.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] text-red-500 uppercase font-black tracking-widest block mb-1">Anomalies Detected:</span>
                      {firstNode.statusEffects.map((e, i) => (
                        <div key={i} className="text-[10px] text-red-400 bg-red-950/30 px-1 py-0.5 border border-red-900/50 mb-1">
                          !! {e.type} [{Math.round((e.endsAt - performance.now())/1000)}s]
                        </div>
                      ))}
                    </div>
                  )}
                  {firstNode.state === NODE_STATES.UNDER_CONSTRUCTION && activeConstructionRef.current[`${firstNode.q},${firstNode.r}`] && (
                    <div className="mt-2 text-[10px] text-cyan-400">
                      <span className="mb-1 block tracking-widest animate-pulse font-bold">ASSEMBLY SECURED</span>
                      <div className="w-full bg-black h-2 relative border border-cyan-900">
                        <div className="h-full bg-cyan-500 shadow-[0_0_5px_cyan]" style={{ width: `${Math.min(100, Math.max(0, activeConstructionRef.current[`${firstNode.q},${firstNode.r}`].progress * 100))}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
           )}
       </div>

       {/* CENTER PANEL: Global Ordnance Pipeline */}
       <div className="col-span-8 flex flex-col h-full bg-black/50 border-r-2 border-[#1a1a1a] p-4 font-mono">
           <div className="flex justify-between items-baseline mb-3 border-b border-cyan-900/50 pb-1">
              <h3 className="text-cyan-400 font-bold text-xs tracking-widest">GLOBAL ORDNANCE ASSETS</h3>
              <span className="text-[10px] text-cyan-500 font-bold">[{playerOffensiveCount}] ACTIVE_FACTORIES</span>
           </div>
           
           <div className="grid grid-cols-6 gap-3 mb-4">
              {Object.entries(STRIKES).filter(([k]) => k !== 'FOR_AMERICA').map(([key, data], idx) => {
                 return (
                   <div key={key} className="flex flex-col gap-1.5">
                     <button 
                       title={data.desc}
                       disabled={bits < data.cost || playerOffensiveCount === 0}
                       onClick={() => produceMissile(key)}
                       className="flex flex-col items-center justify-center p-2 bg-blue-950/20 border border-blue-500/30 hover:bg-blue-900/60 hover:border-blue-400 text-blue-400 disabled:opacity-20 cursor-pointer h-16 transition-all"
                     >
                       <span className="text-[8px] opacity-70 mb-1 tracking-widest">BUILD [{data.prodTime/1000}s]</span>
                       <span className="font-bold text-[9px] text-center leading-tight hover:text-white transition-colors uppercase">{data.name}</span>
                       <span className="text-[8px] font-black mt-1">[{data.cost}λ]</span>
                     </button>
                     
                     <button
                       disabled={inventory[key] <= 0}
                       onClick={() => setIsTargeting(isTargeting === key ? null : key)}
                       className={`relative flex items-center justify-center py-2 border text-xs font-bold transition-all ${isTargeting === key ? 'bg-red-700 text-white border-red-400 shadow-[0_0_15px_red] scale-105' : 'bg-red-950/40 text-red-300 border-red-500/30 hover:bg-red-800/80 hover:text-white'} disabled:opacity-20 disabled:scale-100 disabled:grayscale rounded-[2px]`}
                     >
                       <span className="absolute top-1 left-1.5 text-[8px] opacity-50 mix-blend-screen">[{idx+1}]</span>
                       <span className="ml-2 tracking-widest text-[10px] uppercase">LCH [{inventory[key]}]</span>
                     </button>
                   </div>
                 );
              })}
           </div>
           
           {/* Active Assembly Queue */}
           <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-none border-t border-[#111] pt-2">
              {ammoQueueRef.current.map((ammo, idx) => {
                 const isBuilding = idx < playerOffensiveCount;
                 return (
                   <div key={ammo.id} className={`flex items-center gap-4 bg-[#0a0a0a] px-3 py-1.5 border-l-2 ${isBuilding ? 'border-cyan-400 text-cyan-400 shadow-[inset_20px_0_30px_rgba(0,255,255,0.05)]' : 'border-gray-700 text-gray-500'} text-[10px]`}>
                      <span className="w-44 uppercase tracking-widest font-bold">{isBuilding ? '> ASSEMBLING' : '> QUEUED'}: {STRIKES[ammo.type].name}</span>
                      <div className="flex-1 bg-[#050505] h-2 relative border border-[#222]">
                         <div className={`h-full ${isBuilding ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-gray-600'}`} style={{ width: `${Math.min(100, Math.max(0, ammo.progress * 100))}%` }} />
                      </div>
                      <span className="w-8 text-right font-black">{Math.floor(ammo.progress * 100)}%</span>
                   </div>
                 );
              })}
           </div>
       </div>

       {/* RIGHT PANEL: Architecture & Expansion */}
       <div className="col-span-2 flex flex-col h-full bg-[#0a0a0a] p-4 text-[#0ff] font-mono">
           <h3 className="font-bold text-xs mb-3 border-b border-cyan-900/50 pb-1">ARCHITECTURE</h3>
           {firstNode && firstNode.state !== NODE_STATES.EMPTY && (
             <button 
               onClick={() => setIsTargeting(isTargeting === 'expand' ? null : 'expand')}
               className={`mb-3 font-bold text-[10px] p-2 transition-all border ${isTargeting === 'expand' ? 'bg-green-700 text-white border-green-400 animate-pulse drop-shadow-[0_0_5px_green]' : 'bg-green-900/20 text-green-400 border-green-500/30 hover:bg-green-600/40 hover:text-white'}`}
             >
               {isTargeting === 'expand' ? 'CANCEL_EXPANSION' : `EXPAND [${COSTS.EXPAND}λ] [E]`}
             </button>
           )}

           <div className="grid grid-cols-1 gap-2 flex-1 content-start">
               <button 
                 title={NODE_DESCRIPTIONS[NODE_STATES.PRODUCTIVE]}
                 disabled={bits < COSTS.CONVERT || firstNode?.state !== NODE_STATES.BORDER || firstNode?.state === NODE_STATES.UNDER_CONSTRUCTION}
                 onClick={() => handleMassAction(NODE_STATES.PRODUCTIVE)}
                 className="bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 disabled:opacity-20 font-bold text-[10px] py-1.5 transition-colors relative"
               >
                 <span className="absolute top-1 right-2 text-[8px] opacity-40 mix-blend-difference font-black">[P]</span>
                 INIT_PROD [{COSTS.CONVERT}λ]
               </button>
               <button 
                 title={NODE_DESCRIPTIONS[NODE_STATES.DEFENSIVE]}
                 disabled={bits < COSTS.CONVERT || firstNode?.state !== NODE_STATES.BORDER || firstNode?.state === NODE_STATES.UNDER_CONSTRUCTION}
                 onClick={() => handleMassAction(NODE_STATES.DEFENSIVE)}
                 className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 disabled:opacity-20 font-bold text-[10px] py-1.5 transition-colors relative"
               >
                 <span className="absolute top-1 right-2 text-[8px] opacity-40 mix-blend-difference font-black">[D]</span>
                 INIT_DEF [{COSTS.CONVERT}λ]
               </button>
               <button 
                 title={NODE_DESCRIPTIONS[NODE_STATES.OFFENSIVE]}
                 disabled={bits < COSTS.CONVERT || firstNode?.state !== NODE_STATES.BORDER || firstNode?.state === NODE_STATES.UNDER_CONSTRUCTION}
                 onClick={() => handleMassAction(NODE_STATES.OFFENSIVE)}
                 className="bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-black hover:border-red-400 disabled:opacity-20 font-bold text-[10px] py-1.5 transition-colors relative"
               >
                 <span className="absolute top-1 right-2 text-[8px] opacity-40 mix-blend-difference font-black">[O]</span>
                 INIT_OFF [{COSTS.CONVERT}λ]
               </button>
               <button 
                 title={NODE_DESCRIPTIONS[NODE_STATES.ADVANCE]}
                 disabled={bits < COSTS.UPGRADE_ADVANCE || (firstNode?.state !== NODE_STATES.PRODUCTIVE && firstNode?.state !== NODE_STATES.OFFENSIVE && firstNode?.state !== NODE_STATES.DEFENSIVE)}
                 onClick={() => handleMassAction(NODE_STATES.ADVANCE)}
                 className="bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-400 disabled:opacity-20 font-bold text-[10px] py-1.5 transition-colors relative mt-1"
               >
                 <span className="absolute top-1 right-2 text-[8px] opacity-40 mix-blend-difference font-black">[U]</span>
                 UPGRADE_ADV [{COSTS.UPGRADE_ADVANCE}λ]
               </button>
           </div>
       </div>
    </div>
  );
};

export default React.memo(CommandCard);
