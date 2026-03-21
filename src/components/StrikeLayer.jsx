import React, { useEffect, useRef, useState } from 'react';
import { hexToPixel } from '../utils/hexUtils';

const HEX_POINTS = "0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5";

const StrikeLayer = ({ activeExpansionsRef, strikesRef, size }) => {
  const [, setTick] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time) => {
      // Soft cap to ~30hz for React render inside this layer
      if (time - lastTime > 30) { 
        setTick(t => t + 1);
        lastTime = time;
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const expansions = Object.values(activeExpansionsRef.current || {});
  const strikes = strikesRef.current || [];

  return (
    <g className="strike-layer" pointerEvents="none">
      {/* Render Siege Hexes */}
      {expansions.map(exp => {
         const coords = exp.target.split(',');
         const { x, y } = hexToPixel(parseInt(coords[0]), parseInt(coords[1]), size);
         // Shrink from 1.5 to 0.95 depending on progress (0 to 1)
         const scale = 1.5 - (0.55 * exp.progress);
         
         const isPlayer = exp.owner === 'player';
         const color = isPlayer ? '0, 255, 255' : '255, 50, 50';

         return (
           <g key={exp.target}>
               <polygon 
                 points={HEX_POINTS}
                 transform={`translate(${x}, ${y}) scale(${size * scale})`}
                 fill={`rgba(${color}, 0.1)`}
                 stroke={`rgba(${color}, 0.8)`}
                 strokeWidth="4"
                 strokeDasharray="10 5"
               />
               <text x={x} y={y} fill={`rgba(${color}, 1)`} fontSize={size*0.4} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                 {Math.round(exp.progress * 100)}%
               </text>
           </g>
         );
      })}

      {/* Render Missiles */}
      {strikes.map(strike => {
          const sC = strike.source.split(',');
          const tC = strike.target.split(',');
          const { x: sx, y: sy } = hexToPixel(parseInt(sC[0]), parseInt(sC[1]), size);
          const { x: tx, y: ty } = hexToPixel(parseInt(tC[0]), parseInt(tC[1]), size);
          
          const currentX = sx + (tx - sx) * strike.progress;
          const currentY = sy + (ty - sy) * strike.progress;
          
          const angle = Math.atan2(ty - sy, tx - sx) * (180 / Math.PI);
          const isPlayer = strike.owner === 'player';

          return (
            <g key={strike.id} transform={`translate(${currentX}, ${currentY}) rotate(${angle})`}>
              <path d="M -15 -8 L 15 0 L -15 8 Z" fill={isPlayer ? '#00ffff' : '#ff3333'} />
              {/* Thrust Flame */}
              <circle cx="-15" cy="0" r="5" fill="white" className="animate-pulse" />
              {/* Trail */}
              <line x1="-50" y1="0" x2="-15" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeDasharray="4 4" />
            </g>
          );
      })}
    </g>
  );
};

export default React.memo(StrikeLayer);
