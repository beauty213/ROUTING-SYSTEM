# Smart Emergency Vehicle Routing System Using Time-Dependent Dijkstra's Algorithm
## An Academic Case Study on Dynamic Shortest-Path Optimization in Traffic-Constrained Road Networks

---

### 1. Title
**Smart Emergency Vehicle Routing System Using Time-Dependent Dijkstra's Algorithm: Overcoming Rush-Hour Bottlenecks in Urban Road Networks**

---

### 2. Abstract
Emergency vehicle routing is a life-critical challenge where minimizing transit time rather than physical distance directly dictates patient survival rates. Conventional navigation systems rely on static shortest-path formulations (such as standard Dijkstra or $A^*$) that assume constant travel costs across edges. Under dynamic urban traffic conditions, this assumption breaks down: physically shorter corridors often experience extreme peak-hour congestion, making longer perimeter expressways substantially faster. Furthermore, static traffic snapshots taken at departure fail to predict downstream congestion transitions that develop while the vehicle is en route. 

This case study implements a full-stack, client-side, interactive smart-city routing application featuring **Time-Dependent Dijkstra's Algorithm** with a custom Binary Min-Heap Priority Queue ($O((V+E)\log V)$) and rigorous First-In, First-Out (FIFO) boundary smoothing. Evaluated on a 9-intersection ($3 \times 3$ grid) urban network under simulated traffic regimes, the system demonstrates that during a 17:00–19:00 rush hour, the physical shortest path ($7.6\text{ km}$, through central corridors B–E and E–F) requires $16.80\text{ minutes}$, whereas the time-dependent optimal route ($11.0\text{ km}$ via the southern perimeter expressway) requires only $11.00\text{ minutes}$—a travel time reduction of **$34.52\%$ ($5\text{ min } 48\text{ sec}$ saved)**. All findings are verified through deterministic automated test suites and interactive spatial visualizations.

---

### 3. Introduction
Urban emergency medical services (EMS) operate under rigid "golden hour" constraints, where each minute saved in ambulance transit reduces patient mortality by an estimated 7% to 10% in critical cardiovascular and traumatic events. Despite advances in global navigation satellite systems (GNSS), standard consumer routing algorithms frequently optimize for total distance traveled or static average speeds. In modern metropolises, traffic congestion is non-stationary: it evolves as a function of time-of-day, bottleneck capacities, and commuter travel patterns. Consequently, an edge's traversal time cannot be treated as a scalar weight, but must be formulated as a time-dependent function $\tau(e, t)$ evaluated at the exact entry timestamp $t$.

This report details the design, algorithmic formulation, computational complexity, implementation, and experimental validation of an academic emergency vehicle routing system utilizing Time-Dependent Dijkstra's Algorithm.

---

### 4. Problem Statement
Given a directed, weighted road network graph $G = (V, E)$, an emergency vehicle depot (source node $s \in V$), a target medical facility (destination node $d \in V$), and a scheduled departure time $T_0$, determine the trajectory $P = (v_0 = s, v_1, \dots, v_k = d)$ that minimizes total elapsed travel time:
$$\min_{P} \quad T(P, T_0) = \sum_{i=0}^{k-1} \Delta t((v_i, v_{i+1}), t_i)$$
where $t_0 = T_0$ and $t_{i+1} = t_i + \Delta t((v_i, v_{i+1}), t_i)$. 

The central challenge is that:
1. Physical distance minimization ($\min \sum d(e)$) is decoupled from travel time minimization due to heterogeneous speed limits and congestion multipliers.
2. Traversal cost on edge $(v_i, v_{i+1})$ is a dynamic function of arrival time $t_i$ at node $v_i$, rendering static graph-search algorithms suboptimal or invalid.

---

