import pymysql

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

try:
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT id, username, role FROM users")
        users = cur.fetchall()
        print("USERS LIST:")
        for u in users:
            print(f"ID: {u['id']} | Login: {u['username']} | Role: {u['role']}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
