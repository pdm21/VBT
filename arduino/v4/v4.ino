#include <WiFiNINA.h>
#include <Arduino_LSM6DS3.h>

const char* ssid = "VBT";
const char* password = "hamilton";

// Device 1: 150, 2: 151. 3: 152, 4: 153, 5: 154

IPAddress staticIP(192, 168, 0, 154);  // Set device IP
IPAddress gateway(192, 168, 1, 2);
IPAddress subnet(255, 255, 255, 0); 


const char* serverIP = "192.168.0.100";  // Set server IP
// Device 1: 345, 2: 346. 3: 347, 4: 348, 5: 349
const int serverPort = 12349;  // Set server port

WiFiClient client; // Create a WiFi client instance

float x_acc, y_acc, z_acc;
union ds {float values[2]; unsigned char buffer[8];} data;
union ts {float flt; unsigned long ms;} time;

void setup() {
    // Serial.begin(115200);  // Start serial communication
    // while (!Serial);       // Wait for Serial Monitor to open

    if (!IMU.begin()) {
      // Serial.println("Failed to initialize IMU!");
      while (1);
    }
    // WiFi.setHostname("VBT-2"); doesnt work offline
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
        // Serial.print(".");
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
            delay(1000);
            return;
        }
    }
    
    IMU.readAcceleration(x_acc, y_acc, z_acc);
    data.values[0] = sqrt(sq(x_acc) + sq(y_acc) + sq(z_acc));
    // IMU.readGyroscope(data.values[3], data.values[4], data.values[5]);
    time.ms = millis();
    data.values[1] = time.flt;

    client.write(data.buffer, 8);

    delay(8);

}