### 5. Motivation and Real-World Relevance
In urban traffic networks:
- **Central Arterials Bottlenecks:** Central corridors feature heavy signalization, lower speed limits ($40\text{–}45\text{ km/h}$), and severe peak-hour capacity over-saturation ($2.5\times$ congestion multipliers).
- **Perimeter Expressways:** Ring roads and bypasses have higher speed limits ($60\text{ km/h}$) and greater capacity, remaining free-flowing even when physical distance is $40\%$ longer.
- **Dynamic Transition Hazard:** Dispatching an ambulance 5 minutes prior to rush hour using a static snapshot leads to catastrophic delays if downstream road segments become congested while the ambulance is en route.

A resilient emergency dispatch system must anticipate downstream traffic evolution dynamically.

---

### 6. Objectives
1. **Mathematical Modeling:** Formulate time-dependent edge traversal functions satisfying the First-In, First-Out (FIFO) property.
2. **Algorithm Implementation:** Implement Time-Dependent Dijkstra using an efficient Binary Min-Heap Priority Queue with $O(\log V)$ `decreaseKey` operations.
3. **Comparative Evaluation:** Benchmark Time-Dependent Dijkstra against:
   - Strategy 2: Shortest-Distance Dijkstra ($\min \text{km}$).
   - Strategy 3: Static Fastest-Route Baseline (frozen $T_0$ traffic snapshot).
4. **Interactive Dashboard:** Build an interactive SVG-based web application with animated vehicle transit, scenario controls, and departure-time sensitivity analytics.
5. **Deterministic Verification:** Author a test suite verifying 8 distinct academic edge cases, including FIFO satisfaction, unreachable destinations, and congestion state flips.

---

### 7. Existing System and Its Limitations

| Routing Approach | Cost Metric Evaluated | Downstream Congestion Awareness | FIFO Consistency | Failure Mode |
|---|---|---|---|---|
| **Shortest-Distance Dijkstra** | Physical Distance $d(e)$ in km | None (Blind to traffic) | N/A (Static) | Traps ambulances in dense urban bottlenecks. |
| **Static Fastest Baseline** | Fixed speed at departure $s(e, T_0)$ | None (Frozen snapshot) | Broken if conditions change | Leaves before rush hour, hits congestion mid-route. |
| **Average Speed Heuristics** | Historical average $s_{\text{avg}}(e)$ | Low (Static average) | Yes | Overestimates off-peak and underestimates rush hour. |

---

### 8. Proposed System
The proposed system resolves these deficiencies by implementing:
1. **Timestamp-Carrying State Space:** Each intersection node maintains its earliest arrival timestamp $arr[u]$.
2. **Dynamic Edge Cost Relaxation:** For each outgoing edge $e = (u, v)$, the algorithm computes $\Delta t(e, arr[u])$ using the vehicle's simulated arrival time at $u$.
3. **FIFO Clearance Smoothing:** Edge cost functions ensure that departing later never arrives earlier ($t_1 \le t_2 \implies arr(t_1) \le arr(t_2)$), preventing non-physical overtaking.
4. **Bounded Alternative Enumeration:** Generates alternative loopless routes using bounded path enumeration, evaluated under identical temporal conditions.

---

### 9. Graph Representation
The road network is modeled as a 9-node directed graph $G = (V, E)$ arranged in a $3 \times 3$ grid:

```
  A (Depot) ————— B ————— C
      |           |       |
      |           |       |
      D ————————— E ————— F
      |           |       |
      |           |       |
      G ————————— H ————— I (Hospital)
```

- **Vertices ($V$):** $V = \{A, B, C, D, E, F, G, H, I\}$
  - $A$: Station Alpha Ambulance Depot $(x=120, y=120)$
  - $E$: Central Square Interchange Bottleneck $(x=340, y=320)$
  - $I$: General Emergency Hospital $(x=560, y=520)$
