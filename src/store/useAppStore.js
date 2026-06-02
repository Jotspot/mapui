import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let idCounter = Date.now()
const uid = () => (++idCounter).toString(36)

const DEFAULT_SPEEDS = { flight: 6, driving: 4, transit: 5, walking: 8 } // seconds
const DEFAULT_MAP_STYLE = { provider: 'openfreemap', openFreeStyle: 'liberty', appleToken: '', labelsHidden: false, recordingAspect: '16:9', recordingResolution: '1080p' }

const useAppStore = create(
  persist(
    (set) => ({
      teams: [],
      waypoints: [],
      routes: [],
      speeds: { ...DEFAULT_SPEEDS },
      mapStyle: { ...DEFAULT_MAP_STYLE },

      addTeam: (team) => set((s) => ({ teams: [...s.teams, { id: uid(), ...team }] })),
      updateTeam: (id, patch) =>
        set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTeam: (id) => set((s) => ({ teams: s.teams.filter((t) => t.id !== id) })),

      addWaypoint: (wp) => set((s) => ({ waypoints: [...s.waypoints, { id: uid(), ...wp }] })),
      updateWaypoint: (id, patch) =>
        set((s) => ({ waypoints: s.waypoints.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
      removeWaypoint: (id) =>
        set((s) => ({ waypoints: s.waypoints.filter((w) => w.id !== id) })),

      addRoute: (route) =>
        set((s) => ({
          routes: [...s.routes, { id: uid(), progress: 1, queued: false, geometry: null, ...route }],
        })),
      updateRoute: (id, patch) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRoute: (id) => set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),

      setSpeed: (mode, secs) =>
        set((s) => ({ speeds: { ...s.speeds, [mode]: secs } })),
      setMapStyle: (patch) =>
        set((s) => ({ mapStyle: { ...s.mapStyle, ...patch } })),
    }),
    {
      name: 'jetlag-map-store',
      version: 2, // v2: road routes resampled to even arc-length spacing
      partialize: (s) => ({ teams: s.teams, waypoints: s.waypoints, routes: s.routes, speeds: s.speeds, mapStyle: s.mapStyle }),
      migrate: (persisted, version) => {
        if (persisted?.routes) {
          if (version < 1) {
            persisted.routes = persisted.routes.map((r) =>
              r.mode === 'walking' ? { ...r, geometry: null } : r
            )
          }
          if (version < 2) {
            // Clear cached road geometry so routes re-fetch and get resampled
            // to evenly-spaced coordinates (fixes speed variation at bends).
            persisted.routes = persisted.routes.map((r) =>
              r.mode !== 'flight' ? { ...r, geometry: null } : r
            )
          }
        }
        return persisted
      },
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        speeds: { ...DEFAULT_SPEEDS, ...(persisted.speeds || {}) },
        mapStyle: { ...DEFAULT_MAP_STYLE, ...(persisted.mapStyle || {}) },
        routes: (persisted.routes || []).map((r) => ({
          queued: false,
          progress: r.animationProgress ?? r.progress ?? 1,
          ...r,
        })),
      }),
    }
  )
)

export default useAppStore
