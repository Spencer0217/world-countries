import { useState, useEffect } from 'react'

function useCountries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,population,capital,region,cca3')
        if (!res.ok) throw new Error('データ取得に失敗しました')
        const data = await res.json()
        // 国名アルファベット順に並び替え
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        )
        setCountries(sorted)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCountries()
  }, [])

  return { countries, loading, error }
}

export default useCountries
