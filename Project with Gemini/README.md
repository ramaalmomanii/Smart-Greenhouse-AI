# Smart Irrigation System

An IoT-based intelligent irrigation system using ESP8266, sensors, and Google Gemini AI for smart pump control.

## System Architecture

```
┌─────────────┐      MQTT/TLS      ┌─────────────┐      HTTP      ┌──────────────┐
│  ESP8266    │◄───────────────────►│  FastAPI    │◄──────────────►│  Gemini 2    │
│  NodeMCU    │    JSON Telemetry   │  Backend    │   LLM Prompt   │  Flash API   │
└─────────────┘                     └─────────────┘                └──────────────┘
      ▲
      │
      ▼
┌─────────────┐
│  Sensors &  │
│  Actuators  │
└─────────────┘
```

## Hardware Components

- NodeMCU ESP8266 development board
- Capacitive soil moisture sensor
- DHT11 temperature and humidity sensor
- HC-SR04 ultrasonic distance sensor (for water level)
- 5V relay module
- 12V water pump
- I²C LCD 1602 display with backlight
- Power supply (5V for ESP8266, 12V for pump)

## Pin Connections

| Component              | ESP8266 Pin | Description                       |
|------------------------|-------------|-----------------------------------|
| Soil Moisture Sensor   | A0          | Analog input for moisture level   |
| DHT11 Sensor           | D4          | Digital I/O for temp/humidity     |
| HC-SR04 Trigger        | D1          | Ultrasonic trigger signal         |
| HC-SR04 Echo           | D2          | Ultrasonic echo signal            |
| Relay Control          | D5          | Pump control signal               |
| LCD SCL                | D1 (GPIO5)  | I²C clock line                    |
| LCD SDA                | D2 (GPIO4)  | I²C data line                     |

## Firmware Features

- Memory efficient C++ code for ESP8266
- MQTT over TLS for secure communication
- Fallback HTTP REST API
- OTA firmware updates
- Compact JSON payloads for data transmission
- Sensor reading at appropriate intervals
- I²C LCD display for real-time status

## MQTT Topics

The system uses these MQTT topics for communication:

| Topic                        | Direction      | Description                        | Example Payload                                 |
|------------------------------|----------------|------------------------------------|------------------------------------------------|
| `irrigation/esp8266/telemetry` | ESP → Backend  | Sensor data from ESP               | `{"deviceId":"esp8266_abc123","moisture":45.2,"temperature":23.1,"humidity":65.3,"waterLevel":78.9,"pumpState":false}` |
| `irrigation/esp8266/command`   | Backend → ESP  | Commands to control the pump       | `{"pump":true,"manual":false}`                  |
| `irrigation/esp8266/status`    | ESP → Backend  | Device status and command response | `{"status":"online","deviceId":"esp8266_abc123"}` |

## Installation

### ESP8266 Firmware

1. Clone this repository
2. Open the project in PlatformIO or Arduino IDE
3. Update the `platformio.ini` with your WiFi and MQTT credentials
4. Update `include/certificates.h` with your MQTT broker's TLS certificates
5. Connect your ESP8266 and upload the firmware

### FastAPI Backend

1. Install Python 3.8+ and pip
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set environment variables:
   ```
   export MQTT_BROKER="your-mqtt-broker.com"
   export MQTT_PORT=8883
   export MQTT_USERNAME="mqtt_user"
   export MQTT_PASSWORD="mqtt_password"
   export MQTT_TOPIC_BASE="irrigation/esp8266/"
   export GEMINI_API_KEY="your-gemini-api-key"
   ```
4. Run the FastAPI application:
   ```
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

### React Frontend Dashboard

1. Navigate to the frontend directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Access the dashboard at http://localhost:3000

### Using the run.sh helper script:

To simplify setup and running the system, use the included run.sh script:

```
# To install all dependencies
./run.sh install

# To run the backend
./run.sh backend

# To run the frontend (in a separate terminal)
./run.sh frontend
```

## Backend API Endpoints

| Endpoint                      | Method | Description                              |
|-------------------------------|--------|------------------------------------------|
| `/`                           | GET    | Root endpoint with API info              |
| `/devices`                    | GET    | List all connected devices               |
| `/devices/{device_id}`        | GET    | Get specific device data                 |
| `/devices/{device_id}/pump`   | POST   | Send pump command to device              |
| `/devices/{device_id}/ai-decision` | GET    | Get AI-based pump decision for device    |
| `/devices/{device_id}/analyze`   | POST   | Force new AI analysis for device          |

## Frontend Features

The React dashboard provides the following features:

- Real-time device status monitoring 
- Sensor data visualization (soil moisture, temperature, humidity, water level)
- Manual pump control via the web interface
- AI-based irrigation decision display and explanation
- Historical data viewing
- Dark mode support
- Mobile-friendly responsive design

For more details, see the [Frontend README](./frontend/README.md).

## Gemini AI Integration

The backend uses Google's Gemini 2 Flash model to analyze sensor data and make intelligent decisions about when to activate the irrigation pump. The AI considers:

- Soil moisture level
- Temperature and humidity
- Water tank level
- Historical patterns
- Safety constraints

## AI Model Update (Latest)

The system now uses Google's Gemini API directly instead of OpenRouter. This change provides several benefits:
- Direct access to Google's Gemini models without a third-party intermediary
- Lower latency and higher reliability
- Simplified authentication with Google API key

To run the system:

1. Make sure you have the Google Gemini API key set in your environment or .env file:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   ```
2. Start the application with `python app.py`
3. Connect your ESP8266 device to the same network

You can test the Gemini API connection separately using `python test_gemini.py`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 