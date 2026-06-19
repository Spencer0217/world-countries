import { memo } from 'react'

const CountryCard = memo(function CountryCard({ country, onClick, isFavorite, onFavorite }) {
  const jpName = country.translations?.ja?.common ?? country.name.common

  return (
    <article className="card" onClick={() => onClick(country)}>
      <div className="flag-frame">
        {/* alt属性（画像の説明）も日本語にしておくと親切です */}
        <img src={country.flags.png} alt={jpName} className="card-flag" />
      </div>
      <div className="card-body">
        <div className="card-title-row">
          {/* ★ 取得した日本語名を表示 */}
          <h3>{jpName}</h3>
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
