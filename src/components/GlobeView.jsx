import { memo, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import countriesGeoJsonRaw from '../data/ne_110m_admin_0_countries.geojson?raw'

const countryPolygons = JSON.parse(countriesGeoJsonRaw).features.filter(
  (feature) => feature.properties.ISO_A2 !== 'AQ'
)

const GlobeView = memo(function GlobeView({ countries, selectedCountry, onSelectCountry }) {
  const containerRef = useRef(null)
  const videoRef = useRef(null) // MediaPipe用の非表示ビデオ要素
  const globeRef = useRef(null)
  const reqAnimFrameId = useRef(null)
  const [status, setStatus] = useState('loading')

  // 物理演算の状態管理（Reactの再描画を防ぐため全て useRef で保持）
  const physics = useRef({
    isHandPresent: false,
    currentScale: 1.0, targetScale: 1.0,
    currentPosition: new THREE.Vector3(0, 0, 0),
    targetPosition: new THREE.Vector3(0, 0, 0),
    velocityPosition: new THREE.Vector3(0, 0, 0),
    currentRotation: new THREE.Euler(0, 0, 0),
    targetRotation: new THREE.Euler(0, 0, 0),
    velocityRotation: new THREE.Euler(0, 0, 0),
  })

  // 地球儀にマッピングする国データ
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

  // ==========================================
  // 1. 初期化エフェクト（マウント時に1回だけ実行）
  // ==========================================
  useEffect(() => {
    let cancelled = false
    let resizeObserver
    const mountNode = containerRef.current

    if (!mountNode || globeRef.current) return

    setStatus('loading')

    import('globe.gl').then(({ default: Globe }) => {
      if (cancelled) return

      setStatus('ready')
      mountNode.innerHTML = ''

      // --- A. 地球儀の初期化 ---
      const globe = Globe()(mountNode)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .lineHoverPrecision(0)
        .polygonsTransitionDuration(450)
        .atmosphereColor('#ffffff')
        .atmosphereAltitude(0.15)
        .onPolygonClick((feature) => {
          const country = countriesByCode.get(feature.properties.ISO_A3) ?? countriesByCode.get(feature.properties.ISO_A2)
          if (country) onSelectCountry(country)
        })
        .onLabelClick((country) => onSelectCountry(country))

      globe.pointOfView({ lat: 24, lng: 132, altitude: 2.25 }, 0)
      globeRef.current = globe

      const globeScene = globe.scene()

      // --- B. リサイズ監視 ---
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

      // --- C. MediaPipe ハンドトラッキングのセットアップ ---
      if (window.Hands && window.Camera) {
        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        })

        hands.onResults((results) => {
          const p = physics.current
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            p.isHandPresent = true
            const hand = results.multiHandLandmarks[0]
            const wrist = hand[0], indexBase = hand[5], middleBase = hand[9], pinkyBase = hand[17]

            // 拡縮
            let distSum = 0
            ;[4, 8, 12, 16, 20].forEach(tipIndex => {
              const tip = hand[tipIndex]
              const dx = tip.x - wrist.x, dy = tip.y - wrist.y, dz = tip.z - wrist.z
              distSum += Math.sqrt(dx*dx + dy*dy + dz*dz)
            })
            p.targetScale = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(distSum / 5, 0.1, 0.5, 0.5, 2.0), 0.4, 2.5)

            // 移動 (スケールに合わせて係数調整)
            p.targetPosition.x = (0.5 - middleBase.x) * 150
            p.targetPosition.y = (0.5 - middleBase.y) * 100

            // 回転
            const dirX = middleBase.x - wrist.x, dirY = middleBase.y - wrist.y
            p.targetRotation.z = -Math.atan2(dirY, dirX) - Math.PI / 2
            p.targetRotation.y = (pinkyBase.x - indexBase.x) * 5.0
            p.targetRotation.x = (wrist.y - middleBase.y) * 2.5 - 1.0

            globe.atmosphereColor('#2dd4bf') // ジェスチャー中はティール色に発光
            globe.atmosphereAltitude(0.25)
          } else {
            if (p.isHandPresent) {
              p.isHandPresent = false
              p.targetPosition.set(0, 0, 0)
              p.targetScale = 1.0
              globe.atmosphereColor('#ffffff')
              globe.atmosphereAltitude(0.15)
            }
          }
        })

        const cameraAI = new window.Camera(videoRef.current, {
          onFrame: async () => { if (videoRef.current) await hands.send({ image: videoRef.current }) },
          width: 640, height: 480
        })
        cameraAI.start()

        // カメラ停止用クリーンアップ関数を保持
        globeRef.current._cameraAI = cameraAI 
      }

      // --- D. 物理演算アニメーションループ ---
      const frict = 0.94
      const spring = 0.02

      const animatePhysics = () => {
        const p = physics.current
        if (!globeScene) return

        // 拡縮の補間
        p.currentScale = THREE.MathUtils.lerp(p.currentScale, p.targetScale, 0.1)
        globeScene.scale.set(p.currentScale, p.currentScale, p.currentScale)

        if (p.isHandPresent) {
          // 手がある場合：マウス操作を無効化して手に追従
          globe.controls().enabled = false

          p.velocityPosition.x = (p.targetPosition.x - p.currentPosition.x) * 0.15
          p.velocityPosition.y = (p.targetPosition.y - p.currentPosition.y) * 0.15
          
          p.currentRotation.x = THREE.MathUtils.lerp(p.currentRotation.x, p.targetRotation.x, 0.2)
          p.currentRotation.y = THREE.MathUtils.lerp(p.currentRotation.y, p.targetRotation.y, 0.2)
          p.currentRotation.z = THREE.MathUtils.lerp(p.currentRotation.z, p.targetRotation.z, 0.2)
        } else {
          // 手がない場合：マウス操作を有効化し、位置と回転をゆっくり元に戻す
          globe.controls().enabled = true
          
          p.velocityPosition.x += (0 - p.currentPosition.x) * spring
          p.velocityPosition.y += (0 - p.currentPosition.y) * spring
          p.velocityPosition.multiplyScalar(frict)

          // 回転はOrbitControlsに任せるため、シーン自体の傾きは0に戻す
          p.currentRotation.x = THREE.MathUtils.lerp(p.currentRotation.x, 0, 0.05)
          p.currentRotation.y = THREE.MathUtils.lerp(p.currentRotation.y, 0, 0.05)
          p.currentRotation.z = THREE.MathUtils.lerp(p.currentRotation.z, 0, 0.05)
        }

        p.currentPosition.add(p.velocityPosition)
        globeScene.position.copy(p.currentPosition)
        globeScene.rotation.copy(p.currentRotation)

        reqAnimFrameId.current = requestAnimationFrame(animatePhysics)
      }
      animatePhysics()

    }).catch(() => {
      if (!cancelled) setStatus('error')
    })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      cancelAnimationFrame(reqAnimFrameId.current)
      if (globeRef.current?._cameraAI) globeRef.current._cameraAI.stop()
      if (globeRef.current) globeRef.current._destructor()
      globeRef.current = null
      mountNode.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 初回のみ実行


  // ==========================================
  // 2. データ更新エフェクト（選択状況が変わるたびに実行）
  // ==========================================
  useEffect(() => {
    if (status !== 'ready' || !globeRef.current) return
    const globe = globeRef.current

    globe
      .polygonsData(countryPolygons)
      .polygonAltitude((feature) =>
        feature.properties.ISO_A3 === selectedCode || feature.properties.ISO_A2 === selectedCode ? 0.08 : 0.01
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
        const matched = countriesByCode.get(properties.ISO_A3) ?? countriesByCode.get(properties.ISO_A2)
        const population = matched?.population ?? properties.POP_EST
        return `<strong>${matched?.name.common ?? properties.ADMIN}</strong><br/>人口: ${population?.toLocaleString() ?? 'データなし'}人`
      })
      .labelsData(globeData)
      .labelLat((country) => country.lat)
      .labelLng((country) => country.lng)
      .labelText((country) => country.name.common)
      .labelSize((country) => country.labelSize)
      .labelDotRadius((country) => country.labelSize * 0.42)
      .labelColor(() => 'rgba(251, 191, 36, 0.88)')
      .labelResolution(2)

    // オートローテーションの制御（手がない時＆未選択時に回る）
    globe.controls().autoRotate = !selectedCountry && !physics.current.isHandPresent
    globe.controls().autoRotateSpeed = 0.35

  }, [selectedCode, countriesByCode, globeData, selectedCountry, status])


  // ==========================================
  // 3. カメラフォーカスエフェクト
  // ==========================================
  useEffect(() => {
    if (!selectedCountry?.latlng || status !== 'ready' || !globeRef.current) return
    globeRef.current.controls().autoRotate = false
    globeRef.current.pointOfView(
      { lat: selectedCountry.latlng[0], lng: selectedCountry.latlng[1], altitude: 1.65 },
      900
    )
  }, [selectedCountry, status])


  return (
    <section className="globe-shell" aria-label="世界地図ビュー">
      <div className="globe-stage" ref={containerRef} />
      {/* ハンドトラッキング用の非表示Video要素 */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline />
      
      {status === 'loading' && <p className="globe-status">地球儀を読み込み中...</p>}
      {status === 'error' && (
        <p className="globe-status">
          地球儀を読み込めませんでした。国リストはそのまま利用できます。
        </p>
      )}
      
      <div className="globe-caption">
        <span>{globeData.length}カ国をマッピング</span>
        <span>
          {physics.current.isHandPresent 
            ? '🖐️ ジェスチャー操作中...'
            : selectedCountry
              ? `${selectedCountry.name.common}をハイライト中・回転停止中`
              : '国をクリックしてハイライト'}
        </span>
      </div>
    </section>
  )
})

export default GlobeView