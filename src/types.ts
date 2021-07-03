import { JSX } from 'solid-js'
import { Axis, Measurements } from './helpers/create-measurements-observer'

export type { Measurements }

export type ScrollDirection = 'vertical' | 'horizontal'

export interface VirtualItemSizeStatic {
  width?: number
  height?: number
}

export type VirtualItemSizeDynamic = (
  crossAxisContentSize: number,
  isHorizontal: boolean,
) => VirtualItemSizeStatic

export type VirtualItemSize = VirtualItemSizeStatic | VirtualItemSizeDynamic

export interface VirtualItemProps<T> {
  items: readonly T[]
  item: T
  index: number
  tabIndex: number
  style: Record<string, string | number | undefined>
}

export interface CrossAxisCountOptions {
  target: Axis
  container: Axis
  itemSize: Axis
}

export interface VirtualContainerProps<T> {
  items: readonly T[]
  itemSize: VirtualItemSize
  scrollTarget?: HTMLElement
  direction?: ScrollDirection
  overscan?: number
  className?: string
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  crossAxisCount?: (
    measurements: CrossAxisCountOptions,
    itemsCount: number,
  ) => number
  children: (props: VirtualItemProps<T>) => JSX.Element
}
