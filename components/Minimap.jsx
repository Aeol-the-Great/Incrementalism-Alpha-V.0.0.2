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

const Minimap = ({ nodes, camera, setCamera }) => {
  const gap = 1.666;
  const effectiveSize = HEX_SIZE * gap;

  const cX = camera?.x || 0;
  const cY = camera?.y || 0;

  const camW = window.innerWidth / effectiveSize;
  const camH = window.innerHeight / effectiveSize;

  // Calculate relative center
  const camX = (-cX / effectiveSize) - (camW / 2);
  const camY = (-cY / effectiveSize) - (camH / 2);

  const handlePointer = (e) => {
    // Only track if the primary mouse button is pressed
    if (e.buttons !== 1) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    // Map screen pixel location directly onto the SVG viewBox geometry
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setCamera(-svgP.x * effectiveSize, -svgP.y * effectiveSize);
  };

  return (
    <div className="absolute top-6 right-6 w-[12.5vw] h-[12.5vw] bg-black/80 border-2 border-cyan-900/50 overflow-hidden backdrop-blur-md pointer-events-auto z-[1000] drop-shadow-xl">
      <MinimapStatic nodes={nodes} />
      <svg
        className="absolute inset-0 w-full h-full cursor-crosshair"
        viewBox="-30 -5 60 100"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
      >
        {/* Invisible hit-box layer for pointer tracking */}
        <rect x="-30" y="-5" width="60" height="100" fill="transparent" />
        <rect
          x={camX}
          y={camY}
          width={camW}
          height={camH}
          fill="rgba(255, 255, 255, 0.1)"
          stroke="white"
          strokeWidth="0.6"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
};

export default React.memo(Minimap);
