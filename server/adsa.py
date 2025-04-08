import math
from typing import List
from pydantic import BaseModel

class Point(BaseModel):
    name: str
    lat: float
    lng: float

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

# ADSA: Build cost matrix for TSP 
def build_cost_matrix(points: List[Point]):
    n = len(points)
    cost_matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                cost_matrix[i][j] = haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
    return cost_matrix

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