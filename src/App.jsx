import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useEnemyAI } from './hooks/useEnemyAI';
import HexGrid from './components/HexGrid';
import StrikeLayer from './components/StrikeLayer';
import CommandCard from './components/CommandCard';
import Minimap from './components/Minimap';
import { getNeighbors, hexToPixel } from './utils/hexUtils';
import { HEX_SIZE, NODE_OWNERS, NODE_STATES } from './utils/constants';

export default function App() {
  const engine = useGameEngine();
  const { nodes, bits, bps, activeExpansionsRef, strikesRef, startExpansion, convertNode, launchStrike } = engine;
  
  // Attach Enemy AI
  useEnemyAI(nodes, startExpansion, launchStrike);

  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);
  const [isTargeting, setIsTargeting] = useState(null); // 'expand' | 'STANDARD' | 'ICBM' etc.
  
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const onShake = () => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    };
    window.addEventListener('icbm-impact', onShake);
    return () => window.removeEventListener('icbm-impact', onShake);
  }, []);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        const coreNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.CORE);
        if (coreNode) {
          const { x, y } = hexToPixel(coreNode.q, coreNode.r, HEX_SIZE);
          setCamera({ x: -x, y: -y });
          setSelectedNodeKey(`${coreNode.q},${coreNode.r}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes]);

  // Camera Pan
  const handleMouseDown = e => { setIsDragging(true); setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y }); };
  const handleMouseMove = e => { if (isDragging) setCamera({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setIsDragging(false);

  // Derived Values
  const selectedNode = selectedNodeKey ? nodes[selectedNodeKey] : null;

  const targetableKeys = useMemo(() => {
    if (isTargeting === 'expand' && selectedNode) {
       return getNeighbors(selectedNode.q, selectedNode.r)
         .map(n => `${n.q},${n.r}`)
         .filter(k => nodes[k] && nodes[k].owner !== NODE_OWNERS.PLAYER);
    }
    // If targeting a strike, highlight all enemies
    if (isTargeting && isTargeting !== 'expand') {
       return Object.values(nodes).filter(n => n.owner === NODE_OWNERS.ENEMY).map(n => `${n.q},${n.r}`);
    }
    return [];
  }, [isTargeting, selectedNode, nodes]);

  const handleNodeClick = useCallback((node) => {
    const key = `${node.q},${node.r}`;
    
    if (isTargeting === 'expand') {
      if (targetableKeys.includes(key)) {
         startExpansion(selectedNode, node);
         setIsTargeting(null);
      } else {
         setIsTargeting(null);
         setSelectedNodeKey(key);
      }
      return;
    }

    if (isTargeting && isTargeting !== 'expand') {
       if (node.owner !== NODE_OWNERS.PLAYER) {
          launchStrike(isTargeting, selectedNode.q, selectedNode.r, node.q, node.r);
       }
       setIsTargeting(null);
       return;
    }

    setSelectedNodeKey(key);
  }, [isTargeting, targetableKeys, selectedNode, startExpansion, launchStrike]);

  return (
    <div 
      className={`w-full h-screen bg-[#060b19] overflow-hidden relative font-mono transition-transform duration-75 ${shake ? 'scale-105 translate-x-2 translate-y-2' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

      {/* Top HUD */}
      <div className="absolute top-6 left-10 flex flex-col pointer-events-none z-[1000] drop-shadow-lg">
        <span className="text-cyan-500/50 text-[10px] uppercase mb-1 drop-shadow-[0_0_5px_cyan]">Project_Hex_Void // Titan_Protocol</span>
        <div className="flex items-baseline gap-4">
          <span className="text-6xl font-black tracking-widest text-white">{Math.floor(bits).toLocaleString()}λ</span>
          <span className="text-cyan-400 font-bold text-xl">+{bps}/s</span>
        </div>
      </div>

      <Minimap nodes={nodes} camera={camera} />

      {/* Main Map Viewport */}
      <svg className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
        <g transform={`translate(${camera.x + window.innerWidth/2}, ${camera.y + window.innerHeight/2})`}>
           <HexGrid 
             nodes={nodes} 
             size={HEX_SIZE} 
             onNodeClick={handleNodeClick} 
             selectedNodeKey={selectedNodeKey}
             targetableKeys={targetableKeys}
           />
           <StrikeLayer 
             activeExpansionsRef={activeExpansionsRef}
             strikesRef={strikesRef}
             size={HEX_SIZE}
           />
        </g>
      </svg>

      {/* Bottom Command Card */}
      <CommandCard 
        selectedNode={selectedNode}
        bits={bits}
        nodes={nodes}
        onConvert={convertNode}
        onExpand={startExpansion}
        targetableNodes={targetableKeys}
        isTargeting={isTargeting}
        setIsTargeting={setIsTargeting}
      />
    </div>
  );
}
