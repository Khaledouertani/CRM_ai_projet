import pymysql

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

try:
    conn = get_db()
    with conn.cursor() as cur:
        # On supprime les anciens comptes de test pour nettoyer
        cur.execute("DELETE FROM users WHERE username IN ('service', 'qualite_boss')")
        # On crée un compte tout neuf
        sql = "INSERT INTO users (username, password, name, role, email) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, ("qualite_boss", "password123", "Chef Qualité", "qualite", "qualite@crm.fr"))
        conn.commit()
        print("NEW USER CREATED:")
        print("Login: qualite_boss")
        print("Password: password123")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
