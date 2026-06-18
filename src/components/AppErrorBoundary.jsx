import { Component } from 'react'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="message error-fallback">
          <div>
            <h1>画面の読み込みでエラーが発生しました</h1>
            <p>
              ブラウザを再読み込みしてください。お気に入りデータが原因の場合は自動で復旧します。
            </p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
