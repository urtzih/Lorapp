"""
Script para popular datos de Square Foot Gardening en las especies
"""
from app.infrastructure.database.base import engine
from sqlalchemy import text

square_foot_data = [
    ('Tomate', 1, 30, 'Requiere tutor. Variedad determinada puede ir a 30cm, indeterminada necesita espacio completo.'),
    ('Pimiento', 1, 30, 'Una planta por cuadrado. Necesita tutor en variedades altas.'),
    ('Lechuga', 4, 15, '4-9 plantas dependiendo del tamaño. Lechugas pequeñas hasta 9 por cuadrado.'),
    ('Espinaca', 9, 10, '9 plantas por cuadrado. Espaciado regular.'),
    ('Acelga', 4, 15, '4 plantas por cuadrado. Hojas grandes necesitan más espacio.'),
    ('Zanahoria', 16, 7.5, '16 por cuadrado en patrón 4x4. Siembra directa.'),
    ('Rábano', 16, 7.5, '16 por cuadrado. Crecimiento rápido.'),
    ('Rábanos', 16, 7.5, '16 por cuadrado. Crecimiento rápido.'),
    ('Cebolla', 9, 10, '9-16 plantas por cuadrado dependiendo del tamaño deseado.'),
    ('Ajo', 9, 10, '9 dientes por cuadrado. Espaciado regular.'),
    ('Judía', 9, 10, '8-9 plantas por cuadrado. Necesitan soporte vertical.'),
    ('Guisante', 8, 10, '8 plantas por cuadrado en dos hileras. Necesitan enrejado.'),
    ('Calabacín', 1, 30, '1 planta por cuadrado. Mejor cultivar verticalmente en enrejado.'),
    ('Pepino', 2, 21, '2 plantas por cuadrado si se cultiva en enrejado, 1 si crece horizontal.'),
    ('Berenjena', 1, 30, '1 planta por cuadrado. Necesita tutor.'),
    ('Maíz', 4, 15, '4 plantas por cuadrado. Plantar en bloques para mejor polinización.'),
    ('Albahaca', 4, 15, '4 plantas por cuadrado.'),
    ('Perejil', 4, 15, '4 plantas por cuadrado.'),
    ('Cilantro', 9, 10, '9 plantas por cuadrado.'),
    ('Rúcula', 16, 7.5, '16 plantas por cuadrado.'),
    ('Brócoli', 1, 30, '1 planta por cuadrado.'),
    ('Coliflor', 1, 30, '1 planta por cuadrado.'),
    ('Col', 1, 30, '1 planta por cuadrado.'),
    ('Calabaza', 1, 30, '1 planta por 2-4 cuadrados. Requiere mucho espacio.'),
    ('Melón', 1, 30, '1 planta por 2 cuadrados. Mejor en enrejado.'),
    ('Fresa', 4, 15, '4 plantas por cuadrado.'),
]

conn = engine.connect()
trans = conn.begin()
try:
    for nombre_comun, plantas, espaciado, notas in square_foot_data:
        result = conn.execute(
            text("""
                UPDATE especies 
                SET square_foot_plants = :plantas,
                    square_foot_spacing = :espaciado,
                    square_foot_notes = :notas
                WHERE nombre_comun = :nombre_comun
            """),
            {
                'plantas': plantas,
                'espaciado': espaciado,
                'notas': notas,
                'nombre_comun': nombre_comun
            }
        )
        if result.rowcount > 0:
            print(f'✓ Actualizado: {nombre_comun}')
        else:
            print(f'⚠ No encontrado: {nombre_comun}')
    trans.commit()
    print('\n✅ Datos de Square Foot Gardening actualizados exitosamente')
except Exception as e:
    trans.rollback()
    print(f'\n❌ Error: {e}')
finally:
    conn.close()
