import React from 'react';
import { NODE_STATES, NODE_OWNERS } from '../utils/constants';
import { hexToPixel } from '../utils/hexUtils';

const HEX_POINTS = "0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5";

const HexNode = ({ node, size, isSelected, isTargetable, onClick }) => {
  const { q, r, state, owner, hp, maxHp, statusEffects } = node;
  const { x, y } = hexToPixel(q, r, size);

  // Styling based on state
  let strokeColor = 'transparent';
  let fillGradient = 'transparent';
  
  if (owner === NODE_OWNERS.PLAYER) {
    strokeColor = 'rgba(0, 255, 255, 0.4)';
    fillGradient = 'url(#playerNode)';
  } else if (owner === NODE_OWNERS.ENEMY) {
    strokeColor = 'rgba(255, 50, 50, 0.6)';
    fillGradient = 'url(#enemyNode)';
  } else if (state !== NODE_STATES.EMPTY) {
    strokeColor = 'rgba(255,255,255,0.1)';
    fillGradient = 'url(#neutralNode)';
  }

  // Node taxonomy iconography
  const renderIcon = () => {
    switch (state) {
      case NODE_STATES.CORE:
         return <circle r={size * 0.4} fill="white" />;
      case NODE_STATES.PRODUCTIVE:
         return <polygon points={`0,-${size*0.4} ${size*0.35},${size*0.2} -${size*0.35},${size*0.2}`} fill="none" stroke="white" strokeWidth="2" />;
      case NODE_STATES.OFFENSIVE:
         return <polygon points={`0,-${size*0.4} ${size*0.2},0 0,${size*0.4} -${size*0.2},0`} fill="none" stroke="rgba(255,100,100,0.8)" strokeWidth="2" />;
      case NODE_STATES.DEFENSIVE:
         return <polygon points={HEX_POINTS} transform={`scale(${size * 0.4})`} fill="none" stroke="rgba(100,255,255,0.8)" strokeWidth="2" />;
      case NODE_STATES.ADVANCE:
         return <path d={`M 0 -${size*0.5} L ${size*0.2} -${size*0.1} L ${size*0.5} 0 L ${size*0.2} ${size*0.1} L 0 ${size*0.5} L -${size*0.2} ${size*0.1} L -${size*0.5} 0 L -${size*0.2} -${size*0.1} Z`} fill="none" stroke="white" strokeWidth="2" />;
      default:
         return null;
    }
  };

  // Status effects
  const isHot = statusEffects.some(e => e.type === 'radioactive');
  const isBlackout = statusEffects.some(e => e.type === 'blackout');
  const isFire = statusEffects.some(e => e.type === 'fire');

  return (
    <g transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => onClick(node)}>
      {/* Invisible clickable layer */}
      <polygon points={HEX_POINTS} transform={`scale(${size})`} fill="transparent" pointerEvents="all" />

      {/* Main Base Hex */}
      <polygon 
        points={HEX_POINTS} 
        transform={`scale(${size * 0.95})`} 
        fill={fillGradient} 
        stroke={isSelected ? '#ffffff' : strokeColor} 
        strokeWidth={isSelected ? 3 : 1.5} 
        pointerEvents="none" 
      />

      {/* VFX Overlays */}
      {isHot && <polygon points={HEX_POINTS} transform={`scale(${size * 0.95})`} fill="rgba(100,255,50,0.2)" pointerEvents="none" className="animate-pulse" />}
      {isBlackout && <polygon points={HEX_POINTS} transform={`scale(${size * 0.95})`} fill="rgba(0,0,0,0.8)" pointerEvents="none" />}
      {isFire && <circle r={size * 0.6} fill="rgba(255,100,0,0.5)" pointerEvents="none" className="animate-pulse" />}

      {/* Icon */}
      <g pointerEvents="none">
        {renderIcon()}
      </g>

      {/* Targeting Highlight */}
      {isTargetable && (
         <polygon points={HEX_POINTS} transform={`scale(${size * 0.95})`} fill="rgba(75, 255, 100, 0.15)" stroke="rgb(75, 255, 100)" strokeWidth="2" strokeDasharray="4 4" pointerEvents="none" />
      )}

      {/* HP Bar (Only if damaged) */}
      {hp < maxHp && (
        <g transform={`translate(0, ${size * 0.8})`} pointerEvents="none">
           <rect x={-size*0.5} y={0} width={size} height="2" fill="rgba(255,255,255,0.1)" />
           <rect x={-size*0.5} y={0} width={size * Math.max(0, (hp/maxHp))} height="2" fill="white" />
        </g>
      )}
    </g>
  );
};

export default React.memo(HexNode, (prev, next) => {
  return prev.size === next.size &&
         prev.isSelected === next.isSelected &&
         prev.isTargetable === next.isTargetable &&
         prev.node === next.node; // Works because node is treated as immutable ref by engine
});
