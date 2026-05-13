import requests

def invia_whatsapp(config, to, template_name, lang_code, components):
    url = f"https://graph.facebook.com/v22.0/{config['pid']}/messages"

    headers = {
        "Authorization": f"Bearer {config['token']}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": lang_code},
            "components": components
        }
    }

    try:
        r = requests.post(url, headers=headers, json=payload)
        return r.status_code == 200, r.text
    except Exception as e:
        return False, str(e)