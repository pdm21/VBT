# utils.py

import socket
import time
import struct
import subprocess
import numpy as np
import scipy.signal as signal
import queue
import threading

# Constants used in signal processing and device connection
b, a = signal.butter(4, [1/200, 1/20], 'bandpass')
means = np.array([0.98862311, 1.01106522, 1.01168681, 1.00348977, 1.00572611])

def filter_data(dps, b, a):
    acc, time_vals = np.array(dps).T

    diff = np.diff(time_vals)
    dt = np.zeros_like(time_vals)
    dt[:-1] += diff / 2
    dt[1:] += diff / 2

    filt_acc = signal.filtfilt(b, a, np.pad(acc, (0, 500)))[:-500]
    vel = (9.8 * filt_acc[:-100] * dt[:-100]).cumsum()

    return vel

def find_peaks(vel, nreps):
    peak_xs = signal.find_peaks(vel, prominence=0.5)[0]
    peak_vels = np.zeros(nreps)
    use_peaks = min(len(peak_xs), nreps) - 1

    if use_peaks < 0:
        return -1, 0
    else:
        return use_peaks, vel[peak_xs][use_peaks]

def dps_to_max(dps, nreps):
    vel = filter_data(dps, b, a)
    return find_peaks(vel, nreps)

def get_online_devices():
    # had to specify fping path here
    # will need to be changed for other systems
    output = subprocess.run(
        ['/opt/homebrew/bin/fping', '-c', '1', '-t', '250'] + [f'192.168.0.{ip}' for ip in range(150, 155)],
        capture_output=True,
    )
    return sorted([int(response[12:13])+1 for response in output.stdout.decode().split('\n')[:-1] if 'timed out' not in response])

def connect_to_device(num):
    assert(num in [1, 2, 3, 4, 5])
    host = "192.168.0.100"
    port = 12344 + num

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((host, port))
    server.listen(1)

    print(f"Listening for VBT:{num}")

    client_socket, client_address = server.accept()
    client_socket.settimeout(2)

    print(f"VBT:{num} - connected")

    return client_socket, server, means[num - 1]

def worker(num, controller, data):
    try:
        csoc, serv, grav = connect_to_device(num)
    except:
        data.put(0)
        print(f'VBT:{num} - failed to connect')
        return

    try:
        data.put(0)
        action = 0
        while True:
            if not controller.empty():
                action = controller.get()
    
            if action > 0:
                i, is_done, last_rep = 0, False, -1
                
                dps = []
                
                max_vels = np.zeros((1,action))
                data.put(max_vels)
                while controller.empty() and (last_rep < action-1):
                    acc, t = struct.unpack('fI', csoc.recv(8, socket.MSG_WAITALL))
                    dps.append((acc-grav, t / 1000.0))
                    if (i > 300) & (i % 50):
                        # max_vels, is_done = dps_to_max(dps, action)
                        rep, vel = dps_to_max(dps, action)
                        if rep > last_rep:
                            max_vels[0, rep] = vel
                            last_rep = rep
                            # data.put(max_vels)
                            
                    i += 1
                
                data.put(True)
                action = 0
                print(f'VBT:{num} - reps recorded')
    
            if action == -1:
                csoc.close()
                serv.close()
                print(f'VBT:{num} - connection closed')
                return
                
            time.sleep(0.1)
            csoc.recv(128) # , socket.MSG_DONTWAIT)
            

    except socket.error as e:
        csoc.close()
        serv.close()
        print(e)
        print(f'VBT:{num} - closed connection')
        return
            
            

def init_connection_thread(num):
    controller = queue.Queue()
    data = queue.Queue()

    connection_thread = threading.Thread(target=worker, args=(num, controller, data))
    connection_thread.daemon = True
    connection_thread.start()

    return connection_thread, controller, data

