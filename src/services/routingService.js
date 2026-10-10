/**
 * routingService.js
 * Centralized, single source of truth for graph data, scenario management,
 * route calculations, and instrumented step-by-step algorithm tracing.
 */

import { INITIAL_NODES, INITIAL_EDGES, buildAdjacencyList } from '../data/graphData.js';
import { HYDERABAD_NODES, HYDERABAD_EDGES } from '../data/hyderabadData.js';
import { SCENARIO_TYPES, SCENARIO_PRESETS, getEdgesForScenario } from '../data/scenarios.js';
import { timeDependentDijkstra, evaluatePathUnderTimeModel } from '../algorithms/timeDependentDijkstra.js';
import { shortestDistanceDijkstra } from '../algorithms/shortestDistanceDijkstra.js';
import { staticFastestRoute } from '../algorithms/staticFastestRoute.js';
import { findAlternativeRoutes } from '../algorithms/kShortestPaths.js';
import { calculateEdgeTravelTime } from '../algorithms/travelTimeModel.js';
import { MinPriorityQueue } from '../algorithms/priorityQueue.js';
import { minutesToTimeString, formatDuration } from '../utils/timeUtils.js';

export class RoutingService {
  /**
   * Returns graph intersections.
   */
  static getNodes() {
    return INITIAL_NODES;
  }

  /**
   * Returns Hyderabad real-world intersections and hospital hubs.
   */
  static getHyderabadNodes() {
    return HYDERABAD_NODES;
  }

  /**
   * Returns Hyderabad real-world road network with speed limits and bottlenecks.
   */
  static getHyderabadEdges() {
    return HYDERABAD_EDGES;
  }

  /**
   * Returns graph road segments configured for a scenario.
   */
  static getEdges(scenarioId = SCENARIO_TYPES.RUSH_HOUR, customConfig = null) {
    return getEdgesForScenario(INITIAL_EDGES, scenarioId, customConfig);
  }

  /**
   * Computes primary Time-Dependent Dijkstra fastest route.
   */
  static computeTimeDependentRoute(edges, sourceId, destinationId, departureTimeMinutes) {
    return timeDependentDijkstra(edges, sourceId, destinationId, departureTimeMinutes);
  }

  /**
   * Computes Shortest-Distance Dijkstra route and evaluates actual duration.
   */
  static computeShortestDistanceRoute(edges, sourceId, destinationId, departureTimeMinutes) {
    return shortestDistanceDijkstra(edges, sourceId, destinationId, departureTimeMinutes);
  }

  /**
   * Computes Static Snapshot baseline route.
   */
  static computeStaticSnapshotRoute(edges, sourceId, destinationId, departureTimeMinutes) {
    return staticFastestRoute(edges, sourceId, destinationId, departureTimeMinutes);
  }

  /**
   * Computes top alternative candidate routes.
   */
  static computeAlternativeRoutes(edges, sourceId, destinationId, departureTimeMinutes, optimalPath, maxAlt = 3) {
    return findAlternativeRoutes(edges, sourceId, destinationId, departureTimeMinutes, optimalPath, maxAlt);
  }

  /**
   * Generates a 24-hour departure time sensitivity sweep (every 30 mins) using real algorithm runs.
   * Compares both Time-Dependent Dijkstra and Shortest-Distance Dijkstra to highlight rush-hour divergence.
   */
  static computeDepartureSweep(edges, sourceId, destinationId, stepMinutes = 30) {
    const sweep = [];
    if (!edges || !sourceId || !destinationId) return sweep;

    for (let m = 0; m < 1440; m += stepMinutes) {
      if (sourceId === destinationId) {
        sweep.push({
          minutes: m,
          timeStr: minutesToTimeString(m),
          timeDepTravelTime: 0,
          shortestDistTravelTime: 0,
          timeSaved: 0,
          timeDepDistance: 0,
          shortestDistDistance: 0,
          timeDepPath: sourceId,
          shortestDistPath: sourceId,
          isCongestedWindow: false,
        });
        continue;
      }

      const tdRes = timeDependentDijkstra(edges, sourceId, destinationId, m);
      const sdRes = shortestDistanceDijkstra(edges, sourceId, destinationId, m);

      const tdTime = tdRes.success ? tdRes.totalTravelTimeMinutes : 0;
      const sdTime = sdRes.success ? sdRes.totalTravelTimeMinutes : 0;
      const timeSaved = Math.max(0, sdTime - tdTime);

      // Check if any edge on either path is currently congested at minute m
      const isCongestedWindow = (m >= 1020 && m <= 1140); // 17:00 - 19:00

      sweep.push({
        minutes: m,
        timeStr: minutesToTimeString(m),
        travelTime: tdTime, // Backward compatibility for any direct reader
        timeDepTravelTime: tdTime,
        shortestDistTravelTime: sdTime,
        timeSaved,
        timeDepDistance: tdRes.success ? tdRes.totalDistanceKm : 0,
        shortestDistDistance: sdRes.success ? sdRes.totalDistanceKm : 0,
        timeDepPath: tdRes.success ? tdRes.path.join(' → ') : 'Unreachable',
        shortestDistPath: sdRes.success ? sdRes.path.join(' → ') : 'Unreachable',
        isCongestedWindow,
      });
    }
    return sweep;
  }

