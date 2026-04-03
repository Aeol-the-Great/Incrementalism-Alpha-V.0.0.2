import React, { useEffect, useRef, useState } from 'react';
import { hexToPixel } from '../utils/hexUtils';

const HEX_POINTS = "0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5";

const StrikeLayer = ({ activeExpansions, strikes, explosions, size }) => {
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

  const expansions = Object.values(activeExpansions || {});
  const safeStrikes = strikes || [];
  const safeExplosions = explosions || [];

  return (
    <g className="strike-layer" pointerEvents="none">
      {/* Render Siege Hexes */}
      {expansions.map(exp => {
         const coords = exp.target.split(',');
         const { x, y } = hexToPixel(parseInt(coords[0]), parseInt(coords[1]), size);
         // Shrink from 1.2 to 0.6 depending on progress (0 to 1) to match the condensed node render scale
         const scale = 1.2 - (0.6 * exp.progress);
         
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
      {safeStrikes.map(strike => {
          const sC = strike.source.split(',');
          const tC = strike.target.split(',');
          const { x: sx, y: sy } = hexToPixel(parseInt(sC[0]), parseInt(sC[1]), size);
          const { x: tx, y: ty } = hexToPixel(parseInt(tC[0]), parseInt(tC[1]), size);
          
          const currentX = sx + (tx - sx) * strike.progress;
          const currentY = sy + (ty - sy) * strike.progress;
          
          const angle = Math.atan2(ty - sy, tx - sx) * (180 / Math.PI);
          const isPlayer = strike.owner === 'player';

          let MissleSVG = null;
          let TrailSVG = null;

          if (strike.type === 'COBALT') {
             MissleSVG = (
                <g>
                   <rect x="-10" y="-4" width="20" height="8" fill="#66aaff" />
                   <polygon points="10,-4 20,0 10,4" fill="#00ffff" />
                   <polygon points="-10,-4 -20,-12 -4,-4" fill="#4488ff" />
                   <polygon points="-10,4 -20,12 -4,4" fill="#4488ff" />
                   <circle cx="-10" cy="0" r="5" fill="#00ffff" className="animate-pulse" />
                </g>
             );
             TrailSVG = <line x1="-80" y1="0" x2="-10" y2="0" stroke="rgba(0,150,255,0.6)" strokeWidth="4" strokeDasharray="6 6" />;
          } else if (strike.type === 'INCENDIARY') {
             MissleSVG = (
                <g>
                   <ellipse cx="0" cy="0" rx="10" ry="5" fill="#ffaa00" />
                   <polygon points="10,0 -15,-6 -15,6" fill="#ff2200" />
                </g>
             );
             TrailSVG = (
                <g>
                   <line x1="-60" y1="0" x2="-10" y2="0" stroke="rgba(255,100,0,0.8)" strokeWidth="6" />
                   <line x1="-80" y1="0" x2="-40" y2="0" stroke="rgba(255,0,0,0.4)" strokeWidth="12" />
                </g>
             );
          } else if (strike.type === 'ICBM' || strike.type === 'BUNKER_BUSTER') { // support legacy type during reload
             MissleSVG = (
                <g transform="scale(2)">
                   <rect x="-12" y="-5" width="24" height="10" fill="#444" stroke="#ff00ff" strokeWidth="1" />
                   <polygon points="12,-5 24,0 12,5" fill="#222" />
                   <polygon points="-12,-5 -18,-10 -6,-5" fill="#ff00ff" />
                   <polygon points="-12,5 -18,10 -6,5" fill="#ff00ff" />
                   <circle cx="-12" cy="0" r="6" fill="#ff00ff" className="animate-pulse" />
                </g>
             );
             TrailSVG = <line x1="-120" y1="0" x2="-20" y2="0" stroke="rgba(255,0,255,0.5)" strokeWidth="8" strokeDasharray="10 10" />;
          } else if (strike.type === 'HARPOON') {
             const color = isPlayer ? '#00ffaa' : '#ffaa00';
             MissleSVG = (
                <g transform="scale(1.5)">
                   <polygon points="-8,-6 4,-6 8,0 4,6 -8,6 -12,0" fill="#222" stroke={color} strokeWidth="1" />
                   <rect x="-8" y="-4" width="12" height="8" fill="#444" />
                   <polygon points="8,-2 14,0 8,2" fill={color} />
                   <circle cx="-14" cy="0" r="4" fill="#fff" className="animate-pulse" />
                   <circle cx="-14" cy="-4" r="3" fill="#fff" className="animate-pulse" />
                   <circle cx="-14" cy="4" r="3" fill="#fff" className="animate-pulse" />
                </g>
             );
             TrailSVG = <line x1="-80" y1="0" x2="-20" y2="0" stroke="rgba(255,255,255,0.8)" strokeWidth="6" strokeDasharray="15 10" />;
          } else if (strike.type === 'EMP') {
             const color = isPlayer ? '#00bbff' : '#aa00ff';
             MissleSVG = (
                <g transform="scale(1.2)">
                   <circle cx="0" cy="0" r="8" fill="#111" stroke={color} strokeWidth="2" />
                   <circle cx="0" cy="0" r="4" fill={color} className="animate-pulse" />
                   <ellipse cx="0" cy="0" rx="4" ry="12" fill="none" stroke="#fff" strokeWidth="1" className="animate-spin-slow" />
                   <polygon points="-8,-4 -14,-8 -10,0 -14,8 -8,4" fill="#333" />
                </g>
             );
             TrailSVG = (
                <g>
                  <line x1="-50" y1="0" x2="-10" y2="0" stroke={color} strokeWidth="2" strokeDasharray="2 6" />
                  <line x1="-40" y1="3" x2="-10" y2="3" stroke={color} strokeWidth="1" opacity="0.5" />
                  <line x1="-40" y1="-3" x2="-10" y2="-3" stroke={color} strokeWidth="1" opacity="0.5" />
                </g>
             );
          } else {
             // STANDARD, FOR_AMERICA
             const color = isPlayer ? '#00ffff' : '#ff3333';
             MissleSVG = (
                <g>
                   <path d="M -12 -4 L 12 0 L -12 4 Z" fill={color} />
                   <polygon points="-12,-4 -16,-6 -14,0 -16,6 -12,4" fill="white" />
                   <circle cx="-16" cy="0" r="4" fill={color} className="animate-pulse" />
                </g>
             );
             TrailSVG = <line x1="-40" y1="0" x2="-16" y2="0" stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="5 5" />;
          }

          return (
            <g key={strike.id} transform={`translate(${currentX}, ${currentY}) rotate(${angle})`}>
              {TrailSVG}
              {MissleSVG}
            </g>
          );
      })}

      {/* Render Explosions */}
      {(explosions || []).map(ex => {
         if (ex.progress <= 0) return null;
         const coords = ex.target.split(',');
         const { x, y } = hexToPixel(parseInt(coords[0]), parseInt(coords[1]), size);
         const cx = x + ex.offsetX;
         const cy = y + ex.offsetY;
         
         const scale = 1 + ex.progress * 2;
         const opacity = 1 - Math.pow(ex.progress, 2);
         
         return (
            <g key={ex.id} transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity}>
               <circle cx="0" cy="0" r="12" fill="#ffaa00" />
               <circle cx="0" cy="0" r="8" fill="#ffffff" />
               <polygon points="0,-18 5,-5 18,0 5,5 0,18 -5,5 -18,0 -5,-5" fill="#ff4400" />
            </g>
         );
      })}

      {/* Render Explosions */}
      {safeExplosions.map(ex => {
          if (ex.progress === 0) return null; // Still in delay

          const coords = ex.target.split(',');
          const { x, y } = hexToPixel(parseInt(coords[0]), parseInt(coords[1]), size);
          const currentX = x + ex.offsetX;
          const currentY = y + ex.offsetY;
          
          let ExplosionSVG = null;
          
          if (ex.type === 'COBALT') {
             ExplosionSVG = <circle cx="0" cy="0" r={size * 1.5 * ex.progress} fill="rgba(0, 200, 255, 0.4)" stroke="#00ffff" strokeWidth={5 * (1 - ex.progress)} />;
          } else if (ex.type === 'INCENDIARY') {
             ExplosionSVG = (
                 <g>
                    <circle cx="0" cy="0" r={size * ex.progress} fill="rgba(255, 50, 0, 0.6)" />
                    <circle cx={Math.random()*10 - 5} cy={Math.random()*10 - 5} r={size * 0.5 * ex.progress} fill="rgba(255, 150, 0, 0.8)" />
                 </g>
             );
          } else if (ex.type === 'EMP') {
             ExplosionSVG = <circle cx="0" cy="0" r={size * 1.2 * ex.progress} fill="none" stroke="#aa00ff" strokeWidth={10 * (1 - ex.progress)} strokeDasharray="10 10" />;
          } else if (ex.type === 'ICBM') {
             ExplosionSVG = <circle cx="0" cy="0" r={size * 2 * ex.progress} fill="rgba(255, 0, 255, 0.3)" stroke="#ff00ff" strokeWidth={8 * (1 - ex.progress)} />;
          } else {
             // HARPOON & STANDARD & FOR_AMERICA
             ExplosionSVG = <circle cx="0" cy="0" r={size * ex.progress} fill="rgba(255, 255, 255, 0.5)" stroke="#ffffff" strokeWidth={3 * (1 - ex.progress)} />;
          }

          return (
            <g key={ex.id} transform={`translate(${currentX}, ${currentY})`}>
              {ExplosionSVG}
            </g>
          );
      })}
    </g>
  );
};

export default React.memo(StrikeLayer);
