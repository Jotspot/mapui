import { sliceCoords, easeInOut } from '../../utils/geo.js'

export class RouteAnimator {
  constructor({ map, routeId, coords, durationMs = 4000, startProgress = 0, dotMarker, onProgress, onComplete }) {
    this.map = map
    this.routeId = routeId
    this.coords = coords
    this.durationMs = durationMs * (1 - startProgress) // scale duration by remaining distance
    this.startProgress = startProgress
    this.dotMarker = dotMarker
    this.onProgress = onProgress
    this.onComplete = onComplete
    this._raf = null
    this._startTime = null
    this._tick = this._tick.bind(this)
  }

  start() {
    this._startTime = null
    this._raf = requestAnimationFrame(this._tick)
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
  }

  _updateSources(t) {
    const traveled = sliceCoords(this.coords, t)
    const tipIdx = Math.floor(t * (this.coords.length - 1))
    const remaining = [traveled[traveled.length - 1], ...this.coords.slice(tipIdx + 1)]

    const traveledSrc = this.map.getSource(`${this.routeId}-traveled`)
    const remainingSrc = this.map.getSource(`${this.routeId}-remaining`)

    if (traveledSrc) {
      traveledSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: traveled } })
    }
    if (remainingSrc) {
      remainingSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: remaining.length > 1 ? remaining : [] } })
    }

    if (this.dotMarker && traveled.length >= 1) {
      this.dotMarker.setLngLat(traveled[traveled.length - 1])
    }
  }

  _tick(now) {
    if (!this._startTime) this._startTime = now
    const elapsed = Math.min((now - this._startTime) / Math.max(this.durationMs, 1), 1)
    const t = this.startProgress + easeInOut(elapsed) * (1 - this.startProgress)

    this._updateSources(t)
    if (this.onProgress) this.onProgress(t)

    if (elapsed < 1) {
      this._raf = requestAnimationFrame(this._tick)
    } else {
      // finalize: full traveled, empty remaining
      const traveledSrc = this.map.getSource(`${this.routeId}-traveled`)
      const remainingSrc = this.map.getSource(`${this.routeId}-remaining`)
      if (traveledSrc) {
        traveledSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: this.coords } })
      }
      if (remainingSrc) {
        remainingSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } })
      }
      if (this.dotMarker) this.dotMarker.getElement().style.display = 'none'
      if (this.onComplete) this.onComplete()
    }
  }
}