- **Edges ($E$):** 12 bidirectional road segments ($24$ directed edges in adjacency list).
- **Data Model per Edge:**
  ```json
  {
    "id": "B-E",
    "from": "B",
    "to": "E",
    "name": "Central Boulevard (North)",
    "distance": 1.8,
    "speedLimit": 45,
    "bidirectional": true,
    "congestionMultiplier": 2.5,
    "congestionStart": 1020,
    "congestionEnd": 1140
  }
  ```

---

### 10. Mathematical Formulation
Let:
- $d(e) \in \mathbb{R}^+$: Physical length of road segment $e$ in kilometers.
- $s(e) \in \mathbb{R}^+$: Posted speed limit in kilometers per hour ($\text{km/h}$).
- $c(e, t) \ge 1.0$: Congestion multiplier at arrival time $t$.
- $s_{\text{eff}}(e, t) = \frac{s(e)}{c(e, t)}$: Effective vehicle speed in $\text{km/h}$.
- $\Delta t(e, t)$: Edge traversal duration in minutes:
$$\Delta t(e, t) = \left( \frac{d(e)}{s_{\text{eff}}(e, t)} \right) \times 60 = \left( \frac{d(e) \cdot c(e, t)}{s(e)} \right) \times 60$$

For free-flow traffic ($c = 1.0$):
$$\Delta t_{\text{base}}(e) = \left( \frac{d(e)}{s(e)} \right) \times 60$$

---

### 11. Time-Dependent Edge-Weight Calculation
Congestion is defined over a time interval $[t_{\text{start}}, t_{\text{end}}]$ (in minutes from midnight, e.g. $17:00 = 1020\text{ min}$, $19:00 = 1140\text{ min}$).

#### Continuous Boundary Clearance Model
To satisfy the FIFO property continuously across the clearance boundary at $t_{\text{end}}$, if an ambulance enters edge $e$ at $t \in [t_{\text{start}}, t_{\text{end}}]$:
1. Time remaining until congestion ends: $\Delta t_{\text{rem}} = t_{\text{end}} - t$.
2. Distance covered during congested period:
   $$d_{\text{cong}} = \min\left(d(e), \, \frac{s_{\text{eff}} \cdot \Delta t_{\text{rem}}}{60}\right)$$
3. If $d_{\text{cong}} < d(e)$, remaining distance $d_{\text{free}} = d(e) - d_{\text{cong}}$ is traversed at free-flow speed $s(e)$:
   $$\Delta t(e, t) = \Delta t_{\text{rem}} + \left(\frac{d_{\text{free}}}{s(e)}\right) \times 60$$

This formulation models the physical reality of emergency vehicles accelerating as a traffic jam clears ahead of them.

---

### 12. Dijkstra's Algorithm: Time-Dependent Variant
Standard Dijkstra relaxes edge costs by adding static weights $w(u, v)$. In the time-dependent variant:
1. Node priority in the Min-Heap is the **earliest arrival time** $arr[u]$.
2. The edge relaxation condition becomes:
   $$\text{candidateArr} = arr[u] + \Delta t((u, v), arr[u])$$
   $$\text{If } \text{candidateArr} < arr[v], \quad \text{then } arr[v] \leftarrow \text{candidateArr}, \quad \text{pred}[v] \leftarrow u$$

