from google import genai
from google.genai import types
from bs4 import BeautifulSoup
import json

def analizza_email(html_content, conf):
    api_key = conf.get('gemini_api_key', '')
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)

    soup = BeautifulSoup(html_content, 'html.parser')
    for s in soup(["script", "style"]):
        s.decompose()

    testo = soup.get_text(separator=' ', strip=True)

    prompt = f"""
    Analizza email immobiliare e restituisci JSON:
    - nome_cliente
    - telefono_cliente
    - email_cliente
    - portale
    - descrizione_immobile
    - sigla_consulente
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt + testo,
        config=types.GenerateContentConfig(response_mime_type='application/json')
    )

    return json.loads(response.text)