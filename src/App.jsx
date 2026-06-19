import { useState, useMemo, useEffect } from 'react'
import useCountries from './hooks/useCountries'
import CountryCard from './components/CountryCard'
import GlobeView from './components/GlobeView'
import SearchBar from './components/SearchBar'
import FilterDropdown from './components/FilterDropdown'
import Header from './components/Header'
import { getFavorites, saveFavorites } from './utils/storage'
import './App.css'

function App() {
  const { countries, loading } = useCountries()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('すべて')
  const [darkMode, setDarkMode] = useState(false)
  const [favorites, setFavorites] = useState(getFavorites)
  const [showFav, setShowFav] = useState(false)
  const [focusedCountry, setFocusedCountry] = useState(null)

  // ダークモードをbodyに反映
  useEffect(() => {
    document.body.className = darkMode ? 'dark' : ''
  }, [darkMode])

  // お気に入りをlocalStorageに保存
  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const toggleFavorite = (country) => {
    setFavorites((prev) =>
      prev.some((f) => f.cca3 === country.cca3)
        ? prev.filter((f) => f.cca3 !== country.cca3)
        : [...prev, country]
    )
  }

  const isFavorite = (country) => favorites.some((f) => f.cca3 === country.cca3)

  const openCountryDetail = (country) => {
    setFocusedCountry(country)
    setSelected(country)
  }

  const filtered = useMemo(() => {
    const list = showFav ? favorites : countries
    return list.filter((country) => {
      const enName = country.name.common.toLowerCase()
      const jpName = country.translations?.ja?.common ?? ''
      const matchSearch = enName.includes(search.toLowerCase()) || jpName.includes(search)
      const matchRegion = region === 'すべて' || country.region === region
      return matchSearch && matchRegion
    })
  }, [countries, favorites, search, region, showFav])

  if (loading) return <p className="message">読み込み中...</p>
  if (selected) {
    return (
      <div className="container">
        <Header darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        <button className="back-btn" onClick={() => setSelected(null)}>
          ← 戻る
        </button>
        <div className="detail">
          <GlobeView
            countries={countries}
            selectedCountry={selected}
            onSelectCountry={setSelected}
          />
          <div className="detail-info">
            <img src={selected.flags.png} alt={selected.name.common} className="detail-flag" />
            <h2>{selected.translations?.ja?.common ?? selected.name.common}</h2>
            <p>
              <strong>人口：</strong>
              {selected.population?.toLocaleString() ?? 'データなし'}人
            </p>
            <p>
              <strong>首都：</strong>
              {selected.capital?.[0] ?? 'なし'}
            </p>
            <p>
              <strong>地域：</strong>
              {selected.region}
            </p>
            <p>
              <strong>サブ地域：</strong>
              {selected.subregion ?? 'なし'}
            </p>
            <p>
              <strong>面積：</strong>
              {selected.area?.toLocaleString() ?? 'データなし'} km²
            </p>
            <button className="fav-btn" onClick={() => toggleFavorite(selected)}>
              {isFavorite(selected) ? '⭐ お気に入り解除' : '☆ お気に入り登録'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />

      <main className="dashboard">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Interactive Globe</p>
            <h2>国データを地球儀から探索</h2>
            <p>国名検索、地域フィルター、お気に入りを使いながら、世界の国を視覚的にたどれます。</p>
            <div className="stats-row">
              <span>
                <strong>{countries.length}</strong>
                全データ
              </span>
              <span>
                <strong>{filtered.length}</strong>
                表示中
              </span>
              <span>
                <strong>{favorites.length}</strong>
                お気に入り
              </span>
            </div>
          </div>
          <GlobeView
            countries={filtered}
            selectedCountry={focusedCountry}
            onSelectCountry={setFocusedCountry}
          />
        </section>

        <section className="explorer-panel">
          <div className="controls">
            <SearchBar value={search} onChange={setSearch} />
            <FilterDropdown value={region} onChange={setRegion} />
            <button
              className={`fav-toggle ${showFav ? 'active' : ''}`}
              onClick={() => setShowFav(!showFav)}
            >
              ⭐ お気に入り（{favorites.length}）
            </button>
          </div>

          <p className="count">{filtered.length}カ国表示中</p>

          <div className="grid">
            {filtered.map((country) => (
              <CountryCard
                key={country.cca3}
                country={country}
                onClick={openCountryDetail}
                isFavorite={isFavorite(country)}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
