# backend/main.py

from fastapi import FastAPI
from device_manager import DV

app = FastAPI()

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
