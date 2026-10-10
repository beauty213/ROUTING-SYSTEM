/**
 * timeDependentDijkstra.js
 * Implementation of Time-Dependent Dijkstra's Algorithm using a Binary Min-Heap Priority Queue.
 * 
 * In this algorithm:
 * - Edge traversal costs depend on the exact timestamp at which the vehicle reaches the starting node.
 * - Nodes are relaxed using earliest arrival times: arr[v] = arr[u] + travelTime(edge, arr[u]).
 * - Uses O((V + E) log V) Min-Priority Queue.
 */

import { MinPriorityQueue } from './priorityQueue.js';
import { calculateEdgeTravelTime } from './travelTimeModel.js';
import { buildAdjacencyList } from '../data/graphData.js';

/**
 * Runs Time-Dependent Dijkstra to find the fastest route from source to destination.
 * 
 * @param {Array} edges - Configured road segments
 * @param {string} sourceId - e.g. 'A'
 * @param {string} destinationId - e.g. 'I'
 * @param {number} departureTimeMinutes - Departure time in minutes from midnight (e.g. 1050 for 17:30)
 * @returns {object} Result containing path, travelTime, distance, edgeDetails, exploredCount, etc.
 */
export function timeDependentDijkstra(edges, sourceId, destinationId, departureTimeMinutes) {
  // Edge Case: Source equals Destination
  if (sourceId === destinationId) {
    return {
      success: true,
      strategy: 'time_dependent',
      path: [sourceId],
      totalTravelTimeMinutes: 0,
      totalDistanceKm: 0,
      departureTimeMinutes,
      arrivalTimeMinutes: departureTimeMinutes,
      edgeDetails: [],
      exploredCount: 1,
      visitedNodes: [sourceId],
      congestedSegmentsCount: 0,
    };
  }

  const adj = buildAdjacencyList(edges);

  // Initialize arrival times and predecessors
  const arrivalTime = new Map();
  const predecessor = new Map(); // target -> { from, edge }
  const visited = new Set();
  const exploredOrder = [];

  adj.forEach((_, nodeId) => {
    arrivalTime.set(nodeId, Infinity);
  });

  // Source arrives at departure time
  arrivalTime.set(sourceId, departureTimeMinutes);

  // Priority Queue ordered by earliest arrival time
  const pq = new MinPriorityQueue();
  pq.push(sourceId, departureTimeMinutes);

  let destinationReached = false;

  while (!pq.isEmpty()) {
    const current = pq.pop();
    const u = current.key;
    const currArrTime = current.priority;

    // If already finalized with an earlier arrival time, skip
    if (visited.has(u)) continue;
    visited.add(u);
    exploredOrder.push(u);

    // Early termination once destination is finalized
    if (u === destinationId) {
      destinationReached = true;
      break;
    }

    const outgoingEdges = adj.get(u) || [];
    for (const edge of outgoingEdges) {
      const v = edge.target;
      if (visited.has(v)) continue;

      // Calculate traversal duration based on arrival time at intersection u
      const { travelTimeMinutes } = calculateEdgeTravelTime(edge, currArrTime, true);
      const candidateArrivalTime = currArrTime + travelTimeMinutes;

      if (candidateArrivalTime < arrivalTime.get(v)) {
        arrivalTime.set(v, candidateArrivalTime);
        predecessor.set(v, { from: u, edge });
        pq.push(v, candidateArrivalTime);
      }
    }
  }

  // If destination could not be reached
  if (!destinationReached || arrivalTime.get(destinationId) === Infinity) {
    return {
      success: false,
      strategy: 'time_dependent',
      path: [],
      totalTravelTimeMinutes: Infinity,
      totalDistanceKm: 0,
      departureTimeMinutes,
      arrivalTimeMinutes: Infinity,
      edgeDetails: [],
      exploredCount: exploredOrder.length,
      visitedNodes: exploredOrder,
      congestedSegmentsCount: 0,
      error: `Destination ${destinationId} is unreachable from ${sourceId}.`,
    };
  }

  // Reconstruct path from predecessors
  const path = [];
  let curr = destinationId;
  const pathEdges = [];

  while (curr !== sourceId) {
    path.unshift(curr);
    const predInfo = predecessor.get(curr);
    if (!predInfo) break;
    pathEdges.unshift(predInfo.edge);
    curr = predInfo.from;
  }
  path.unshift(sourceId);

  // Trace full detailed metrics along the reconstructed path
  let simTime = departureTimeMinutes;
  let totalDistanceKm = 0;
  let congestedSegmentsCount = 0;
  const edgeDetails = [];

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = pathEdges[i];

    const { travelTimeMinutes, effectiveSpeed, multiplier, baseTravelTime } = calculateEdgeTravelTime(
      edge,
      simTime,
      true
    );

    const segmentArrival = simTime + travelTimeMinutes;
    if (multiplier > 1.0) congestedSegmentsCount++;

    edgeDetails.push({
      segmentId: `${u}-${v}`,
      from: u,
      to: v,
      roadName: edge.name,
      distanceKm: edge.distance,
      speedLimitKmH: edge.speedLimit,
      multiplier,
      effectiveSpeedKmH: effectiveSpeed,
      entryTimeMinutes: simTime,
      exitTimeMinutes: segmentArrival,
      durationMinutes: travelTimeMinutes,
      baseDurationMinutes: baseTravelTime,
      isCongested: multiplier > 1.0,
    });

    totalDistanceKm += edge.distance;
    simTime = segmentArrival;
  }

  const totalTravelTimeMinutes = simTime - departureTimeMinutes;

  return {
    success: true,
    strategy: 'time_dependent',
    path,
    totalTravelTimeMinutes,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    departureTimeMinutes,
    arrivalTimeMinutes: simTime,
    edgeDetails,
    exploredCount: exploredOrder.length,
    visitedNodes: exploredOrder,
    congestedSegmentsCount,
  };
}

