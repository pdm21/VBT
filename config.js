const config = {
  // The local IP address of the Mac computer
  serverIp: 'Getting', // This will be updated by start.sh
  
  // The port where your Arduino is connected
  arduinoPort: '/dev/tty.usbmodem101', // This will be updated by start.sh
  
  // Server port
  port: 3001
};

module.exports = config;