from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

init_db()

app = FastAPI()

# Permette al frontend React di parlare col backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "backend online"}

@app.get("/stats")
def get_stats():
    leads = get_leads()

    return {
        "total_leads": len(leads),
        "new_leads": len([l for l in leads if l.get("status") == "New"]),
        "contacted_leads": len([l for l in leads if l.get("status") == "Sent"]),
        "pending_leads": len([l for l in leads if l.get("status") == "Pending"]),

        "per_source": [
            {"source": "Idealista", "count": len([l for l in leads if l.get("portal") == "Idealista"])},
            {"source": "Immobiliare", "count": len([l for l in leads if l.get("portal") == "Immobiliare"])}
        ],

        "per_agent": [
            {"agent": "MR01", "count": len([l for l in leads if l.get("agent") == "MR01"])}
        ],

        "recent_activity": [
            {
                "type": "Lead importato",
                "detail": l["name"],
                "timestamp": "2026-05-14T10:00:00"
            }
            for l in leads
        ]
    }

from database import SessionLocal, Lead

@app.get("/leads")
def get_leads():
    db = SessionLocal()
    leads = db.query(Lead).all()

    return [
        {
            "id": l.id,
            "name": l.name,
            "phone": l.phone,
            "email": l.email,
            "portal": l.portal,
            "property": l.property,
            "agent": l.agent,
            "status": l.status,
            "created_at": l.created_at
        }
        for l in leads
    ]

from pydantic import BaseModel
from database import SessionLocal, Lead

class LeadIn(BaseModel):
    name: str
    phone: str
    email: str
    portal: str
    property: str
    agent: str


@app.post("/leads")
def create_lead(lead: LeadIn):
    db = SessionLocal()

    new_lead = Lead(**lead.dict())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return {"success": True, "id": new_lead.id}


from scanner import scan_emails

@app.post("/scan")
def scan():
    config = carica_config()
    leads = scan_emails(config)

    return {
        "success": True,
        "new_leads": len(leads)
    }

@app.get("/agents")
def get_agents():
    return [
        {
            "id": "MR01",
            "name": "Mario Rossi",
            "phone": "+393331234567",
            "active": True
        }
    ]