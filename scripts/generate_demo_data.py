import pymysql
import sys, os
from datetime import datetime, timedelta
import random

# Ajout du chemin pour importer models
sys.path.append(os.path.abspath('.'))
from models.database import get_connection

def generate():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Liste de codes postaux de test (divers départements)
            test_data = [
                ("75001", "Paris - Centre"),
                ("75015", "Paris - 15ème"),
                ("33000", "Bordeaux"),
                ("13001", "Marseille"),
                ("69002", "Lyon"),
                ("06000", "Nice"),
                ("31000", "Toulouse"),
                ("44000", "Nantes"),
                ("59000", "Lille"),
                ("67000", "Strasbourg")
            ]
            
            agents = ["Agent_Test_1", "Agent_Test_2"]
            sentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"]
            
            print("Génération de 10 appels de test avec codes postaux...")
            
            for cp, city in test_data:
                agent = random.choice(agents)
                agent_id = agent.lower().replace(" ", "_")
                sentiment = random.choice(sentiments)
                score = random.randint(50, 95)
                
                # S'assurer que l'agent existe
                cursor.execute("SELECT id FROM agents WHERE agent_id = %s", (agent_id,))
                if not cursor.fetchone():
                    cursor.execute("INSERT INTO agents (agent_id, name, created_at) VALUES (%s, %s, NOW())", (agent_id, agent))
                
                # Insérer l'appel
                cursor.execute("""
                    INSERT INTO calls (
                        agent_id, agent_name, audio_file, transcription, sentiment, 
                        sentiment_score, score_percentage, performance, summary, 
                        problem, postal_code, script_respected, customer_intent, 
                        objections_handled, agent_politeness, next_steps, call_date, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    agent_id, agent, "test_audio.mp3", f"Appel de test pour la ville de {city}", 
                    sentiment, score/100, score, "Bonne", f"Résumé test {city}", 
                    "Information de test", cp, 1, "Renseignement", 1, 8, "Aucune", 
                    (datetime.now() - timedelta(hours=random.randint(1, 48))).strftime("%Y-%m-%d %H:%M:%S")
                ))
            
            conn.commit()
            print(" 10 appels de test ajoutés avec succès !")
    except Exception as e:
        print(f" Erreur lors de la génération : {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    generate()
