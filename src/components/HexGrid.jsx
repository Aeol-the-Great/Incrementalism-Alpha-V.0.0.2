import React from 'react';
import HexNode from './HexNode';

const HexGrid = ({ nodes, size, onNodeClick, onNodeEnter, onNodeLeave, selectedNodeKeys, targetableKeys }) => {
  return (
    <g className="grid-layer">
      <defs>
        <radialGradient id="playerNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0, 255, 255, 0.3)" />
          <stop offset="100%" stopColor="rgba(0, 255, 255, 0.05)" />
        </radialGradient>
        <radialGradient id="enemyNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 50, 50, 0.3)" />
          <stop offset="100%" stopColor="rgba(255, 50, 50, 0.05)" />
        </radialGradient>
        <radialGradient id="neutralNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(100, 100, 100, 0.15)" />
          <stop offset="100%" stopColor="rgba(100, 100, 100, 0.05)" />
        </radialGradient>
      </defs>

      {Object.values(nodes).map(node => {
        const key = `${node.q},${node.r}`;
        return (
          <HexNode 
            key={key} 
            node={node} 
            size={size} 
            isSelected={selectedNodeKeys.includes(key)}
            isTargetable={targetableKeys.includes(key)}
            onClick={onNodeClick}
            onMouseEnter={onNodeEnter}
            onMouseLeave={onNodeLeave}
          />
        );
      })}
    </g>
  );
};

export default React.memo(HexGrid, (prev, next) => {
  return prev.nodes === next.nodes &&
         prev.size === next.size &&
         prev.selectedNodeKey === next.selectedNodeKey &&
         prev.targetableKeys === next.targetableKeys;
});
