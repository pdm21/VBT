from fastapi import FastAPI
import threading
import socket
import struct
import time
import numpy as np

app = FastAPI()

grav = 1.007
ports = [12345, 12346, 12347, 12348, 12349]

def recv_n_bytes(sock, n):
    data = b''
    while len(data) < n:
        packet = sock.recv(n - len(data))
        if not packet:
            raise ConnectionError("Socket connection lost")
        data += packet
    return data

def find_max_vels(dps):
    # Dummy placeholder
    return np.array([max(d[0] for d in dps)]), True

def handle_device(port, device_id):
    dps = []
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('0.0.0.0', port))
    server.listen(1)
    print(f"[Device {device_id}] Listening on port {port}...")

    client_socket, client_address = server.accept()
    print(f"[Device {device_id}] Connected from {client_address}")

    start = time.time()
    i = 0
    while time.time() - start < 45:
        try:
            data = recv_n_bytes(client_socket, 8)
        except Exception as e:
            print(f"[Device {device_id}] Error receiving data: {e}")
            break
        acc, t = struct.unpack('fI', data)
        acc -= grav
        dps.append((acc, t))

        if i % 10 == 9:
            maxs, is_done = find_max_vels(dps)
            np.savetxt(f'frontend/public/velocity_data_Device{device_id}.csv',
                       maxs, delimiter='\n', fmt='%f')
        i += 1

    client_socket.close()
    server.close()
    print(f"[Device {device_id}] Connection closed.")

def start_all_socket_servers():
    for idx, port in enumerate(ports, start=1):
        t = threading.Thread(target=handle_device, args=(port, idx), daemon=True)
        t.start()

@app.on_event("startup")
def on_startup():
    print("Starting socket servers for Arduino devices...")
    start_all_socket_servers()

@app.get("/")
def root():
    return {"status": "FastAPI server is running with socket listeners."}
