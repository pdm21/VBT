import pandas as pd
import numpy as np
import socket
import time
import struct

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

dps = []
num_reps = 5
prev_time = 0.0
np.savetxt('/Users/teddyrosenbaum/Desktop/School/SP25/CS_Thesis/repo/VBT/frontend/public/velocity_data.csv', np.zeros(num_reps, dtype=float), delimiter='\n', fmt='%.2f')
host = "192.168.0.101"
port = 12345

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((host, port))
server.listen(1)

print(f"Listening on {host}:{port}...")

client_socket, client_address = server.accept()
print(f"Connection from {client_address}")

i = 0
while True:
    i += 1
    acc, cur_time = struct.unpack('fI', recv_n_bytes(client_socket, 8))
    if prev_time == 0:
        dt = 0
    else:
        dt = (cur_time - prev_time) / 1000.0

    prev_time = cur_time
    dps.append(acc * dt * 9.8)

    if i % 10 == 0:
        accs = np.array(dps)
        inflections = np.argwhere(np.diff(accs) > 0.1).flatten()
        if len(inflections) > 0:
            begin = inflections[0]
            start_stop = np.argwhere(np.diff(accs[begin:]) > 0.1).flatten()
            start_stop = start_stop[np.argwhere(np.diff(start_stop) > 10).flatten()]
            if len(start_stop) == num_reps + 1:
                client_socket.close()
                server.close()
                break
                
            v = accs.cumsum()[begin:]
            x = np.arange(len(v))
        
            coefficients = np.polyfit(x, v, 1)
            slope = coefficients[0]
            intercept = coefficients[1]
            norm_v = v - (slope * x + intercept)
    
            max_vs = np.zeros(num_reps, dtype=float)
            for j, start, stop in zip(np.arange(num_reps), start_stop, start_stop[1:]):
                max_vs[j] = -norm_v[start:stop].min()
            np.savetxt('/Users/teddyrosenbaum/Desktop/School/SP25/CS_Thesis/repo/VBT/frontend/public/velocity_data.csv', max_vs, delimiter='\n', fmt='%.2f')


client_socket.close()
server.close()