/**
 * Componente SearchBox compartido
 * Caja de búsqueda reutilizable
 */

function SearchBox({ 
    value, 
    onChange, 
    placeholder = '🔍 Buscar...',
    className = '',
    ...props 
}) {
    return (
        <div className={`shared-search ${className}`}>
            <input 
                type="text"
                className="shared-search__input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                {...props}
            />
        </div>
    );
}

export default SearchBox;
