/**
 * @jsxImportSource solid-js
 */
import h from 'solid-js/h'
import { expect } from '@esm-bundle/chai'
import { createMeasurementsObserver } from '../src/helpers/create-measurements-observer'
import { createEffect, createRoot, on, onMount } from 'solid-js'

declare module 'mocha' {
  export interface Context {
    target: HTMLDivElement
    container: HTMLDivElement
  }
}

describe('Test measurements observer', () => {
  describe('Test direction', () => {
    it('should resolve vertical direction default', () => {
      createRoot((dispose) => {
        const { isDirectionHorizontal } = createMeasurementsObserver({
          itemSize: {},
        })

        expect(isDirectionHorizontal()).to.be.false
        dispose()
      })
    })

    it('should resolve vertical direction', () => {
      createRoot((dispose) => {
        const { isDirectionHorizontal } = createMeasurementsObserver({
          direction: 'vertical',
          itemSize: {},
        })

        expect(isDirectionHorizontal()).to.be.false
        dispose()
      })
    })

    it('should resolve horizontal direction', () => {
      createRoot((dispose) => {
        const { isDirectionHorizontal } = createMeasurementsObserver({
          direction: 'horizontal',
          itemSize: {},
        })

        expect(isDirectionHorizontal()).to.be.true
        dispose()
      })
    })
  })

  describe('Test layout', function () {
    it('should ignore empty target', function (done) {
      createRoot(() => {
        const { measurements } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: null,
        })

        setTimeout(() => {
          expect(measurements.isMeasured).to.be.false
          done()
        }, 50)
      })
    })

    before(function () {
      let container
      const target = (
        <div
          style={{
            padding: '50px 60px',
            height: '500px',
            width: '600px',
            overflow: 'auto',
          }}
        >
          <div
            style={{ height: '1000px', width: '1100px' }}
            ref={(el) => {
              container = el
            }}
          />
        </div>
      ) as HTMLDivElement

      document.body.appendChild(target)

      this.target = target
      this.container = container
    })

    beforeEach(function () {
      this.target.scrollTop = 0
      this.target.scrollLeft = 0
    })

    it('should get correct initial vertical scroll value', function (done) {
      createRoot((dispose) => {
        this.target.scrollTop = 200
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (measurements.isMeasured) {
            expect(measurements.mainAxisScrollValue).to.be.equal(
              this.target.scrollTop,
            )
            done()
            dispose()
          }
        })
      })
    })

    it('should get correct initial horizontal scroll value', function (done) {
      createRoot((dispose) => {
        this.target.scrollLeft = 200
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: this.target,
          direction: 'horizontal',
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (measurements.isMeasured) {
            expect(measurements.mainAxisScrollValue).to.be.equal(
              this.target.scrollLeft,
            )
            done()
            dispose()
          }
        })
      })
    })

    it('should observe scroll value change', function (done) {
      createRoot((dispose) => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          if (measurements.mainAxisScrollValue === 0) {
            this.target.scrollTop = 400
            return
          }

          expect(measurements.mainAxisScrollValue).to.be.equal(
            this.target.scrollTop,
          )
          done()
          dispose()
        })
      })
    })

    it('should measure correct target and container layout sizes', function (done) {
      createRoot(() => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          expect(measurements.container).to.deep.equal({
            main: 1000,
            cross: 1100,
            offsetMain: 50,
            offsetCross: 60,
          })
          done()
        })
      })
    })

    it('uses static item sizes', function (done) {
      createRoot(() => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: { height: 50, width: 60 },
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          expect(measurements.itemSize).to.deep.equal({
            main: 50,
            cross: 60,
          })
          done()
        })
      })
    })

    it('uses correct dynamic item sizes with vertical direction', function (done) {
      createRoot(() => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: (containerCrossSize, isHorizontal) => {
            expect(containerCrossSize).to.equal(measurements.container.cross)
            expect(isHorizontal).to.be.false
            return { height: 50, width: 60 }
          },
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          expect(measurements.itemSize).to.deep.equal({
            main: 50,
            cross: 60,
          })
          done()
        })
      })
    })

    it('uses correct dynamic item sizes with horizontal direction', function (done) {
      createRoot(() => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: (containerCrossSize, isHorizontal) => {
            expect(containerCrossSize).to.equal(measurements.container.cross)
            expect(isHorizontal).to.be.true
            return { height: 50, width: 60 }
          },
          scrollTarget: this.target,
          direction: 'horizontal',
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          expect(measurements.itemSize).to.deep.equal({
            main: 60,
            cross: 50,
          })
          done()
        })
      })
    })

    it('should measure correct target and container layout sizes without ResizeObserverEntry.prototype.borderBoxSize', function (done) {
      // @ts-ignore
      delete ResizeObserverEntry.prototype.borderBoxSize
      createRoot(() => {
        const { measurements, setContainerRefEl } = createMeasurementsObserver({
          itemSize: {},
          scrollTarget: this.target,
        })

        setContainerRefEl(this.container)

        createEffect(() => {
          if (!measurements.isMeasured) {
            return
          }

          expect(measurements.container).to.deep.equal({
            main: 1000,
            cross: 1100,
            offsetMain: 50,
            offsetCross: 60,
          })
          done()
        })
      })
    })
  })
})
