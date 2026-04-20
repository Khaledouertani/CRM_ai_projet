import pymysql

def alter_db():
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia'
    )
    cursor = conn.cursor()
    columns_to_add = [
        "ADD COLUMN appointment_date VARCHAR(255) DEFAULT ''",
        "ADD COLUMN appointment_confidence INT DEFAULT 0",
        "ADD COLUMN score_ecoute INT DEFAULT 0",
        "ADD COLUMN score_persuasion INT DEFAULT 0",
        "ADD COLUMN score_empathie INT DEFAULT 0",
        "ADD COLUMN score_argumentation INT DEFAULT 0",
        "ADD COLUMN score_refus INT DEFAULT 0",
        "ADD COLUMN score_vente INT DEFAULT 0"
    ]
    
    for col in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE calls {col}")
            print(f"Executed: {col}")
        except pymysql.err.OperationalError as e:
            # Code 1060: Duplicate column name
            if e.args[0] == 1060:
                print(f"Skipped (already exists): {col}")
            else:
                print(f"Error: {e}")
        except Exception as e:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    alter_db()
