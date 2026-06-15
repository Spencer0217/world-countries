import { getFavorites, saveFavorites } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('空の時は空配列を返す', () => {
    expect(getFavorites()).toEqual([])
  })

  it('保存したお気に入りを読み込める', () => {
    const favorites = [{ cca3: 'JPN', name: { common: 'Japan' } }]
    saveFavorites(favorites)
    expect(getFavorites()).toEqual(favorites)
  })
})
