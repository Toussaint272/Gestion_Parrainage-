export default function Modal({ titre, children, onClose, large = false }) {
  return (
    <div className="modal-voile" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${large ? 'modal-large' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-entete">
          <h3>{titre}</h3>
          <button className="fermer" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="modal-corps">{children}</div>
      </div>
    </div>
  );
}
