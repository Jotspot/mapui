export function getRouteLayerSpecs(id, mode, color) {
  const dashRemaining = mode === 'walking' ? [2, 4] : mode === 'transit' ? [4, 3] : [3, 3]
  const width = mode === 'walking' ? 3 : 4

  const traveledLayer = {
    id: `${id}-traveled`,
    type: 'line',
    source: `${id}-traveled`,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': color,
      'line-width': width,
      'line-opacity': 1,
    },
  }

  const remainingLayer = {
    id: `${id}-remaining`,
    type: 'line',
    source: `${id}-remaining`,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': color,
      'line-width': width,
      'line-opacity': 0.45,
      'line-dasharray': dashRemaining,
    },
  }

  return { traveledLayer, remainingLayer }
}
