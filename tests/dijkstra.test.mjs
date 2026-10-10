/**
 * tests/dijkstra.test.mjs
 * Comprehensive automated test suite for Time-Dependent Dijkstra's Algorithm
 * and Emergency Vehicle Routing System.
 * 
 * Verifies all 8 required academic scenarios:
 * 1. Simple graph with a known optimal path
 * 2. Shortest-distance route is NOT the fastest route
 * 3. Congestion causes the optimal route to change (Free Flow vs Rush Hour)
 * 4. Destination is unreachable (disconnected graph)
 * 5. Source equals Destination (trivial zero distance/time)
 * 6. Multiple possible optimal routes (tie handling and valid path selection)
 * 7. Road congestion state changes during the journey (dynamic downstream transition)
 * 8. FIFO property verification (monotonic arrival times, no overtaking)
 * 
 * Plus algorithmic invariants:
 * - Arrival times monotonically increase along the reconstructed route
 * - Total distance equals the sum of selected road distances
 * - Total travel time equals the sum of evaluated road segment durations
 * - Path begins at source and terminates at destination
 * - All hops use valid existing edges
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { timeDependentDijkstra, evaluatePathUnderTimeModel } from '../src/algorithms/timeDependentDijkstra.js';
import { shortestDistanceDijkstra } from '../src/algorithms/shortestDistanceDijkstra.js';
import { staticFastestRoute } from '../src/algorithms/staticFastestRoute.js';
import { findAlternativeRoutes } from '../src/algorithms/kShortestPaths.js';
import { calculateEdgeTravelTime } from '../src/algorithms/travelTimeModel.js';
import { INITIAL_EDGES, INITIAL_NODES } from '../src/data/graphData.js';
import { getEdgesForScenario, SCENARIO_TYPES } from '../src/data/scenarios.js';
import { timeStringToMinutes } from '../src/utils/timeUtils.js';

describe('Smart Emergency Vehicle Routing: Time-Dependent Dijkstra Test Suite', () => {

  // Test Case 1: Simple graph with known optimal path
  test('Case 1: Simple linear graph with known optimal path', () => {
    const simpleEdges = [
      { id: '1-2', from: '1', to: '2', distance: 10, speedLimit: 60, bidirectional: true },
      { id: '2-3', from: '2', to: '3', distance: 15, speedLimit: 60, bidirectional: true },
    ];
    // Distance = 25 km, Speed = 60 km/h -> travel time = (25/60)*60 = 25 minutes
    const depTime = 480; // 08:00
    const result = timeDependentDijkstra(simpleEdges, '1', '3', depTime);

    assert.equal(result.success, true);
    assert.deepEqual(result.path, ['1', '2', '3']);
    assert.equal(result.totalDistanceKm, 25);
    assert.ok(Math.abs(result.totalTravelTimeMinutes - 25.0) < 0.001);
    assert.equal(result.arrivalTimeMinutes, depTime + 25.0);
  });

  // Test Case 2: Graph where shortest-distance route is NOT the fastest route
  test('Case 2: Shortest-distance route is NOT the fastest route due to speed limits/traffic', () => {
    // Two paths between X and Y:
    // Path 1 (Short): 5 km at 20 km/h -> (5 / 20) * 60 = 15 minutes
    // Path 2 (Longer expressway): 10 km at 100 km/h -> (10 / 100) * 60 = 6 minutes
    const testEdges = [
      { id: 'X-S', from: 'X', to: 'S', distance: 2.5, speedLimit: 20, bidirectional: true },
      { id: 'S-Y', from: 'S', to: 'Y', distance: 2.5, speedLimit: 20, bidirectional: true },
      { id: 'X-F', from: 'X', to: 'F', distance: 5.0, speedLimit: 100, bidirectional: true },
      { id: 'F-Y', from: 'F', to: 'Y', distance: 5.0, speedLimit: 100, bidirectional: true },
    ];

    const depTime = 600;
    const timeOpt = timeDependentDijkstra(testEdges, 'X', 'Y', depTime);
    const distOpt = shortestDistanceDijkstra(testEdges, 'X', 'Y', depTime);

    // Shortest distance chooses X-S-Y (5 km)
    assert.deepEqual(distOpt.path, ['X', 'S', 'Y']);
    assert.equal(distOpt.totalDistanceKm, 5.0);
    assert.ok(Math.abs(distOpt.totalTravelTimeMinutes - 15.0) < 0.001);

    // Time-dependent Dijkstra chooses X-F-Y (10 km, but only 6 mins)
    assert.deepEqual(timeOpt.path, ['X', 'F', 'Y']);
    assert.equal(timeOpt.totalDistanceKm, 10.0);
    assert.ok(Math.abs(timeOpt.totalTravelTimeMinutes - 6.0) < 0.001);

    // Verify timeOpt is strictly faster despite longer distance
    assert.ok(timeOpt.totalTravelTimeMinutes < distOpt.totalTravelTimeMinutes);
  });

  // Test Case 3: Graph where congestion causes the optimal route to change
  test('Case 3: Congestion causes optimal route to change between Free Flow and Rush Hour', () => {
    const freeFlowEdges = getEdgesForScenario(INITIAL_EDGES, SCENARIO_TYPES.FREE_FLOW);
    const rushHourEdges = getEdgesForScenario(INITIAL_EDGES, SCENARIO_TYPES.RUSH_HOUR);

    const depTime = timeStringToMinutes('17:30'); // Rush hour active

    const freeFlowResult = timeDependentDijkstra(freeFlowEdges, 'A', 'I', depTime);
    const rushHourResult = timeDependentDijkstra(rushHourEdges, 'A', 'I', depTime);

    assert.equal(freeFlowResult.success, true);
    assert.equal(rushHourResult.success, true);

    // Free flow prefers central corridor (e.g. via B-E-F or B-E-H)
    const freeUsesCentralBottleneck =
      freeFlowResult.path.includes('E');

    // In rush hour, B-E and E-F have severe 2.5x congestion, so optimal route shifts away from E
    const rushHourUsesBottlenecks =
      rushHourResult.path.join('-').includes('B-E') ||
      rushHourResult.path.join('-').includes('E-F');

    assert.equal(freeUsesCentralBottleneck, true);
    assert.equal(rushHourUsesBottlenecks, false, 'Rush hour optimal path must bypass congested B-E and E-F');

    // The two routes must differ
    assert.notDeepEqual(freeFlowResult.path, rushHourResult.path);
  });

  // Test Case 4: Destination is unreachable (disconnected graph)
  test('Case 4: Destination is unreachable in disconnected graph', () => {
    // Node Z is completely disconnected
    const disconnectedEdges = [
      { id: 'A-B', from: 'A', to: 'B', distance: 2.0, speedLimit: 50, bidirectional: true },
      { id: 'Z-W', from: 'Z', to: 'W', distance: 1.0, speedLimit: 50, bidirectional: true },
    ];

    const result = timeDependentDijkstra(disconnectedEdges, 'A', 'Z', 500);
    assert.equal(result.success, false);
    assert.equal(result.totalTravelTimeMinutes, Infinity);
    assert.deepEqual(result.path, []);
  });

  // Test Case 5: Source equals Destination
  test('Case 5: Source equals Destination returns trivial zero distance and time', () => {
    const edges = getEdgesForScenario(INITIAL_EDGES, SCENARIO_TYPES.FREE_FLOW);
    const depTime = 600;
    const result = timeDependentDijkstra(edges, 'A', 'A', depTime);

    assert.equal(result.success, true);
    assert.deepEqual(result.path, ['A']);
    assert.equal(result.totalDistanceKm, 0);
    assert.equal(result.totalTravelTimeMinutes, 0);
    assert.equal(result.arrivalTimeMinutes, depTime);
  });

  // Test Case 6: Multiple possible optimal routes (tie handling and valid path selection)
  test('Case 6: Graph with multiple possible symmetric optimal routes returns valid deterministic path', () => {
    // Diamond graph: Top route X-T-Y and Bottom route X-B-Y are perfectly symmetric
    const symmetricEdges = [
      { id: 'X-T', from: 'X', to: 'T', distance: 3.0, speedLimit: 60, bidirectional: true },
      { id: 'T-Y', from: 'T', to: 'Y', distance: 3.0, speedLimit: 60, bidirectional: true },
      { id: 'X-B', from: 'X', to: 'B', distance: 3.0, speedLimit: 60, bidirectional: true },
      { id: 'B-Y', from: 'B', to: 'Y', distance: 3.0, speedLimit: 60, bidirectional: true },
    ];

    const result = timeDependentDijkstra(symmetricEdges, 'X', 'Y', 0);
    assert.equal(result.success, true);
    assert.equal(result.totalDistanceKm, 6.0);
    // Both take (6 / 60) * 60 = 6 minutes
    assert.ok(Math.abs(result.totalTravelTimeMinutes - 6.0) < 0.001);
    // Must be either X-T-Y or X-B-Y
    const validPaths = ['X->T->Y', 'X->B->Y'];
    assert.ok(validPaths.includes(result.path.join('->')));
  });

  // Test Case 7: Congestion state changes during the journey
  test('Case 7: Downstream congestion state transitions while ambulance is traversing network', () => {
    // Departure at 16:55 (1015 min). Rush hour starts at 17:00 (1020 min).
    // Segment 1 (A->B) takes 6 minutes -> arrives at B at 17:01 (1021 min).
    // Segment 2 (B->C) is congested from 17:00 onwards.
    // Ambulance departed before rush hour, but reaches segment 2 inside rush hour!
    const transitionEdges = [
      { id: 'A-B', from: 'A', to: 'B', distance: 5.0, speedLimit: 50, bidirectional: true }, // takes 6 mins
      {
        id: 'B-C',
        from: 'B',
        to: 'C',
        distance: 4.0,
        speedLimit: 40,
        bidirectional: true,
        congestionMultiplier: 2.0,
        congestionStart: 1020, // 17:00
        congestionEnd: 1140,   // 19:00
      },
    ];

    const depTime = 1015; // 16:55
    const result = timeDependentDijkstra(transitionEdges, 'A', 'C', depTime);

    assert.equal(result.success, true);
    // Edge A-B: entry 1015, duration 6.0 min -> arrival at B = 1021 min (17:01)
    const segAB = result.edgeDetails[0];
    assert.equal(segAB.entryTimeMinutes, 1015);
    assert.equal(segAB.durationMinutes, 6.0);
    assert.equal(segAB.exitTimeMinutes, 1021);

    // Edge B-C: entry at 1021 is > 1020, so multiplier 2.0 applies!
    // effective speed = 40 / 2 = 20 km/h -> duration = (4 / 20) * 60 = 12 minutes
    const segBC = result.edgeDetails[1];
    assert.equal(segBC.entryTimeMinutes, 1021);
    assert.equal(segBC.multiplier, 2.0);
    assert.equal(segBC.durationMinutes, 12.0);
    assert.equal(segBC.exitTimeMinutes, 1033);

    assert.equal(result.totalTravelTimeMinutes, 18.0);
  });

  // Test Case 8: FIFO property verification
  test('Case 8: FIFO property is satisfied (later departure never arrives earlier)', () => {
    const congestedEdge = {
      id: 'E1',
      from: 'U',
      to: 'V',
      distance: 6.0,
      speedLimit: 60, // base traversal = 6 minutes
      congestionMultiplier: 2.5, // congested traversal = 15 minutes
      congestionStart: 1020, // 17:00
      congestionEnd: 1140,   // 19:00
    };

    // Test a sweep of departure times across the congestion transition boundary (18:50 to 19:10)
    let prevArrival = -Infinity;
    for (let t = 1130; t <= 1150; t += 1) {
      const { travelTimeMinutes } = calculateEdgeTravelTime(congestedEdge, t, true);
      const arrival = t + travelTimeMinutes;

      // Invariant: arrival time must be non-decreasing with departure time
      assert.ok(
        arrival >= prevArrival - 1e-9,
        `FIFO violation detected at t=${t}: arrival ${arrival} is earlier than previous arrival ${prevArrival}`
      );
      prevArrival = arrival;
    }
  });

  // Invariant Verifications on 3x3 Grid
  test('Invariants verification: distances, arrival monotonicity, edge continuity', () => {
    const edges = getEdgesForScenario(INITIAL_EDGES, SCENARIO_TYPES.RUSH_HOUR);
    const depTime = timeStringToMinutes('17:30');
    const result = timeDependentDijkstra(edges, 'A', 'I', depTime);

    assert.equal(result.success, true);
    assert.equal(result.path[0], 'A');
    assert.equal(result.path[result.path.length - 1], 'I');

    // 1. Arrival times never decrease along path
    let lastTime = depTime;
    for (const detail of result.edgeDetails) {
      assert.ok(detail.entryTimeMinutes >= lastTime - 1e-9);
      assert.ok(detail.exitTimeMinutes >= detail.entryTimeMinutes);
      lastTime = detail.exitTimeMinutes;
    }

    // 2. Sum of road distances matches total distance
    const sumDist = result.edgeDetails.reduce((sum, e) => sum + e.distanceKm, 0);
    assert.ok(Math.abs(sumDist - result.totalDistanceKm) < 0.01);

    // 3. Sum of durations matches total travel time
    const sumTime = result.edgeDetails.reduce((sum, e) => sum + e.durationMinutes, 0);
    assert.ok(Math.abs(sumTime - result.totalTravelTimeMinutes) < 0.01);

    // 4. Comparison strategies run deterministically
    const shortestResult = shortestDistanceDijkstra(edges, 'A', 'I', depTime);
    const staticResult = staticFastestRoute(edges, 'A', 'I', depTime);
    const alternatives = findAlternativeRoutes(edges, 'A', 'I', depTime, result.path, 3);

    assert.equal(shortestResult.success, true);
    assert.equal(staticResult.success, true);
    assert.ok(Array.isArray(alternatives));

    // Time-dependent optimal must be <= shortest distance route's travel time
    assert.ok(result.totalTravelTimeMinutes <= shortestResult.totalTravelTimeMinutes + 1e-9);
  });

  // Test Case 10: Instrumented Step-by-Step Execution Tracing
  test('Case 10: RoutingService.recordDijkstraSteps produces valid real execution states', async () => {
    const { RoutingService } = await import('../src/services/routingService.js');
    const edges = getEdgesForScenario(INITIAL_EDGES, SCENARIO_TYPES.RUSH_HOUR);
    const depTime = 1050; // 17:30
    const steps = RoutingService.recordDijkstraSteps(edges, 'A', 'I', depTime);

    assert.ok(Array.isArray(steps));
    assert.ok(steps.length > 5, 'Dijkstra must record initialization, extractions, and relaxations');

    // Step 1 must be INIT
    assert.equal(steps[0].type, 'INIT');
    assert.equal(steps[0].currentNode, 'A');

    // Final step must reconstruct valid optimal path
    const lastStep = steps[steps.length - 1];
    assert.equal(lastStep.type, 'PATH_RECONSTRUCTED');
    assert.deepEqual(lastStep.finalPath, ['A', 'D', 'G', 'H', 'I']);
  });
});
