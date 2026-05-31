import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let idCounter = Date.now()
const uid = () => (++idCounter).toString(36)

const useAppStore = create(
  persist(
    (set) => ({
      teams: [],
      waypoints: [],
      routes: [],

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
    }),
    {
      name: 'jetlag-map-store',
      partialize: (s) => ({ teams: s.teams, waypoints: s.waypoints, routes: s.routes }),
      // migrate old animationProgress field
      merge: (persisted, current) => {
        const migrated = {
          ...current,
          ...persisted,
          routes: (persisted.routes || []).map((r) => ({
            queued: false,
            progress: r.animationProgress ?? r.progress ?? 1,
            ...r,
          })),
        }
        return migrated
      },
    }
  )
)

export default useAppStore
