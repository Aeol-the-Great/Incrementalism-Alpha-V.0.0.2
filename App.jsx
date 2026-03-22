import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useEnemyAI } from './hooks/useEnemyAI';
import HexGrid from './components/HexGrid';
import StrikeLayer from './components/StrikeLayer';
import CommandCard from './components/CommandCard';
import Minimap from './components/Minimap';
import { getNeighbors, hexToPixel } from './utils/hexUtils';
import { HEX_SIZE, NODE_OWNERS, NODE_STATES } from './utils/constants';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');

  const engine = useGameEngine();
  const { nodes, bits, bps, inventory, activeExpansionsRef, activeConstructionRef, ammoQueueRef, strikesRef, startExpansion, convertNode, launchStrike, produceMissile } = engine;
  
  // Attach Enemy AI
  useEnemyAI(engine, difficulty);

  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragBox, setDragBox] = useState(null);
  
  const [selectedNodeKeys, setSelectedNodeKeys] = useState([]);
  const [isTargeting, setIsTargeting] = useState(null); // 'expand' | 'STANDARD' | 'ICBM' etc.
  const [hoveredNodeKey, setHoveredNodeKey] = useState(null);
  
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
    if (!gameStarted) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        const offNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.OFFENSIVE);
        const coreNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.CORE);
        const targetNode = offNode || coreNode;
        if (targetNode) setSelectedNodeKeys([`${targetNode.q},${targetNode.r}`]);
      }
      if (e.key.toLowerCase() === 'f') {
        const coreNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.CORE);
        if (coreNode) {
          const { x, y } = hexToPixel(coreNode.q, coreNode.r, HEX_SIZE);
          setCamera({ x: -x, y: -y });
          setSelectedNodeKeys([`${coreNode.q},${coreNode.r}`]);
        }
      }

      // Action Keybinds (Map over all selected)
      if (selectedNodeKeys.length > 0) {
        selectedNodeKeys.forEach(key => {
          const node = nodes[key];
          if (node && node.owner === NODE_OWNERS.PLAYER) {
            if (e.key.toLowerCase() === 'e') setIsTargeting(prev => prev === 'expand' ? null : 'expand');
            if (e.key.toLowerCase() === 'p' && node.state === NODE_STATES.BORDER) convertNode(node.q, node.r, NODE_STATES.PRODUCTIVE);
            if (e.key.toLowerCase() === 'd' && node.state === NODE_STATES.BORDER) convertNode(node.q, node.r, NODE_STATES.DEFENSIVE);
            if (e.key.toLowerCase() === 'o' && node.state === NODE_STATES.BORDER) convertNode(node.q, node.r, NODE_STATES.OFFENSIVE);
            if (e.key.toLowerCase() === 'u' && node.state !== NODE_STATES.BORDER && node.state !== NODE_STATES.EMPTY) convertNode(node.q, node.r, NODE_STATES.ADVANCE);
          }
        });
      }

      // Strike Mapping Keybinds
      const offNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.OFFENSIVE);
      const coreNode = Object.values(nodes).find(n => n.owner === NODE_OWNERS.PLAYER && n.state === NODE_STATES.CORE);
      const originNode = offNode || coreNode;
      const hasOffensive = offNode !== undefined;

      if (hasOffensive || originNode) {
         const handleStrikeKey = (type) => {
            if (selectedNodeKeys.length === 0) setSelectedNodeKeys([`${originNode.q},${originNode.r}`]);
            setIsTargeting(prev => prev === type ? null : type);
         };

         if (e.key === '1') handleStrikeKey('STANDARD');
         if (e.key === '2') handleStrikeKey('INCENDIARY');
         if (e.key === '3') handleStrikeKey('COBALT');
         if (e.key === '4') handleStrikeKey('EMP');
         if (e.key === '5') handleStrikeKey('ICBM');
         if (e.key === '6') handleStrikeKey('HARPOON');
         if (e.key === '0') handleStrikeKey('FOR_AMERICA');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, selectedNodeKeys, gameStarted]);

  // RTS Edge Scrolling
  const edgeScrollRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!gameStarted) return;
    const handleEdgeMove = (e) => {
      const margin = 20; 
      let vx = 0, vy = 0;
      if (e.clientX < margin) vx = 25;
      else if (e.clientX > window.innerWidth - margin) vx = -25;
      if (e.clientY < margin) vy = 25;
      else if (e.clientY > window.innerHeight - margin) vy = -25;
      edgeScrollRef.current = { x: vx, y: vy };
    };
    
    const handleEdgeLeave = () => { edgeScrollRef.current = { x: 0, y: 0 }; };

    window.addEventListener('mousemove', handleEdgeMove);
    window.addEventListener('mouseout', handleEdgeLeave);
    return () => {
      window.removeEventListener('mousemove', handleEdgeMove);
      window.removeEventListener('mouseout', handleEdgeLeave);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    let frameId;
    const loop = () => {
      if (edgeScrollRef.current.x !== 0 || edgeScrollRef.current.y !== 0) {
        setCamera(cam => ({ x: cam.x + edgeScrollRef.current.x, y: cam.y + edgeScrollRef.current.y }));
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameStarted]);

  // Box Select & Pan
  const handleSvgPointerDown = e => { 
     if (e.target.tagName !== 'svg') return;
     if (e.button === 0) setDragBox({ sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY });
     else if (e.button === 1 || e.button === 2) {
       setIsDragging(true); 
       setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y }); 
     }
  };
  const handleSvgPointerMove = e => { 
     if (dragBox) setDragBox(prev => ({ ...prev, cx: e.clientX, cy: e.clientY }));
     else if (isDragging) setCamera({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); 
  };
  const handleSvgPointerUp = e => { 
     if (dragBox) {
         const minX = Math.min(dragBox.sx, dragBox.cx), maxX = Math.max(dragBox.sx, dragBox.cx);
         const minY = Math.min(dragBox.sy, dragBox.cy), maxY = Math.max(dragBox.sy, dragBox.cy);
         
         const selected = [];
         Object.values(nodes).forEach(n => {
            if (n.owner !== NODE_OWNERS.PLAYER) return;
            const { x, y } = hexToPixel(n.q, n.r, HEX_SIZE);
            const screenX = x + camera.x + window.innerWidth / 2;
            const screenY = y + camera.y + window.innerHeight / 2;

            if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) selected.push(`${n.q},${n.r}`);
         });

         if (Math.abs(dragBox.sx - dragBox.cx) > 10 || Math.abs(dragBox.sy - dragBox.cy) > 10) {
            setSelectedNodeKeys(selected);
            setIsTargeting(null);
         }
         setDragBox(null);
     }
     setIsDragging(false); 
  };

  const targetableKeys = useMemo(() => {
    if (isTargeting === 'expand' && selectedNodeKeys.length > 0) {
       const [fq, fr] = selectedNodeKeys[0].split(',').map(Number);
       return getNeighbors(fq, fr).map(n => `${n.q},${n.r}`).filter(k => nodes[k] && nodes[k].owner !== NODE_OWNERS.PLAYER);
    }
    if (isTargeting && isTargeting !== 'expand') {
       if (isTargeting === 'HARPOON') {
          return hoveredNodeKey && nodes[hoveredNodeKey] && nodes[hoveredNodeKey].owner !== NODE_OWNERS.PLAYER ? [hoveredNodeKey] : [];
       }
       return Object.values(nodes).filter(n => n.owner === NODE_OWNERS.ENEMY).map(n => `${n.q},${n.r}`);
    }
    return [];
  }, [isTargeting, hoveredNodeKey, selectedNodeKeys, nodes]);

  const handleNodeClick = useCallback((node) => {
    const key = `${node.q},${node.r}`;
    
    if (isTargeting === 'expand') {
      if (targetableKeys.includes(key)) {
         selectedNodeKeys.forEach(sKey => {
           startExpansion(nodes[sKey], node);
         });
      }
      setIsTargeting(null);
      return;
    }

    if (isTargeting && isTargeting !== 'expand') {
       if (selectedNodeKeys.length === 0) {
          setIsTargeting(null); return;
       }
       if (node.owner !== NODE_OWNERS.PLAYER) {
          selectedNodeKeys.forEach(sKey => {
             const [sq, sr] = sKey.split(',').map(Number);
             const srcNode = nodes[sKey];
             if (srcNode && (srcNode.state === NODE_STATES.CORE || srcNode.state === NODE_STATES.OFFENSIVE)) {
                launchStrike(isTargeting, sq, sr, node.q, node.r);
             }
          });
       }
       setIsTargeting(null);
       return;
    }

    setSelectedNodeKeys([key]);
  }, [isTargeting, targetableKeys, selectedNodeKeys, startExpansion, launchStrike]);

  const updateCamera = useCallback((x, y) => setCamera({x, y}), []);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-white font-mono gap-6 z-[1000000] fixed top-0 left-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.08)_0%,transparent_100%)] pointer-events-none" />
         <h1 className="text-6xl font-black text-cyan-400 drop-shadow-[0_0_20px_cyan] tracking-widest text-center relative z-10">PROJECT HEX-VOID:<br />THE TITAN PROTOCOL</h1>
         <p className="text-xl opacity-70 mb-10 max-w-2xl text-center relative z-10">Establish your base. Secure nodes. Weather the storm. Destroy the Titan Core using extreme geometric force.</p>
         <div className="flex gap-4 relative z-10">
           {['easy', 'normal', 'hard', 'insane'].map(diff => (
             <button 
               key={diff}
               onClick={() => { setDifficulty(diff); setGameStarted(true); }}
               className="px-8 py-4 border-2 border-cyan-700 bg-cyan-950/30 text-cyan-400 font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all"
             >
               {diff}
             </button>
           ))}
         </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-screen bg-[#060b19] overflow-hidden relative font-mono transition-transform duration-75 ${shake ? 'scale-105 translate-x-2 translate-y-2' : ''}`} onContextMenu={e => e.preventDefault()}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />
      
      <div className="absolute top-6 left-10 flex flex-col pointer-events-none z-[1000] drop-shadow-lg">
        <span className="text-cyan-500/50 text-[10px] uppercase mb-1 drop-shadow-[0_0_5px_cyan]">Project_Hex_Void // Titan_Protocol</span>
        <div className="flex items-baseline gap-4">
          <span className="text-6xl font-black tracking-widest text-white">{Math.floor(bits).toLocaleString()}λ</span>
          <span className="text-cyan-400 font-bold text-xl">+{bps}/s</span>
        </div>
      </div>

      <Minimap nodes={nodes} camera={camera} setCamera={updateCamera} />

      <svg className="w-full h-full absolute inset-0 cursor-crosshair"
           onPointerDown={handleSvgPointerDown} 
           onPointerMove={handleSvgPointerMove} 
           onPointerUp={handleSvgPointerUp} 
           onPointerLeave={handleSvgPointerUp}>
        <g transform={`translate(${camera.x + window.innerWidth/2}, ${camera.y + window.innerHeight/2})`}>
           <HexGrid 
             nodes={nodes} 
             size={HEX_SIZE} 
             onNodeClick={handleNodeClick} 
             onNodeEnter={(n) => setHoveredNodeKey(`${n.q},${n.r}`)}
             onNodeLeave={() => setHoveredNodeKey(null)}
             selectedNodeKeys={selectedNodeKeys}
             targetableKeys={targetableKeys}
           />
           <StrikeLayer 
             activeExpansions={activeExpansionsRef.current}
             strikes={strikesRef.current}
             size={HEX_SIZE}
           />
        </g>
        
        {dragBox && (
           <rect 
             x={Math.min(dragBox.sx, dragBox.cx)}
             y={Math.min(dragBox.sy, dragBox.cy)}
             width={Math.abs(dragBox.sx - dragBox.cx)}
             height={Math.abs(dragBox.sy - dragBox.cy)}
             fill="rgba(0, 255, 0, 0.1)"
             stroke="#00ff00"
             strokeWidth="2"
           />
        )}
      </svg>

      <CommandCard 
        selectedNodeKeys={selectedNodeKeys}
        bits={bits}
        nodes={nodes}
        inventory={inventory}
        produceMissile={produceMissile}
        ammoQueueRef={ammoQueueRef}
        activeConstructionRef={activeConstructionRef}
        onConvert={convertNode}
        onExpand={startExpansion}
        targetableNodes={targetableKeys}
        isTargeting={isTargeting}
        setIsTargeting={setIsTargeting}
      />
    </div>
  );
}
