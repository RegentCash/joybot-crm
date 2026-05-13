import imaplib, email, json
from ai import analizza_email
from database import SessionLocal, Lead

def scan_emails(config):
    mail = imaplib.IMAP4_SSL(config['imap'], int(config['port']))
    mail.login(config['email'], config['password'])
    mail.select('inbox')

    typ, data = mail.search(None, '(UNSEEN)')
    ids = data[0].split()

    new_leads = []

    for num in ids:
        _, msg_data = mail.fetch(num, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])

        html = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    html = part.get_payload(decode=True).decode(errors="ignore")
        else:
            html = msg.get_payload(decode=True).decode(errors="ignore")

        if not html:
            continue

        d = analizza_email(html, config)

        if not d:
            continue

        db = SessionLocal()

        lead = Lead(
            name=d.get("nome_cliente", "cliente"),
            phone=d.get("telefono_cliente"),
            email=d.get("email_cliente"),
            portal=d.get("portale"),
            property=d.get("descrizione_immobile"),
            agent=d.get("sigla_consulente"),
            status="New"
        )

        db.add(lead)
        db.commit()
        db.refresh(lead)

        new_leads.append(d)

    mail.logout()
    return new_leads