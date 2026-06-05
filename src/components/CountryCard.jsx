import { memo } from 'react'

const CountryCard = memo(function CountryCard({
  country,
  onClick,
  isFavorite,
  onFavorite,
}) {
  return (
    <div className="card">
      <img
        src={country.flags.png}
        alt={country.name.common}
        className="card-flag"
        onClick={() => onClick(country)}
      />
      <div className="card-body">
        <h3 onClick={() => onClick(country)}>{country.name.common}</h3>
        <p><strong>人口：</strong>{country.population.toLocaleString()}人</p>
        <p><strong>首都：</strong>{country.capital?.[0] ?? 'なし'}</p>
        <p><strong>地域：</strong>{country.region}</p>
        <button
          className="fav-btn-small"
          onClick={(e) => {
            e.stopPropagation()
            onFavorite(country)
          }}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  )
})

export default CountryCard