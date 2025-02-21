import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import pandas as pd
import numpy as np
import plotly.graph_objs as go
import threading
import time

# Initialize Dash app
app = dash.Dash(__name__)
app.title = "Live Accelerometer Data"

# Global DataFrame to store data
df = pd.DataFrame(columns=["time", "ax", "ay", "az"])

# Function to generate dummy accelerometer data
def generate_data():
    global df
    while True:
        num_samples = 104
        time_values = np.linspace(0, 0.5, num_samples)  # 104 Hz over 0.5s
        x_acc = np.random.normal(0, 0.5, num_samples)
        y_acc = np.random.normal(0, 0.5, num_samples)
        z_acc = np.random.normal(-9.81, 0.5, num_samples)  # Gravity
        
        new_data = pd.DataFrame({
            "time": time_values + (df["time"].max() if not df.empty else 0),
            "ax": x_acc,
            "ay": y_acc,
            "az": z_acc
        })

        # Append and keep only recent data (optional)
        df = pd.concat([df, new_data]).tail(500)  # Keep last 500 rows

        time.sleep(0.5)  # Generate new data every 500ms

# Start data generation in a background thread
threading.Thread(target=generate_data, daemon=True).start()

# Dash Layout
app.layout = html.Div([
    html.H1("Real-Time Accelerometer Data"),
    dcc.Graph(id="live-graph"),
    dcc.Interval(id="interval-update", interval=500, n_intervals=0)  # Update every 500ms
])

# Dash Callback for updating the graph
@app.callback(
    Output("live-graph", "figure"),
    Input("interval-update", "n_intervals")
)
def update_graph(n):
    global df
    if df.empty:
        return go.Figure()

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df["time"], y=df["ax"], mode="lines", name="X Acceleration"))
    fig.add_trace(go.Scatter(x=df["time"], y=df["ay"], mode="lines", name="Y Acceleration"))
    fig.add_trace(go.Scatter(x=df["time"], y=df["az"], mode="lines", name="Z Acceleration"))
    fig.update_layout(title="Live Accelerometer Data", xaxis_title="Time (s)", yaxis_title="Acceleration (m/s²)")

    return fig

# Run the Dash app
if __name__ == "__main__":
    app.run_server(debug=True)

