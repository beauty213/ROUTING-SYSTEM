import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, ShieldAlert, Cross, Navigation, Clock, Zap } from 'lucide-react';
import { isEdgeCongestedAtTime } from '../algorithms/travelTimeModel';
import { minutesToTimeString, formatDuration } from '../utils/timeUtils';

export default function NetworkGraph({
  nodes,
  edges,
  sourceId,
  destinationId,
  onSelectSource,
  onSelectDestination,
  optimalResult,
  shortestDistanceResult,
  departureTimeMinutes,
  showShortestDistanceOverlay,
  onToggleShortestOverlay,
  blockedEdgeIds = [],
  onToggleBlockEdge,
}) {
  // Animation state for vehicle transit
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0.0 to 1.0 along the optimal path
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const [selectedNodeModal, setSelectedNodeModal] = useState(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const optimalPath = optimalResult?.path || [];
  const edgeDetails = optimalResult?.edgeDetails || [];
  const totalTravelTime = optimalResult?.totalTravelTimeMinutes || 0;

  // Node position map for fast lookup
  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Reset animation when path or departure changes
  useEffect(() => {
    setIsPlaying(false);
    setAnimProgress(0);
    lastTimeRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, [optimalPath.join('-'), departureTimeMinutes]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || optimalPath.length <= 1 || totalTravelTime <= 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Real journey time in seconds is totalTravelTime * 60.
      // For visual preview, let standard animation take 8 seconds base at 1x speed.
      const baseDurationSec = Math.max(4, Math.min(12, totalTravelTime * 0.8));
      const step = (deltaSec * playbackSpeed) / baseDurationSec;

      setAnimProgress((prev) => {
        const next = prev + step;
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalTravelTime, optimalPath.length]);

  // Calculate current vehicle coordinates and simulated timestamp
  const calculateVehiclePosition = () => {
    if (optimalPath.length <= 1 || edgeDetails.length === 0) {
      const srcNode = nodeMap.get(sourceId);
      return {
        x: srcNode?.x || 120,
        y: srcNode?.y || 120,
        simulatedMinutes: departureTimeMinutes,
        currentSegment: null,
      };
    }

    const currentMinuteInJourney = animProgress * totalTravelTime;
    const currentSimulatedTime = departureTimeMinutes + currentMinuteInJourney;

    // Find active edge detail
    let accumulatedTime = 0;
    for (let i = 0; i < edgeDetails.length; i++) {
      const detail = edgeDetails[i];
      const segmentDuration = detail.durationMinutes;

      if (
        currentMinuteInJourney <= accumulatedTime + segmentDuration ||
        i === edgeDetails.length - 1
      ) {
        const segProgress = Math.max(
          0,
          Math.min(1, (currentMinuteInJourney - accumulatedTime) / segmentDuration)
        );
        const fromNode = nodeMap.get(detail.from);
        const toNode = nodeMap.get(detail.to);

        const x = fromNode.x + (toNode.x - fromNode.x) * segProgress;
        const y = fromNode.y + (toNode.y - fromNode.y) * segProgress;

        return {
          x,
          y,
          simulatedMinutes: currentSimulatedTime,
          currentSegment: detail,
        };
      }
      accumulatedTime += segmentDuration;
    }

    const lastNode = nodeMap.get(optimalPath[optimalPath.length - 1]);
    return {
      x: lastNode?.x || 560,
      y: lastNode?.y || 520,
      simulatedMinutes: departureTimeMinutes + totalTravelTime,
      currentSegment: edgeDetails[edgeDetails.length - 1],
    };
  };

  const vehicleState = calculateVehiclePosition();

  // Helper: check if an edge is part of the optimal path
  const isEdgeInPath = (u, v, path) => {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === u && path[i + 1] === v) ||
        (path[i] === v && path[i + 1] === u)
      ) {
        return true;
      }
    }
    return false;
  };

  const shortestPath = shortestDistanceResult?.path || [];

  return (
    <div className="panel-card flex flex-col h-full relative overflow-hidden bg-[#0c121e] border-[#1e293b]">
      {/* Top Header & Visual Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Road Network Graph (3×3 Grid)
          </h2>
          <span className="text-xs text-slate-400">
            Click any node to reassign Source or Destination
          </span>
        </div>

        {/* Animation playback controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              if (animProgress >= 1.0) setAnimProgress(0);
              setIsPlaying(!isPlaying);
            }}
            disabled={optimalPath.length <= 1}
            className="text-xs font-semibold px-2 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded flex items-center gap-1 transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : animProgress > 0 ? 'Resume' : 'Drive'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setAnimProgress(0);
            }}
            disabled={animProgress === 0}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-30 p-1"
            title="Rewind to Depot"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed toggles */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Live Animation Time Indicator */}
          <div className="border-l border-slate-700 pl-2 text-[11px] font-mono text-cyan-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{minutesToTimeString(vehicleState.simulatedMinutes, true)}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full flex-1 min-h-[460px] flex items-center justify-center p-4">
        <svg
          viewBox="0 0 680 640"
          className="w-full h-full max-w-[680px] max-h-[640px] select-none"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-optimal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-congested" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-siren" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Direction marker for optimal route */}
            <marker
              id="arrow-optimal"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Background grid gridlines */}
          <g opacity="0.15">
            <line x1="60" y1="120" x2="620" y2="120" stroke="#334155" strokeDasharray="3 3" />
            <line x1="60" y1="320" x2="620" y2="320" stroke="#334155" strokeDasharray="3 3" />
            <line x1="60" y1="520" x2="620" y2="520" stroke="#334155" strokeDasharray="3 3" />
            <line x1="120" y1="60" x2="120" y2="580" stroke="#334155" strokeDasharray="3 3" />
            <line x1="340" y1="60" x2="340" y2="580" stroke="#334155" strokeDasharray="3 3" />
            <line x1="560" y1="60" x2="560" y2="580" stroke="#334155" strokeDasharray="3 3" />
          </g>

          {/* 1. Base Road Edges */}
          {edges.map((edge) => {
            const uNode = nodeMap.get(edge.from);
            const vNode = nodeMap.get(edge.to);
            if (!uNode || !vNode) return null;

            const isBlocked = blockedEdgeIds.includes(edge.id);
            const isCongested = !isBlocked && isEdgeCongestedAtTime(edge, departureTimeMinutes);
            const inOptimal = isEdgeInPath(edge.from, edge.to, optimalPath);
            const inShortest = isEdgeInPath(edge.from, edge.to, shortestPath);

            const midX = (uNode.x + vNode.x) / 2;
            const midY = (uNode.y + vNode.y) / 2;

            // Offset label slightly perpendicular to edge line
            const dx = vNode.x - uNode.x;
            const dy = vNode.y - uNode.y;
            const isHorizontal = Math.abs(dx) > Math.abs(dy);
            const labelX = midX + (isHorizontal ? 0 : 28);
            const labelY = midY + (isHorizontal ? -14 : 0);

            return (
              <g key={edge.id}>
                {/* Thick underlying edge line */}
                <line
                  x1={uNode.x}
                  y1={uNode.y}
                  x2={vNode.x}
                  y2={vNode.y}
                  stroke={isBlocked ? '#ef4444' : isCongested ? '#f59e0b' : '#334155'}
                  strokeWidth={isBlocked ? 6 : isCongested ? 7 : 5}
                  strokeOpacity={isBlocked ? 0.95 : isCongested ? 0.85 : 0.6}
                  strokeDasharray={isBlocked ? '4 4' : isCongested ? '8 4' : 'none'}
                />

                {/* Congestion Glow Layer */}
                {isCongested && (
                  <line
                    x1={uNode.x}
                    y1={uNode.y}
                    x2={vNode.x}
                    y2={vNode.y}
                    stroke="#f59e0b"
                    strokeWidth={14}
                    strokeOpacity={0.25}
                    filter="url(#glow-congested)"
                  />
                )}

                {/* Shortest Distance Overlay (Purple dashed) */}
                {showShortestDistanceOverlay && inShortest && !inOptimal && (
                  <line
                    x1={uNode.x}
                    y1={uNode.y}
                    x2={vNode.x}
                    y2={vNode.y}
                    stroke="#a855f7"
                    strokeWidth={5}
                    strokeDasharray="6 6"
                    strokeOpacity={0.9}
                  />
                )}

                {/* Optimal Route Highlight (Glowing Emerald) */}
                {inOptimal && (
                  <>
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke="#10b981"
                      strokeWidth={12}
                      strokeOpacity={0.4}
                      filter="url(#glow-optimal)"
                    />
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke="#10b981"
                      strokeWidth={6}
                      className="animate-dash"
                    />
                  </>
                )}

                {/* Road Metric Tag (Distance & Speed) */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x="-28"
                    y="-10"
                    width="56"
                    height="20"
                    rx="4"
                    fill="#0f172a"
                    stroke={isCongested ? '#b45309' : inOptimal ? '#059669' : '#1e293b'}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isCongested ? '#fcd34d' : inOptimal ? '#6ee7b7' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    {edge.distance}km•{edge.speedLimit}
                  </text>

                  {/* Congestion Multiplier Badge or Blocked Badge */}
                  {isBlocked ? (
                    <g transform="translate(0, 16)">
                      <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#dc2626" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        ROAD CLOSED
                      </text>
                    </g>
                  ) : isCongested ? (
                    <g transform="translate(0, 16)">
                      <rect
                        x="-20"
                        y="-7"
                        width="40"
                        height="14"
                        rx="3"
                        fill="#b45309"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {edge.congestionMultiplier}x CONG
                      </text>
                    </g>
                  ) : null}
                </g>
              </g>
            );
          })}

          {/* 2. Intersections (Nodes A through I) */}
          {nodes.map((node) => {
            const isSource = node.id === sourceId;
            const isDestination = node.id === destinationId;
            const inOptimal = optimalPath.includes(node.id);
            const inShortest = shortestPath.includes(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelectedNodeModal(node)}
              >
                {/* Node Halo / Pulse for Source & Destination */}
                {isSource && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                    className="animate-ping"
                  />
                )}
                {isDestination && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                    className="animate-ping"
                  />
                )}

                {/* Outer Node Ring */}
                <circle
                  r={isSource || isDestination ? 24 : 18}
                  fill={
                    isSource
                      ? '#7f1d1d'
                      : isDestination
                      ? '#064e3b'
                      : inOptimal
                      ? '#065f46'
                      : '#1e293b'
                  }
                  stroke={
                    isSource
                      ? '#ef4444'
                      : isDestination
                      ? '#10b981'
                      : inOptimal
                      ? '#34d399'
                      : '#475569'
                  }
                  strokeWidth={isSource || isDestination ? 3 : 2}
                  className="transition-all duration-300 group-hover:stroke-cyan-400 group-hover:scale-110"
                />

                {/* Inner Core */}
                <circle
                  r={isSource || isDestination ? 17 : 12}
                  fill={
                    isSource
                      ? '#dc2626'
                      : isDestination
                      ? '#059669'
                      : inOptimal
                      ? '#10b981'
                      : '#0f172a'
                  }
                />

                {/* Node Identifier Letter */}
                <text
                  x="0"
                  y={isSource || isDestination ? 6 : 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSource || isDestination ? 15 : 12}
                  fontWeight="800"
                  fontFamily="Inter, sans-serif"
                >
                  {node.id}
                </text>

                {/* Role Marker Label (Depot / Hospital / Intersection) */}
                <text
                  x="0"
                  y={isSource || isDestination ? 38 : 30}
                  textAnchor="middle"
                  fill={isSource ? '#f87171' : isDestination ? '#34d399' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="600"
                >
                  {isSource ? 'DEPOT' : isDestination ? 'HOSPITAL' : node.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* 3. Live Animated Ambulance Vehicle */}
          {optimalPath.length > 1 && (
            <g
              transform={`translate(${vehicleState.x}, ${vehicleState.y})`}
              filter="url(#glow-siren)"
              className="pointer-events-none transition-transform duration-75"
            >
              {/* Emergency vehicle outer beacon aura */}
              <circle r="18" fill="rgba(239, 68, 68, 0.4)" className="animate-pulse" />
              {/* Vehicle body */}
              <rect
                x="-14"
                y="-9"
                width="28"
                height="18"
                rx="4"
                fill="#ffffff"
                stroke="#dc2626"
                strokeWidth="2"
              />
              {/* Red medical cross icon */}
              <path
                d="M -3 -5 L 3 -5 L 3 -2 L 6 -2 L 6 2 L 3 2 L 3 5 L -3 5 L -3 2 L -6 2 L -6 -2 L -3 -2 Z"
                fill="#dc2626"
              />
              {/* Flashing blue and red siren lights */}
              <circle cx="-8" cy="-11" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="8" cy="-11" r="2.5" fill="#3b82f6" className="animate-ping" />
            </g>
          )}
        </svg>

        {/* Node Selection Quick Modal */}
        {selectedNodeModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-40">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-xs w-full shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-lg text-white">
                  Intersection {selectedNodeModal.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({selectedNodeModal.x}, {selectedNodeModal.y})
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4">{selectedNodeModal.name}</p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onSelectSource(selectedNodeModal.id);
                    setSelectedNodeModal(null);
                  }}
                  className="btn-primary text-xs w-full py-2"
                >
                  Set as Ambulance Depot (Source)
                </button>
                <button
                  onClick={() => {
                    onSelectDestination(selectedNodeModal.id);
                    setSelectedNodeModal(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  Set as Emergency Hospital (Destination)
                </button>
                <button
                  onClick={() => setSelectedNodeModal(null)}
                  className="btn-secondary text-xs w-full py-1.5 mt-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Map Legend & Toggles */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400"></span>
            <span className="text-slate-300 font-medium">Depot ({sourceId})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></span>
            <span className="text-slate-300 font-medium">Hospital ({destinationId})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 bg-emerald-500 rounded"></span>
            <span className="text-emerald-400 font-semibold">Fastest Route (Time-Dependent)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 bg-amber-500 rounded border border-amber-300 border-dashed"></span>
            <span className="text-amber-300 font-medium">Congested Road (Rush Hour)</span>
          </div>
        </div>

        {/* Shortest Distance Overlay Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showShortestDistanceOverlay}
            onChange={(e) => onToggleShortestOverlay(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
          />
          <span className="text-purple-300 text-xs font-semibold">
            Show Shortest-Distance Path (Purple)
          </span>
        </label>
      </div>
    </div>
  );
}
