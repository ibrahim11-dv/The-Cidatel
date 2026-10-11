import { useState } from 'react'

export function OnlinePage() {
  const [notice, setNotice] = useState('')
  function unavailable() {
    setNotice('Online play is not connected yet. This is the table layout your future games will use.')
  }

  return (
    <section className="online-page">
      <header className="page-heading"><p className="eyebrow">Correspondence room</p><h1>Play online</h1><p>The room is drawn; the wire is not yet connected.</p></header>
      <div className="online-layout">
        <article className="room-card">
          <span className="room-number">A</span>
          <h2>Open a table</h2>
          <p>Choose a side and invite a friend when online play is ready.</p>
          <div className="room-details"><span>Untimed</span><span>Private link</span></div>
          <button className="primary-button" type="button" onClick={unavailable}>Prepare table</button>
        </article>
        <article className="room-card">
          <span className="room-number">B</span>
          <h2>Join a table</h2>
          <p>Enter a room code shared by another player.</p>
          <label htmlFor="room-code">Room code</label>
          <input id="room-code" placeholder="e.g. WALNUT-48" disabled />
          <button className="quiet-button" type="button" onClick={unavailable}>Join room</button>
        </article>
      </div>
      <p className="availability-note" role="status">{notice || 'No players are connected. Multiplayer will appear here when the server is ready.'}</p>
    </section>
  )
}
