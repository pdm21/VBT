import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import pandas as pd
import numpy as np
import plotly.graph_objs as go
import time

# Load data
file_path = "processed_velocity_data.csv"
df = pd.read_csv(file_path)

# Define time step (assuming 100 Hz sampling rate)
dt = 1 / 100  # 0.01 seconds
vmin, vmax = 0.05, 0.15  # Define velocity thresholds

def get_velocity_data():
    """Returns velocity data at 1-second intervals."""
    for i in range(0, len(df), 100):  # 100 samples = 1 second
        yield df.iloc[i:i+100].copy()

# Initialize Dash app
app = dash.Dash(__name__)
app.layout = html.Div([
    html.H1("Velocity-Based Training Dashboard"),
    dcc.Graph(id='velocity-bar-graph'),
    dcc.Interval(
        id='interval-component',
        interval=1000,  # Update every second
        n_intervals=0
    )
])

# Store velocity data generator
data_generator = get_velocity_data()
current_data = next(data_generator, None)

@app.callback(
    Output('velocity-bar-graph', 'figure'),
    Input('interval-component', 'n_intervals')
)
def update_graph(n_intervals):
    global current_data
    if current_data is None:
        return go.Figure()
    
    # Update data
    velocity_magnitude = current_data['velocity_magnitude'].mean()
    color = 'green' if vmin <= velocity_magnitude <= vmax else 'red'
    
    # Create bar graph
    figure = go.Figure()
    figure.add_trace(go.Bar(
        x=['Velocity'], 
        y=[velocity_magnitude],
        marker_color=color
    ))
    figure.update_layout(title='Velocity Indicator', yaxis_title='Velocity (m/s)', yaxis=dict(range=[0, vmax * 1.5]))
    
    # Get next set of data
    current_data = next(data_generator, None)
    return figure

if __name__ == '__main__':
    app.run_server(debug=True)
