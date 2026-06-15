import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('入力欄が表示される', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('🔍 国名で検索...')).toBeInTheDocument()
  })

  it('文字を入力するとonChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    await user.type(screen.getByPlaceholderText('🔍 国名で検索...'), 'Japan')
    expect(onChange).toHaveBeenCalled()
  })
})
