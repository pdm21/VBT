# Use Node.js as the base image for frontend
FROM node:18-slim

# Install Python and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    fping \
    iputils-ping \
    net-tools \
    lsof \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install frontend dependencies
RUN npm install
RUN cd frontend && npm install

RUN cd ..

# Copy the rest of the application
COPY . .

# Create and activate Python virtual environment
RUN mkdir -p /opt/venv && \
    python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install -r requirements.txt

# Make start.sh executable and ensure Unix line endings
RUN sed -i 's/\r$//' start.sh && \
    chmod +x start.sh

# Create a new script that will keep the container running and verify servers
RUN echo '#!/bin/bash\n\
echo "=== Starting VBT Application ===\n\
echo "Current directory: $(pwd)"\n\
echo "Contents of current directory:"\n\
ls -la\n\
echo "\n=== Running start.sh ===\n\
bash ./start.sh\n\
echo "\n=== Checking server status ===\n\
if lsof -i :3001 > /dev/null; then\n\
    echo "Frontend server is running on port 3001"\n\
else\n\
    echo "ERROR: Frontend server is not running on port 3001"\n\
fi\n\
if lsof -i :8000 > /dev/null; then\n\
    echo "Backend server is running on port 8000"\n\
else\n\
    echo "ERROR: Backend server is not running on port 8000"\n\
fi\n\
echo "\nServers should be accessible at http://192.168.0.100:3001"\n\
echo "Container will keep running. Press Ctrl+C to stop."\n\
tail -f /dev/null' > /app/keep-alive.sh && \
    chmod +x /app/keep-alive.sh

# Use the keep-alive script
CMD ["/bin/bash", "/app/keep-alive.sh"] 