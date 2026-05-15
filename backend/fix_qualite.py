import pymysql

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

try:
    conn = get_db()
    with conn.cursor() as cur:
        # Nettoyage des logins (suppression des espaces)
        cur.execute("UPDATE users SET username = TRIM(username)")
        # On s'assure que le compte 'qualite' a un mot de passe connu pour le test
        # Je vais mettre 'qualite123' pour que l'utilisateur puisse tester
        cur.execute("UPDATE users SET password = %s WHERE username = %s", ("qualite123", "service"))
        conn.commit()
        print("User 'service' updated. Password set to: qualite123 (without spaces)")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