/**
 * Evaluates an arbitrary node path under the time-dependent model departing at departureTime.
 * Essential for evaluating shortest-distance routes and static snapshots under true dynamic conditions.
 * 
 * @param {Array} edges
 * @param {Array<string>} path - e.g. ['A', 'B', 'E', 'F', 'I']
 * @param {number} departureTimeMinutes
 * @returns {object} Evaluation metrics
 */
export function evaluatePathUnderTimeModel(edges, path, departureTimeMinutes) {
  if (!path || path.length === 0) {
    return {
      success: false,
      totalTravelTimeMinutes: Infinity,
      totalDistanceKm: 0,
      edgeDetails: [],
    };
  }

  if (path.length === 1) {
    return {
      success: true,
      path,
      totalTravelTimeMinutes: 0,
      totalDistanceKm: 0,
      departureTimeMinutes,
      arrivalTimeMinutes: departureTimeMinutes,
      edgeDetails: [],
      congestedSegmentsCount: 0,
    };
  }

  const adj = buildAdjacencyList(edges);
  let simTime = departureTimeMinutes;
  let totalDistanceKm = 0;
  let congestedCount = 0;
  const edgeDetails = [];

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];

    const outgoing = adj.get(u) || [];
    const edge = outgoing.find((e) => e.target === v);

    if (!edge) {
      return {
        success: false,
        error: `Invalid edge in path: ${u} -> ${v} does not exist.`,
        totalTravelTimeMinutes: Infinity,
        totalDistanceKm: 0,
        edgeDetails: [],
      };
    }

    const { travelTimeMinutes, effectiveSpeed, multiplier, baseTravelTime } = calculateEdgeTravelTime(
      edge,
      simTime,
      true
    );

    const segmentArrival = simTime + travelTimeMinutes;
    if (multiplier > 1.0) congestedCount++;

    edgeDetails.push({
      segmentId: `${u}-${v}`,
      from: u,
      to: v,
      roadName: edge.name,
      distanceKm: edge.distance,
      speedLimitKmH: edge.speedLimit,
      multiplier,
      effectiveSpeedKmH: effectiveSpeed,
      entryTimeMinutes: simTime,
      exitTimeMinutes: segmentArrival,
      durationMinutes: travelTimeMinutes,
      baseDurationMinutes: baseTravelTime,
      isCongested: multiplier > 1.0,
    });

    totalDistanceKm += edge.distance;
    simTime = segmentArrival;
  }

  return {
    success: true,
    path,
    totalTravelTimeMinutes: simTime - departureTimeMinutes,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    departureTimeMinutes,
    arrivalTimeMinutes: simTime,
    edgeDetails,
    congestedSegmentsCount: congestedCount,
  };
}
