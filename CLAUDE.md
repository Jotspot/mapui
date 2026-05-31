# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start local dev server (Vite HMR)
npm run build      # Production build → dist/
npm run lint       # ESLint
npm run preview    # Serve the dist/ build locally
```

No test suite — verify changes by running `npm run dev` and testing in the browser.

**Deployment:** Pushing to `claude/elegant-shannon-JuO5l` triggers `.github/workflows/deploy.yml`, which builds and pushes `dist/` to the `gh-pages` branch. GitHub Pages serves from that branch at `https://jotspot.github.io/mapui/`. The `base: '/mapui/'` in `vite.config.js` is required for this to work.

## Architecture

Single-page React + Vite app — no router, no backend, no API keys required for the default map.

### State

All app state lives in `src/store/useAppStore.js` (Zustand with `persist` middleware → `localStorage`). Shape:

```
teams[]      { id, name, color, photoDataUrl, waypointId }
waypoints[]  { id, name, lat, lng }
routes[]     { id, fromWaypointId, toWaypointId, mode, color, progress, queued, geometry }
speeds       { flight, driving, transit, walking }  — animation duration in seconds
mapStyle     { provider: 'openfreemap'|'apple', openFreeStyle: 'liberty'|'bright', appleToken }
```

`routes[].geometry` caches the fetched coordinate array so OSRM/arc is only computed once and survives reload. `routes[].progress` (0–1) is both the slider value and the live animation value written by `RouteAnimator`.

### Map rendering

`MapView.jsx` is a dispatcher: if `mapStyle.provider === 'apple'` and a token exists it renders `AppleMapView.jsx` (MapKit JS + canvas route overlay); otherwise it renders an inline `MapLibreMap` component using OpenFreeMap vector tiles.

**Markers** are pure DOM elements created by `markerUtils.js` (no React roots — avoids MapLibre measuring a 0×0 element before React renders). Team markers use an SVG teardrop path so the spike and circle are one seamless shape. `maplibregl.Marker({ element, anchor: 'bottom' })` places the spike tip at the coordinate because the label is `position: absolute` outside the element's flow.

**Routes** are managed by `RouteLayer.jsx` (MapLibre only): each route gets two GeoJSON sources (`{id}-traveled`, `{id}-remaining`) and two layers. `RouteAnimator.js` drives `requestAnimationFrame` updates to both sources and a dot marker at the tip. Flight routes use `greatCircleArc()` (correct SLERP in `geo.js`); driving/walking/transit fetch road geometry from the public OSRM API and cache it in the store.

**Apple Maps path** (`AppleMapView.jsx`): MapKit JS handles the base map; routes are drawn on a `<canvas>` overlay using `map.convertCoordinateToPointOnPage()` for projection, redrawn on `regiondidchange` and every animation frame.

### Animation flow

`App.jsx` owns `animatingIds: string[]`. Pressing ▶ sets all queued route IDs simultaneously; pressing ▶▶ All sets every route ID. `RouteLayer` starts a `RouteAnimator` for each ID in `animatingIds`; when one completes it calls `onAnimateComplete(id)` which removes that ID from the array. Progress bar in `PlaybackBar` averages `route.progress` across all active IDs.

### Key utilities

- `src/utils/geo.js` — `greatCircleArc` (SLERP), `sliceCoords` (partial line for animation), `fetchRoadGeometry` (OSRM)
- `src/utils/routeStyles.js` — returns MapLibre layer paint specs (traveled = solid, remaining = dashed at 40% opacity)
- `src/utils/imageUtils.js` — resizes photo uploads to ≤200×200 JPEG via canvas before storing as base64
