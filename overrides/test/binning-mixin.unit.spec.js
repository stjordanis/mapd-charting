import chai, {expect} from "chai"
import spies from "chai-spies"
import binningMixin, {roundTimeBin} from "../src/binning-mixin"
import dc from "../../mapdc"

describe("binningMixin", () => {
  let chart

  beforeEach(() => {
    chart = binningMixin(dc.baseMixin({}))
    chart.redrawGroup = chai.spy()
  })

  describe("timeBinInputVal Method", () => {
    it('should be initialized to auto', () => {
      expect(chart.timeBinInputVal()).to.equal("auto")
    })
    it('should update timeBinInputVal', () => {
      chart.timeBinInputVal("quarter")
      expect(chart.timeBinInputVal()).to.equal("quarter")
    })
  })

  describe("roundTimeBin Helper", () => {
    describe("when there is no interval", () => {
      it("should return date", () => {
        const date = new Date()
        const inMS = date.getTime()
        expect(roundTimeBin(date).getTime()).to.equal(inMS)
      })
    })
    describe("when interval is a property of d3.time", () => {
      it('should return utc', () => {
        const date = new Date("Wed Oct 24 2001 01:32:32 GMT-0700 (PDT)")
        const expected = (new Date ("Sat Oct 20 2001 17:00:00 GMT-0700 (PDT)")).getTime()
        expect(roundTimeBin(date, "week", "round").getTime()).to.equal(expected)
      })
    })
    describe('when interval is quarter', () => {
      it('shoould return the proper rounded date', () => {
        const date = new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)")
        const expected = (new Date ("Fri Dec 31 1999 16:00:00 GMT-0800 (PST)")).getTime()
        expect(roundTimeBin(date, "decade", "round").getTime()).to.equal(expected)
      })
    })
    describe('when interval is decade', () => {
      it('shoould return the proper rounded date', () => {
        const date = new Date("Fri May 17 1991 00:41:30 GMT-0700 (PDT)")
        const expected = (new Date ("Sun Mar 31 1991 16:00:00 GMT-0800 (PST)")).getTime()
        expect(roundTimeBin(date, "quarter", "round").getTime()).to.equal(expected)
      })
    })
    describe('when interval is century', () => {
      it('should returnt the proper rounded date', () => {
        const date = new Date("Fri May 17 1991 00:41:30 GMT-0700 (PDT)")
        const expected = (new Date ("Fri Dec 31 1999 16:00:00 GMT-0800 (PST)")).getTime()
        expect(roundTimeBin(date, "century", "round").getTime()).to.equal(expected)
      })
    })
    describe("when operation is ceil", () => {
      it('should', () => {
        const date = new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)")
        const expected = (new Date ("Fri Dec 31 1999 16:00:00 GMT-0800 (PST)")).getTime()
        expect(roundTimeBin(date, "decade", "ceil").getTime()).to.equal(expected)
      })
    })
    describe("when operation is floor", () => {
      it('should', () => {
        const date = new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)")
        const expected = (new Date ("Sun Dec 31 1989 16:00:00 GMT-0800 (PST)")).getTime()
        expect(roundTimeBin(date, "decade", "floor").getTime()).to.equal(expected)
      })
    })
  })

  describe('binBrush Method', () => {
    const RangedFilter = dc.filters.RangedFilter
    beforeEach(() => {
      dc.filters.RangedFilter = (a, b) => [a, b]
      chart.extendBrush = () => {}
      chart.xAxisMin = () => {}
      chart.xAxisMax = () => {}
      chart.replaceFilter = chai.spy()
      chart.redrawGroup = chai.spy()
      chart.triggerReplaceFilter = chai.spy()
      chart.group = () => ({
        binParams: () => [{timeBin: "day"}]
      })
    })
    after(() => {
      dc.filters.RangedFilter = RangedFilter
      chart.extendBrush = () => {}
      chart.xAxisMin = () => {}
      chart.xAxisMax = () => {}
    })
    describe('when extend0 start and end are the same', () => {
      it('should return undefined', () => {
        chart.extendBrush = () => [
          new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)"),
          new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)")
        ]
        expect(chart.binBrush()).to.equal(undefined)
      })
    })
    describe('when extend0 start and end is less than xAxisMin', () => {
      it('should return undefined, replaceFilter, and redrawGroup', () => {
        chart.extendBrush = () => [
          new Date("Wed Jul 26 1995 08:17:06 GMT-0700 (PDT)"),
          new Date("Wed Jul 28 1995 08:17:06 GMT-0700 (PDT)")
        ]
        chart.xAxisMin = () => new Date("Wed Jul 30 1995 08:17:06 GMT-0700 (PDT)")
        expect(chart.binBrush()).to.equal(undefined)
        expect(chart.replaceFilter).to.have.been.called.with(null)
        expect(chart.redrawGroup).to.have.been.called()
      })
    })

    describe('regular when extendBrush is a regular range ', () => {
      it('should call replaceFilter with a RangedFilter and invoke triggerReplaceFilter', () => {
        chart.extendBrush = () => [
          new Date("Wed May 21 2008 01:59:19 GMT-0700 (PDT)"),
          new Date("Fri May 30 2008 13:26:35 GMT-0700 (PDT)")
        ]
        chart.xAxisMin = () => new Date("Tue Jan 01 2008 16:00:00 GMT-0800 (PST)")
        chart.xAxisMax = () => new Date("Wed Dec 31 2008 16:00:00 GMT-0800 (PST)")
        chart.binBrush()
        expect(chart.triggerReplaceFilter).to.have.been.called()
        expect(chart.replaceFilter).to.have.been.called.with(dc.filters.RangedFilter(
          new Date("Tue May 20 2008 17:00:00 GMT-0700 (PDT)"),
          new Date("Fri May 30 2008 17:00:00 GMT-0700 (PDT)")
        ))
      })
    })
  })

  describe("changeBinVal method", () => {
    beforeEach(() => {
      chart.stack = () => []
      chart.renderAsync = chai.spy()
      chart.binBrush = chai.spy()
    })
    it('should update timeBinInputVal, invokeBinListener, renderAsync, and binBrush', () => {
      chart.changeBinVal("day")
      expect(chart.timeBinInputVal()).to.equal("day")
      expect(chart.renderAsync).to.have.been.called()
      expect(chart.binBrush).to.have.been.called()
    })
  })

  describe("bin event", () => {
    beforeEach(() => {
      chart.stack = () => []
      chart.extendBrush = () => [
        new Date("Wed May 21 2008 01:59:19 GMT-0700 (PDT)"),
        new Date("Fri May 30 2008 13:26:35 GMT-0700 (PDT)")
      ]
      chart.xAxisMin = () => new Date("Tue Jan 01 2008 16:00:00 GMT-0800 (PST)")
      chart.xAxisMax = () => new Date("Wed Dec 31 2008 16:00:00 GMT-0800 (PST)")
      chart.triggerReplaceFilter = () => {}
      chart.group = () => ({
        binParams: () => [{timeBin: "day"}]
      })
    })
    it('should expose the bin event for listeners', () => {
      const binVal = "day"
      chart.on('bin', (chart, val) => {
        expect(chart).to.equal(chart)
        expect(val).to.equal(binVal)
      })
      chart.changeBinVal("day")
    })
  })
})