Because edge traversal times are strictly positive ($\Delta t > 0$) and arrival functions satisfy FIFO, sub-paths of optimal paths remain optimal (Bellman's Principle of Optimality holds).

---

### 13. Pseudocode

```text
Algorithm: TimeDependentDijkstra(G, source, destination, T_0)
Input: Graph G = (V, E), source s, destination d, departure time T_0
Output: Optimal path P, arrival time arr[d], total travel time

1.  FOR each vertex v in V:
2.      arr[v] = Infinity
3.      pred[v] = NIL
4.      visited[v] = FALSE
5.
6.  arr[s] = T_0
7.  PQ = InitializeMinPriorityQueue()
8.  PQ.push(s, priority = T_0)
9.
10. WHILE NOT PQ.isEmpty() DO:
11.     u = PQ.pop()                     // Extracts node with minimum arrival time
12.     IF visited[u] == TRUE THEN CONTINUE
13.     visited[u] = TRUE
14.
15.     IF u == destination THEN BREAK   // Target reached and finalized
16.
17.     FOR each outgoing edge e = (u, v) in Adj[u] DO:
18.         IF visited[v] == TRUE THEN CONTINUE
19.
20.         travelTime = CalculateEdgeTravelTime(e, arr[u])
21.         candidateArrival = arr[u] + travelTime
22.
23.         IF candidateArrival < arr[v] THEN:
24.             arr[v] = candidateArrival
25.             pred[v] = (u, e)
26.             PQ.pushOrDecreaseKey(v, candidateArrival)
27.
28. IF arr[d] == Infinity THEN RETURN Failure("Unreachable")
29.
30. Reconstruct path P from pred starting at d backtracking to s
31. RETURN { path: P, arrivalTime: arr[d], travelTime: arr[d] - T_0 }
```

---

### 14. Data Structures Used
1. **Adjacency List (`Map<string, Array<Edge>>`):** Provides $O(\text{deg}(u))$ neighbor lookup during edge examination.
2. **Binary Min-Heap (`MinPriorityQueue`):** 
   - Internal array representing binary tree (`parent = floor((i-1)/2)`, `left = 2i+1`, `right = 2i+2`).
   - Reverse index lookup table (`Map<string, number>`) mapping node keys to heap indices, enabling $O(\log V)$ `decreaseKey` operations rather than $O(V)$ linear scans.
3. **Predecessor Map (`Map<string, { from, edge }>`):** Enables $O(|P|)$ backtracking for path reconstruction.

---

### 15. Algorithm Correctness and FIFO Property
The correctness of Dijkstra's algorithm relies on the fact that when a node $u$ is extracted from the priority queue, its tentative distance/arrival time is optimal. In time-dependent graphs, this property holds if and only if edge traversal functions satisfy the **First-In, First-Out (FIFO)** property:
$$\forall t_1 \le t_2, \quad t_1 + \Delta t(e, t_1) \le t_2 + \Delta t(e, t_2)$$

#### Proof of Monotonicity in our Model:
Let arrival at destination be $A(t) = t + \Delta t(e, t)$.
During clearance transition:
$$A(t) = t_{\text{end}} + \frac{d(e) - d_{\text{cong}}(t)}{s(e)} \times 60$$
where $d_{\text{cong}}(t) = s_{\text{eff}} \cdot \frac{t_{\text{end}} - t}{60}$.
Taking the derivative with respect to departure time $t$:
$$\frac{dA}{dt} = 0 - \frac{60}{s(e)} \cdot \frac{\partial d_{\text{cong}}}{\partial t} = -\frac{60}{s(e)} \cdot \left(-\frac{s_{\text{eff}}}{60}\right) = \frac{s_{\text{eff}}}{s(e)} = \frac{1}{c(e)} > 0$$
Since $\frac{dA}{dt} > 0$ strictly, $A(t)$ is strictly monotonically increasing. Hence, departing later always arrives later, guaranteeing the FIFO condition holds without exception.

---

### 16. Time and Space Complexity

#### Time Complexity:
1. **Heap Initialization:** $V$ insertions $\implies O(V \log V)$.
2. **Extract-Min Operations:** Each vertex is extracted at most once $\implies V \times O(\log V) = O(V \log V)$.
3. **Edge Relaxations & Decrease-Key:** Each edge is examined at most once per direction. Each relaxation invokes `calculateEdgeTravelTime` in $O(1)$ arithmetic operations, followed by `decreaseKey` in $O(\log V)$ $\implies E \times O(\log V) = O(E \log V)$.
4. **Total Search Time:**
   $$T(V, E) = O((V + E) \log V)$$
5. **Path Reconstruction:** $O(|V|)$ edge pointer traversals.

#### Space Complexity:
- Graph Adjacency List: $O(V + E)$
- Priority Queue Heap Array: $O(V)$
- Key-to-Index Map: $O(V)$
- Predecessor and Arrival Maps: $O(V)$
- Total Memory Consumption: $O(V + E)$

---

### 17. System Architecture
The application is structured into decoupled, modular layers:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Presentation                │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Interactive SVG     │  │ Route Configuration   │  │
│  │  Road Network Canvas  │  │   & Scenario Panel    │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  │
│              │                          │              │
│  ┌───────────▼───────────┐  ┌───────────▼───────────┐  │
│  │    Results Summary    │  │  Multi-Strategy       │  │
│  │    & KPIs Itinerary   │  │   Comparison Table    │  │
│  └───────────────────────┘  └───────────────────────┘  │
└──────────────────────────┬─────────────────────────────┘
                           │ Dispatches State
┌──────────────────────────▼─────────────────────────────┐
│                 Algorithmic Engine                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Time-Dependent Dijkstra (timeDependentDijkstra)│  │
│  │   Shortest-Distance Dijkstra (shortestDistance)  │  │
│  │   Static Fastest Baseline (staticFastestRoute)   │  │
│  │   Bounded Path Enumerator (kShortestPaths)       │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                             │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │  Binary Min-Heap Priority Queue (priorityQueue)  │  │
│  │  FIFO Congestion Model (travelTimeModel)         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

### 18. Frontend and Backend Implementation
- **Frontend Stack:** React 18, Vite 5, Tailwind-compatible CSS with dark navy emergency aesthetics, Lucide React iconography.
- **Rendering Technology:** Pure vector SVG visualization with hardware-accelerated CSS animations (`stroke-dashoffset` flow, siren pulses, vehicle coordinate interpolation).
- **Architecture Rationale:** The entire routing engine executes client-side in sub-millisecond execution time ($<2\text{ ms}$). Running the algorithm in JavaScript avoids external server round-trip latency, eliminates API key dependencies, and guarantees 100% offline reliability.

---

### 19. Test Graph and Edge Data

| Edge ID | From | To | Road Name | Distance | Speed Limit | Base Time | Rush Multiplier | Rush Window |
|---|---|---|---|---|---|---|---|---|
| **A–B** | A | B | North Avenue (West) | 2.0 km | 50 km/h | 2.40 min | 1.0x | Free |
| **B–C** | B | C | North Avenue (East) | 3.0 km | 50 km/h | 3.60 min | 1.0x | Free |
| **A–D** | A | D | West Ring Parkway (North) | 2.5 km | 60 km/h | 2.50 min | 1.0x | Free |
| **D–G** | D | G | West Ring Parkway (South) | 2.5 km | 60 km/h | 2.50 min | 1.0x | Free |
| **B–E** | B | E | Central Boulevard (North) | 1.8 km | 45 km/h | 2.40 min | **2.5x** | 17:00–19:00 |
| **E–H** | E | H | Central Boulevard (South) | 2.4 km | 45 km/h | 3.20 min | 1.6x | 17:00–19:00 |
| **D–E** | D | E | Midtown Connector (West) | 2.4 km | 45 km/h | 3.20 min | 1.6x | 17:00–19:00 |
| **E–F** | E | F | Midtown Connector (East) | 1.8 km | 45 km/h | 2.40 min | **2.5x** | 17:00–19:00 |
| **C–F** | C | F | East Radial Parkway (North) | 3.0 km | 50 km/h | 3.60 min | 1.0x | Free |
| **F–I** | F | I | Hospital Access Boulevard | 2.0 km | 50 km/h | 2.40 min | 1.0x | Free |
| **G–H** | G | H | South Expressway (West) | 3.0 km | 60 km/h | 3.00 min | 1.0x | Free |
| **H–I** | H | I | South Expressway (East) | 3.0 km | 60 km/h | 3.00 min | 1.0x | Free |

---

### 20. Experimental Methodology
To evaluate system efficacy, simulations were executed across three scenarios:
1. **Experiment 1 (Free Flow at 02:00):** Establishes the baseline unconstrained performance.
2. **Experiment 2 (Rush Hour at 17:30):** Evaluates routing behavior under active bottleneck congestion on central corridors B–E and E–F.
3. **Experiment 3 (Downstream Congestion Transition at 16:56):** Evaluates vehicle departure 4 minutes before rush hour to test downstream arrival sensitivity.
4. **Experiment 4 (24-Hour Continuous Sweep):** Evaluates departure times from 00:00 to 23:30 at 30-minute intervals (48 runs) to measure network delay elasticity.

All strategies were evaluated under identical temporal and spatial conditions using `evaluatePathUnderTimeModel`.

---

### 21. Results and Comparison Tables Populated from Actual Simulation Output

#### Table 1: Free-Flow Traffic Baseline (Departure 02:00)
*Origin: Node A (Depot) | Destination: Node I (Hospital)*

| Strategy | Computed Route | Distance | Travel Time | Delay vs Optimal | Improvement % |
|---|---|---|---|---|---|
| **Time-Dependent Dijkstra** | `A → B → E → F → I` | **7.6 km** | **9.60 min (9m 36s)** | 0.00 min | Benchmark |
| **Shortest-Distance Dijkstra** | `A → B → E → F → I` | 7.6 km | 9.60 min (9m 36s) | 0.00 min | 0.00% |
| **Static Fastest Baseline** | `A → B → E → F → I` | 7.6 km | 9.60 min (9m 36s) | 0.00 min | 0.00% |

*Finding:* Under free-flow conditions, physical distance minimization and travel time minimization coincide. The central corridor is both the shortest and fastest route.

---

#### Table 2: Peak Rush-Hour Traffic (Departure 17:30)
*Origin: Node A (Depot) | Destination: Node I (Hospital)*

| Strategy | Computed Route | Distance | Travel Time | Delay vs Optimal | Improvement % |
|---|---|---|---|---|---|
| **Time-Dependent Dijkstra** | `A → D → G → H → I` | **11.0 km** | **11.00 min (11m 00s)** | **0.00 min** | **+34.52% Faster** |
| **Shortest-Distance Dijkstra** | `A → B → E → F → I` | 7.6 km | 16.80 min (16m 48s) | **+5.80 min (5m 48s)** | Baseline (-34.5%) |
| **Static Fastest Baseline** | `A → D → G → H → I` | 11.0 km | 11.00 min (11m 00s) | 0.00 min | +34.52% Faster |

*Finding:* During peak rush hour, the physical shortest path encounters $2.5\times$ congestion on B–E and E–F, ballooning traversal time to $16.80\text{ min}$. Time-Dependent Dijkstra routes the ambulance around the city via the southern perimeter expressway ($11.0\text{ km}$), completing the trip in $11.00\text{ min}$—saving **5 minutes 48 seconds ($34.52\%$)**.

---

#### Table 3: Downstream Transition Hazard (Departure 16:56)
*Origin: Node A (Depot) | Destination: Node I (Hospital)*

| Strategy | Computed Route | Distance | Travel Time | Delay vs Optimal | Improvement % |
|---|---|---|---|---|---|
| **Time-Dependent Dijkstra** | `A → D → G → H → I` | **11.0 km** | **11.00 min (11m 00s)** | **0.00 min** | **+16.67% Faster** |
| **Static Fastest Baseline** | `A → B → E → F → I` | 7.6 km | 13.20 min (13m 12s) | **+2.20 min (2m 12s)** | Sub-optimal |
| **Shortest-Distance Dijkstra** | `A → B → E → F → I` | 7.6 km | 13.20 min (13m 12s) | +2.20 min (2m 12s) | Sub-optimal |

*Finding:* At 16:56, traffic is currently free-flowing across all roads. The static snapshot incorrectly concludes that the central route A–B–E–F–I is optimal. However, as the ambulance enters B–E at 16:58.4, rush hour begins (17:00). The vehicle gets trapped in developing congestion, resulting in a 13.20-minute trip. Time-Dependent Dijkstra anticipates downstream arrival times, avoiding the impending bottleneck and saving **2 minutes 12 seconds ($16.67\%$)**.

---

### 22. Discussion of Findings
1. **Distance Fallacy in Emergency Logistics:** Optimizing purely for distance produces severe delays during peak hours. In our network, traveling $3.4\text{ km}$ further ($+44.7\%$ in distance) achieved a $34.52\%$ reduction in transit time.
2. **Failure of Static Snapshots:** Static snapshots suffer from temporal blindness. In emergency logistics, downstream edge arrival times occur 5 to 20 minutes in the future; failing to model time-dependency exposes ambulances to unexpected traffic gridlock.
3. **FIFO Property Essentiality:** Without FIFO smoothing, Dijkstra's greedy invariant fails, potentially producing invalid cyclic paths or negative-edge-like artifacts. Our continuous clearance formulation ensures robust algorithmic execution.

---

### 23. Limitations
1. **Simulated Traffic Regime:** The application uses synthetic scenario parameters rather than live municipal loop detector or GPS probe feeds.
2. **Piecewise Multiplier Function:** Congestion multipliers are modeled using windowed multiplier functions rather than hydrodynamic macroscopic traffic flow equations (e.g. Lighthill-Whitham-Richards model).
3. **Deterministic Travel Speeds:** Stochastic factors such as weather, traffic signal delays, and temporary pedestrian crossings are treated as lumped average speed limits.

---

### 24. Future Enhancements
1. **Real-Time GTFS-RT / OpenStreetMap Integration:** Ingest live municipal traffic feeds and open street maps for arbitrary city topologies.
2. **Traffic Signal Preemption Modeling:** Model emergency vehicle signal preemption (green waves) that reduce congestion multipliers for ambulances approaching intersections.
3. **Multi-Vehicle Fleet Dispatch:** Implement centralized bipartite matching to dispatch the nearest available ambulance among multiple depots to the incident location.

---

### 25. Conclusion
This academic case study demonstrates the formulation, implementation, and empirical verification of **Time-Dependent Dijkstra's Algorithm** for emergency vehicle dispatch. By dynamically computing edge costs based on simulated intersection arrival timestamps and enforcing the FIFO condition, the system solves the critical flaw of traditional distance-based routing. Experimental results prove that Time-Dependent Dijkstra consistently finds the fastest path, saving up to $34.52\%$ in travel time during rush-hour congestion. The accompanying interactive web application and automated test suite provide an exemplary platform for undergraduate and diploma computer science education and viva examinations.

---

### 26. References
1. Dijkstra, E. W. (1959). *A note on two problems in connexion with graphs.* Numerische Mathematik, 1(1), 269–271.
2. Dreyfus, S. E. (1969). *An appraisal of some shortest-path algorithms.* Operations Research, 17(3), 395–412. (Introduction of time-dependent shortest paths).
3. Cooke, K. L., & Halsey, E. (1966). *The shortest route through a network with time-dependent internodal transit times.* Journal of Mathematical Analysis and Applications, 14(3), 493–498.
4. Halpern, J. (1977). *The shortest path with time-dependent transit times.* Research Report No. 77-4, Technion, Haifa, Israel.
5. Orda, A., & Rom, R. (1990). *Shortest-path and minimum-delay algorithms in networks with time-dependent edge-length.* Journal of the ACM (JACM), 37(3), 607–625.
6. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2022). *Introduction to Algorithms* (4th ed.). MIT Press. (Binary Min-Heap Priority Queue and Shortest Path Foundations).
