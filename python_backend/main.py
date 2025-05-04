from fastapi import FastAPI
from pydantic import BaseModel

from start import start_session
from reset import reset_device
from endsession import end_session

app = FastAPI()

# Request schema
class DeviceRequest(BaseModel):
    device_ip: str

@app.post("/start")
def api_start(request: DeviceRequest):
    return start_session(request.device_ip)

@app.post("/reset")
def api_reset(request: DeviceRequest):
    return reset_device(request.device_ip)

@app.post("/end")
def api_end(request: DeviceRequest):
    return end_session(request.device_ip)

