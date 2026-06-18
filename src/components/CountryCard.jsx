import { memo } from 'react'

const CountryCard = memo(function CountryCard({ country, onClick, isFavorite, onFavorite }) {
  return (
    <article className="card" onClick={() => onClick(country)}>
      <div className="flag-frame">
        <img src={country.flags.png} alt={country.name.common} className="card-flag" />
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{country.name.common}</h3>
          <span>{country.flag}</span>
        </div>
        <p>
          <strong>人口：</strong>
          {country.population?.toLocaleString() ?? 'データなし'}人
        </p>
        <p>
          <strong>首都：</strong>
          {country.capital?.[0] ?? 'なし'}
        </p>
        <p>
          <strong>地域：</strong>
          {country.region ?? 'なし'}
        </p>
        <button
          aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
          className="fav-btn-small"
          onClick={(e) => {
            e.stopPropagation()
            onFavorite(country)
          }}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    </article>
  )
})

export default CountryCard
