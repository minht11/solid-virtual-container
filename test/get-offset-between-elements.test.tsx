/**
 * @jsxImportSource solid-js
 */
import h from 'solid-js/h'
import { expect } from '@esm-bundle/chai'
import { getOffsetBetweenElements } from '../src/helpers/utils'

interface OffsetContainerProps {
  target?: boolean
  middle?: boolean
}

const TARGET_OFFSET = 40
const MIDDLE_OFFSET = 50
const EXPECTED_DISTANCE = TARGET_OFFSET + MIDDLE_OFFSET

const setup = (roots: OffsetContainerProps) => {
  const style = (isContainmentRoot: boolean, padding = 0) => ({
    contain: isContainmentRoot && 'content',
    padding: `${padding}px`,
  })

  const elements = (
    <div style={{ padding: '30px' }}>
      <div id='target' style={style(roots.target, TARGET_OFFSET)}>
        <div id='middle' style={style(roots.middle, MIDDLE_OFFSET)}>
          <div id='start'></div>
        </div>
      </div>
    </div>
  ) as HTMLDivElement

  document.body.appendChild(elements)

  return {
    target: elements.querySelector('#target') as HTMLDivElement,
    start: elements.querySelector('#start') as HTMLDivElement,
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('Test the offset distance measuring between target and child', () => {
  it('should get right distance when containing root is body', () => {
    const { start, target } = setup({ target: false, middle: false })

    expect(getOffsetBetweenElements(target, start).offsetLeft).to.equal(
      EXPECTED_DISTANCE,
    )
  })
  it('should get right distance when containing root is body and there is one containing root in between', () => {
    const { start, target } = setup({ target: false, middle: true })

    expect(getOffsetBetweenElements(target, start).offsetLeft).to.equal(
      EXPECTED_DISTANCE,
    )
  })
  it('should get right distance when containing root is target and there is no containing root in between', () => {
    const { start, target } = setup({ target: true, middle: false })

    expect(getOffsetBetweenElements(target, start).offsetLeft).to.equal(
      EXPECTED_DISTANCE,
    )
  })
  it('should get right distance when containing root is target and there is one containing root in between', () => {
    const { start, target } = setup({ target: true, middle: true })

    expect(getOffsetBetweenElements(target, start).offsetLeft).to.equal(
      EXPECTED_DISTANCE,
    )
  })
})
