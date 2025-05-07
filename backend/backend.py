import socket
import time
import struct
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from IPython import display
import scipy as sp
from scipy import signal
import subprocess
import queue
import threading

def filter_data(dps, b, a):
    acc, time = np.array(dps).T
    
    diff = np.diff(time)
    dt = np.zeros_like(time)
    dt[:-1] += diff / 2
    dt[1:] += diff / 2

    
    filt_acc = signal.filtfilt(b, a, np.pad(acc, (0, 500)))[:-500]
    vel = (9.8 * filt_acc[:-100] * dt[:-100]).cumsum()

    return vel # filt_acc, vel, time

def find_peaks(vel, nreps):
    # _, vel, time = filter_data(dps)
    peak_xs = signal.find_peaks(vel, prominence=0.5)[0]
    
    peak_vels = np.zeros(nreps)
    use_peaks = min(len(peak_xs), nreps) - 1
    # peak_vels[:use_peaks] = vel[peak_xs][:use_peaks]

    if use_peaks < 0:
        return -1, 0
    else:
        return use_peaks, vel[peak_xs][use_peaks]
    # return use_peaks-1, vel
    # return peak_vels, (use_peaks == nreps)

b, a = signal.butter(4, [1/200, 1/20], 'bandpass')

def dps_to_max(dps, nreps):
    vel = filter_data(dps, b, a)
    return find_peaks(vel, nreps)

def get_online_devices():
    output = subprocess.run(
        ['fping', '-c', '1', '-t', '250'] + [f'192.168.0.{ip}' for ip in range(150, 155)],
        capture_output=True,
    )
    return sorted([int(response[12:13])+1 for response in output.stdout.decode().split('\n')[:-1] if 'timed out' not in response])

means = np.array([0.98862311, 1.01106522, 1.01168681, 1.00348977, 1.00572611])

def connect_to_device(num):
    assert(num in [1,2,3,4,5])
    host = "192.168.0.100"
    port = 12344 + num
    
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    server.bind((host, port))
    server.listen(1)

    print(f"Listening for VBT:{num}")

    client_socket, client_address = server.accept()
    
    client_socket.settimeout(2)
    # client_socket.setblocking(False)
    
    print(f"VBT:{num} - connected")

    return client_socket, server, means[num-1]

def worker(num, controller, data):
    try:
        csoc, serv, grav = connect_to_device(num)
        data.put(0)
        
        action = 0
        while True:
            if not controller.empty():
                action = controller.get()
    
            if action > 0:
                i, is_done, last_rep = 0, False, -1
                
                dps = []
                
                max_vels = np.zeros(action)
                data.put(max_vels)
                while controller.empty() and (last_rep < action-1):
                    acc, t = struct.unpack('fI', csoc.recv(8, socket.MSG_WAITALL))
                    dps.append((acc-grav, t / 1000.0))
                    if (i > 300) & (i % 50):
                        # max_vels, is_done = dps_to_max(dps, action)
                        rep, vel = dps_to_max(dps, action)
                        if rep > last_rep:
                            max_vels[rep] = vel
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
            csoc.recv(128, socket.MSG_DONTWAIT)
            

    except socket.error as e:
        csoc.close()
        serv.close()
        print(f'VBT:{num} - closed connection')
        return
            
def init_connection_thread(num):
    controller = queue.Queue()
    data = queue.Queue()

    connection_thread = threading.Thread(target=worker, args=(num, controller, data))
    connection_thread.daemon = True
    connection_thread.start()

    return connection_thread, controller, data

class DeviceManager:
    def __init__(self, file_format='/Users/pmargaronis/Desktop/CS410/Code/VBT/frontend/public/velocity_data_Device{}.csv'):
        self.threads = {}
        self.conts = {}
        self.datas = {}
        self.last_reps = -1
        self.csv_filepath = file_format

        self.clear_csvs()
        self.disconnected = []
            

    # removes disconnected devices
    def remove_dead(self):
        for device in list(self.threads.keys()):
            if not self.threads[device].is_alive():
                self.threads[device].join()
                del self.threads[device]
                del self.conts[device]
                del self.datas[device]
                self.disconnected.append(device)

    # connects to all available devices
    def connect(self):
        self.remove_dead()
        devices = get_online_devices()
        new_data = []
        for device in devices:
            if device not in self.threads.keys():
                thread, cont, data = init_connection_thread(device)
                self.threads[device] = thread
                self.conts[device] = cont
                self.datas[device] = data
                new_data.append(data)

        [data.get() for data in new_data]

    # returns a list of connected devices
    def get_connected(self):
        self.remove_dead()
        return sorted(list(self.threads.keys()))

    # disconnects from all devices - should only be done at end of session / shutting down vbt
    def disconnect(self):
        self.remove_dead()
        [cont.put(-1) for cont in self.conts.values()]

    # stops recording
    def stop(self):
        self.remove_dead()
        [cont.put(0) for cont in self.conts.values()]

    # starts recording for n reps 
    # this is a blocking function it will not return until all n reps have been completed. I can change this easily if better
    def do_reps(self, nreps):
        self.last_reps = nreps
        [cont.put(nreps) for cont in self.conts.values()]

        max_vels = {device: data.get() for device, data in self.datas.items()}

        while any([data.empty() for data in self.datas.values()]):
            self.remove_dead()
            time.sleep(0.2)
            for device, data in max_vels.items():
                np.savetxt(self.csv_filepath.format(device),
                   max_vels[device], delimiter='\n', fmt='%f')
                # np.savetxt(f'test_files/velocity_data_Device{device}.csv',
                #     max_vels[device], delimiter='\n', fmt='%f')

        [data.get() for data in self.datas.values()]
        return max_vels

    # resets do_reps with same number of reps
    def reset(self):
        self.stop()
        self.clear_csvs()
        if self.last_reps > 0:
            self.do_reps(self.last_reps)

    # clears the csvs
    def clear_csvs(self):
        for i in range(1,6):
            with open(self.csv_filepath.format(i), "w") as file:
                pass

    def get_disconnected(self):
        disconnected = self.disconnected
        self.disconnected = []
        return disconnected

DV = DeviceManager()
DV.connect()
DV.do_reps(5)
DV.get_connected()
DV.get_disconnected()
DV.disconnect()