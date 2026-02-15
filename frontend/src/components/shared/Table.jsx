/**
 * Componente Table compartido
 * Tabla profesional con columnas, sorting, y filas expandibles
 */

function Table({ 
    columns = [],
    data = [],
    onColumnClick = null,
    sortColumn = null,
    sortDirection = 'asc',
    renderRow = null,
    rowKey = 'id',
    className = '',
    ...props 
}) {
    const renderHeader = () => {
        return (
            <div className="shared-table__header">
                {columns.map((col) => (
                    <div 
                        key={col.key}
                        className="shared-table__header-cell"
                        style={{
                            gridColumn: col.gridColumn,
                            textAlign: col.align || 'left',
                            cursor: col.sortable ? 'pointer' : 'default'
                        }}
                        onClick={() => col.sortable && onColumnClick && onColumnClick(col.key)}
                    >
                        <span>{col.label}</span>
                        {col.sortable && sortColumn === col.key && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    };
    
    const renderBody = () => {
        return data.map((row, index) => (
            <div key={row[rowKey] || index}>
                {renderRow ? (
                    renderRow(row, index)
                ) : (
                    <div className="shared-table__row" style={{ alignItems: 'center' }}>
                        {columns.map((col) => (
                            <div 
                                key={col.key}
                                className="shared-table__cell"
                                style={{
                                    gridColumn: col.gridColumn,
                                    textAlign: col.align || 'left'
                                }}
                            >
                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };
    
    return (
        <div className={`shared-table ${className}`} {...props}>
            {renderHeader()}
            <div className="shared-table__body">
                {data.length === 0 ? (
                    <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-gray)' }}>
                        No hay datos para mostrar
                    </div>
                ) : (
                    renderBody()
                )}
            </div>
        </div>
    );
}

export default Table;
