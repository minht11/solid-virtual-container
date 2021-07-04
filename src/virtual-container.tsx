import {
  createMemo,
  Index,
  Show,
  createComputed,
  Component,
  children,
  JSX,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Dynamic } from 'solid-js/web'
import {
  clickFocusedElement,
  createArray,
  doesElementContainFocus,
  getFiniteNumberOrZero,
} from './helpers/utils'
import { VirtualContainerProps } from './types'
import { createMeasurementsObserver } from './helpers/create-measurements-observer'
import { createMainAxisPositions } from './helpers/create-main-axis-positions'

export interface VirtualState {
  focusPosition: number
  mainAxis: {
    totalItemCount: number
    // Focused position for this axis.
    focusPosition: number
    scrollValue: number
  }
  crossAxis: {
    totalItemCount: number
  }
}

const STATIC_ITEM_STYLES = {
  'box-sizing': 'border-box',
  contain: 'strict',
  position: 'absolute',
  top: 0,
  left: 0,
}

export function VirtualContainer<T>(props: VirtualContainerProps<T>) {
  const [state, setState] = createStore<VirtualState>({
    focusPosition: 0,
    mainAxis: {
      totalItemCount: 0,
      focusPosition: 0,
      scrollValue: 0,
    },
    crossAxis: {
      totalItemCount: 0,
    },
  })

  const {
    containerEl,
    setContainerRefEl,
    isDirectionHorizontal,
    measurements,
  } = createMeasurementsObserver(props)

  // This selector is used for position calculations,
  // so value must always be current.
  // itemsMemo below is used only for rendering items.
  const itemsCount = () => (props.items && props.items.length) || 0

  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    const cTotal = getFiniteNumberOrZero(
      props.crossAxisCount?.(measurements, itemsCount()) || 0,
    )

    // There are always must be at least one column.
    setState('crossAxis', {
      totalItemCount: Math.max(1, cTotal),
    })
  })

  createComputed(() => {
    if (!measurements.isMeasured) {
      return
    }

    const iCount = itemsCount()
    const cTotal = state.crossAxis.totalItemCount

    const mTotal = Math.ceil(iCount / cTotal)

    setState('mainAxis', {
      totalItemCount: getFiniteNumberOrZero(mTotal),
    })
    setState('crossAxis', {
      totalItemCount: cTotal,
      positions: createArray(0, state.crossAxis.totalItemCount),
    })
  })

  createComputed(() => {
    const mFocusPos = Math.floor(
      state.focusPosition / state.crossAxis.totalItemCount,
    )
    setState('mainAxis', 'focusPosition', getFiniteNumberOrZero(mFocusPos))
  })

  const mainAxisPositions = createMainAxisPositions(
    measurements,
    state.mainAxis,
    () => props.overscan,
  )

  const containerStyleProps = (): JSX.CSSProperties => {
    const containerSize =
      state.mainAxis.totalItemCount * measurements.itemSize.main
    const property = isDirectionHorizontal() ? 'width' : 'height'
    const property2 = isDirectionHorizontal() ? 'height' : 'width'

    return {
      [property]: `${containerSize}px`,
      [property2]: '100%',
      position: 'relative',
      'flex-shrink': 0,
    }
  }

  const getItemStyle = (mainPos: number, crossPos = 0) => {
    const size = measurements.itemSize

    const mainSize = size.main * mainPos
    const crossSize = size.cross * crossPos

    let xTranslate = crossSize
    let yTranslate = mainSize
    let width = size.cross
    let height = size.main

    if (isDirectionHorizontal()) {
      xTranslate = mainSize
      yTranslate = crossSize
      width = size.main
      height = size.cross
    }

    return {
      transform: `translate(${xTranslate}px, ${yTranslate}px)`,
      width: width ? `${width}px` : '',
      height: height ? `${height}px` : '',
      ...STATIC_ITEM_STYLES,
    }
  }

  const crossAxisPositions = createMemo(() =>
    createArray(0, state.crossAxis.totalItemCount),
  )

  // When items change, old positions haven't yet changed,
  // so if there are more positions than items things will break.
  // This memo delays resolving items until new positions are calculated.
  const items = createMemo(() => props.items || [])

  const calculatePosition = (m: number, c: number) =>
    m * state.crossAxis.totalItemCount + c

  const MainAxisItems: Component<{ crossPos?: number }> = (itemProps) => (
    <Index each={mainAxisPositions()}>
      {(mainPos) => {
        const index = createMemo(() => {
          const mPos = mainPos()
          const cPos = itemProps.crossPos
          if (cPos === undefined) {
            return mPos
          }

          return calculatePosition(mPos, cPos)
        })

        return (
          <Show when={index() < items().length}>
            <Dynamic
              component={props.children}
              items={items()}
              item={items()[index()]}
              index={index()}
              tabIndex={index() === state.focusPosition ? 0 : -1}
              style={getItemStyle(mainPos(), itemProps.crossPos)}
            />
          </Show>
        )
      }}
    </Index>
  )

  const virtualElements = children(() => (
    // If there less than 2 cross axis columns
    // use fast path with only one loop, instead of 2.
    <Show
      when={state.crossAxis.totalItemCount > 1}
      fallback={<MainAxisItems />}
    >
      <Index each={crossAxisPositions()}>
        {(crossPos) => <MainAxisItems crossPos={crossPos()} />}
      </Index>
    </Show>
  )) as () => (HTMLElement | undefined)[]

  const findFocusPosition = () => {
    const cPositions = crossAxisPositions()
    const mPositions = mainAxisPositions()
    const elements = virtualElements()

    const focusedElementIndex = elements.findIndex((element) =>
      // inside grid last few elements can be undefined,
      // so safeguard for undefined.
      element?.matches(':focus-within, :focus'),
    )

    if (focusedElementIndex === -1) {
      return -1
    }

    if (state.crossAxis.totalItemCount > 1) {
      const cIndex = Math.floor(focusedElementIndex / mPositions.length)
      const mIndex = focusedElementIndex % mPositions.length

      const cPos = cPositions[cIndex]
      const mPos = mPositions[mIndex]

      const focusPosition = calculatePosition(mPos, cPos)

      return focusPosition
    }

    // If grid is one dimenisonal (i.e. just list) index
    // maps directly to position.
    return mPositions[focusedElementIndex]
  }

  const moveFocusHandle = (increment: number, isMainDirection: boolean) => {
    const fPosition = state.focusPosition

    let cPos = fPosition % state.crossAxis.totalItemCount
    let mPos = Math.floor(fPosition / state.crossAxis.totalItemCount)

    if (isMainDirection) {
      mPos += increment
    } else {
      cPos += increment
    }

    const newFocusPos = calculatePosition(mPos, cPos)

    // Prevent focus position from going out of list bounds.
    if (newFocusPos < 0 || newFocusPos >= itemsCount()) {
      return
    }

    const cIndex = crossAxisPositions().indexOf(cPos)

    if (cIndex === -1) {
      return
    }

    setState('focusPosition', newFocusPos)

    // After focusPosition is set elements and positions might have changed.
    const elements = virtualElements()

    const mPositions = mainAxisPositions()
    const mIndex = mPositions.indexOf(mPos)

    if (mIndex === -1) {
      return
    }

    const newIndex = cIndex * mPositions.length + mIndex
    const foundEl = elements[newIndex]

    if (!foundEl) {
      return
    }

    queueMicrotask(() => {
      foundEl.focus()
      foundEl.scrollIntoView({ block: 'nearest' })
    })
  }

  const onKeydownHandle = (e: KeyboardEvent) => {
    const { code } = e

    const isArrowUp = code === 'ArrowUp'
    const isArrowDown = code === 'ArrowDown'
    const isArrowLeft = code === 'ArrowLeft'
    const isArrowRight = code === 'ArrowRight'

    const isArrowUpOrDown = isArrowUp || isArrowDown
    const isArrowLeftOrRight = isArrowLeft || isArrowRight

    if (isArrowUpOrDown || isArrowLeftOrRight) {
      const isArrowDownOrRight = isArrowDown || isArrowRight

      moveFocusHandle(
        isArrowDownOrRight ? 1 : -1,
        isDirectionHorizontal() ? isArrowLeftOrRight : isArrowUpOrDown,
      )
    } else if (code === 'Enter') {
      if (!clickFocusedElement(containerEl())) {
        return
      }
    } else {
      return
    }

    e.preventDefault()
  }

  const onFocusInHandle = () => {
    // Restore previous focus position. For example user switching tab
    // back and forth.
    const newFocusPosition = findFocusPosition()
    setState('focusPosition', newFocusPosition === -1 ? 0 : newFocusPosition)
  }

  const onFocusOutHandle = async () => {
    queueMicrotask(() => {
      if (!doesElementContainFocus(containerEl())) {
        setState('focusPosition', 0)
      }
    })
  }

  return (
    <div
      ref={setContainerRefEl}
      className={props.className}
      style={containerStyleProps()}
      onKeyDown={onKeydownHandle}
      onFocusIn={onFocusInHandle}
      onFocusOut={onFocusOutHandle}
      role={props.role || 'list'}
    >
      {virtualElements()}
    </div>
  )
}
