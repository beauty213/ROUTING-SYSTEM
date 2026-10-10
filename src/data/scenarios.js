/**
 * scenarios.js
 * Predefined and customizable traffic scenarios.
 * Times are specified in HH:MM strings and converted to minutes from midnight.
 */

import { timeStringToMinutes } from '../utils/timeUtils.js';

export const SCENARIO_TYPES = {
  FREE_FLOW: 'free_flow',
  NORMAL: 'normal',
  RUSH_HOUR: 'rush_hour',
  CUSTOM: 'custom',
};

export const SCENARIO_PRESETS = [
  {
    id: SCENARIO_TYPES.FREE_FLOW,
    name: 'Free Flow (Night / Ideal)',
    description: 'Zero traffic delays across all roads. Multipliers = 1.0 everywhere.',
    defaultDeparture: '02:00',
    apply: (edges) => {
      return edges.map((e) => ({
        ...e,
        congestionMultiplier: 1.0,
        congestionStart: 0,
        congestionEnd: 1440,
      }));
    },
  },
  {
    id: SCENARIO_TYPES.NORMAL,
    name: 'Normal Traffic (Daytime)',
    description: 'Moderate congestion (1.3x - 1.5x) on central corridors throughout the day.',
    defaultDeparture: '14:00',
    apply: (edges) => {
      return edges.map((e) => {
        let mult = 1.0;
        if (e.id === 'B-E' || e.id === 'E-F') mult = 1.5;
        else if (e.id === 'D-E' || e.id === 'E-H') mult = 1.3;
        else if (e.id === 'A-B' || e.id === 'F-I') mult = 1.15;

        return {
          ...e,
          congestionMultiplier: mult,
          congestionStart: timeStringToMinutes('08:00'),
          congestionEnd: timeStringToMinutes('20:00'),
        };
      });
    },
  },
  {
    id: SCENARIO_TYPES.RUSH_HOUR,
    name: 'Rush Hour Bottleneck (17:00 - 19:00)',
    description: 'Severe rush-hour bottleneck (2.5x) on Central corridors B-E and E-F.',
    defaultDeparture: '17:30',
    apply: (edges) => {
      return edges.map((e) => {
        let mult = 1.0;
        let start = timeStringToMinutes('17:00');
        let end = timeStringToMinutes('19:00');

        if (e.id === 'B-E' || e.id === 'E-F') {
          mult = 2.5; // Heavy central bottleneck
        } else if (e.id === 'D-E' || e.id === 'E-H') {
          mult = 1.6;
        }

        return {
          ...e,
          congestionMultiplier: mult,
          congestionStart: start,
          congestionEnd: end,
        };
      });
    },
  },
  {
    id: SCENARIO_TYPES.CUSTOM,
    name: 'Custom Traffic Conditions',
    description: 'User-configured congestion multiplier and time window.',
    defaultDeparture: '17:30',
    apply: (edges, customConfig = {}) => {
      const mult = customConfig.multiplier || 2.5;
      const start = customConfig.startMinutes ?? timeStringToMinutes('17:00');
      const end = customConfig.endMinutes ?? timeStringToMinutes('19:00');
      const targetEdges = customConfig.targetEdges || ['B-E', 'E-F'];

      return edges.map((e) => {
        if (targetEdges.includes(e.id)) {
          return {
            ...e,
            congestionMultiplier: mult,
            congestionStart: start,
            congestionEnd: end,
          };
        }
        return {
          ...e,
          congestionMultiplier: 1.0,
          congestionStart: 0,
          congestionEnd: 1440,
        };
      });
    },
  },
];

/**
 * Returns configured edges for a given scenario.
 * @param {Array} baseEdges
 * @param {string} scenarioId
 * @param {object} customConfig
 */
export function getEdgesForScenario(baseEdges, scenarioId, customConfig) {
  const preset = SCENARIO_PRESETS.find((p) => p.id === scenarioId) || SCENARIO_PRESETS[0];
  return preset.apply(baseEdges, customConfig);
}
