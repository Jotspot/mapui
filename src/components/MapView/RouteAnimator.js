import { sliceCoords, easeInOut } from '../../utils/geo.js'

export class RouteAnimator {
  constructor({ map, routeId, coords, durationMs = 4000, dotMarker, onProgress, onComplete }) {
    this.map = map
    this.routeId = routeId
    this.coords = coords
    this.durationMs = durationMs
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

  _tick(now) {
    if (!this._startTime) this._startTime = now
    const raw = Math.min((now - this._startTime) / this.durationMs, 1)
    const t = easeInOut(raw)

    const traveled = sliceCoords(this.coords, t)
    const remaining = sliceCoords(this.coords, 1).slice(Math.max(0, traveled.length - 1))

    const traveledSrc = this.map.getSource(`${this.routeId}-traveled`)
    const remainingSrc = this.map.getSource(`${this.routeId}-remaining`)

    if (traveledSrc) {
      traveledSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: traveled } })
    }
    if (remainingSrc) {
      remainingSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: remaining } })
    }

    if (this.dotMarker && traveled.length >= 1) {
      const tip = traveled[traveled.length - 1]
      this.dotMarker.setLngLat(tip)
    }

    if (this.onProgress) this.onProgress(t)

    if (raw < 1) {
      this._raf = requestAnimationFrame(this._tick)
    } else {
      if (remainingSrc) {
        remainingSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } })
      }
      if (this.dotMarker) this.dotMarker.getElement().style.display = 'none'
      if (this.onComplete) this.onComplete()
    }
  }
}
