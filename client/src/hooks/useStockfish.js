import { useCallback, useEffect, useRef, useState } from 'react'
import { StockfishClient } from '../lib/stockfishClient'

export function useStockfish(enabled) {
  const clientRef = useRef(null)
  const [epoch, setEpoch] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!enabled) { setStatus('idle'); setError(''); return }
    const client = new StockfishClient({ onState: (state, message) => { setStatus(state); setError(message) } })
    clientRef.current = client
    return () => { client.dispose(); if (clientRef.current === client) clientRef.current = null }
  }, [enabled, epoch])
  const requestMove = useCallback((position, level) => clientRef.current?.request(position, level) || Promise.reject(new Error('Stockfish is still preparing.')), [])
  const cancelSearch = useCallback(() => clientRef.current?.cancel(), [])
  const restartEngine = useCallback(() => { clientRef.current?.dispose(); setEpoch((value) => value + 1) }, [])
  return { status, error, requestMove, cancelSearch, restartEngine }
}
