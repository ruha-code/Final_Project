from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict



class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    action_key: Optional[str] = None
    action_label: Optional[str] = None
    entity_type: Optional[str]
    entity_id: Optional[int]
    target_label: Optional[str] = None
    actor_name: Optional[str] = None
    actor_username: Optional[str] = None
    actor_role: Optional[str] = None
    extra_data: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
