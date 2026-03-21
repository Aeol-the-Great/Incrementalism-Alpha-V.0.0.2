import React, { useMemo } from 'react';
import { NODE_STATES, NODE_OWNERS, COSTS, STRIKES, MAX_HP } from '../utils/constants';
import { getNeighbors } from '../utils/hexUtils';
import Minimap from './Minimap';

const CommandCard = ({ 
  selectedNode, 
  bits, 
  nodes, 
  onConvert, 
  onExpand, 
  targetableNodes, 
  isTargeting, 
  setIsTargeting 
}) => {
  const isPlayerOwned = selectedNode?.owner === NODE_OWNERS.PLAYER;

  if (!selectedNode || !isPlayerOwned) {
    return (
      <div className="fixed bottom-0 left-0 w-full h-[25vh] bg-[#050505] border-t-2 border-[#1a1a1a] z-[99999] pointer-events-auto"></div>
    );
  }

  // Calculate offensive capacity
  const offensiveNodes = Object.values(nodes).filter(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.OFFENSIVE);
  const missileCap = offensiveNodes.length * 10;
  const hasOffensive = offensiveNodes.length > 0;

  const canExpand = useMemo(() => {
    if (!selectedNode) return false;
    const nbs = getNeighbors(selectedNode.q, selectedNode.r);
    return nbs.some(nb => {
       const key = `${nb.q},${nb.r}`;
       return nodes[key] && nodes[key].owner !== NODE_OWNERS.PLAYER;
    });
  }, [selectedNode, nodes]);

  return (
    <div className="fixed bottom-0 left-0 w-full h-[25vh] bg-black border-t-2 border-[#1a1a1a] flex p-4 gap-6 z-[99999] shadow-[0_-10px_50px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden text-mono font-mono">
      
      {/* 1/8th Square Minimap Top Right but they said Top Right earlier? "minimap on the top right taking up 1/8th of the screen in a a square". Oh! "top right" means not in the CommandCard. okay, I'll return null here and let App.jsx render minimap in top right */ }
      
      {/* Node Info Panel */}
      <div className="flex-1 flex flex-col justify-between border-r border-white/10 pr-6">
         <span className="text-[10px] text-cyan-500/50 uppercase">Tactical_Telemetry</span>
         <div className="text-4xl font-black text-white uppercase tracking-widest">{selectedNode.state}</div>
         <div className="flex justify-between text-xs text-white/50 w-64 mb-1">
            <span>INTEGRITY</span>
            <span className="text-cyan-400">{Math.round(selectedNode.hp)} / {selectedNode.maxHp}</span>
         </div>
         <div className="h-2 w-64 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${Math.max(0, selectedNode.hp / selectedNode.maxHp) * 100}%` }} />
         </div>
         <div className="text-[10px] text-white/30 mt-2">ID: {selectedNode.q}.{selectedNode.r}</div>
      </div>

      {/* Grid Actions */}
      <div className="flex-2 flex flex-col w-[600px] border-r border-white/10 pr-6 pl-4">
         <span className="text-[10px] text-cyan-500/50 uppercase mb-4">Command_Matrix</span>
         
         <div className="grid grid-cols-3 gap-2 h-full pb-2">
           {selectedNode.state === NODE_STATES.BORDER && (
             <>
               <button 
                 disabled={bits < COSTS.CONVERT}
                 onClick={() => onConvert(selectedNode.q, selectedNode.r, NODE_STATES.PRODUCTIVE)}
                 className="bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/60 disabled:opacity-20 transition-all font-bold text-xs"
               >
                 INIT_PRODUCTIVE [{COSTS.CONVERT}λ]
               </button>
               <button 
                 disabled={bits < COSTS.CONVERT}
                 onClick={() => onConvert(selectedNode.q, selectedNode.r, NODE_STATES.DEFENSIVE)}
                 className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 disabled:opacity-20 transition-all font-bold text-xs"
               >
                 INIT_DEFENSIVE [{COSTS.CONVERT}λ]
               </button>
               <button 
                 disabled={bits < COSTS.CONVERT}
                 onClick={() => onConvert(selectedNode.q, selectedNode.r, NODE_STATES.OFFENSIVE)}
                 className="bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/60 disabled:opacity-20 transition-all font-bold text-xs"
               >
                 INIT_OFFENSIVE [{COSTS.CONVERT}λ]
               </button>
             </>
           )}

           {selectedNode.state === NODE_STATES.PRODUCTIVE || selectedNode.state === NODE_STATES.DEFENSIVE || selectedNode.state === NODE_STATES.OFFENSIVE ? (
               <button 
                 disabled={bits < COSTS.UPGRADE_ADVANCE}
                 onClick={() => onConvert(selectedNode.q, selectedNode.r, NODE_STATES.ADVANCE)}
                 className="col-span-3 bg-purple-900/30 border border-purple-500/30 text-purple-400 hover:bg-purple-900/60 disabled:opacity-20 transition-all font-bold text-sm"
               >
                 UPGRADE_ADVANCE [{COSTS.UPGRADE_ADVANCE}λ]
               </button>
           ) : null}

           {selectedNode.state !== NODE_STATES.EMPTY && canExpand && (
             <button 
               onClick={() => setIsTargeting(isTargeting === 'expand' ? null : 'expand')}
               className={`col-span-3 font-bold text-sm transition-all border ${isTargeting === 'expand' ? 'bg-green-700 text-white border-green-400 animate-pulse' : 'bg-green-900/20 text-green-400 border-green-500/30 hover:bg-green-900/50'}`}
             >
               {isTargeting === 'expand' ? 'CANCEL_EXPANSION' : `AUTHORIZE_EXPANSION [${COSTS.EXPAND}λ]`}
             </button>
           )}
         </div>
      </div>

      {/* Ordinance Sub-Menu */}
      <div className="flex-1 flex flex-col pl-4">
         <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] text-red-500/50 uppercase">Heavy_Ordinance</span>
             {hasOffensive && <span className="text-[10px] text-red-400">CAPACITY: {missileCap}</span>}
         </div>

         {!hasOffensive ? (
           <div className="flex-1 border border-red-500/10 flex items-center justify-center text-xs text-red-500/30 bg-red-950/10 p-4 text-center">
             OFFENSIVE NODE REQUIRED FOR STRIKE AUTHORIZATION
           </div>
         ) : (
           <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 scrollbar-none h-full pb-2">
             {Object.entries(STRIKES).map(([key, data]) => (
                <button 
                  key={key}
                  disabled={bits < data.cost}
                  onClick={() => setIsTargeting(isTargeting === key ? null : key)}
                  className={`flex flex-col items-center justify-center border text-[10px] font-bold py-2 ${isTargeting === key ? 'bg-red-700 text-white border-red-400 animate-pulse' : 'bg-red-900/20 text-red-400 border-red-500/30 hover:bg-red-900/50'} disabled:opacity-20`}
                >
                  <span className="uppercase text-center leading-tight mb-1">{data.name}</span>
                  <span className="text-[8px] opacity-70">[{data.cost}λ]</span>
                </button>
             ))}
           </div>
         )}
      </div>

    </div>
  );
};

export default React.memo(CommandCard);
