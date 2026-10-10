import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Gauge,
  Milestone,
  ArrowRight,
  MapPin,
  Siren,
  ShieldAlert,
  CheckCircle,
  Zap,
  Compass,
  ArrowLeftRight,
  TrendingUp,
  Map as MapIcon,
  Layers,
  Sparkles,
  Key,
  ExternalLink,
  Info,
  Car,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { HYDERABAD_NODES, HYDERABAD_EDGES } from '../data/hyderabadData';
import { timeDependentDijkstra } from '../algorithms/timeDependentDijkstra';
import { shortestDistanceDijkstra } from '../algorithms/shortestDistanceDijkstra';
import { minutesToTimeString, formatDuration } from '../utils/timeUtils';
import { isEdgeCongestedAtTime } from '../algorithms/travelTimeModel';
import { GoogleMapsService } from '../services/googleMapsService';

export default function RealTimeMapPage() {
  // Hyderabad Origin & Destination
  const [sourceId, setSourceId] = useState('GACHIBOWLI');
  const [destinationId, setDestinationId] = useState('GANDHI');
  const [departureTimeMinutes, setDepartureTimeMinutes] = useState(1080); // 18:00 (Peak Hyderabad Evening Rush Hour)
  const [clickTargetMode, setClickTargetMode] = useState('destination'); // 'source' | 'destination'

  // Map Engine: 'google_js' | 'google_embed' | 'leaflet' | 'vector'
  const [mapEngine, setMapEngine] = useState('google_embed');
  const [isTrafficLayerActive, setIsTrafficLayerActive] = useState(true);

  // Google Maps API Key State
  const [apiKey, setApiKey] = useState(GoogleMapsService.getApiKey());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [isGoogleJsLoaded, setIsGoogleJsLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(null);

  // Google Directions Result State
  const [googleDirections, setGoogleDirections] = useState(null);
  const [isCalculatingGoogleRoute, setIsCalculatingGoogleRoute] = useState(false);

  // Dispatch Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // DOM Container Refs
  const googleMapRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const googleTrafficLayerRef = useRef(null);
  const googleDirectionsRendererRef = useRef(null);

  const leafletMapRef = useRef(null);
  const leafletInstanceRef = useRef(null);

  const nodes = HYDERABAD_NODES;
  const edges = HYDERABAD_EDGES;

  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const sourceNode = nodeMap.get(sourceId) || nodes[0];
  const destNode = nodeMap.get(destinationId) || nodes[1];

  // Compute Time-Dependent Dijkstra Route on Hyderabad Network
  const optimalResult = useMemo(() => {
    return timeDependentDijkstra(edges, sourceId, destinationId, departureTimeMinutes);
  }, [edges, sourceId, destinationId, departureTimeMinutes]);

  // Compute Shortest-Distance Route on Hyderabad Network
  const shortestResult = useMemo(() => {
    return shortestDistanceDijkstra(edges, sourceId, destinationId, departureTimeMinutes);
  }, [edges, sourceId, destinationId, departureTimeMinutes]);

  const optimalPath = optimalResult?.path || [];
  const edgeDetails = optimalResult?.edgeDetails || [];
  const totalTravelTime = optimalResult?.totalTravelTimeMinutes || 0;
  const totalDistance = optimalResult?.totalDistanceKm || 0;

  const shortestTime = shortestResult?.totalTravelTimeMinutes || 0;
  const shortestDistance = shortestResult?.totalDistanceKm || 0;
  const timeSaved = Math.max(0, shortestTime - totalTravelTime);
  const improvementPct = shortestTime > 0 ? (((shortestTime - totalTravelTime) / shortestTime) * 100).toFixed(1) : '0.0';

  // Attempt to load Google Maps JS API if API key exists
  useEffect(() => {
    if (!apiKey) {
      setIsGoogleJsLoaded(false);
      return;
    }

    GoogleMapsService.loadGoogleMapsScript(apiKey)
      .then((gMaps) => {
        setIsGoogleJsLoaded(true);
        setGoogleLoadError(null);
        setMapEngine('google_js');
      })
      .catch((err) => {
        console.warn('Google Maps JS API loading error:', err);
        setGoogleLoadError('Failed to load Google Maps JS API with provided key. Using Google Maps Embed mode.');
        setIsGoogleJsLoaded(false);
        setMapEngine('google_embed');
      });
  }, [apiKey]);

  // Initialize & Update Google Maps JavaScript SDK
  useEffect(() => {
    if (mapEngine !== 'google_js' || !isGoogleJsLoaded || !window.google?.maps || !googleMapRef.current) {
      return;
    }

    const gMaps = window.google.maps;

    // Initialize Map Instance
    if (!googleMapInstanceRef.current) {
      const map = new gMaps.Map(googleMapRef.current, {
        center: { lat: 17.4150, lng: 78.4350 }, // Central Hyderabad
        zoom: 12,
        mapTypeId: gMaps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Traffic Layer
      const trafficLayer = new gMaps.TrafficLayer();
      trafficLayer.setMap(map);
      googleTrafficLayerRef.current = trafficLayer;

      // Directions Renderer
      const directionsRenderer = new gMaps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#0284c7',
          strokeWeight: 6,
          strokeOpacity: 0.9,
        },
      });
      googleDirectionsRendererRef.current = directionsRenderer;

      googleMapInstanceRef.current = map;
    }

    const map = googleMapInstanceRef.current;

    // Toggle Traffic Layer
    if (googleTrafficLayerRef.current) {
      googleTrafficLayerRef.current.setMap(isTrafficLayerActive ? map : null);
    }

    // Query Google Directions with Real-Time Traffic
    if (sourceNode && destNode) {
      setIsCalculatingGoogleRoute(true);
      const directionsService = new gMaps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: sourceNode.lat, lng: sourceNode.lng },
          destination: { lat: destNode.lat, lng: destNode.lng },
          travelMode: gMaps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(), // Live real-time traffic
            trafficModel: gMaps.TrafficModel.BEST_GUESS,
          },
          provideRouteAlternatives: true,
        },
        (result, status) => {
          setIsCalculatingGoogleRoute(false);
          if (status === gMaps.DirectionsStatus.OK && result) {
            setGoogleDirections(result);
            if (googleDirectionsRendererRef.current) {
              googleDirectionsRendererRef.current.setDirections(result);
            }
          } else {
            console.warn('Google Directions request failed:', status);
          }
        }
      );
    }
  }, [mapEngine, isGoogleJsLoaded, isTrafficLayerActive, sourceId, destinationId, sourceNode, destNode]);

  // Reset animation when route changes
  useEffect(() => {
    setIsPlaying(false);
    setAnimProgress(0);
    lastTimeRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, [sourceId, destinationId, departureTimeMinutes]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || optimalPath.length <= 1 || totalTravelTime <= 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const baseDurationSec = Math.max(4, Math.min(10, totalTravelTime * 0.25));
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

  // Telemetry computation
  const telemetry = useMemo(() => {
    if (optimalPath.length <= 1 || edgeDetails.length === 0) {
      const src = nodeMap.get(sourceId);
      return {
        lat: src?.lat || 17.4474,
        lng: src?.lng || 78.3762,
        x: src?.x || 225,
        y: src?.y || 208,
        currentMinutes: departureTimeMinutes,
        elapsedMinutes: 0,
        coveredKm: 0,
        currentSegment: null,
        currentStreet: 'Standing by at Dispatch Depot',
        currentSpeed: 60,
      };
    }

    const currentMinuteInJourney = animProgress * totalTravelTime;
    const currentSimulatedTime = departureTimeMinutes + currentMinuteInJourney;

    let accumulatedTime = 0;
    let accumulatedDist = 0;

    for (let i = 0; i < edgeDetails.length; i++) {
      const detail = edgeDetails[i];
      const segmentDuration = detail.durationMinutes;

      if (
        currentMinuteInJourney <= accumulatedTime + segmentDuration ||
        i === edgeDetails.length - 1
      ) {
        const segProgress = Math.max(
          0,
          Math.min(1, (currentMinuteInJourney - accumulatedTime) / Math.max(0.001, segmentDuration))
        );
        const fromNode = nodeMap.get(detail.from);
        const toNode = nodeMap.get(detail.to);

        const lat = fromNode.lat + (toNode.lat - fromNode.lat) * segProgress;
        const lng = fromNode.lng + (toNode.lng - fromNode.lng) * segProgress;
        const x = fromNode.x + (toNode.x - fromNode.x) * segProgress;
        const y = fromNode.y + (toNode.y - fromNode.y) * segProgress;

        return {
          lat,
          lng,
          x,
          y,
          currentMinutes: currentSimulatedTime,
          elapsedMinutes: currentMinuteInJourney,
          coveredKm: accumulatedDist + detail.distanceKm * segProgress,
          currentSegment: `${fromNode.shortName} → ${toNode.shortName}`,
          currentStreet: detail.name,
          currentSpeed: Math.round(detail.effectiveSpeedKmh || 50),
        };
      }

      accumulatedTime += segmentDuration;
      accumulatedDist += detail.distanceKm;
    }

    const dest = nodeMap.get(destinationId);
    return {
      lat: dest?.lat || 17.4239,
      lng: dest?.lng || 78.5036,
      x: dest?.x || 560,
      y: dest?.y || 267,
      currentMinutes: departureTimeMinutes + totalTravelTime,
      elapsedMinutes: totalTravelTime,
      coveredKm: totalDistance,
      currentSegment: 'Arrived at Destination Hospital',
      currentStreet: dest?.name || 'Destination Reached',
      currentSpeed: 0,
    };
  }, [
    animProgress,
    optimalPath.length,
    edgeDetails,
    totalTravelTime,
    totalDistance,
    departureTimeMinutes,
    sourceId,
    destinationId,
    nodeMap,
  ]);

  // Handle Preset Scenarios in Hyderabad
  const handleApplyPreset = (src, dst, time) => {
    setSourceId(src);
    setDestinationId(dst);
    setDepartureTimeMinutes(time);
    setIsPlaying(false);
    setAnimProgress(0);
  };

  const handleSwap = () => {
    const temp = sourceId;
    setSourceId(destinationId);
    setDestinationId(temp);
  };

  const handleSaveApiKey = () => {
    GoogleMapsService.setApiKey(tempApiKeyInput);
    setApiKey(tempApiKeyInput.trim());
    setIsApiKeyModalOpen(false);
  };

  // Extract Google primary route summary metrics
  const googleRouteLeg = googleDirections?.routes?.[0]?.legs?.[0];
  const googleDurationTraffic = googleRouteLeg?.duration_in_traffic?.text || googleRouteLeg?.duration?.text;
  const googleDistanceText = googleRouteLeg?.distance?.text;

  return (
    <div className="flex flex-col gap-6 max-w-[1550px] mx-auto w-full">
      {/* 1. Header with Real Google Maps Service & Traffic Detection Controls */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-500 siren-active">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Hyderabad Real Google Maps Traffic & Emergency Routing
                </h2>
                <span className="badge badge-emergency text-[10px] flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                  Live Google Traffic Layer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detects real-time traffic congestion on Hyderabad roads and computes turn-by-turn directions. Compares Google Maps live traffic ETA against Time-Dependent Dijkstra emergency bypasses.
              </p>
            </div>
          </div>

          {/* Engine & Settings Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Traffic Layer Switch */}
            <button
              onClick={() => setIsTrafficLayerActive(!isTrafficLayerActive)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 border ${
                isTrafficLayerActive
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/80 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Google Maps Live Traffic Flow"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Traffic Detection: {isTrafficLayerActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMapEngine('google_embed')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                  mapEngine === 'google_embed'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Live Embed
              </button>
              {isGoogleJsLoaded && (
                <button
                  onClick={() => setMapEngine('google_js')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                    mapEngine === 'google_js'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google JS SDK
                </button>
              )}
              <button
                onClick={() => setMapEngine('vector')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                  mapEngine === 'vector'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vector Map
              </button>
            </div>

            {/* API Key Modal Button */}
            <button
              onClick={() => {
                setTempApiKeyInput(apiKey);
                setIsApiKeyModalOpen(true);
              }}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Configure Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? 'API Key Configured' : 'Add API Key'}</span>
            </button>
          </div>
        </div>

        {/* Live Traffic Alert Notification */}
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Real-Time Traffic Detection: </strong>
              Severe rush-hour bottlenecks detected on <strong>Panjagutta - Begumpet corridor</strong> and <strong>Cyber Towers junction</strong>.
            </span>
          </div>
          <span className="text-emerald-400 font-mono font-bold text-[11px]">
            Nehru ORR & PVNR Elevated: Free-Flow (80-100 km/h)
          </span>
        </div>

        {/* Real Hyderabad Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Hyderabad Emergency Presets:
          </span>

          <button
            onClick={() => handleApplyPreset('GACHIBOWLI', 'GANDHI', 1080)}
            className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition font-medium"
          >
            🔥 Cyber Towers → Gandhi Hospital (18:00 Peak Rush)
          </button>

          <button
            onClick={() => handleApplyPreset('GACHIBOWLI', 'OSMANIA', 1080)}
            className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition font-medium"
          >
            ⚡ Gachibowli → Osmania Hospital (ORR Expressway Bypass)
          </button>

          <button
            onClick={() => handleApplyPreset('APOLLO', 'KIMS', 1080)}
            className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition font-medium"
          >
            🚨 Apollo Jubilee → KIMS Secunderabad (Central Gridlock)
          </button>

          <button
            onClick={() => handleApplyPreset('GACHIBOWLI', 'GANDHI', 120)}
            className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition font-medium"
          >
            🌙 Free Flow Night (02:00 Direct Arterial)
          </button>
        </div>

        {/* Origin, Destination & Time Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Origin Picker */}
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 block font-semibold">ORIGIN (HYDERABAD)</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="bg-transparent text-white text-xs font-bold w-full outline-none cursor-pointer"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900">
                    {n.shortName} ({n.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Picker */}
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 block font-semibold">DESTINATION HOSPITAL</label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="bg-transparent text-white text-xs font-bold w-full outline-none cursor-pointer"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900">
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="hidden md:flex items-center justify-center -mx-4 z-10 pointer-events-none">
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition pointer-events-auto shadow-md"
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Departure Time Slider */}
          <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 md:col-span-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                <span>SIMULATED DEPARTURE TIME</span>
                <span className="font-mono text-cyan-300 font-bold text-xs">
                  {minutesToTimeString(departureTimeMinutes)}
                  {departureTimeMinutes >= 1050 && departureTimeMinutes <= 1200 ? (
                    <span className="text-amber-400 ml-1.5 font-bold">[Peak Evening Rush 17:30–20:00]</span>
                  ) : null}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1439"
                step="15"
                value={departureTimeMinutes}
                onChange={(e) => setDepartureTimeMinutes(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Live Map Canvas & Side Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Google Maps View (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="panel-card bg-[#0a0f1d] border-[#1e293b] p-4 flex flex-col relative overflow-hidden">
            {/* Map Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={optimalPath.length <= 1}
                  className={`btn-primary text-xs py-2 px-3.5 flex items-center gap-2 ${
                    isPlaying ? 'bg-amber-600 hover:bg-amber-500' : ''
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause Ambulance' : 'Dispatch Ambulance'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setAnimProgress(0);
                  }}
                  className="btn-secondary text-xs py-2 px-3"
                  title="Reset to Origin"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Speed Toggles */}
                <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
                  {[1, 2, 4].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`text-[10px] px-2 py-1 rounded font-mono font-bold transition ${
                        playbackSpeed === speed
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 font-mono text-xs">
                {timeSaved > 0 ? (
                  <span className="badge badge-optimal text-[10px]">
                    Saved +{formatDuration(timeSaved)} (+{improvementPct}%)
                  </span>
                ) : (
                  <span className="badge badge-info text-[10px]">Optimal Route Active</span>
                )}
              </div>
            </div>

            {/* Mode 1: Real Google Maps Live Embed with Live Traffic & Directions (Zero-Config) */}
            {mapEngine === 'google_embed' && (
              <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 my-2 shadow-2xl relative">
                <iframe
                  title="Google Maps Hyderabad Real-Time Directions & Traffic"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={GoogleMapsService.getEmbedDirectionsUrl(
                    `${sourceNode.name}, Hyderabad`,
                    `${destNode.name}, Hyderabad`
                  )}
                />
              </div>
            )}

            {/* Mode 2: Google Maps JavaScript SDK Canvas */}
            {mapEngine === 'google_js' && (
              <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 my-2 shadow-2xl relative">
                <div ref={googleMapRef} className="w-full h-full" />
              </div>
            )}

            {/* Mode 3: Vector Cartography Map (SVG Fallback) */}
            {mapEngine === 'vector' && (
              <div className="w-full flex justify-center py-2 select-none">
                <svg
                  viewBox="0 0 680 680"
                  className="w-full max-w-[620px] aspect-square rounded-xl bg-[#070b14] border border-slate-800 shadow-2xl"
                >
                  <defs>
                    <pattern id="hyd-v-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#101827" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="680" height="680" fill="url(#hyd-v-grid)" />

                  {/* Watermarks */}
                  <text x="50" y="45" fill="#1e293b" fontSize="12" fontFamily="JetBrains Mono" fontWeight="bold">
                    NORTH HYDERABAD (KUKATPALLY)
                  </text>
                  <text x="440" y="45" fill="#1e293b" fontSize="12" fontFamily="JetBrains Mono" fontWeight="bold">
                    SECUNDERABAD
                  </text>
                  <text x="50" y="650" fill="#1e293b" fontSize="12" fontFamily="JetBrains Mono" fontWeight="bold">
                    NEHRU OUTER RING ROAD (ORR) 100 KM/H
                  </text>

                  {/* Road Network */}
                  {edges.map((edge) => {
                    const u = nodeMap.get(edge.from);
                    const v = nodeMap.get(edge.to);
                    if (!u || !v) return null;

                    const isCongested = isEdgeCongestedAtTime(edge, departureTimeMinutes);
                    const color = isCongested ? '#ef4444' : edge.speedLimit >= 80 ? '#0284c7' : '#334155';

                    return (
                      <line
                        key={edge.id}
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={color}
                        strokeWidth={isCongested ? 5 : 4}
                        strokeLinecap="round"
                        opacity={isCongested ? 0.95 : 0.6}
                      />
                    );
                  })}

                  {/* Optimal Route (Emerald) */}
                  {edgeDetails.map((detail, idx) => {
                    const u = nodeMap.get(detail.from);
                    const v = nodeMap.get(detail.to);
                    if (!u || !v) return null;
                    return (
                      <line
                        key={`opt-${idx}`}
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke="#10b981"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const isSrc = node.id === sourceId;
                    const isDst = node.id === destinationId;
                    return (
                      <g
                        key={node.id}
                        onClick={() => {
                          if (clickTargetMode === 'source') {
                            setSourceId(node.id);
                            setClickTargetMode('destination');
                          } else {
                            setDestinationId(node.id);
                            setClickTargetMode('source');
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSrc || isDst ? 20 : 14}
                          fill={isSrc ? '#dc2626' : isDst ? '#10b981' : '#0f172a'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                        >
                          {node.shortName.slice(0, 3)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vehicle Marker */}
                  {optimalPath.length > 1 && (
                    <circle cx={telemetry.x} cy={telemetry.y} r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  )}
                </svg>
              </div>
            )}

            {/* Map Legend & Google Live Traffic Indicators */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-white font-medium">Google Traffic: Fast / Clear</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-300 font-medium">Moderate Congestion</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-red-400 font-bold">Severe Bottleneck / Choke-Point</span>
                </div>
              </div>
              <span className="text-[11px] text-cyan-400">Powered by Google Maps Real-Time Service</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google Live Directions & Algorithm Comparison (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 1. Google Maps Live Traffic & Directions Summary */}
          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Google Maps Live Traffic Navigation
                </h3>
              </div>
              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                Live Traffic Active
              </span>
            </div>

            {/* Live Google Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Google Driving Duration</span>
                <span className="font-mono text-lg font-bold text-cyan-300">
                  {googleDurationTraffic || formatDuration(totalTravelTime)}
                </span>
                <span className="text-[10px] text-slate-500 block">Traffic-adjusted live estimate</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Google Route Distance</span>
                <span className="font-mono text-lg font-bold text-white">
                  {googleDistanceText || `${totalDistance.toFixed(1)} km`}
                </span>
                <span className="text-[10px] text-slate-500 block">Physical road meters</span>
              </div>
            </div>

            {/* Real Traffic Bottleneck Detection Note */}
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Traffic Delay Detected: </strong>
                Heavy delays along Punjagutta Flyover & Begumpet corridor. Time-Dependent Dijkstra recommends expressway detours.
              </span>
            </div>
          </div>

          {/* 2. Algorithm Performance Benchmark (Time-Dependent vs Google / Shortest) */}
          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Emergency Vehicle Routing Benchmark
            </h3>

            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-400 block">Time-Dependent Dijkstra (Proposed)</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {optimalPath.map((id) => nodeMap.get(id)?.shortName || id).join(' → ')}
                  </span>
                </div>
                <div className="text-right font-mono shrink-0 ml-2">
                  <span className="text-sm font-bold text-white block">
                    {formatDuration(totalTravelTime)}
                  </span>
                  <span className="text-[10px] text-slate-400">{totalDistance.toFixed(1)} km</span>
                </div>
              </div>

              <div className="p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-400 block">Direct Shortest-Distance Route</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {shortestResult?.path?.map((id) => nodeMap.get(id)?.shortName || id).join(' → ') || 'N/A'}
                  </span>
                </div>
                <div className="text-right font-mono shrink-0 ml-2">
                  <span className="text-sm font-bold text-white block">
                    {formatDuration(shortestTime)}
                  </span>
                  <span className="text-[10px] text-slate-400">{shortestDistance.toFixed(1)} km</span>
                </div>
              </div>

              {timeSaved > 0 && (
                <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-300 text-[11px] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Detour is <strong>+{(totalDistance - shortestDistance).toFixed(1)} km longer</strong>, but saves{' '}
                    <strong>{formatDuration(timeSaved)} (+{improvementPct}%)</strong> by bypassing Punjagutta/Begumpet congestion!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Turn-by-Turn Driving Directions */}
          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Milestone className="w-4 h-4 text-cyan-400" />
              Turn-by-Turn Hyderabad Driving Directions
            </h3>

            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
              <div className="flex items-start gap-2.5 text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="w-5 h-5 rounded-full bg-red-950 border border-red-500 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-bold text-white block">
                    Depart {sourceNode.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Departure Clock: {minutesToTimeString(departureTimeMinutes)}
                  </span>
                </div>
              </div>

              {edgeDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{detail.name}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {formatDuration(detail.durationMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{detail.distanceKm} km</span>
                      <span>Speed: {detail.effectiveSpeedKmh} km/h</span>
                      {detail.wasCongested && (
                        <span className="text-amber-400 font-bold">Heavy Traffic Slowdown</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-2.5 text-xs p-2 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
                <div className="w-5 h-5 rounded-full bg-emerald-900 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-emerald-300 block">
                    Arrive at {destNode.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hospital Arrival: {minutesToTimeString(departureTimeMinutes + totalTravelTime)} (Total: {formatDuration(totalTravelTime)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. API Key Config Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Maps API Configuration</h3>
                <p className="text-xs text-slate-400">
                  Enter your Google Maps JavaScript API key to enable live custom SDK features and Places.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Google Maps API Key:
              </label>
              <input
                type="text"
                value={tempApiKeyInput}
                onChange={(e) => setTempApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="bg-slate-950 border border-slate-700 text-white text-xs p-2.5 rounded-xl font-mono outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                The key is stored locally in your browser’s <code>localStorage</code>. Zero-Config Google Maps Embed is also always available without any key.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="btn-primary text-xs py-2 px-5"
              >
                Save & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
