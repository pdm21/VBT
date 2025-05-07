# backend/device_manager.py

from utils import (
    connect_to_device,
    init_connection_thread,
    get_online_devices,
)
import time
import numpy as np

class DeviceManager:
    def __init__(self, file_format='/Users/pmargaronis/Desktop/CS410/Code/VBT/frontend/public/velocity_data_Device{}.csv'):
        self.threads = {}
        self.conts = {}
        self.datas = {}
        self.last_reps = -1
        self.csv_filepath = file_format

        self.clear_csvs()
        self.disconnected = []

    def remove_dead(self):
        for device in list(self.threads.keys()):
            if not self.threads[device].is_alive():
                self.threads[device].join()
                del self.threads[device]
                del self.conts[device]
                del self.datas[device]
                self.disconnected.append(device)

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

    def get_connected(self):
        self.remove_dead()
        return sorted(list(self.threads.keys()))

    def disconnect(self):
        self.remove_dead()
        [cont.put(-1) for cont in self.conts.values()]

    def stop(self):
        self.remove_dead()
        [cont.put(0) for cont in self.conts.values()]

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

        [data.get() for data in self.datas.values()]
        return max_vels

    def reset(self):
        self.stop()
        self.clear_csvs()
        if self.last_reps > 0:
            self.do_reps(self.last_reps)

    def clear_csvs(self):
        for i in range(1, 6):
            with open(self.csv_filepath.format(i), "w") as file:
                pass

    def get_disconnected(self):
        disconnected = self.disconnected
        self.disconnected = []
        return disconnected


# Initialize a singleton instance
DV = DeviceManager()

