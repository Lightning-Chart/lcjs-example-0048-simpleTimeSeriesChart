window.lcjsSmallView = window.devicePixelRatio >= 2
if (!window.__lcjsDebugOverlay) {
    window.__lcjsDebugOverlay = document.createElement('div')
    window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
    const attach = () => { if (document.body && !window.__lcjsDebugOverlay.parentNode) document.body.appendChild(window.__lcjsDebugOverlay) }
    attach()
    setInterval(() => {
        attach()
        window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + window.lcjsSmallView
    }, 500)
}
const lcjs = require('@lightningchart/lcjs')
const xydata = require('@lightningchart/xydata')
const { lightningChart, Themes, AxisTickStrategies } = lcjs
const { createMultiChannelTraceGenerator } = xydata

// Generate example time-series data set
const pointCount = 5_000_000
// The recommended way of providing timestamps is with UTC timestamp numbers
const timeStart = Date.UTC(2024, 0, 1, 12, 0, 0)
const timeEnd = Date.UTC(2026, 6, 1, 12, 0, 0)
const timeStep = (timeEnd - timeStart) / pointCount
const timestamps = new Array(pointCount).fill(0).map((_, i) => timeStart + i * timeStep)

const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
const chart = lc
    .ChartXY({
        defaultAxisX: {
            type: 'linear-highPrecision',
        },
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    return t && window.lcjsSmallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.lcjsSmallView ? lcjs.htmlTextRenderer : undefined,
    })
    .setTitle('Time-series chart')
chart.axisX.setTickStrategy(AxisTickStrategies.DateTime)

createMultiChannelTraceGenerator()
    .setNumberOfChannels(2)
    .setNumberOfPoints(pointCount)
    .generate()
    .then((allData) => {
        const yValues1 = allData['y0']
        const yValues2 = allData['y1']
        // For best performance, shared timestamps could be connected to several series without duplicating the data internally
        // documentation on this can be found at https://lightningchart.com/js-charts/docs/features/xy/line/#avoiding-input-data-duplication
        // For purposes of this example, data is just connected in simplest possible way. And this is actually the most optimal way if timestamps between trends are not the same.

        const series1 = chart
            .addLineSeries({
                schema: {
                    timestamps: { pattern: 'progressive' },
                    y: { pattern: null },
                },
            })
            .setName('Trend 1')
            .appendSamples({ timestamps, y: yValues1 })

        const series2 = chart
            .addLineSeries({
                schema: {
                    timestamps: { pattern: 'progressive' },
                    y: { pattern: null },
                },
                automaticColorIndex: 2,
            })
            .setName('Trend 2')
            .appendSamples({ timestamps, y: yValues2 })
    })
