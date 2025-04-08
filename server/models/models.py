from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class User(BaseModel):
    truck_id: str
    truck_number: str
    role: str = Field(default="user")

class RouteSegment(BaseModel):
    from_location: str
    to_location: str
    google_maps_url : str

class Route(BaseModel):
    truck_id: str  
    segments: List[RouteSegment]
    total_distance: float
    date: datetime
