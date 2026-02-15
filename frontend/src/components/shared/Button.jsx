/**
 * Componente Button compartido
 * Botón reutilizable con variantes: primary, secondary, small, disabled
 */

function Button({ 
    onClick, 
    children, 
    variant = 'primary', 
    size = 'default',
    disabled = false,
    className = '',
    ...props 
}) {
    const baseClass = 'shared-btn';
    const variantClass = `shared-btn--${variant}`;
    const sizeClass = size !== 'default' ? `shared-btn--${size}` : '';
    
    return (
        <button 
            className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
