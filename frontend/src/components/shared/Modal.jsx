/**
 * Componente Modal compartido
 * Modal reutilizable para diálogos, confirmaciones, etc.
 */

function Modal({ 
    isOpen, 
    onClose, 
    title,
    children, 
    footer = null,
    className = '',
    ...props 
}) {
    if (!isOpen) return null;
    
    return (
        <div className={`shared-modal__overlay ${className}`} {...props}>
            <div className="shared-modal__content">
                {title && (
                    <h2 className="shared-modal__header">{title}</h2>
                )}
                <div className="shared-modal__body">
                    {children}
                </div>
                {footer && (
                    <div className="shared-modal__footer">
                        {footer}
                    </div>
                )}
                <button 
                    className="shared-modal__close"
                    onClick={onClose}
                    title="Cerrar"
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export default Modal;
