import { createComputed, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Measurements } from './create-measurements-observer'
import { diffPositions } from './diff-positions'
import { getFiniteNumberOrZero } from './utils'

export const getIntegerOrZero = (value: number) =>
  Number.isInteger(value) ? value : 0

interface AxisValues {
  totalItemCount: number
  focusPosition: number
}

interface State {
  overscan: number
  positionCount: number
  currentPosition: number
  maxScrollPosition: number
  positions: number[]
}

export const createMainAxisPositions = (
  measurements: Measurements,
  axis: AxisValues,
  getOverscan: () => number | undefined,
) => {
  const [state, setState] = createStore<State>({
    overscan: 0,
    positionCount: 0,
    maxScrollPosition: 0,
    currentPosition: 0,
    positions: [],
  })

  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    const totalElementCount = axis.totalItemCount
    const mItemSize = measurements.itemSize.main
    const mTargetSize = measurements.target.main

    untrack(() => {
      const MINIMUM_OVERSCAN_DISTANCE = 180
      const overscanNotSafe =
        getOverscan() ??
        Math.max(Math.ceil(MINIMUM_OVERSCAN_DISTANCE / mItemSize), 2)

      const overscan = getFiniteNumberOrZero(overscanNotSafe)
      setState('overscan', overscan)

      // Calculate how many elements are visible on screen.
      const mainAxisVisibleCount = Math.ceil(mTargetSize / mItemSize)

      const positionCount = getIntegerOrZero(
        Math.min(mainAxisVisibleCount + overscan * 2, totalElementCount),
      )

      setState('positionCount', positionCount)
      setState('maxScrollPosition', totalElementCount - positionCount)
    })
  })

  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    // Calculate scrollValue only from place where itemsContainer starts.
    const scrollValueAdjusted =
      measurements.mainAxisScrollValue - measurements.container.offsetMain

    // Scroll position is an index representing each item's place on screen.
    const basePosition = Math.floor(
      scrollValueAdjusted / measurements.itemSize.main,
    )

    const positionAdjusted = basePosition - state.overscan

    // Clamp scroll position so it doesn't exceed bounds.
    const currentPosition = Math.min(
      Math.max(0, positionAdjusted),
      state.maxScrollPosition,
    )
    setState('currentPosition', currentPosition)
  })

  let prevPosition = 0
  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    const newPositions = diffPositions({
      total: axis.totalItemCount,
      focusPosition: axis.focusPosition,
      positionCount: state.positionCount,
      startPosition: state.currentPosition,
      prevStartPosition: prevPosition,
      prevPositions: untrack(() => state.positions),
    })

    setState('positions', newPositions)

    prevPosition = state.currentPosition
  })

  return () => state.positions
}
