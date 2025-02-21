import pandas as pd
import numpy as np

# Load the CSV file
file_path = "./test_data.csv"
df = pd.read_csv(file_path)

# Define time step (assuming 100 Hz sampling rate)
dt = 1 / 100  # 0.01 seconds

# Compute velocity using cumulative sum of acceleration * dt
df["vx"] = np.cumsum(df["adj_acc_x"] * dt)
df["vy"] = np.cumsum(df["adj_acc_y"] * dt)
df["vz"] = np.cumsum(df["adj_acc_z"] * dt)

# Compute total velocity magnitude
df["velocity_magnitude"] = np.sqrt(df["vx"]**2 + df["vy"]**2 + df["vz"]**2)

# Display the processed data
print(df)

df.to_csv("processed_velocity_data.csv", index=False)