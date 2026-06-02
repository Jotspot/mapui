# Jetlag Map

Animated broadcast-style map builder inspired by Jetlag: The Game. Drop city waypoints, create teams with photo pins, and animate routes between them with different transport modes. Export to video.

**Live:** https://jotspot.github.io/mapui/

## Features

- **Teams** — add a name, color, and photo; pins appear as teardrop markers with circular photo crops
- **Waypoints** — click the map to place city pins; hide/show individually
- **Routes** — connect two waypoints with a transport mode (✈️ flight, 🚗 driving, 🚆 transit, 🚶 walking); road routes follow real streets via OSRM
- **Animation** — animate individual routes or queue + play all at once; speed is configurable per mode
- **Video export** — record animations to a composited video file; choose aspect ratio (16:9, 4:3, 1:1, 9:16) and resolution (720p, 1080p, 1440p)
- **Map styles** — OpenFreeMap Liberty or Bright; optional Apple Maps with a MapKit JS token
- **Label toggle** — hide all map text labels for a clean broadcast look
- All data persists in `localStorage` — no account or backend needed

## Video Export Tips

- **Use Safari for higher bitrate.** Chrome's VP9 encoder silently caps output at ~2 Mbps regardless of the requested bitrate hint. Safari's encoder allocates significantly more bits, producing sharper exports — especially during fast route animations.
- Firefox is untested but likely better than Chrome.

## Running Locally

```bash
npm install
npm run dev       # dev server with HMR at localhost:5173/mapui/
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

## Architecture

Single-page React + Vite app — no router, no backend, no required API keys.

| Layer | Tech |
|---|---|
| Map rendering | MapLibre GL JS + OpenFreeMap vector tiles |
| State + persistence | Zustand with `persist` middleware → `localStorage` |
| Road routing | OSRM public API (FOSSGIS instances, no key needed) |
| Video capture | `MediaRecorder` + canvas compositing |

Key files:
- `src/store/useAppStore.js` — all app state (teams, waypoints, routes, speeds, mapStyle)
- `src/components/MapView/MapView.jsx` — map init, marker lifecycle, video recording
- `src/components/MapView/RouteLayer.jsx` — GeoJSON route sources/layers per route
- `src/components/MapView/RouteAnimator.js` — rAF animation engine
- `src/utils/geo.js` — great-circle arcs, arc-length resampling, OSRM fetch
