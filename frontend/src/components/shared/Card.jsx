/**
 * Componente Card compartido
 * Tarjeta reutilizable con variantes: normal, gradient, no-padding
 */

function Card({ 
    children, 
    variant = 'default',
    className = '',
    style = {},
    ...props 
}) {
    const baseClass = 'shared-card';
    const variantClass = variant !== 'default' ? `shared-card--${variant}` : '';
    
    return (
        <div 
            className={`${baseClass} ${variantClass} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
