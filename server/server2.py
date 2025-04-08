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
from adsa import tsp_nearest_neighbor,build_cost_matrix
from utils.fmodels import Point, RouteRequest, LoginRequest, LoginResponse, RouteSegment, TruckResponse, EachRoute, CombinedRoute, AllTruckResponse,TruckModel
from utils.externalapi import get_osrm_route_geometry, fetch_nearby_pois
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
    "http://localhost:27017"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        truck = users_collection.find_one({"truck_id": request.truck_id})  
        if not truck:
            raise HTTPException(status_code=401, detail="Invalid Truck ID or Truck Number")
        
        if "truck_number" not in truck or truck["truck_number"] != request.truck_number:
            raise HTTPException(status_code=401, detail="Invalid Truck ID or Truck Number")
        
        role = truck.get("role", "user")

        return LoginResponse(success=True, token=request.truck_id,role = role)
    
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
    
@app.get("/admin/get-all-trucks/", response_model=AllTruckResponse)
async def get_all_trucks():
    try:
        trucks_data = list(users_collection.find({"role": "user"}, {"_id": 0, "truck_id": 1, "truck_number": 1}).sort({"truck_id":1}))
        
        trucks = [TruckModel(**truck) for truck in trucks_data]

        return AllTruckResponse(success= True, trucks=trucks)
    
    except Exception as e:
        print(str(e))  # Print for debugging
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/admin/add-truck")
async def add_truck(request: dict):
    try:
        truck_id = request.get("truck_id")
        truck_number = request.get("truck_number")

        if not truck_id or not truck_number:
            raise HTTPException(status_code=400, detail="Invalid Request")

        user_data = {
            "truck_id": truck_id,
            "truck_number": truck_number,
            "role":"user"
        }
        users_collection.insert_one(user_data)

        return {"message": "Truck added successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/admin/get-truck-details/{truck_id}", response_model=TruckResponse)
async def get_truck_details(truck_id: str):
    try:
        if not truck_id:
            raise HTTPException(status_code=401, detail="No truck Id found")
        
        truck = users_collection.find_one({"truck_id": truck_id})
        
        if not truck:
            return TruckResponse(success=False, truck_id="", truck_number="", routes=[])

        recent_travels = list(routes_collection.find({"truck_id": truck_id}).sort("date", -1).limit(0))

        if not recent_travels:
            return TruckResponse(success=True, truck_id=truck["truck_id"], truck_number=truck["truck_number"], routes=[])

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
    uvicorn.run("server:app",port=8086, host="0.0.0.0",reload=True)
