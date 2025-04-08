from utils.fmodels import Point, RouteRequest, LoginRequest, LoginResponse, RouteSegment, TruckResponse, EachRoute, CombinedRoute
import requests
import aiohttp
import asyncio
from fastapi import FastAPI, HTTPException


OVERPASS_URL = "http://overpass-api.de/api/interpreter"

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