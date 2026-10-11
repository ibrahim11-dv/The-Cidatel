import { useEffect, useRef } from 'react'

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const returnFocus = useRef(null)
  useEffect(() => {
    returnFocus.current = document.activeElement
    dialogRef.current.showModal()
    return () => { returnFocus.current?.focus?.() }
  }, [])
  return <dialog ref={dialogRef} className="citadel-dialog" aria-labelledby="confirmation-title" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <p className="eyebrow">The Citadel</p><h2 id="confirmation-title">{title}</h2><p>{message}</p>
    <div className="dialog-actions"><button autoFocus className="quiet-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>
}
