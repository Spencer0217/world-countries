export function getFavorites() {
  const saved = localStorage.getItem('favorites')
  return saved ? JSON.parse(saved) : []
}

export function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites))
}
