import csv
import psycopg2

# Conexión
conn = psycopg2.connect(
    host='postgres',
    port=5432,
    database='lorapp',
    user='lorapp_user',
    password='lorapp_dev_password_123'
)

cur = conn.cursor()

# IMPORTANTE: Resetear secuencia antes de insertar
cur.execute("SELECT setval('especies_id_seq', (SELECT COALESCE(MAX(id), 0) FROM especies))")
print("🔄 Secuencia de IDs reseteada")

# Leer CSV
with open('/app/plants_sfg.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    imported = 0
    updated_sfg = 0
    
    for row in reader:
        name = row['name'].strip()
        if not name:
            continue
        
        # Verificar si existe
        cur.execute("SELECT id FROM especies WHERE nombre_comun = %s", (name,))
        result = cur.fetchone()
        
        if not result:
            # Insertar nueva especie
            try:
                cur.execute(
                    "INSERT INTO especies (nombre_comun, tipo_cultivo) VALUES (%s, %s) RETURNING id",
                    (name, 'SFG')
                )
                especie_id = cur.fetchone()[0]
                imported += 1
            except psycopg2.IntegrityError:
                # Ya existe, buscar de nuevo
                conn.rollback()
                cur.execute("SELECT id FROM especies WHERE nombre_comun = %s", (name,))
                especie_id = cur.fetchone()[0]
        else:
            especie_id = result[0]
        
        # Parsear datos SFG
        orig = int(row['sfgOriginal']) if row['sfgOriginal'].strip() else None
        multi = int(row['sfgMultisow']) if row['sfgMultisow'].strip() else None
        macizo = int(row['sfgMacizo']) if row['sfgMacizo'].strip() else None
        
        # Verificar si ya tiene datos SFG
        cur.execute("SELECT id FROM square_foot_gardening WHERE especie_id = %s", (especie_id,))
        if not cur.fetchone():
            # Insertar datos SFG
            if orig or multi or macizo:
                cur.execute(
                    "INSERT INTO square_foot_gardening (especie_id, plantas_original, plantas_multisow, plantas_macizo) VALUES (%s, %s, %s, %s)",
                    (especie_id, orig, multi, macizo)
                )
                updated_sfg += 1

conn.commit()

# Resumen
cur.execute("SELECT COUNT(*) FROM especies")
total = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM square_foot_gardening")
total_sfg = cur.fetchone()[0]

print(f"✅ IMPORTACIÓN COMPLETADA")
print(f"📥 Especies nuevas importadas: {imported}")
print(f"📊 Datos SFG añadidos: {updated_sfg}")
print(f"📈 Total especies en BD: {total}")
print(f"📈 Total con datos SFG: {total_sfg}")

cur.close()
conn.close()
