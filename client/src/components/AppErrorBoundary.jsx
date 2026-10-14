import { Component } from 'react'

export class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <main className="app-error" role="alert"><p className="eyebrow">The table needs a reset</p><h1>We could not open this view.</h1><p>Your saved games and account remain available. Reload the club room to continue.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload The Citadel</button></main>
    }
    return this.props.children
  }
}
