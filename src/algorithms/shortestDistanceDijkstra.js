/**
 * shortestDistanceDijkstra.js
 * Implementation of Shortest-Distance Dijkstra Algorithm.
 * 
 * Minimizes strictly physical road distance (km), completely ignoring traffic and time.
 * To enable a scientifically sound comparison, the discovered route is subsequently
 * evaluated under the exact same simulated departure time and traffic model.
 */

import { MinPriorityQueue } from './priorityQueue.js';
import { buildAdjacencyList } from '../data/graphData.js';
import { evaluatePathUnderTimeModel } from './timeDependentDijkstra.js';

/**
 * Finds the shortest physical distance route from source to destination,
 * and evaluates its true travel time under the current traffic scenario.
 * 
 * @param {Array} edges
 * @param {string} sourceId
 * @param {string} destinationId
 * @param {number} departureTimeMinutes
 * @returns {object}
 */
export function shortestDistanceDijkstra(edges, sourceId, destinationId, departureTimeMinutes) {
  if (sourceId === destinationId) {
    return {
      success: true,
      strategy: 'shortest_distance',
      path: [sourceId],
      totalDistanceKm: 0,
      totalTravelTimeMinutes: 0,
      departureTimeMinutes,
      arrivalTimeMinutes: departureTimeMinutes,
      edgeDetails: [],
      exploredCount: 1,
      visitedNodes: [sourceId],
      congestedSegmentsCount: 0,
    };
  }

  const adj = buildAdjacencyList(edges);
  const dist = new Map();
  const predecessor = new Map();
  const visited = new Set();
  const exploredOrder = [];

  adj.forEach((_, nodeId) => {
    dist.set(nodeId, Infinity);
  });

  dist.set(sourceId, 0);

  const pq = new MinPriorityQueue();
  pq.push(sourceId, 0);

  let destinationReached = false;

  while (!pq.isEmpty()) {
    const current = pq.pop();
    const u = current.key;
    const currentDist = current.priority;

    if (visited.has(u)) continue;
    visited.add(u);
    exploredOrder.push(u);

    if (u === destinationId) {
      destinationReached = true;
      break;
    }

    const outgoing = adj.get(u) || [];
    for (const edge of outgoing) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const candidateDist = currentDist + edge.distance;
      if (candidateDist < dist.get(v)) {
        dist.set(v, candidateDist);
        predecessor.set(v, { from: u, edge });
        pq.push(v, candidateDist);
      }
    }
  }

  if (!destinationReached || dist.get(destinationId) === Infinity) {
    return {
      success: false,
      strategy: 'shortest_distance',
      path: [],
      totalDistanceKm: Infinity,
      totalTravelTimeMinutes: Infinity,
      departureTimeMinutes,
      arrivalTimeMinutes: Infinity,
      edgeDetails: [],
      exploredCount: exploredOrder.length,
      visitedNodes: exploredOrder,
      congestedSegmentsCount: 0,
      error: `Destination ${destinationId} is unreachable from ${sourceId}.`,
    };
  }

  // Reconstruct path
  const path = [];
  let curr = destinationId;
  while (curr !== sourceId) {
    path.unshift(curr);
    const pred = predecessor.get(curr);
    if (!pred) break;
    curr = pred.from;
  }
  path.unshift(sourceId);

  // Evaluate the actual travel time of this path under the dynamic traffic model
  const evaluation = evaluatePathUnderTimeModel(edges, path, departureTimeMinutes);

  return {
    ...evaluation,
    strategy: 'shortest_distance',
    exploredCount: exploredOrder.length,
    visitedNodes: exploredOrder,
  };
}
