def start_session(device_ip: str) -> dict:
    print(f"Starting session with device at {device_ip}")
    return {"status": "started", "device_ip": device_ip}