  /**
   * Computes dynamic distance vs travel time tradeoff metrics between Time-Dependent
   * Dijkstra and Shortest-Distance Dijkstra for the active source, destination, and departure time.
   */
  static computeTradeoffMetrics(edges, sourceId, destinationId, departureTimeMinutes) {
    if (sourceId === destinationId) {
      return {
        isTrivial: true,
        shortestDistanceKm: 0,
        shortestTravelTimeMinutes: 0,
        timeDepDistanceKm: 0,
        timeDepTravelTimeMinutes: 0,
        timeSavedMinutes: 0,
        distanceDifferenceKm: 0,
        improvementPct: '0.0',
        shortestPath: sourceId,
        timeDepPath: sourceId,
      };
    }

    const tdRes = timeDependentDijkstra(edges, sourceId, destinationId, departureTimeMinutes);
    const sdRes = shortestDistanceDijkstra(edges, sourceId, destinationId, departureTimeMinutes);

    const sdDist = sdRes.success ? sdRes.totalDistanceKm : 0;
    const sdTime = sdRes.success ? sdRes.totalTravelTimeMinutes : 0;
    const tdDist = tdRes.success ? tdRes.totalDistanceKm : 0;
    const tdTime = tdRes.success ? tdRes.totalTravelTimeMinutes : 0;

    const timeSaved = Math.max(0, sdTime - tdTime);
    const distDiff = tdDist - sdDist;
    const improvementPct = sdTime > 0 ? (((sdTime - tdTime) / sdTime) * 100).toFixed(1) : '0.0';

    return {
      isTrivial: false,
      shortestDistanceKm: sdDist,
      shortestTravelTimeMinutes: sdTime,
      timeDepDistanceKm: tdDist,
      timeDepTravelTimeMinutes: tdTime,
      timeSavedMinutes: timeSaved,
      distanceDifferenceKm: distDiff,
      improvementPct,
      shortestPath: sdRes.success ? sdRes.path.join(' → ') : 'Unreachable',
      timeDepPath: tdRes.success ? tdRes.path.join(' → ') : 'Unreachable',
      shortestCongestedCount: sdRes.congestedSegmentsCount || 0,
      timeDepCongestedCount: tdRes.congestedSegmentsCount || 0,
    };
  }

