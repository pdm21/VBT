# backend/main.py

from fastapi import FastAPI
from device_manager import DV
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class RepsRequest(BaseModel):
    num_reps: int

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://150.209.48.222:3001",
        "http://192.168.0.100:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def test():
    return {"message": "Uvicorn server is live on port 8000"}

@app.post("/connect")
def connect_devices():
    try:
        DV.connect()  # Connect the devices
        connected_devices = DV.get_connected()
        print(f"Connected devices: {connected_devices}")
        return {"status": "success", "connected_devices": connected_devices}
    except Exception as e:
        print(f"Error while connecting devices: {e}") 
        return {"status": "error", "message": str(e)}

@app.post("/disconnect")
def disconnect_devices():
    try:
        DV.disconnect() 
        disconnected_devices = DV.get_disconnected()
        print(f"Disconnected devices: {disconnected_devices}")  
        return {"status": "success", "disconnected_devices": disconnected_devices}
    except Exception as e:
        print(f"Error while disconnecting devices: {e}") 
        return {"status": "error", "message": str(e)}
    
@app.post("/get_connected")
def get_connected_devices():
    try:
        connected_devices = DV.get_connected()  
        print(f"Connected devices: {connected_devices}") 
        return {"status": "success", "connected_devices": connected_devices}
    except Exception as e:
        print(f"Error while getting connected devices: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/do_reps")
def do_reps(request: RepsRequest):
    try:
        DV.do_reps(request.num_reps)
        print(f"Workout started with {request.num_reps} reps.") 
        return {"status": "success", "message": f"Workout started with {request.num_reps} reps."}
    except Exception as e:
        print(f"Error while setting reps: {e}") 
        return {"status": "error", "message": str(e)}