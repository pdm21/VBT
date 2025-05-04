from fastapi import FastAPI, HTTPException, BackgroundTasks
import socket
import time
import struct

app = FastAPI()

def recv_n_bytes(s, n):
    buffer = bytearray()
    while len(buffer) < n:
        data = s.recv(n - len(buffer))
        if not data:
            if len(buffer) > 0:
                return buffer
            return None
        buffer.extend(data)
    return buffer


# Connect to a device (you could extend this for multiple devices)
def connect_to_device(device_id: int):
    host = "192.168.0.100"
    port = 12344 + device_id
    
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((host, port))
    server.listen(1)
    
    print(f"Listening on {host}:{port}...")
    
    client_socket, client_address = server.accept()
    print(f"Connection from {client_address}")
    
    return client_socket, server

def connect_all_devices():
    devs = [1,2,3,4,5]
    socs, servs = [], []
    for dev in devs:
        soc, serv = connect_to_device(dev)
        socs.append(soc), servs.append(serv)
        
    dps = {i: [] for i in devs}
    grav = 1.008 # np.float64(1.0071216108364667)

    start = time.time()
    i = 0
    while True:
        for dev, client_socket in zip(devs, socs):
            data = recv_n_bytes(client_socket, 8)
            acc, t = struct.unpack('fI', data)
            acc -= grav
            dps[dev].append((acc, t))



@app.post("/start-session")
async def start_session(background_tasks: BackgroundTasks):
    # connect_all_devices()
    # background_tasks.add_task(connect_all_devices)
    """fyi on background tasks:
    background_tasks is a feature in FastAPI that allows you to execute tasks 
    asynchronously in the background while still returning a response to the 
    client immediately. This is useful when you need to run a task that might 
    take some time (such as opening socket connections or processing data) but 
    don't want the client to have to wait for it to complete before receiving a 
    response."""
    return {"message": "Session started."}

@app.post("/start-set")
async def start_set(background_tasks: BackgroundTasks):
    # start "collecting" data (begin storing data)
    return {"message": "Set started."}

@app.post("/stop-set")
async def stop_set(background_tasks: BackgroundTasks):
    # stop "collecting" data (ignore data coming in, replace each batch with new)
    return {"message": "Set ended."}

@app.post("/reset")
async def reset(background_tasks: BackgroundTasks):
    # for every device 1-5
        # reset its csv to all zeros
    return {"message": "Graphs have been reset."}

@app.post("/end-session")
async def end_session():
    # implement
    # for each socket and server (for every device 1-5)
        # client_socket.close()
        # server.close()
    return {"message": "Session ended."}

