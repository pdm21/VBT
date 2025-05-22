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

# Create a new script that will keep the container running
RUN echo '#!/bin/bash\n./start.sh\ntail -f /dev/null' > /app/keep-alive.sh && \
    chmod +x /app/keep-alive.sh

# Use the keep-alive script
CMD ["/bin/bash", "/app/keep-alive.sh"] 