import React from 'react';
import HexNode from './HexNode';
import { getNeighbors } from '../utils/hexUtils';

const HexGrid = ({ nodes, size, onNodeClick, onNodeDoubleClick, onNodeEnter, onNodeLeave, selectedNodeKeys, targetableKeys }) => {
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
        
        const nbs = getNeighbors(node.q, node.r);
        const isShielded = node.owner === 'player' && nbs.some(nb => {
           const nbNode = nodes[`${nb.q},${nb.r}`];
           return nbNode && nbNode.owner === 'player' && nbNode.state === 'Defensive';
        });

        return (
          <HexNode 
            key={key} 
            node={node} 
            size={size} 
            isSelected={selectedNodeKeys.includes(key)}
            isShielded={isShielded}
            isTargetable={targetableKeys.includes(key)}
            onClick={onNodeClick}
            onDoubleClick={onNodeDoubleClick}
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
