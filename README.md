# Virtual container for Solid-js
Efficient, single direction virtual list/grid for Solid-js

## Features
* Support for grid/list modes.
* Only render visible items, no matter how big is your list.
* Keyboard navigation and focus management out of the box.
* Option to change items size based on available space.

[Demo](https://codesandbox.io/s/friendly-darkness-pk74r)

## Usage
Create list item component.
```tsx
const ListItem = (props) => (
  <div
    // Required for items to switch places.
    style={props.style}
    // Used for keyboard navigation and accessibility.
    tabIndex={props.tabIndex}
    role="listitem"
  >
    <div>{props.item}</div>
  </div>
)
```
Create vertically scrolling virtual list
```tsx
const App = () => {
  const items = [0, 1, 2, 3]
  let scrollTargetElement!: HTMLDivElement
  return (
    <div style={{ overflow: 'auto' }} ref={scrollTargetElement}>
      <VirtualContainer
        items={items}
        scrollTarget={scrollTargetElement}
        // Define size you wish your list items to take.
        itemSize={{ height: 50 }}
      >
        {ListItem}
      </VirtualContainer>
    </div>
  )
}
```
or a virtual grid
```tsx
const App = () => {
  const items = [0, 1, 2, 3]
  let scrollTargetElement!: HTMLDivElement
  return (
    <div style={{ overflow: 'auto' }} ref={scrollTargetElement}>
      <VirtualContainer
        items={items}
        scrollTarget={scrollTargetElement}
        itemSize={{ height: 50, width: 50 }}
        // Calculate how many columns to show.
        crossAxisCount={(measurements) => (
          Math.floor(
            measurements.container.cross / measurements.itemSize.cross
          )
        )}
      >
        {ListItem}
      </VirtualContainer>
    </div>
  )
}
```
## Api
### ScrollTargetContext
If you you do not have an immediate access to the VirtualContainer, or do not want to pass props several components deep you can use context api.

```tsx
const App = () => {
  const items = [0, 1, 2, 3]
  let scrollTargetElement!: HTMLDivElement
  return (
    <div ref={scrollTargetElement}>
      <ScrollTargetContext.Provider value={{ scrollTarget: scrollTargetElement }}>
        ...
        <VirtualContainer ... />
        ...
      </ScrollTargetContext.Provider>
    </div>
  )
}
```
### Virtual container options
```tsx
interface VirtualContainer<T> {
  // your list data array. 
  items: readonly T[]
  // Define elements size.
  // All elements will use same size.
  itemSize: VirtualItemSize
  // Scrolling element, if context api is used this is not needed,
  // however you must use one or the other.
  scrollTarget?: HTMLElement
  // Scroll direction. Default is vertical.
  direction?: 'vertical' | 'horizontal'
  // Number of elements to render below and above currently visible items,
  // if not provided an optimal amount will be automatically picked.
  overscan?: number
  // Container className, if at all possible ignore this option,
  // because direct styling can break virtualizing, instead wrap
  // element in another div and style that.
  className?: string
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  // Function which determines how many columns in vertical mode
  // or rows in horizontal to show. Default is 1.
  crossAxisCount?: (
    measurements: CrossAxisCountOptions,
    // The same as items.length
    itemsCount: number,
  ) => number
  // List item render function.
  children: (props: VirtualItemProps<T>) => JSX.Element
}
```
If `direction` is `vertical` main axis is vertical.
If `direction` is `horizontal` main axis is horizontal.
```tsx
interface Axis {
  // Main scrolling direction axis.
  main: number
  // Opposite axis to main.
  cross: number
}
```

Parameter object used in `VirtualContainer.crossAxisCount` function.
```tsx
interface CrossAxisCountOptions {
  // Scrolling element dimensions.
  target: Axis
  // Container element dimensions.
  container: Axis
  // List element dimensions.
  itemSize: Axis
}
```
### Item size
```tsx
// You can use static object to define item size
interface VirtualItemSizeStatic {
  width?: number
  height?: number
}

// or use a function to calculate it when layout changes.
type VirtualItemSizeDynamic = (
  crossAxisContentSize: number,
  // Scroll direction.
  isHorizontal: boolean,
) => VirtualItemSizeStatic
```
Dynamic size is useful when you want your
grid items to fill all available space
```tsx
// One possible example
const calculateItemSize = (crossAxisSize: number) => {
  // Choose minimum size depending on the available space.
  const minWidth = crossAxisSize > 560 ? 180 : 140

  const count = Math.floor(crossAxisSize / minWidth)
  const width = Math.floor(crossAxisSize / count)

  return {
    width,
    height: width + 48
  }
}

<VirtualContent itemSize={calculateItemSize}></VirtualContent>
```

## Limitations
Different individual item sizes and scrolling with both directions at the same time are not and likely will never be supported by this package.
