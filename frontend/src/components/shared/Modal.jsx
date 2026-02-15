/**
 * Componente Modal compartido
 * Modal reutilizable para diálogos, confirmaciones, etc.
 */

import Button from './Button';

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
                {footer ? (
                    <div className="shared-modal__footer">
                        {footer}
                    </div>
                ) : (
                    <div className="shared-modal__footer">
                        <Button 
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={onClose}
                        >
                            Aceptar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
