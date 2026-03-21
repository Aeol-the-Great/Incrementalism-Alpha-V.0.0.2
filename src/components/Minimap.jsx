import React from 'react';
import { NODE_OWNERS, HEX_SIZE } from '../utils/constants';

const MinimapStatic = React.memo(({ nodes }) => (
  <svg className="absolute inset-0 w-full h-full" viewBox="-30 -5 60 100" preserveAspectRatio="xMidYMid meet">
    {Object.values(nodes).map(node => {
      const x = 1.732 * node.q + 0.866 * node.r;
      const y = 1.5 * node.r;
      let fill = 'rgba(255,255,255,0.05)';
      if (node.owner === NODE_OWNERS.PLAYER) fill = 'cyan';
      if (node.owner === NODE_OWNERS.ENEMY) fill = 'red';
      return <circle key={`${node.q},${node.r}`} cx={x} cy={y} r="0.6" fill={fill} />;
    })}
  </svg>
));

const Minimap = ({ nodes, camera }) => {
  const gap = 1.666;
  const effectiveSize = HEX_SIZE * gap;
  
  const cX = camera?.x || 0;
  const cY = camera?.y || 0;

  const camW = window.innerWidth / effectiveSize;
  const camH = window.innerHeight / effectiveSize;
  
  // Calculate relative center
  const camX = (-cX / effectiveSize) - (camW / 2);
  const camY = (-cY / effectiveSize) - (camH / 2);

  return (
    <div className="absolute top-6 right-6 w-[12.5vw] h-[12.5vw] bg-black/80 border-2 border-cyan-900/50 overflow-hidden backdrop-blur-md pointer-events-none z-[1000] drop-shadow-xl">
      <MinimapStatic nodes={nodes} />
      <svg className="absolute inset-0 w-full h-full" viewBox="-30 -5 60 100" preserveAspectRatio="xMidYMid meet">
        <rect 
          x={camX} 
          y={camY} 
          width={camW} 
          height={camH} 
          fill="rgba(255, 255, 255, 0.1)" 
          stroke="white" 
          strokeWidth="0.6" 
        />
      </svg>
    </div>
  );
};

export default React.memo(Minimap);
