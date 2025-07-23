# Optimized Route Planning for BigBasket Trucks

An efficient delivery route planner for logistics fleets, minimizing delivery effort and distance using greedy heuristics and a scalable system architecture.

## Overview
This project is designed to optimize delivery routes for BigBasket trucks, aiming to reduce total travel distance and improve delivery efficiency. The system uses a greedy heuristic algorithm to determine the most efficient path across multiple delivery destinations

The platform features a React Native mobile app for field use, a Python FastAPI backend, a MongoDB data layer, and a load-balanced two-server setup with real-time dashboards.

It combines graph algorithms, and optimization techniques to enhance delivery logistics at scale.

##  ✨ Features
- Greedy Route Optimization: Plans delivery order based on nearest unvisited destination to reduce total distance

- Multi-Drop Route Planning: Handles multiple delivery locations in a single trip

- React Native App: Mobile app for drivers to view routes and delivery sequence

- Interactive Dashboard: Visualizes completed trips, delivery stats, and last-traveled routes

- FastAPI Backend: Lightweight, high-performance REST API for route computation and trip tracking

- Round-Robin Load Balancing: Distributes load across two backend servers for better scalability

- MongoDB Storage: NoSQL database used to store delivery data, routes, and historical trip records

## 🛠️ Tech Stack
Frontend:

- React Native

- CSS / Styled Components

Backend:

- Python FastAPI

- RESTful API Design

- Round-robin load balancing

Database:

- MongoDB (NoSQL, used for delivery locations, routes, trip history)
- 
---
