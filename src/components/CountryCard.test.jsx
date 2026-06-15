import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CountryCard from './CountryCard'

const mockCountry = {
  cca3: 'JPN',
  name: { common: 'Japan' },
  flags: { png: 'japan-flag.png' },
  population: 125000000,
  capital: ['Tokyo'],
  region: 'Asia',
}

describe('CountryCard', () => {
  it('国名が表示される', () => {
    render(<CountryCard country={mockCountry} onClick={() => {}} isFavorite={false} onFavorite={() => {}} />)
    expect(screen.getByText('Japan')).toBeInTheDocument()
  })

  it('首都が表示される', () => {
    render(<CountryCard country={mockCountry} onClick={() => {}} isFavorite={false} onFavorite={() => {}} />)
    expect(screen.getByText(/Tokyo/)).toBeInTheDocument()
  })

  it('お気に入り未登録なら☆が表示される', () => {
    render(<CountryCard country={mockCountry} onClick={() => {}} isFavorite={false} onFavorite={() => {}} />)
    expect(screen.getByText('☆')).toBeInTheDocument()
  })

  it('お気に入り登録済みなら⭐が表示される', () => {
    render(<CountryCard country={mockCountry} onClick={() => {}} isFavorite={true} onFavorite={() => {}} />)
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  it('☆ボタンをクリックするとonFavoriteが呼ばれる', async () => {
    const user = userEvent.setup()
    const onFavorite = vi.fn()
    render(<CountryCard country={mockCountry} onClick={() => {}} isFavorite={false} onFavorite={onFavorite} />)
    await user.click(screen.getByText('☆'))
    expect(onFavorite).toHaveBeenCalledTimes(1)
  })
})
