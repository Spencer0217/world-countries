import { useState, useMemo, useEffect } from 'react'
import useCountries from './hooks/useCountries'
import CountryCard from './components/CountryCard'
import SearchBar from './components/SearchBar'
import FilterDropdown from './components/FilterDropdown'
import Header from './components/Header'
import { getFavorites, saveFavorites } from './utils/storage'
import './App.css'

function App() {
  const { countries, loading, error } = useCountries()
  const [selected, setSelected]   = useState(null)
  const [search, setSearch]       = useState('')
  const [region, setRegion]       = useState('すべて')
  const [darkMode, setDarkMode]   = useState(false)
  const [favorites, setFavorites] = useState(getFavorites)
  const [showFav, setShowFav]     = useState(false)

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

  const isFavorite = (country) =>
    favorites.some((f) => f.cca3 === country.cca3)

  const filtered = useMemo(() => {
    const list = showFav ? favorites : countries
    return list.filter((country) => {
      const matchSearch = country.name.common
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchRegion =
        region === 'すべて' || country.region === region
      return matchSearch && matchRegion
    })
  }, [countries, favorites, search, region, showFav])

  if (loading) return <p className="message">読み込み中...</p>
  if (error)   return <p className="message">エラー：{error}</p>

  if (selected) {
    return (
      <div className="container">
        <Header darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        <button className="back-btn" onClick={() => setSelected(null)}>
          ← 戻る
        </button>
        <div className="detail">
          <img
            src={selected.flags.png}
            alt={selected.name.common}
            className="detail-flag"
          />
          <div className="detail-info">
            <h2>{selected.name.common}</h2>
            <p><strong>人口：</strong>{selected.population.toLocaleString()}人</p>
            <p><strong>首都：</strong>{selected.capital?.[0] ?? 'なし'}</p>
            <p><strong>地域：</strong>{selected.region}</p>
            <button
              className="fav-btn"
              onClick={() => toggleFavorite(selected)}
            >
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
            onClick={setSelected}
            isFavorite={isFavorite(country)}
            onFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  )
}

export default App