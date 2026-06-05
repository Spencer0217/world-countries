import { memo } from 'react'

const REGIONS = ['すべて', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

const FilterDropdown = memo(function FilterDropdown({ value, onChange }) {
  return (
    <select
      className="filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {REGIONS.map((region) => (
        <option key={region} value={region}>
          {region}
        </option>
      ))}
    </select>
  )
})

export default FilterDropdown
