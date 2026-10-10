/**
 * graphData.js
 * Predefined 9-intersection road network arranged in a 3x3 grid:
 * 
 *   A — B — C
 *   |   |   |
 *   D — E — F
 *   |   |   |
 *   G — H — I
 * 
 * Nodes represent intersections with spatial coordinates for visualization.
 * Edges have realistic road distances (km), speed limits (km/h), and names.
 */

export const INITIAL_NODES = [
  { id: 'A', name: 'Ambulance Depot Alpha', x: 120, y: 120, label: 'A', type: 'depot' },
  { id: 'B', name: 'North Central Junction', x: 340, y: 120, label: 'B', type: 'intersection' },
  { id: 'C', name: 'North-East Crossing', x: 560, y: 120, label: 'C', type: 'intersection' },
  { id: 'D', name: 'West Ring Interchange', x: 120, y: 320, label: 'D', type: 'intersection' },
  { id: 'E', name: 'Central City Square', x: 340, y: 320, label: 'E', type: 'bottleneck' },
  { id: 'F', name: 'East Boulevard Hub', x: 560, y: 320, label: 'F', type: 'intersection' },
  { id: 'G', name: 'South-West Outer Hub', x: 120, y: 520, label: 'G', type: 'intersection' },
  { id: 'H', name: 'South Arterial Junction', x: 340, y: 520, label: 'H', type: 'intersection' },
  { id: 'I', name: 'General Emergency Hospital', x: 560, y: 520, label: 'I', type: 'hospital' },
];

/**
 * 12 bidirectional road segments connecting adjacent intersections.
 */
export const INITIAL_EDGES = [
  // Horizontal Top Row
  {
    id: 'A-B',
    from: 'A',
    to: 'B',
    name: 'North Avenue (West)',
    distance: 2.0,
    speedLimit: 50,
    bidirectional: true,
  },
  {
    id: 'B-C',
    from: 'B',
    to: 'C',
    name: 'North Avenue (East)',
    distance: 3.0,
    speedLimit: 50,
    bidirectional: true,
  },

  // Vertical Left Column
  {
    id: 'A-D',
    from: 'A',
    to: 'D',
    name: 'West Ring Parkway (North)',
    distance: 2.5,
    speedLimit: 60,
    bidirectional: true,
  },
  {
    id: 'D-G',
    from: 'D',
    to: 'G',
    name: 'West Ring Parkway (South)',
    distance: 2.5,
    speedLimit: 60,
    bidirectional: true,
  },

  // Vertical Center Column (Bottleneck B-E)
  {
    id: 'B-E',
    from: 'B',
    to: 'E',
    name: 'Central Boulevard (North)',
    distance: 1.8,
    speedLimit: 45,
    bidirectional: true,
  },
  {
    id: 'E-H',
    from: 'E',
    to: 'H',
    name: 'Central Boulevard (South)',
    distance: 2.4,
    speedLimit: 45,
    bidirectional: true,
  },

  // Horizontal Middle Row (Bottleneck E-F)
  {
    id: 'D-E',
    from: 'D',
    to: 'E',
    name: 'Midtown Connector (West)',
    distance: 2.4,
    speedLimit: 45,
    bidirectional: true,
  },
  {
    id: 'E-F',
    from: 'E',
    to: 'F',
    name: 'Midtown Connector (East)',
    distance: 1.8,
    speedLimit: 45,
    bidirectional: true,
  },

  // Vertical Right Column
  {
    id: 'C-F',
    from: 'C',
    to: 'F',
    name: 'East Radial Parkway (North)',
    distance: 3.0,
    speedLimit: 50,
    bidirectional: true,
  },
  {
    id: 'F-I',
    from: 'F',
    to: 'I',
    name: 'Hospital Access Boulevard',
    distance: 2.0,
    speedLimit: 50,
    bidirectional: true,
  },

  // Horizontal Bottom Row (South Bypass Expressway)
  {
    id: 'G-H',
    from: 'G',
    to: 'H',
    name: 'South Expressway (West)',
    distance: 3.0,
    speedLimit: 60,
    bidirectional: true,
  },
  {
    id: 'H-I',
    from: 'H',
    to: 'I',
    name: 'South Expressway (East)',
    distance: 3.0,
    speedLimit: 60,
    bidirectional: true,
  },
];

/**
 * Builds an adjacency list representation of the graph.
 * @param {Array} edges
 * @returns {Map<string, Array<object>>}
 */
export function buildAdjacencyList(edges) {
  const adj = new Map();

  INITIAL_NODES.forEach((node) => {
    adj.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);

    // Forward direction
    adj.get(edge.from).push({
      ...edge,
      target: edge.to,
      origin: edge.from,
    });

    // Reverse direction if bidirectional
    if (edge.bidirectional) {
      adj.get(edge.to).push({
        ...edge,
        target: edge.from,
        origin: edge.to,
      });
    }
  });

  return adj;
}
