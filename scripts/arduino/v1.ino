#include <WiFiNINA.h>
#include <Arduino_LSM6DS3.h>

const char* ssid = "VBT";
const char* password = "hamilton";

IPAddress staticIP(192, 168, 0, 150);  // Set device IP
IPAddress gateway(192, 168, 1, 2);
IPAddress subnet(255, 255, 255, 0); 


const char* serverIP = "192.168.0.102";  // Set server IP
const int serverPort = 12345;  // Set server port

WiFiClient client; // Create a WiFi client instance

union ds {float values[6]; unsigned char buffer[24];} data;

void setup() {
    // Serial.begin(115200);  // Start serial communication
    // while (!Serial);       // Wait for Serial Monitor to open

    if (!IMU.begin()) {
      // Serial.println("Failed to initialize IMU!");
      while (1);
    }

    // Check if Wi-Fi module is detected
    if (WiFi.status() == WL_NO_MODULE) {
        // Serial.println("WiFi module not detected!");
        while (true);
        delay(1000);
    }

    // Serial.print("Connecting to Wi-Fi: ");
    // Serial.println(ssid);

    // Set static IP before connecting
    WiFi.config(staticIP, gateway, subnet);

    // Connect to Wi-Fi
    while (WiFi.begin(ssid, password) != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }

    // Serial.println("\nConnected to Wi-Fi!");
    // Serial.print("Arduino IP Address: ");
    // Serial.println(WiFi.localIP());  // Print assigned IP

    // Serial.print("Accelerometer sample rate = ");
    // Serial.print(IMU.accelerationSampleRate());
    // Serial.println(" Hz");

    // Serial.print("Gyroscope sample rate = ");
    // Serial.print(IMU.gyroscopeSampleRate());
    // Serial.println(" Hz");
}

void loop() {
    if (!client.connected()) {
        // Serial.println("Connecting to server...");
        if (client.connect(serverIP, serverPort)) {
            // Serial.println("Connected to server!");
        } else {
            // Serial.println("Connection to server failed!");
            delay(5000);
            return;
        }
    }
    IMU.readAcceleration(data.values[0], data.values[1], data.values[2]);
    IMU.readGyroscope(data.values[3], data.values[4], data.values[5]);

    // Serial.println(data.values[0]);
    // Serial.println(data.values[1]);
    // Serial.println(data.values[2]);
    // Serial.println(data.values[3]);
    // Serial.println(data.values[4]);
    // Serial.println(data.values[5]);

    client.write(data.buffer, 24);

    // Close the connection after sending (or keep it open for persistent connection)
    // client.stop();
    // Serial.println("Connection closed.");


    delay(8); // Wait before sending again
}