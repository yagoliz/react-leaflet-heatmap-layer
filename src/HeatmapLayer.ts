import { useImperativeHandle, forwardRef, Ref } from 'react'
import { createLayerHook, createElementHook, LeafletContextInterface } from '@react-leaflet/core'

import Heatmap, { HeatmapOptions } from './Heatmap'

function createLeafletHeatmap<Point>(
  props: HeatmapOptions<Point>,
  context: LeafletContextInterface,
) {
  return { instance: new Heatmap(props), context }
}

function updateLeafletHeatmap<Point>(
  instance: Heatmap<Point>,
  props: HeatmapOptions<Point>,
  prevProps: HeatmapOptions<Point>,
) {
  if (props.fitBoundsOnUpdate) {
    instance.fitBounds()
  }

  if (props.gradient !== prevProps.gradient) {
    instance.updateHeatmapGradient(props.gradient)
  }

  const hasRadiusUpdated = props.radius !== prevProps.radius
  const hasBlurUpdated = props.blur !== prevProps.blur

  if (hasRadiusUpdated || hasBlurUpdated) {
    instance.updateHeatmapRadius(props.radius, props.blur)
  }

  if (props.max !== prevProps.max) {
    instance.updateHeatmapMax(props.max)
  }

  instance.reset()
}

const useLeafletHeatmapElement = createElementHook(createLeafletHeatmap, updateLeafletHeatmap)
export const useHeatmapLayer = createLayerHook(useLeafletHeatmapElement)

function _LeafletHeatmap<Point>(props: HeatmapOptions<Point>, ref: Ref<Heatmap<Point>>) {
  const { instance } = useHeatmapLayer(props).current
  useImperativeHandle(ref, () => instance)

  return null
}

const LeafletHeatmap = forwardRef(_LeafletHeatmap)

export default LeafletHeatmap
