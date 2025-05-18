# VBT - Velocity Based Training System

## Required Node.js and npm Versions

- **Node.js**: v20.18.3
- **npm**: v10.8.2

## Containerized Setup

### Prerequisites

- Docker Desktop installed
  - [Download for Mac](https://www.docker.com/products/docker-desktop)
  - [Download for Windows](https://www.docker.com/products/docker-desktop)

### Running the Application

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd VBT
   ```

2. **Build and start the container**

   ```bash
   docker-compose up --build
   ```

3. **Connect to VBT Network**
   - Connect to the VBT WiFi network
   - The application will be available at http://192.168.0.100:3001

### Stopping the Application

- Press `Ctrl+C` in the terminal to stop the container
- Or run `docker-compose down` in a new terminal

### Troubleshooting

- If you can't access the application, ensure you're connected to the VBT network
- The application requires the VBT network to be properly configured with the static IP 192.168.0.100
- Check Docker Desktop is running and has network access
