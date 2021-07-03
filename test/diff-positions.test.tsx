/**
 * @jsxImportSource solid-js
 */
import h from 'solid-js/h'
import { expect } from '@esm-bundle/chai'
import { diffPositions } from '../src/helpers/diff-positions'

const uniqueLength = (items: unknown[]) => [...new Set(items)].length

const TOTAL = 40

const positionsShouldBeUnique = (positions: number[]) => {
  expect(uniqueLength(positions)).to.be.eq(positions.length)
}
const shouldHaveFocusPosition = (
  positions: number[],
  focusPosition: number,
) => {
  expect(positions.includes(focusPosition)).to.be.true
}

describe('Test the target and child offset distance', () => {
  it('should change position incrementally', () => {
    const focusPosition = 0
    const newPositions = diffPositions({
      total: TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: 2,
      prevStartPosition: 0,
      prevPositions: [0, 1, 2, 3, 4],
    })

    expect(newPositions).to.have.all.members([0, 5, 2, 3, 4])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })
  it('should correctly diff positions when new and old positions count do not match', () => {
    const focusPosition = 0
    const newPositions = diffPositions({
      total: TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: 2,
      prevStartPosition: 0,
      prevPositions: [5],
    })

    expect(newPositions).to.have.all.members([0, 5, 2, 3, 4])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })

  it('should correctly create positions if focus is inside bounds', () => {
    const focusPosition = 35
    const newPositions = diffPositions({
      total: TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: TOTAL - 5,
      prevStartPosition: 0,
      prevPositions: [],
    })

    expect(newPositions).to.have.all.members([focusPosition, 36, 37, 38, 39])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })

  it('should correctly create positions if focus is inside bounds at the very end', () => {
    const focusPosition = 38
    const newPositions = diffPositions({
      total: TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: TOTAL - 4,
      prevStartPosition: 0,
      prevPositions: [],
    })

    expect(newPositions).to.have.all.members([35, 36, 37, focusPosition, 39])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })

  it('should correctly create positions if focus is outside the bounds with previous and new positions', () => {
    const focusPosition = 34
    const newPositions = diffPositions({
      total: TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: TOTAL - 4,
      prevStartPosition: 0,
      prevPositions: [4, 0, 1, 2, 3],
    })

    expect(newPositions).to.have.all.members([focusPosition, 36, 37, 38, 39])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })

  it('should correctly create static positions', () => {
    const STATIC_TOTAL = 4
    const focusPosition = 2
    const newPositions = diffPositions({
      total: STATIC_TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: 0,
      prevStartPosition: 0,
      prevPositions: [],
    })

    expect(newPositions).to.have.all.members([0, 1, focusPosition, 3])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })

  it('should correctly return cached static positions', () => {
    const STATIC_TOTAL = 4
    const focusPosition = 2
    const newPositions = diffPositions({
      total: STATIC_TOTAL,
      focusPosition,
      positionCount: 4,
      startPosition: 0,
      prevStartPosition: 0,
      prevPositions: [0, 1, focusPosition, 3],
    })

    expect(newPositions).to.have.all.members([0, 1, focusPosition, 3])

    shouldHaveFocusPosition(newPositions, focusPosition)
    positionsShouldBeUnique(newPositions)
  })
})
