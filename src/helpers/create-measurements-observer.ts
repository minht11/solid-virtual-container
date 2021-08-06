import {
  createSignal,
  createMemo,
  useContext,
  createEffect,
  batch,
  onCleanup,
  createComputed,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  ScrollDirection,
  VirtualItemSize,
  VirtualItemSizeStatic,
} from '../types'
import { ScrollTargetContext } from '../scroll-target-context'
import { getOffsetBetweenElements } from './utils'

const getSizeFromResizeEntry = (entry: ResizeObserverEntry) => {
  let width = 0
  let height = 0
  if (entry.borderBoxSize) {
    const { borderBoxSize } = entry
    const size = Array.isArray(borderBoxSize) ? borderBoxSize[0] : borderBoxSize
    width = size.inlineSize
    height = size.blockSize
  } else {
    // TODO. As of yet Safari 14 still doesn't support borderBoxSize.
    // getBoundingClientRect changes in respect of css transform
    // so this is partial solution, I have no way to test if this
    // is working correctly.
    const rect = entry.target.getBoundingClientRect()
    width = rect.width
    height = rect.height
  }

  return { width, height }
}

const createAxis = (axisA: number, axisB: number, flip: boolean) => {
  const [main, cross] = flip ? [axisA, axisB] : [axisB, axisA]
  return {
    main,
    cross,
  }
}

export interface Axis {
  main: number
  cross: number
}

export interface Measurements {
  isMeasured: boolean
  mainAxisScrollValue: number
  itemSize: Axis
  target: Axis
  container: {
    offsetMain: number
    offsetCross: number
    main: number
    cross: number
  }
}

export interface MeasurementsObserverProps {
  scrollTarget?: HTMLElement
  direction?: ScrollDirection
  itemSize: VirtualItemSize
}

const DEFAULT_SIZE = {
  main: 0,
  cross: 0,
}

const doCrossAxisSizeMatch = (a: Axis, b: Axis) => a.cross === b.cross

export const createMeasurementsObserver = (
  props: MeasurementsObserverProps,
) => {
  const scrollTargetContext = useContext(ScrollTargetContext)

  const [containerEl, setContainerRefEl] = createSignal<HTMLDivElement>(
    undefined as unknown as HTMLDivElement,
  )
  const targetEl = () => props.scrollTarget || scrollTargetContext?.scrollTarget

  const isDirectionHorizontal = createMemo(
    () => (props.direction || 'vertical') === 'horizontal',
  )

  const [measurements, setMeasurements] = createStore<Measurements>({
    isMeasured: false,
    mainAxisScrollValue: 0,
    target: { ...DEFAULT_SIZE },
    container: {
      ...DEFAULT_SIZE,
      offsetMain: 0,
      offsetCross: 0,
    },
    itemSize: { ...DEFAULT_SIZE },
  })

  const onEntry = (entry: ResizeObserverEntry) => {
    const entryTarget = entry.target as HTMLElement

    const target = targetEl() as HTMLElement
    const container = containerEl()

    const isHorizontal = isDirectionHorizontal()

    const size = getSizeFromResizeEntry(entry)
    const axisSize = createAxis(size.width, size.height, isHorizontal)

    if (entryTarget === target) {
      setMeasurements('target', axisSize)
    } else if (entryTarget === container) {
      if (
        !doCrossAxisSizeMatch(measurements.container, axisSize) ||
        !measurements.isMeasured
      ) {
        const offset = getOffsetBetweenElements(target, container)

        const offsetAxis = createAxis(
          offset.offsetLeft,
          offset.offsetTop,
          isHorizontal,
        )

        setMeasurements('container', {
          ...axisSize,
          offsetMain: offsetAxis.main,
          offsetCross: offsetAxis.cross,
        })
      }
    }
  }

  const getLiveScrollValue = () => {
    const target = targetEl()
    if (target) {
      const value = isDirectionHorizontal()
        ? target.scrollLeft
        : target.scrollTop

      // We are not interested in subpixel values.
      return Math.floor(value)
    }
    return 0
  }

  const ro = new ResizeObserver((entries) => {
    batch(() => {
      entries.forEach((entry) => onEntry(entry))
      setMeasurements({
        isMeasured: true,
        mainAxisScrollValue: getLiveScrollValue(),
      })
    })
  })

  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    const isHorizontal = isDirectionHorizontal()
    const size = props.itemSize

    let itemSizeResolved: VirtualItemSizeStatic
    if (typeof size === 'function') {
      itemSizeResolved = size(measurements.container.cross, isHorizontal)
    } else {
      itemSizeResolved = size
    }
    const itemAxis = createAxis(
      itemSizeResolved.width || 0,
      itemSizeResolved.height || 0,
      isHorizontal,
    )

    setMeasurements('itemSize', itemAxis)
  })

  const onScrollHandle = () => {
    setMeasurements('mainAxisScrollValue', getLiveScrollValue())
  }

  createEffect(() => {
    const target = targetEl()
    const container = containerEl()
    if (!target || !container) {
      return
    }

    target.addEventListener('scroll', onScrollHandle)

    ro.observe(target)
    ro.observe(container)

    onCleanup(() => {
      setMeasurements('isMeasured', false)
      target.removeEventListener('scroll', onScrollHandle)
      ro.unobserve(target)
      ro.unobserve(container)
    })
  })

  return {
    containerEl,
    setContainerRefEl,
    isDirectionHorizontal,
    measurements,
  }
}
