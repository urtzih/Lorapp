# 🏗️ Arquitectura Profesional de LORAPP Frontend

## 📋 Índice
1. [Estructura de Carpetas](#estructura)
2. [Componentes Compartidos](#componentes)
3. [Sistema de Estilos](#estilos)
4. [Cómo Usar](#como-usar)
5. [Refactorización](#refactorización)

---

## <a name="estructura"></a>📂 Estructura de Carpetas

```
frontend/src/
├── components/
│   ├── shared/                 # 🔄 Componentes reutilizables
│   │   ├── Button.jsx          # Botón genérico
│   │   ├── Card.jsx            # Tarjeta/contenedor
│   │   ├── Modal.jsx           # Modal genérico
│   │   ├── Table.jsx           # Tabla con sorting
│   │   ├── SearchBox.jsx       # Caja de búsqueda
│   │   └── index.js            # Exportar todo
│   └── layout/                 # Componentes de layout
│
├── styles/
│   ├── index.css               # Global: variables CSS, base, utilities
│   ├── shared.css              # 🎨 Estilos de componentes compartidos
│   ├── Sfg.css                 # Estilos específicos de SFG page
│   ├── Inventory.css           # Estilos específicos de Inventario
│   ├── MyGarden.css            # Estilos específicos de Mi Huerto
│   └── CSVManager.css          # Estilos específicos de CSV
│
├── screens/                    # 📱 Páginas/pantallas
│   ├── Sfg.jsx                 # REFACTORIZADO ✅
│   ├── Inventory.jsx           # TODO: Refactorizar
│   ├── MyGarden.jsx            # TODO: Refactorizar
│   ├── Login.jsx               # TODO: Refactorizar
│   └── ...
```

---

## <a name="componentes"></a>🧩 Componentes Compartidos

### Button.jsx
```jsx
import Button from '@components/shared/Button';

// Usos:
<Button variant="primary" onClick={handleClick}>Guardar</Button>
<Button variant="secondary" size="small">Cancelar</Button>
<Button disabled>Deshabilitado</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' (default: 'primary')
- `size`: 'default' | 'small' (default: 'default')
- `disabled`: boolean
- `onClick`: function

---

### Card.jsx
```jsx
import Card from '@components/shared/Card';

// Usos:
<Card>Contenido simple</Card>
<Card variant="gradient">Con gradiente</Card>
<Card variant="no-padding">Sin padding</Card>
```

**Props:**
- `variant`: 'default' | 'gradient' | 'no-padding'
- `className`: string
- `style`: object

---

### Modal.jsx
```jsx
import Modal from '@components/shared/Modal';

<Modal 
    isOpen={isOpen} 
    onClose={handleClose}
    title="Agregar Nueva Planta"
>
    Contenido del modal
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `children`: ReactNode
- `footer`: ReactNode (custom footer)

---

### Table.jsx
```jsx
import Table from '@components/shared/Table';

const columns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: false, align: 'center' }
];

<Table 
    columns={columns}
    data={plantList}
    sortColumn={sortColumn}
    sortDirection={sortDirection}
    onColumnClick={handleSort}
/>
```

**Props:**
- `columns`: array of { key, label, sortable, align, render, gridColumn }
- `data`: array of objects
- `sortColumn`: string
- `sortDirection`: 'asc' | 'desc'
- `onColumnClick`: function(columnKey)

---

### SearchBox.jsx
```jsx
import SearchBox from '@components/shared/SearchBox';

<SearchBox 
    value={query} 
    onChange={setQuery}
    placeholder="Buscar plantas..."
/>
```

**Props:**
- `value`: string
- `onChange`: function(value)
- `placeholder`: string

---

## <a name="estilos"></a>🎨 Sistema de Estilos

### Estructura CSS (3 niveles)

#### 1️⃣ Global (`index.css`)
- Variables CSS (colores, espaciado, bordes, sombras)
- Reset y base
- Utilidades generales

#### 2️⃣ Componentes Compartidos (`shared.css`)
- `.shared-btn`, `.shared-card`, `.shared-modal`, etc.
- Usados por múltiples páginas
- Consistencia visual en toda la app

#### 3️⃣ Específico de Página (`Sfg.css`, `Inventory.css`)
- `.sfg-table`, `.sfg-details`, etc.
- Estilos únicos de cada pantalla
- Extienden estilos compartidos

### Variables CSS (en `index.css`)

```css
:root {
  /* Colores */
  --color-primary: #10b981;
  --color-success: #22c55e;
  --color-error: #ef4444;
  
  /* Espaciado (4px base) */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  
  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.08);
}
```

---

## <a name="como-usar"></a>✨ Cómo Usar

### Importar componentes
```jsx
import { Button, Card, Modal, Table, SearchBox } from '@/components/shared';
import '@/styles/shared.css';     // Estilos compartidos
import '@/styles/Sfg.css';        // Estilos específicos
```

### Ejemplo: Página SFG refactorizada
```jsx
import { Button, Card, Modal, SearchBox } from '@/components/shared';

function Sfg() {
    const [sortColumn, setSortColumn] = useState('nombre_comun');
    const [searchQuery, setSearchQuery] = useState('');
    
    return (
        <div className="sfg-container">
            {/* Header */}
            <div className="sfg-header">
                <h1 className="sfg-header__title">📐 Guía SFG</h1>
            </div>
            
            {/* Search */}
            <SearchBox value={searchQuery} onChange={setSearchQuery} />
            
            {/* Info Box */}
            <Card variant="gradient" className="sfg-info-box">
                <h2 className="sfg-info-box__title">Square Foot Gardening</h2>
            </Card>
            
            {/* Table */}
            <div className="sfg-table">
                {/* Contenido tabla */}
            </div>
            
            {/* FAB Button */}
            <button className="sfg-fab">+</button>
        </div>
    );
}
```

---

## <a name="refactorización"></a>🔄 Plan de Refactorización

### Fase 1: ✅ Completada
- ✅ Crear sistema CSS profesional (shared.css)
- ✅ Crear 5 componentes compartidos (Button, Card, Modal, Table, SearchBox)
- ✅ Crear estilos específicos para SFG.css

### Fase 2: 📋 TODO
- [ ] Refactorizar `Sfg.jsx` - usar componentes compartidos
- [ ] Refactorizar `Inventory.jsx` - crear Inventory.css
- [ ] Refactorizar `MyGarden.jsx` - crear MyGarden.css
- [ ] Refactorizar `MySeedling.jsx` - crear MySeedling.css
- [ ] Crear componentes específicos: `StatCard`, `PlantCard`
- [ ] Eliminar estilos inline de todas las páginas

### Beneficios
✨ **Consistencia Visual** - Mismo look & feel en toda la app
🎯 **Mantenibilidad** - Cambios globales en un archivo
⚡ **Performance** - Less repeating styles, better optimization
🔄 **Reusabilidad** - Los componentes se usan en múltiples páginas
📱 **Responsive** - Media queries centralizadas

---

## 📐 Guía de Estilos

### Convención de Clases CSS

```css
/* Componentes compartidos */
.shared-{component}__element--variant { }

/* Ejemplo */
.shared-btn__text--primary { }
.shared-table__header--sticky { }

/* Estilos específicos de página */
.{page}-{component}__element { }

/* Ejemplo */
.sfg-table__header { }
.inventory-card__title { }
```

### Espaciado

Siempre usar variables CSS:
```jsx
<div style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
    Contenido
</div>
```

Nunca:
```jsx
<div style={{ padding: '0.75rem', marginBottom: '1rem' }}>❌ MAL
```

---

## 🚀 Próximos Pasos

1. **Refactorizar páginas** - Usar componentes en lugar de estilos inline
2. **Crear más componentes** - FormInput, DatePicker, Tabs, etc.
3. **Temas** - Sistema de temas claro/oscuro
4. **Documentación** - Storybook para componentes

Este es un sistema profesional y escalable. 🎉
