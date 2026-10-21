from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import AuditLog

def log_action(
    db: Session,
    user_name: str,
    action: str,
    run_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None
) -> AuditLog:
    """
    Records immutable audit log entries for all user actions, overrides, approvals, and configuration changes.
    """
    entry = AuditLog(
        user_name=user_name,
        action=action,
        run_id=run_id,
        entity_type=entity_type,
        old_value=old_value,
        new_value=new_value,
        reason=reason
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
