import { memo, useEffect, useMemo, useRef, useState } from 'react'
import countriesGeoJsonRaw from '../data/ne_110m_admin_0_countries.geojson?raw'

const countryPolygons = JSON.parse(countriesGeoJsonRaw).features.filter(
  (feature) => feature.properties.ISO_A2 !== 'AQ'
)

const GlobeView = memo(function GlobeView({ countries, selectedCountry, onSelectCountry }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const [status, setStatus] = useState('loading')

  const globeData = useMemo(
    () =>
      countries
        .filter((country) => Array.isArray(country.latlng) && country.latlng.length >= 2)
        .map((country) => ({
          ...country,
          lat: country.latlng[0],
          lng: country.latlng[1],
          labelSize: Math.min(1.9, Math.max(0.45, Math.sqrt(country.population || 1) * 0.000035)),
        })),
    [countries]
  )

  const countriesByCode = useMemo(() => {
    const map = new Map()
    countries.forEach((country) => {
      if (country.cca2) map.set(country.cca2, country)
      if (country.cca3) map.set(country.cca3, country)
    })
    return map
  }, [countries])

  const selectedCode = selectedCountry?.cca3 ?? selectedCountry?.cca2

  useEffect(() => {
    let cancelled = false
    let resizeObserver
    const mountNode = containerRef.current

    if (!mountNode) return undefined

    setStatus('loading')

    import('globe.gl')
      .then(({ default: Globe }) => {
        if (cancelled) return

        setStatus('ready')
        mountNode.innerHTML = ''

        const globe = Globe()(mountNode)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
          .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
          .lineHoverPrecision(0)
          .polygonsData(countryPolygons)
          .polygonAltitude((feature) =>
            feature.properties.ISO_A3 === selectedCode || feature.properties.ISO_A2 === selectedCode
              ? 0.08
              : 0.01
          )
          .polygonCapColor((feature) =>
            feature.properties.ISO_A3 === selectedCode || feature.properties.ISO_A2 === selectedCode
              ? 'rgba(45, 212, 191, 0.78)'
              : 'rgba(30, 64, 175, 0.16)'
          )
          .polygonSideColor((feature) =>
            feature.properties.ISO_A3 === selectedCode || feature.properties.ISO_A2 === selectedCode
              ? 'rgba(20, 184, 166, 0.34)'
              : 'rgba(15, 23, 42, 0.08)'
          )
          .polygonStrokeColor((feature) =>
            feature.properties.ISO_A3 === selectedCode || feature.properties.ISO_A2 === selectedCode
              ? '#fbbf24'
              : 'rgba(226, 232, 240, 0.18)'
          )
          .polygonLabel(({ properties }) => {
            const matched =
              countriesByCode.get(properties.ISO_A3) ?? countriesByCode.get(properties.ISO_A2)
            const population = matched?.population ?? properties.POP_EST
            return `<strong>${matched?.name.common ?? properties.ADMIN}</strong><br/>人口: ${population?.toLocaleString() ?? 'データなし'}人`
          })
          .polygonsTransitionDuration(450)
          .onPolygonClick((feature) => {
            const country =
              countriesByCode.get(feature.properties.ISO_A3) ??
              countriesByCode.get(feature.properties.ISO_A2)
            if (country) onSelectCountry(country)
          })
          .labelsData(globeData)
          .labelLat((country) => country.lat)
          .labelLng((country) => country.lng)
          .labelText((country) => country.name.common)
          .labelSize((country) => country.labelSize)
          .labelDotRadius((country) => country.labelSize * 0.42)
          .labelColor(() => 'rgba(251, 191, 36, 0.88)')
          .labelResolution(2)
          .onLabelClick((country) => onSelectCountry(country))

        globe.controls().autoRotate = !selectedCountry
        globe.controls().autoRotateSpeed = 0.35
        globe.pointOfView({ lat: 24, lng: 132, altitude: 2.25 }, 0)

        const syncSize = () => {
          const rect = mountNode.getBoundingClientRect()
          if (rect?.width && rect?.height) {
            globe.width(rect.width).height(rect.height)
          }
        }

        syncSize()
        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(syncSize)
          resizeObserver.observe(mountNode)
        } else {
          window.addEventListener('resize', syncSize)
          resizeObserver = { disconnect: () => window.removeEventListener('resize', syncSize) }
        }
        globeRef.current = globe
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      mountNode.innerHTML = ''
      globeRef.current = null
    }
  }, [countriesByCode, globeData, onSelectCountry, selectedCode, selectedCountry])

  useEffect(() => {
    if (!selectedCountry?.latlng || !globeRef.current) return
    globeRef.current.controls().autoRotate = false
    globeRef.current.pointOfView(
      {
        lat: selectedCountry.latlng[0],
        lng: selectedCountry.latlng[1],
        altitude: 1.65,
      },
      900
    )
  }, [selectedCountry])

  return (
    <section className="globe-shell" aria-label="世界地図ビュー">
      <div className="globe-stage" ref={containerRef} />
      {status === 'loading' && <p className="globe-status">地球儀を読み込み中...</p>}
      {status === 'error' && (
        <p className="globe-status">
          地球儀を読み込めませんでした。国リストはそのまま利用できます。
        </p>
      )}
      <div className="globe-caption">
        <span>{globeData.length}カ国をマッピング</span>
        <span>
          {selectedCountry
            ? `${selectedCountry.name.common}をハイライト中・回転停止中`
            : '国をクリックしてハイライト'}
        </span>
      </div>
    </section>
  )
})

export default GlobeView
