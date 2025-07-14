from datetime import datetime
from services.db import draft_collection

def save_draft(topic: str, company: str, draft: str):
    draft_collection.update_one(
        {"topic": topic, "company": company},
        {
            "$set": {
                "draft": draft,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

def load_draft(topic: str, company: str):
    doc = draft_collection.find_one({"topic": topic, "company": company})
    return doc["draft"] if doc else None
