# Data model for a coordinate point
from datetime import datetime
from typing import List
from pydantic import BaseModel

class Point(BaseModel):
    name: str
    lat: float
    lng: float

# Data model for route requests
class RouteRequest(BaseModel):
    truck_id:str
    algorithm: str 
    points: List[Point]

class LoginRequest(BaseModel):
    truck_id:str
    truck_number: str

class LoginResponse(BaseModel):
    success: bool
    token: str | None = None
    role:str | None = None

class RouteSegment(BaseModel):
    from_location: str
    to_location: str
    google_maps_url: str

class Route(BaseModel):
    truck_id: int
    segments: List[RouteSegment]
    total_distance: float
    date: datetime

class EachRoute(BaseModel):
    start: str
    end: str
    google_maps_url:str

class CombinedRoute(BaseModel):
    combine: List[EachRoute]
    total_distance: float
    date: datetime

class TruckResponse(BaseModel):
    success: bool
    truck_id: str
    truck_number: str   
    routes: List[CombinedRoute]

class TruckModel(BaseModel):
    truck_id: str
    truck_number: str

class AllTruckResponse(BaseModel):
    success: bool
    trucks: List[TruckModel]