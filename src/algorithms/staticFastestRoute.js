/**
 * staticFastestRoute.js
 * Implementation of Static Fastest-Route Baseline.
 * 
 * Assumes a fixed traffic snapshot taken strictly at the departure time (T0).
 * Edge traversal costs remain constant based on initial conditions and are NOT updated
 * as the vehicle advances through the network.
 * 
 * The resulting route is then evaluated under the true dynamic traffic conditions
 * to quantify the performance penalty of ignoring time-dependence.
 */

import { MinPriorityQueue } from './priorityQueue.js';
import { buildAdjacencyList } from '../data/graphData.js';
import { calculateEdgeTravelTime } from './travelTimeModel.js';
import { evaluatePathUnderTimeModel } from './timeDependentDijkstra.js';

/**
 * Calculates a fastest route using a static snapshot of traffic at departure time,
 * then evaluates its real journey time under true dynamic traffic conditions.
 * 
 * @param {Array} edges
 * @param {string} sourceId
 * @param {string} destinationId
 * @param {number} departureTimeMinutes
 * @returns {object}
 */
export function staticFastestRoute(edges, sourceId, destinationId, departureTimeMinutes) {
  if (sourceId === destinationId) {
    return {
      success: true,
      strategy: 'static_snapshot',
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

  // Precompute static edge costs evaluated strictly at departure time T0
  const staticEdgeCosts = new Map();
  edges.forEach((edge) => {
    const { travelTimeMinutes } = calculateEdgeTravelTime(edge, departureTimeMinutes, false);
    staticEdgeCosts.set(edge.id, travelTimeMinutes);
  });

  const cost = new Map();
  const predecessor = new Map();
  const visited = new Set();
  const exploredOrder = [];

  adj.forEach((_, nodeId) => {
    cost.set(nodeId, Infinity);
  });

  cost.set(sourceId, 0);

  const pq = new MinPriorityQueue();
  pq.push(sourceId, 0);

  let destinationReached = false;

  while (!pq.isEmpty()) {
    const current = pq.pop();
    const u = current.key;
    const currentCost = current.priority;

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

      const staticEdgeCost = staticEdgeCosts.get(edge.id) ?? (edge.distance / edge.speedLimit) * 60;
      const candidateCost = currentCost + staticEdgeCost;

      if (candidateCost < cost.get(v)) {
        cost.set(v, candidateCost);
        predecessor.set(v, { from: u, edge });
        pq.push(v, candidateCost);
      }
    }
  }

  if (!destinationReached || cost.get(destinationId) === Infinity) {
    return {
      success: false,
      strategy: 'static_snapshot',
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

  // Evaluate the actual travel time of this route under dynamic time-dependent traffic
  const evaluation = evaluatePathUnderTimeModel(edges, path, departureTimeMinutes);

  return {
    ...evaluation,
    strategy: 'static_snapshot',
    exploredCount: exploredOrder.length,
    visitedNodes: exploredOrder,
  };
}
