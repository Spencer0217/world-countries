import { useEffect, useState } from 'react'
import countriesData from 'world-countries'
import countriesGeoJsonRaw from '../data/ne_110m_admin_0_countries.geojson?raw'

const API_URL =
  'https://restcountries.com/v3.1/all?fields=name,flags,population,capital,region,subregion,cca3,cca2,latlng,area,flag'

const sortByName = (countries) =>
  [...countries].sort((a, b) => a.name.common.localeCompare(b.name.common))

const countryFeatures = JSON.parse(countriesGeoJsonRaw).features
const populationByIsoA2 = new Map(
  countryFeatures.map((feature) => [feature.properties.ISO_A2, feature.properties.POP_EST])
)
const populationByIsoA3 = new Map(
  countryFeatures.map((feature) => [feature.properties.ISO_A3, feature.properties.POP_EST])
)

const fallbackCountries = sortByName(
  countriesData.map((c) => ({
    cca3: c.cca3,
    cca2: c.cca2,
    name: { common: c.name.common },
    flags: { png: `https://flagcdn.com/w320/${c.cca2.toLowerCase()}.png` },
    population: c.population ?? populationByIsoA3.get(c.cca3) ?? populationByIsoA2.get(c.cca2),
    capital: c.capital,
    region: c.region,
    subregion: c.subregion,
    area: c.area,
    flag: c.flag,
    latlng: c.latlng,
  }))
)

function useCountries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchCountries() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`)
        const data = await res.json()
        if (!cancelled) setCountries(sortByName(data))
      } catch (err) {
        if (!cancelled) {
          setCountries(fallbackCountries)
          setError(`${err.message}。ローカルデータで表示しています。`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCountries()

    return () => {
      cancelled = true
    }
  }, [])

  return { countries, loading, error }
}

export default useCountries
