# Smart Emergency Vehicle Routing System Using Time-Dependent Dijkstra's Algorithm

An interactive smart-city emergency vehicle navigation application and academic case study demonstrating how ambulances find the fastest route to hospitals in **Hyderabad, Telangana, India** based on road distances, speed limits, and dynamic time-dependent traffic congestion.

![Project Status](https://img.shields.io/badge/status-complete-success.svg)
![Algorithm](https://img.shields.io/badge/algorithm-Time--Dependent%20Dijkstra-red.svg)
![Complexity](https://img.shields.io/badge/complexity-O((V%2BE)%20log%20V)-blue.svg)
![Tests](https://img.shields.io/badge/tests-10%20passed%20(100%25)-brightgreen.svg)
![Deployment](https://img.shields.io/badge/deployment-Vercel%20Ready-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 1. Project Overview

This project demonstrates the core principle that:
1. **The physically shortest-distance route is NOT always the fastest route** during urban congestion.
2. **The optimal route dynamically shifts** depending on departure time and rush-hour bottlenecks.
3. High-speed expressways (e.g., **Nehru Outer Ring Road (100 km/h)** and **PVNR Elevated Expressway (80 km/h)**) deliver ambulances significantly faster than direct arterial bottlenecks (Panjagutta, Begumpet, Jubilee Hills), even with a 30%–70% longer distance detour.

---

## 2. Key Modules & Features

1. **Home Dashboard:** High-level project summary, live network metrics, and 1-click launch shortcuts.
2. **Hyderabad Google Maps Live:**
   - Real-time traffic flow detection layer (`google.maps.TrafficLayer`) visualizing congestion on Hyderabad corridors.
   - Google Maps Directions Service calculating driving duration in traffic, distance, and turn-by-turn maneuvers.
   - Zero-config Google Live Embed mode + programmatic JS SDK with in-app API key modal.
   - Dynamic comparison against Time-Dependent Dijkstra emergency bypasses.
3. **Route Simulator:** Working emergency simulation lab with departure time slider, scenario presets (Rush Hour, Normal, Free Flow, Custom), and objective toggles (Fastest Time vs Shortest Distance).
4. **Traffic Monitor:** Catalog of Hyderabad and grid road segments displaying live congestion multipliers and traffic status.
5. **Route Comparison:** Side-by-side benchmarking of Time-Dependent Dijkstra vs Shortest-Distance Dijkstra vs Static Snapshot.
6. **Algorithm Explorer:** Step-by-step execution tracer with priority queue visualization and mathematical formulation.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS
- **Maps & GIS:** Google Maps JavaScript API, Google TrafficLayer, Directions Service, Leaflet, OpenStreetMap
- **Icons:** Lucide React
- **Testing:** Node.js native test runner (`node --test`)
- **Hosting:** Vercel (Configured with `vercel.json` SPA rewrites)

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated algorithmic tests (10 suites)
npm test

# Build for production
npm run build
```

---

## 5. Deployment Guide (GitHub & Vercel)

### Step 1: Initialize Git & Commit Code

```bash
# In the project directory:
git init
git add .
git commit -m "Initial commit: Smart Emergency Vehicle Routing System with Hyderabad Google Maps"
```

### Step 2: Push to GitHub

1. Go to [GitHub](https://github.com/new) and create a new repository (e.g., `emergency-vehicle-routing`).
2. Run the following commands in your terminal:

```bash
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/emergency-vehicle-routing.git
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Import your `emergency-vehicle-routing` repository from GitHub.
4. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. *(Optional)* Under **Environment Variables**, add:
   - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key (optional; zero-config embed works without it).
6. Click **"Deploy"**. Your application will be live in ~30 seconds with a free `.vercel.app` URL!

---

## 6. License

This project is licensed under the MIT License.
