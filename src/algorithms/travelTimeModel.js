/**
 * travelTimeModel.js
 * Mathematical formulation for time-dependent edge traversal and FIFO property enforcement.
 * 
 * Travel Time Formula:
 *   Free-Flow Speed: s_0 (km/h)
 *   Congested Speed: s_c = s_0 / multiplier (km/h)
 *   Free-Flow Traversal Time: tau_0 = (Distance / s_0) * 60 (minutes)
 * 
 * Dynamic Transition & FIFO (First-In, First-Out) Monotonicity:
 *   Classic time-dependent Dijkstra requires that edge arrival functions satisfy FIFO:
 *     t1 <= t2 => t1 + d(e, t1) <= t2 + d(e, t2)
 *   If a vehicle enters an edge during congestion, it travels at congested speed s_c.
 *   If the congestion clears at t_end while the vehicle is still traversing the segment,
 *   the vehicle accelerates to free-flow speed s_0 for the remaining distance.
 *   
 *   Mathematically:
 *     d_cong = min(D, s_c * (t_end - t) / 60)
 *     d_rem = D - d_cong
 *     Travel Time = (d_cong / s_c) * 60 + (d_rem / s_0) * 60
 *     Arrival Time A(t) = t_end + (d_rem / s_0) * 60
 *     dA/dt = s_c / s_0 > 0  (Strictly positive derivative => 100% strictly monotonic!)
 *   
 *   This ensures later departures never overtake earlier departures.
 */

import { isTimeInWindow } from '../utils/timeUtils.js';

/**
 * Checks whether an edge is congested at a specific moment in time.
 * @param {object} edge
 * @param {number} timeMinutes
 * @returns {boolean}
 */
export function isEdgeCongestedAtTime(edge, timeMinutes) {
  if (!edge.congestionMultiplier || edge.congestionMultiplier <= 1.0) {
    return false;
  }
  if (edge.congestionStart === undefined || edge.congestionEnd === undefined) {
    return true; // Always congested if multiplier set without window
  }
  return isTimeInWindow(timeMinutes, edge.congestionStart, edge.congestionEnd);
}

/**
 * Calculates the exact travel time for an edge with transition handling and FIFO satisfaction.
 * 
 * @param {object} edge - Edge object { distance, speedLimit, congestionMultiplier, congestionStart, congestionEnd }
 * @param {number} arrivalTimeMinutes - Time vehicle arrives at the start of the edge
 * @param {boolean} handleTransition - Whether to model traffic clearance transitions at window boundaries
 * @returns {{ travelTimeMinutes: number, effectiveSpeed: number, multiplier: number, baseTravelTime: number }}
 */
export function calculateEdgeTravelTime(edge, arrivalTimeMinutes, handleTransition = true) {
  const distance = edge.distance; // km
  const speedLimit = edge.speedLimit; // km/h
  const baseTravelTime = (distance / speedLimit) * 60; // minutes in free flow

  const mult = edge.congestionMultiplier || 1.0;
  const hasWindow = edge.congestionStart !== undefined && edge.congestionEnd !== undefined;

  // If no congestion multiplier configured, return pure free-flow
  if (mult <= 1.0) {
    return {
      travelTimeMinutes: baseTravelTime,
      effectiveSpeed: speedLimit,
      multiplier: 1.0,
      baseTravelTime,
    };
  }

  // Check if arrival is inside the congestion window
  const isCurrentlyCongested = isEdgeCongestedAtTime(edge, arrivalTimeMinutes);

  if (!isCurrentlyCongested) {
    // Edge is currently free-flowing
    return {
      travelTimeMinutes: baseTravelTime,
      effectiveSpeed: speedLimit,
      multiplier: 1.0,
      baseTravelTime,
    };
  }

  // Inside congestion window:
  const congestedSpeed = speedLimit / mult;
  const fullCongestedDuration = (distance / congestedSpeed) * 60;

  if (!handleTransition || !hasWindow) {
    return {
      travelTimeMinutes: fullCongestedDuration,
      effectiveSpeed: congestedSpeed,
      multiplier: mult,
      baseTravelTime,
    };
  }

  // Transition modeling for FIFO guarantee:
  // How much time remains until congestion ends?
  const tEnd = edge.congestionEnd;
  const timeUntilClearance = tEnd - arrivalTimeMinutes;

  if (timeUntilClearance <= 0) {
    // Congestion ended
    return {
      travelTimeMinutes: baseTravelTime,
      effectiveSpeed: speedLimit,
      multiplier: 1.0,
      baseTravelTime,
    };
  }

  // Distance vehicle covers before congestion clears
  const maxDistanceInCongestion = (congestedSpeed * timeUntilClearance) / 60;

  if (maxDistanceInCongestion >= distance) {
    // Entire segment traversed before congestion clears
    return {
      travelTimeMinutes: fullCongestedDuration,
      effectiveSpeed: congestedSpeed,
      multiplier: mult,
      baseTravelTime,
    };
  }

  // Vehicle traverses partial segment in congestion, and the rest in free-flow
  const distInCongestion = maxDistanceInCongestion;
  const distInFreeFlow = distance - distInCongestion;

  const timeInCongestion = timeUntilClearance;
  const timeInFreeFlow = (distInFreeFlow / speedLimit) * 60;
  const totalDuration = timeInCongestion + timeInFreeFlow;

  const averageSpeed = (distance / totalDuration) * 60;

  return {
    travelTimeMinutes: totalDuration,
    effectiveSpeed: averageSpeed,
    multiplier: mult,
    baseTravelTime,
  };
}

/**
 * Calculates candidate arrival time at the destination node of an edge.
 * @param {object} edge
 * @param {number} arrivalTimeAtOriginMinutes
 * @returns {number}
 */
export function calculateArrivalAtNeighbor(edge, arrivalTimeAtOriginMinutes) {
  const { travelTimeMinutes } = calculateEdgeTravelTime(edge, arrivalTimeAtOriginMinutes, true);
  return arrivalTimeAtOriginMinutes + travelTimeMinutes;
}
