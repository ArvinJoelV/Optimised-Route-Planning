from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import math
import requests
import uvicorn
from pymongo import MongoClient
from models.models import User, Route
import os
from datetime import date, datetime
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.getenv("MONGO_URL")


MONGO_URL = mongo_url
client = MongoClient(MONGO_URL)
db = client.truck_db
users_collection = db.users
routes_collection = db.routes

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data model for a coordinate point
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

OVERPASS_URL = "http://overpass-api.de/api/interpreter"

# Helper: Haversine formula (in kilometers)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# ADSA: Nearest Neighbor TSP approximation for the "shortest" route (using straight-line distances)
def tsp_nearest_neighbor(points: List[Point]):
    n = len(points)
    if n == 0:
        return [], 0.0

    visited = [False] * n
    route = [0]  
    visited[0] = True
    total_distance = 0.0
    current = 0

    for _ in range(n - 1):
        next_index = None
        min_dist = float("inf")
        for i in range(n):
            if not visited[i]:
                d = haversine(points[current].lat, points[current].lng, points[i].lat, points[i].lng)
                if d < min_dist:
                    min_dist = d
                    next_index = i
        if next_index is None:
            break
        route.append(next_index)
        visited[next_index] = True
        total_distance += min_dist
        current = next_index

    total_distance += haversine(points[current].lat, points[current].lng, points[0].lat, points[0].lng)
    route.append(0)
    return route, total_distance

def get_osrm_route_geometry(start: Point, end: Point):
    url = f"http://router.project-osrm.org/route/v1/driving/{start.lng},{start.lat};{end.lng},{end.lat}?overview=full&geometries=geojson"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == "Ok":
            return data["routes"][0]["geometry"]
        else:
            raise HTTPException(status_code=500, detail="OSRM error: " + data.get("message", "Unknown error"))
    else:
        raise HTTPException(status_code=response.status_code, detail="OSRM API request failed")

async def fetch_nearby_pois(route_geometry, poi_type: str):
    query = "[out:json];("
    coordinates = route_geometry["coordinates"]
    sampling_interval = max(1,len(coordinates) // 100)

    for i in range(0, len(coordinates), sampling_interval): 
        lon, lat = coordinates[i]
        query += f'node(around:500,{lat},{lon})["amenity"="{poi_type}"];'  

    query += ");out body;"
    url = f"{OVERPASS_URL}?data={query}"

    async with aiohttp.ClientSession() as session:
        await asyncio.sleep(1) 
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                return [
                    {
                        "lat": poi["lat"],
                        "lng": poi["lon"],
                        "brand": poi["tags"].get("brand", poi["tags"].get("name"))
                    }
                    for poi in data.get("elements", []) if "brand" in poi["tags"] or "name" in poi["tags"]
                ]

    return []

@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        truck = users_collection.find_one({"truck_id": request.truck_id})  

        if not truck:
            raise HTTPException(status_code=401, detail="Invalid Truck ID or Truck Number")
        
        if "truck_number" not in truck or truck["truck_number"] != request.truck_number:
            raise HTTPException(status_code=401, detail="Invalid Truck ID or Truck Number")

        return LoginResponse(success=True, token=request.truck_id)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/calculate-route/")
async def calculate_route(request: RouteRequest):
    print("Let me calculate")
    if len(request.points) < 2:
        raise HTTPException(status_code=400, detail="At least two points are required.")

    if request.algorithm == "shortest":
        route_indices, approx_distance = tsp_nearest_neighbor(request.points)
        ordered_points = [request.points[i] for i in route_indices]

        full_coords = []
        for i in range(len(ordered_points) - 1):
            geometry = get_osrm_route_geometry(ordered_points[i], ordered_points[i + 1])
            coords = geometry["coordinates"]
            if full_coords and full_coords[-1] == coords[0]:
                full_coords.extend(coords[1:])
            else:
                full_coords.extend(coords)

        route_geometry = {
            "type": "LineString",
            "coordinates": full_coords
        }

        # Generate Google Maps Links for Each Segment (No Round Trip)
        segment_links = []
        route_segments =[]
        for i in range(len(ordered_points) - 1):
            segment_url = f"https://www.google.com/maps/dir/?api=1&origin={ordered_points[i].lat},{ordered_points[i].lng}&destination={ordered_points[i + 1].lat},{ordered_points[i + 1].lng}&travelmode=driving"
            segment_links.append({
                "from": ordered_points[i].name,
                "to": ordered_points[i + 1].name,
                "google_maps_url": segment_url
            })
            route_segments.append(RouteSegment(
                from_location=ordered_points[i].name,
                to_location=ordered_points[i + 1].name,
                google_maps_url=segment_url
            ))

        restaurants, petrol_bunks = await asyncio.gather(
            fetch_nearby_pois(route_geometry, "restaurant"),
            fetch_nearby_pois(route_geometry, "fuel")
        )


        today = date.today()

        route_data = {
            "truck_id": request.truck_id,
            "segments": [segment.dict() for segment in route_segments],
            "total_distance": approx_distance,
            "date": datetime.now()
        }
        routes_collection.insert_one(route_data)

        return {
            "algorithm": request.algorithm,
            "approx_distance": approx_distance,
            "route_order": ordered_points,
            "route_geometry": route_geometry,
            "segment_links": segment_links,
            "stops":request.points,
            "petrol_bunks": petrol_bunks,
            "restaurants": restaurants
        }
    else:
        raise HTTPException(status_code=400, detail="Unsupported algorithm")

@app.get("/get-truck-details/{truck_id}", response_model=TruckResponse)
async def get_truck_details(truck_id: str):
    try:
        if not truck_id:
            raise HTTPException(status_code=401, detail="No truck Id found")
        
        truck = users_collection.find_one({"truck_id": truck_id})
        
        if not truck:
            return TruckResponse(success=False, truck_id="", truck_number="", routes=[])

        recent_travels = list(routes_collection.find({"truck_id": truck_id}).sort("date", -1).limit(5))

        if not recent_travels:
            return TruckResponse(success=True, truck_id=truck["truck_id"], truck_number=truck["truck_number"], routes=[])

        # Convert recent_travels to a list of CombinedRoute instances
        formatted_routes = []
        for travel in recent_travels:
            if "segments" in travel and isinstance(travel["segments"],list):
                segment_routes = []
                for i in travel["segments"]:
                    segment_routes.append(EachRoute(start = i["from_location"],end = i["to_location"],google_maps_url=i["google_maps_url"]))
                
                formatted_routes.append(CombinedRoute(combine=segment_routes,total_distance = travel["total_distance"],date = travel["date"]))

        return TruckResponse(
            success=True,
            truck_id=truck["truck_id"],
            truck_number=truck["truck_number"],
            routes=formatted_routes
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Route Optimization API with OSRM directions is running!"}


if __name__=="__main__":
    uvicorn.run("server:app",port=8080, host="0.0.0.0",reload=True)
