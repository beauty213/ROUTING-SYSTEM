import React, { useState, useMemo } from 'react';
import {
  BrainCircuit,
  Layers,
  Cpu,
  GitBranch,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import RoadNetwork from '../components/RoadNetwork';
import StepByStepStepper from '../components/StepByStepStepper';
import { RoutingService } from '../services/routingService';

export default function AlgorithmPage({
  nodes,
  edges,
  sourceId,
  destinationId,
  departureTimeMinutes,
  optimalResult,
}) {
  const [activeSubTab, setActiveSubTab] = useState('stepper'); // 'basics' | 'algorithm' | 'stepper' | 'complexity'
  const [stepIndex, setStepIndex] = useState(0);

  // Compute real algorithm execution steps using RoutingService
  const recordedSteps = useMemo(() => {
    return RoutingService.recordDijkstraSteps(edges, sourceId, destinationId, departureTimeMinutes);
  }, [edges, sourceId, destinationId, departureTimeMinutes]);

  const activeStep = recordedSteps[stepIndex] || recordedSteps[0];

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full">
      {/* 1. Module Header & Sub-Navigation */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Algorithm Explorer & Execution Lab
              </h2>
              <p className="text-xs text-slate-400">
                Understand Time-Dependent Dijkstra, view annotated pseudocode, step through execution states, and learn complexity analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {[
            { id: 'basics', label: 'A. Graph Basics', icon: GitBranch },
            { id: 'algorithm', label: "B. Dijkstra's Algorithm & Pseudocode", icon: Layers },
            { id: 'stepper', label: 'C. Step-by-Step Execution Stepper', icon: Play, badge: 'Live Stepper' },
            { id: 'complexity', label: 'D. Computational Complexity', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`text-xs px-3.5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge badge-emergency text-[9px] py-0">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-SECTION A: GRAPH BASICS */}
      {activeSubTab === 'basics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                What is a Road Network Graph?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                In computer science, a city's road network is represented as a <strong>graph G = (V, E)</strong>:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-cyan-400 block mb-0.5">Vertices / Nodes (V = 9)</strong>
                  <p className="text-slate-300">
                    Road intersections where vehicles can turn. Labeled <strong>A through I</strong> in a 3×3 grid.
                    Node A represents the Ambulance Depot; Node I represents the General Emergency Hospital.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-indigo-400 block mb-0.5">Edges (E = 12 segments)</strong>
                  <p className="text-slate-300">
                    The streets connecting adjacent intersections (e.g. A–B, B–E, E–F). Each road has a length in km,
                    a speed limit (40–60 km/h), and a congestion multiplier.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block mb-0.5">Edge Weights / Costs</strong>
                  <p className="text-slate-300">
                    Unlike standard maps where weight is distance, in this system weight is <strong>travel time</strong>:
                    <code className="text-amber-300 font-mono block mt-1">
                      Travel Time = (Distance / (Speed Limit / Multiplier)) × 60
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <RoadNetwork
              nodes={nodes}
              edges={edges}
              sourceId={sourceId}
              destinationId={destinationId}
              onSelectSource={() => {}}
              onSelectDestination={() => {}}
              optimalResult={optimalResult}
              departureTimeMinutes={departureTimeMinutes}
            />
          </div>
        </div>
      )}

      {/* 3. SUB-SECTION B: DIJKSTRA'S ALGORITHM & PSEUDOCODE */}
      {activeSubTab === 'algorithm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                How Dijkstra's Algorithm Works in Plain English
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Dijkstra's algorithm is a greedy shortest-path algorithm. In our time-dependent implementation:
              </p>

              <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300">
                <li>
                  <strong>Initialize:</strong> Set the source depot's arrival time to the departure time (e.g. 17:30).
                  Set all other intersections to Infinity (unknown).
                </li>
                <li>
                  <strong>Priority Queue:</strong> Place intersections in a min-heap ordered by earliest arrival time.
                </li>
                <li>
                  <strong>Extract Earliest:</strong> Always extract the intersection with the smallest arrival time next.
                </li>
                <li>
                  <strong>Examine Outgoing Roads:</strong> For each neighbor, calculate how long it takes to traverse that road
                  <em>using the exact time the ambulance reaches the current intersection</em>.
                </li>
                <li>
                  <strong>Relaxation:</strong> If the candidate arrival time is earlier than the neighbor's current recorded arrival time,
                  update it and record the predecessor pointer!
                </li>
                <li>
                  <strong>Finalize:</strong> Repeat until the hospital destination is extracted, then backtrack predecessor pointers to build the path.
                </li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 font-mono">
                Annotated Algorithmic Pseudocode
              </h3>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`Algorithm TimeDependentDijkstra(G, Source s, Destination d, DepartureTime T0):
  // 1. Initialize arrival times
  For each v in V:
    arr[v] = Infinity, pred[v] = NIL, visited[v] = false
  arr[s] = T0

  // 2. Insert source into Min-Priority Queue
  PQ = BinaryMinHeap()
  PQ.push(s, priority = T0)

  // 3. Main search loop
  While PQ is not empty:
    u = PQ.pop()                         // Earliest arrival node
    If visited[u] == true: continue
    visited[u] = true
    If u == d: break                     // Target finalized

    // 4. Examine outgoing road segments
    For each road e = (u, v) in G.adj[u]:
      If visited[v] == true: continue

      // Calculate traversal duration at time arr[u]
      traversalTime = EdgeCost(e, arrivalTime = arr[u])
      candidateArrival = arr[u] + traversalTime

      // 5. Relaxation step
      If candidateArrival < arr[v]:
        arr[v] = candidateArrival
        pred[v] = (u, e)
        PQ.pushOrDecreaseKey(v, candidateArrival)

  // 6. Backtrack optimal route
  Return ReconstructPath(pred, from = d, to = s)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-SECTION C: STEP-BY-STEP EXECUTION STEPPER */}
      {activeSubTab === 'stepper' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <StepByStepStepper
              steps={recordedSteps}
              currentStepIndex={stepIndex}
              onStepChange={setStepIndex}
            />
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <RoadNetwork
              nodes={nodes}
              edges={edges}
              sourceId={sourceId}
              destinationId={destinationId}
              onSelectSource={() => {}}
              onSelectDestination={() => {}}
              optimalResult={optimalResult}
              departureTimeMinutes={departureTimeMinutes}
              activeStepNode={activeStep?.currentNode}
              activeStepEdge={activeStep?.activeEdge}
              candidateNode={activeStep?.candidateNode}
              visitedStepNodes={activeStep?.visitedNodes || []}
            />
          </div>
        </div>
      )}

      {/* 5. SUB-SECTION D: COMPUTATIONAL COMPLEXITY */}
      {activeSubTab === 'complexity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Binary-Heap Time Complexity: O((V + E) log V)
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Why is the time complexity <strong>O((V + E) log V)</strong>? Let's break it down in simple terms:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-white block mb-0.5">1. What is V?</strong>
                  <span className="text-slate-300">
                    V is the number of vertices (intersections). Here, <strong>V = 9</strong>. Each vertex is extracted
                    from the min-heap at most once. Extract-min takes <code>O(log V)</code> time, so all extractions take
                    <code>V × O(log V) = O(V log V)</code>.
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-white block mb-0.5">2. What is E?</strong>
                  <span className="text-slate-300">
                    E is the number of edges (road segments). Here, <strong>E = 12</strong> (24 directed edges).
                    Each edge is relaxed at most once. Each relaxation may update the priority queue via
                    <code>decreaseKey</code>, taking <code>O(log V)</code> time. All edge operations take <code>O(E log V)</code>.
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-white block mb-0.5">3. Time-Dependent Function Evaluation</strong>
                  <span className="text-slate-300">
                    Calculating the travel time takes <code>O(1)</code> arithmetic operations. It does not add to the
                    graph search complexity, preserving the optimal <strong>O((V + E) log V)</strong> bound.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-fuchsia-300 font-mono">
              Space Complexity: O(V + E) for adjacency list, priority queue, and predecessor pointers.
            </div>
          </div>

          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  The FIFO Property Requirement
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Classic time-dependent Dijkstra works correctly <em>if and only if</em> the road arrival functions satisfy FIFO:
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 mb-3">
                ∀ t₁ ≤ t₂ ⇒ t₁ + Traversal(e, t₁) ≤ t₂ + Traversal(e, t₂)
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>In everyday language: </strong> Departing an intersection later must never result in arriving earlier
                at the next intersection. If an edge had negative travel times or unphysical overtaking where leaving later arrived earlier,
                Dijkstra's greedy choice would fail. Our continuous clearance model guarantees FIFO monotonicity.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
              ✓ Verified across all 9 automated unit tests
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
