import { COLS, ROWS, CHECKPOINTS, isInSpawnZone, isInGoalZone, isInCheckpointZone } from '../config/constants';

// Algorithme A* pour trouver le chemin a travers les checkpoints
export const findPath = (start, goal, obstacles) => {
  const isWalkable = (x, y) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    if (isInSpawnZone(x, y) || isInGoalZone(x, y) || isInCheckpointZone(x, y)) return true;
    return !obstacles.some(obs => obs.x === x && obs.y === y);
  };

  const findPathSegment = (from, to) => {
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const getKey = (x, y) => `${x},${y}`;

    const openSet = [{
      x: from.x, y: from.y, g: 0,
      h: heuristic(from, to), f: heuristic(from, to), parent: null
    }];

    const closedSet = new Set();
    const openSetMap = new Map();
    openSetMap.set(getKey(from.x, from.y), openSet[0]);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = getKey(current.x, current.y);
      openSetMap.delete(currentKey);

      if (current.x === to.x && current.y === to.y) {
        const path = [];
        let node = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }

      closedSet.add(currentKey);

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        const neighborKey = getKey(neighbor.x, neighbor.y);
        if (!isWalkable(neighbor.x, neighbor.y)) continue;
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + 1;
        const h = heuristic(neighbor, to);
        const f = g + h;
        const existingNode = openSetMap.get(neighborKey);

        if (existingNode) {
          if (g < existingNode.g) {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.parent = current;
          }
        } else {
          const newNode = { x: neighbor.x, y: neighbor.y, g, h, f, parent: current };
          openSet.push(newNode);
          openSetMap.set(neighborKey, newNode);
        }
      }
    }
    return null;
  };

  let fullPath = [];
  let currentStart = start;

  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const checkpoint = CHECKPOINTS[i];
    const checkpointCenter = { x: checkpoint.x + 1, y: checkpoint.y + 1 };
    const segment = findPathSegment(currentStart, checkpointCenter);
    if (!segment) return null;
    fullPath = fullPath.length > 0 ? fullPath.concat(segment.slice(1)) : segment;
    currentStart = checkpointCenter;
  }

  const finalSegment = findPathSegment(currentStart, goal);
  if (!finalSegment) return null;
  fullPath = fullPath.length > 0 ? fullPath.concat(finalSegment.slice(1)) : finalSegment;

  return fullPath;
};
