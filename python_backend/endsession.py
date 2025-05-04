def end_session(device_ip: str) -> dict:
    print(f"Ending session with device at {device_ip}")
    return {"status": "ended", "device_ip": device_ip}

