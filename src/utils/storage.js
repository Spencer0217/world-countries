export function getFavorites() {
  try {
    const saved = localStorage.getItem('favorites')
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed.filter((country) => country?.cca3) : []
  } catch {
    localStorage.removeItem('favorites')
    return []
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  } catch {
    // 保存できない環境でも閲覧機能は継続する。
  }
}