  /**
   * Instruments Dijkstra's algorithm step-by-step to record real execution state.
   * Enables the Module 5 Step-by-Step Algorithm Explorer to step forward and backward.
   * 
   * @param {Array} edges
   * @param {string} sourceId
   * @param {string} destinationId
   * @param {number} departureTimeMinutes
   * @returns {Array<object>} Array of execution step states
   */
  static recordDijkstraSteps(edges, sourceId, destinationId, departureTimeMinutes) {
    const steps = [];
    const adj = buildAdjacencyList(edges);

    const arrivalTime = new Map();
    const predecessor = new Map();
    const visited = new Set();

    INITIAL_NODES.forEach((n) => arrivalTime.set(n.id, Infinity));
    arrivalTime.set(sourceId, departureTimeMinutes);

    const pq = new MinPriorityQueue();
    pq.push(sourceId, departureTimeMinutes);

    // Initial state step
    steps.push({
      stepNumber: 1,
      type: 'INIT',
      currentNode: sourceId,
      activeEdge: null,
      visitedNodes: [],
      queueSnapshot: [{ key: sourceId, priority: departureTimeMinutes }],
      arrivalTimesSnapshot: new Map(arrivalTime),
      explanation: `Initialized source intersection ${sourceId} arrival time to departure time ${minutesToTimeString(departureTimeMinutes)}. All other intersections set to Infinity (unvisited).`,
    });

    let stepCounter = 2;
    let targetReached = false;

    while (!pq.isEmpty()) {
      const current = pq.pop();
      const u = current.key;
      const currArr = current.priority;

      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({
        stepNumber: stepCounter++,
        type: 'EXTRACT_MIN',
        currentNode: u,
        activeEdge: null,
        visitedNodes: Array.from(visited),
        queueSnapshot: pq.heap.map((item) => ({ key: item.key, priority: item.priority })),
        arrivalTimesSnapshot: new Map(arrivalTime),
        explanation: `Extracted intersection ${u} with earliest arrival time (${minutesToTimeString(currArr, true)}). Marked intersection ${u} as finalized.`,
      });

      if (u === destinationId) {
        targetReached = true;
        steps.push({
          stepNumber: stepCounter++,
          type: 'TARGET_REACHED',
          currentNode: u,
          activeEdge: null,
          visitedNodes: Array.from(visited),
          queueSnapshot: pq.heap.map((item) => ({ key: item.key, priority: item.priority })),
          arrivalTimesSnapshot: new Map(arrivalTime),
          explanation: `Destination ${destinationId} has been extracted and finalized! Optimal arrival time is ${minutesToTimeString(currArr, true)}. Algorithm terminates.`,
        });
        break;
      }

      const neighbors = adj.get(u) || [];
      for (const edge of neighbors) {
        const v = edge.target;
        if (visited.has(v)) continue;

        const { travelTimeMinutes, multiplier, effectiveSpeed } = calculateEdgeTravelTime(edge, currArr, true);
        const candidateArrival = currArr + travelTimeMinutes;
        const currentBest = arrivalTime.get(v);

        if (candidateArrival < currentBest) {
          arrivalTime.set(v, candidateArrival);
          predecessor.set(v, { from: u, edge });
          pq.push(v, candidateArrival);

          steps.push({
            stepNumber: stepCounter++,
            type: 'RELAX_SUCCESS',
            currentNode: u,
            activeEdge: { from: u, to: v, id: edge.id },
            candidateNode: v,
            visitedNodes: Array.from(visited),
            queueSnapshot: pq.heap.map((item) => ({ key: item.key, priority: item.priority })),
            arrivalTimesSnapshot: new Map(arrivalTime),
            explanation: `Examined road ${u} → ${v} (${edge.distance} km, ${effectiveSpeed.toFixed(0)} km/h${multiplier > 1 ? `, ${multiplier}x traffic` : ''}). Candidate arrival ${minutesToTimeString(candidateArrival, true)} is earlier than previous best (${currentBest === Infinity ? 'Infinity' : minutesToTimeString(currentBest, true)}). Updated arrival time for ${v} and set predecessor to ${u}.`,
          });
        } else {
          steps.push({
            stepNumber: stepCounter++,
            type: 'RELAX_REJECT',
            currentNode: u,
            activeEdge: { from: u, to: v, id: edge.id },
            candidateNode: v,
            visitedNodes: Array.from(visited),
            queueSnapshot: pq.heap.map((item) => ({ key: item.key, priority: item.priority })),
            arrivalTimesSnapshot: new Map(arrivalTime),
            explanation: `Examined road ${u} → ${v}. Candidate arrival ${minutesToTimeString(candidateArrival, true)} is NOT earlier than existing arrival time (${minutesToTimeString(currentBest, true)}). Path rejected.`,
          });
        }
      }
    }

    // Reconstruct path
    const path = [];
    if (targetReached) {
      let curr = destinationId;
      while (curr !== sourceId) {
        path.unshift(curr);
        const pred = predecessor.get(curr);
        if (!pred) break;
        curr = pred.from;
      }
      path.unshift(sourceId);

      steps.push({
        stepNumber: stepCounter++,
        type: 'PATH_RECONSTRUCTED',
        currentNode: destinationId,
        activeEdge: null,
        finalPath: path,
        visitedNodes: Array.from(visited),
        queueSnapshot: [],
        arrivalTimesSnapshot: new Map(arrivalTime),
        explanation: `Optimal route reconstructed by following predecessor pointers backwards from ${destinationId} to ${sourceId}: ${path.join(' → ')}. Total journey time: ${formatDuration(arrivalTime.get(destinationId) - departureTimeMinutes)}.`,
      });
    }

    return steps;
  }
}
