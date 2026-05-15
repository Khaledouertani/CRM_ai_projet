import requests

def llama_generate(prompt: str):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma3:4b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 150  # 
                }
            },
            timeout=120   # 
        )

        data = response.json()

        return data.get("response", "").strip()

    except Exception as e:
        return " Le modèle est lent, réessayez."