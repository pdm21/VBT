# backend/main.py

from fastapi import FastAPI
from device_manager import DV
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import signal
import subprocess

class RepsRequest(BaseModel):
    num_reps: int

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://192.168.0.100:3001",
        "http://192.168.0.*:3001",
        "*",
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
    
@app.post("/stop")
def stop():
    try:
        DV.stop()  
        print("Workout stopped.") 
        return {"status": "success", "message": "Workout stopped."}
    except Exception as e:
        print(f"Error while stopping workout: {e}") 
        return {"status": "error", "message": str(e)}
    
@app.post("/clear_csvs")
def clear_csvs():
    try:
        DV.clear_csvs()  
        print("CSV files cleared.") 
        return {"status": "success", "message": "CSV files cleared."}
    except Exception as e:
        print(f"Error while clearing CSV files: {e}") 
        return {"status": "error", "message": str(e)}

@app.post("/shutdown")
def shutdown():
    try:
        # First disconnect all devices
        DV.disconnect()
        
        # Start a background thread to handle the actual shutdown
        def delayed_shutdown():
            import time
            time.sleep(1)  # Give time for response to be sent
            
            # Kill the Node.js server first
            try:
                if os.name == 'nt':  # Windows
                    cmd = f'netstat -ano | findstr :3001'
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    if result.stdout:
                        pid = result.stdout.strip().split()[-1]
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True)
                else:  # Unix/Linux/MacOS
                    cmd = f"lsof -ti:3001"
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    if result.stdout:
                        pid = result.stdout.strip()
                        os.kill(int(pid), signal.SIGKILL)
            except Exception as e:
                print(f"Error killing Node.js server: {e}")
            
            # Then kill this process
            os.kill(os.getpid(), signal.SIGKILL)
        
        import threading
        threading.Thread(target=delayed_shutdown, daemon=True).start()
        
        return {"status": "success", "message": "System shutdown initiated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

