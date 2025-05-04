def reset_device(device_ip: str) -> dict:
    print(f"Resetting device at {device_ip}")
    return {"status": "reset", "device_ip": device_ip}

