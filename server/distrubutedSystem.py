import aiohttp
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn  # Importing uvicorn

# List of backend servers to handle requests in round-robin fashion
BACKEND_SERVERS = [
    "http://localhost:8085",
    "http://localhost:8086"
]

current_server_index = 0

# Round-robin proxy logic to forward the request to either 8085 or 8086
async def round_robin_proxy(request: Request, backend_servers):
    global current_server_index
    server_url = backend_servers[current_server_index]

    # Round-robin logic: get the next server
    current_server_index = (current_server_index + 1) % len(backend_servers)

    # Prepare the forward request
    async with aiohttp.ClientSession() as session:
        try:
            # Handle POST/PUT data properly
            body = await request.body() if request.method in ["POST", "PUT"] else None

            # Forward request to the selected backend server
            async with session.request(
                request.method,
                server_url + request.url.path,
                headers=request.headers,
                params=request.query_params,
                data=body if body else None,  # Use 'data' instead of 'json' for raw body content
            ) as resp:
                # Handle non-JSON responses
                try:
                    response_data = await resp.json()
                except Exception:
                    response_data = await resp.text()  # fallback to text if JSON parsing fails

                # Return the response from the backend server to the client
                return JSONResponse(status_code=resp.status, content=response_data)
        except Exception as e:
            # Handle errors like connection issues
            return JSONResponse(status_code=500, content={"detail": f"Error forwarding request: {str(e)}"})

# Create FastAPI app
app = FastAPI()

@app.middleware("http")
async def proxy_middleware(request: Request, call_next):
    # Apply round-robin proxy to requests to any route
    if request.url.path.startswith("/"):
        return await round_robin_proxy(request, BACKEND_SERVERS)  # pass the correct arguments here
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"message": "Proxy server is running!"}

# Run the app with uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
