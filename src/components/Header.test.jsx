import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Header from './Header'

describe('Header', () => {
  it('タイトルが表示される', () => {
    render(<Header darkMode={false} onToggle={() => {}} />)
    expect(screen.getByText('🌍 世界の国情報')).toBeInTheDocument()
  })

  it('ライトモードの時☀️ボタンが表示される', () => {
    render(<Header darkMode={false} onToggle={() => {}} />)
    expect(screen.getByText('🌙 ダーク')).toBeInTheDocument()
  })

  it('ダークモードの時🌙ボタンが表示される', () => {
    render(<Header darkMode={true} onToggle={() => {}} />)
    expect(screen.getByText('☀️ ライト')).toBeInTheDocument()
  })

  it('ボタンをクリックするとonToggleが呼ばれる', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<Header darkMode={false} onToggle={onToggle} />)
    await user.click(screen.getByText('🌙 ダーク'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
