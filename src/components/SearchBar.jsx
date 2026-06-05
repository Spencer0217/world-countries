import { memo } from 'react'

const SearchBar = memo(function SearchBar({ value, onChange }) {
  return (
    <input
      className="search-input"
      type="text"
      placeholder="🔍 国名で検索..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
})

export default SearchBar
