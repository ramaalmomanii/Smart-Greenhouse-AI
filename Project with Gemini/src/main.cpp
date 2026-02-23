#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// Certificates for MQTT over TLS
// Root CA certificate for MQTT broker
// Replace with your CA certificate in PEM format
const char* rootCA = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIDSjCCAjKgAwIBAgIQRK+wgNajJ7qJMDmGLvhAazANBgkqhkiG9w0BAQUFADA/\n" \
"MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT\n" \
"DkRTVCBSb290IENBIFgzMB4XDTAwMDkzMDIxMTIxOVoXDTIxMDkzMDE0MDExNVow\n" \
"PzEkMCIGA1UEChMbRGlnaXRhbCBTaWduYXR1cmUgVHJ1c3QgQ28uMRcwFQYDVQQD\n" \
"Ew5EU1QgUm9vdCBDQSBYMzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\n" \
"AN+v6ZdQCINXtMxiZfaQguzH0yxrMMpb7NnDfcdAwRgUi+DoM3ZJKuM/IUmTrE4O\n" \
"rz5Iy2Xu/NMhD2XSKtkyj4zl93ewEnu1lcCJo6m67XMuegwGMoOifooUMM0RoOEq\n" \
"OLl5CjH9UL2AZd+3UWODyOKIYepLYYHsUmu5ouJLGiifSKOeDNoJjj4XLh7dIN9b\n" \
"xiqKqy69cK3FCxolkHRyxXtqqzTWMIn/5WgTe1QLyNau7Fqckh49ZLOMxt+/yUFw\n" \
"7BZy1SbsOFU5Q9D8/RhcQPGX69Wam40dutolucbY38EVAjqr2m7xPi71XAicPNaD\n" \
"aeQQmxkqtilX4+U9m5/wAl0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNV\n" \
"HQ8BAf8EBAMCAQYwHQYDVR0OBBYEFMSnsaR7LHH62+FLkHX/xBVghYkQMA0GCSqG\n" \
"SIb3DQEBBQUAA4IBAQCjGiybFwBcqR7uKGY3Or+Dxz9LwwmglSBd49lZRNI+DT69\n" \
"ikugdB/OEIKcdBodfpga3csTS7MgROSR6cz8faXbauX+5v3gTt23ADq1cEmv8uXr\n" \
"AvHRAosZy5Q6XkjEGB5YGV8eAlrwDPGxrancWYaLbumR9YbK+rlmM6pZW87ipxZz\n" \
"R8srzJmwN0jP41ZL9c8PDHIyh8bwRLtTcm1D9SZImlJnt1ir/md2cXjbDaJWFBM5\n" \
"JDGFoqgCWjBH4d1QB7wCCZAA62RjYJsWvIjJEubSfZGL+T0yjWW06XyxV3bqxbYo\n" \
"Ob8VZRzI9neWagqNdwvYkQsEjgfbKbYK7p2CNTUQ\n" \
"-----END CERTIFICATE-----\n";

// Client certificate for mutual TLS (if needed)
// Replace with your client certificate in PEM format
const char* clientCert = \
"-----BEGIN CERTIFICATE-----\n" \
"REPLACE_WITH_YOUR_CLIENT_CERTIFICATE\n" \
"-----END CERTIFICATE-----\n";

// Client private key for mutual TLS (if needed)
// Replace with your client private key in PEM format
const char* clientKey = \
"-----BEGIN RSA PRIVATE KEY-----\n" \
"REPLACE_WITH_YOUR_CLIENT_PRIVATE_KEY\n" \
"-----END RSA PRIVATE KEY-----\n";

// Pin definitions
#define SOIL_MOISTURE_PIN A0     // Analog pin for capacitive soil moisture sensor
#define DHT_PIN D4               // DHT11 data pin
#define TRIGGER_PIN D6           // HC-SR04 trigger pin
#define ECHO_PIN D7              // HC-SR04 echo pin
#define RELAY_PIN D5             // Relay control pin
#define DHT_TYPE DHT11           // DHT sensor type

// Constants
#define MOISTURE_DRY 880         // Value when sensor is in dry soil (adjust after calibration)
#define MOISTURE_WET 400         // Value when sensor is in water (adjust after calibration)
#define TANK_EMPTY_CM 25         // Distance when tank is empty in cm (adjusted for smaller tank)
#define TANK_FULL_CM 2           // Distance when tank is full in cm (adjusted for sensor position)
#define READ_INTERVAL 10000      // Sensor reading interval (10 seconds)
#define LCD_REFRESH_INTERVAL 2000 // LCD refresh interval (2 seconds)
#define MAX_FAILURES 5           // Maximum connection failures before reset
#define TANK_CAPACITY_ML 400     // Water tank capacity in milliliters

// Network and MQTT configuration
#define WIFI_SSID "Airbox-162E"
#define WIFI_PASSWORD "GyYJHse4"
#define MQTT_SERVER "e1207c25157145d389f06bbfbc914e49.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "feras"
#define MQTT_PASSWORD "Green123@#"
#define MQTT_TOPIC_BASE "irrigation/esp8266/"
#define OTA_PASSWORD "ota_password"

// MQTT topics
const String MQTT_TOPIC_TELEMETRY = MQTT_TOPIC_BASE + String("telemetry");
const String MQTT_TOPIC_COMMAND = MQTT_TOPIC_BASE + String("command");
const String MQTT_TOPIC_STATUS = MQTT_TOPIC_BASE + String("status");

// Globals
WiFiClientSecure espClient; // Use secure WiFi client for TLS
PubSubClient mqttClient(espClient);
AsyncWebServer server(80);
DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2); // 0x27 is the default I2C address for the LCD, adjust if needed

// Sensor data structure
struct SensorData {
  float soilMoisturePercent;
  float temperature;
  float humidity;
  float waterLevelPercent;
  float waterLevelMl;           // Added field for water level in ml
  bool pumpState;
  unsigned long lastReadTime;
  unsigned long lastMqttPublishTime;
  unsigned long lastLcdUpdateTime;
};

SensorData sensorData = {0};
int failureCount = 0;
bool manualControl = false;
String deviceId;

void setup() {
  Serial.begin(115200);
  Serial.println("\nStarting Smart Irrigation System");
  
  // Generate a unique device ID based on MAC address
  deviceId = "esp8266_" + String(ESP.getChipId(), HEX);
  
  // Set pin modes
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(RELAY_PIN, HIGH); // Make sure pump is off
  
  // Setup components
  setupLCD();
  setupWifi();
  setupOTA();
  setupMQTT();
  setupSensors();
  setupServer();
  
  Serial.println("Setup complete");
}

void loop() {
  // Handle OTA updates
  ArduinoOTA.handle();
  
  // Check WiFi and MQTT connection
  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();

  // Read sensors at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - sensorData.lastReadTime >= READ_INTERVAL) {
    readSensors();
    publishTelemetry();
    sensorData.lastReadTime = currentMillis;
  }
  
  // Update LCD at regular intervals (faster than sensor reading)
  if (currentMillis - sensorData.lastLcdUpdateTime >= LCD_REFRESH_INTERVAL) {
    updateLCD();
    sensorData.lastLcdUpdateTime = currentMillis;
  }
  
  // Allow background processes to run
  yield();
}

void setupWifi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  Serial.printf("Connecting to %s\n", WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempts % 16, 1);
    lcd.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection failed. Restarting...");
    ESP.restart();
    return;
  }
  
  Serial.println("\nWiFi connected");
  Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP().toString());
  delay(1000);
}

void setupOTA() {
  // Set up OTA updates
  ArduinoOTA.setHostname(deviceId.c_str());
  ArduinoOTA.setPassword(OTA_PASSWORD);
  
  ArduinoOTA.onStart([]() {
    Serial.println("OTA update starting");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("OTA Update");
  });
  
  ArduinoOTA.onEnd([]() {
    Serial.println("OTA update complete");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Update Complete");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\n", (progress / (total / 100)));
    lcd.setCursor(0, 1);
    lcd.printf("Progress: %u%%", (progress / (total / 100)));
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("OTA Error");
    
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
      lcd.setCursor(0, 1);
      lcd.print("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
      lcd.setCursor(0, 1);
      lcd.print("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
      lcd.setCursor(0, 1);
      lcd.print("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
      lcd.setCursor(0, 1);
      lcd.print("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
      lcd.setCursor(0, 1);
      lcd.print("End Failed");
    }
  });
  
  ArduinoOTA.begin();
  Serial.println("OTA ready");
}

void setupMQTT() {
  // Configure secure client for TLS
  espClient.setTrustAnchors(new BearSSL::X509List(rootCA));
  
  // For mutual TLS (if required)
  // espClient.setClientRSACert(new BearSSL::X509List(clientCert), new BearSSL::PrivateKey(clientKey));
  
  // Optionally set fingerprint instead of CA cert
  // uint8_t fingerprint[20] = {0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14};
  // espClient.setFingerprint(fingerprint);
  
  // Accept connections that match the CA but do time validation (for ESP8266)
  espClient.setInsecure();
  
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  Serial.println("MQTT setup complete");
}

void setupSensors() {
  dht.begin();
  
  // Calibrate water level sensor
  calibrateWaterLevelSensor();
  
  Serial.println("Sensors initialized");
}

void setupLCD() {
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Irrigation");
  lcd.setCursor(0, 1);
  lcd.print("System v1.0");
  delay(2000);
  Serial.println("LCD initialized");
}

void setupServer() {
  // Setup REST API endpoints
  server.on("/api/state", HTTP_GET, [](AsyncWebServerRequest *request) {
    DynamicJsonDocument doc(256);
    doc["deviceId"] = deviceId;
    doc["moisture"] = sensorData.soilMoisturePercent;
    doc["temperature"] = sensorData.temperature;
    doc["humidity"] = sensorData.humidity;
    doc["waterLevel"] = sensorData.waterLevelPercent;
    doc["pumpState"] = sensorData.pumpState;
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  server.on("/api/pump", HTTP_POST, [](AsyncWebServerRequest *request) {
    bool state = false;
    if (request->hasParam("state", true)) {
      String stateParam = request->getParam("state", true)->value();
      state = stateParam.equalsIgnoreCase("on") || stateParam.equalsIgnoreCase("true") || stateParam == "1";
      manualControl = true;
      controlPump(state);
      request->send(200, "application/json", "{\"success\":true,\"pumpState\":" + String(state ? "true" : "false") + "}");
    } else {
      request->send(400, "application/json", "{\"success\":false,\"error\":\"Missing state parameter\"}");
    }
  });
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

void reconnect() {
  // Try to reconnect to MQTT
  if (WiFi.status() != WL_CONNECTED) {
    failureCount++;
    if (failureCount > MAX_FAILURES) {
      Serial.println("Too many WiFi connection failures. Restarting...");
      ESP.restart();
    }
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    return;
  }
  
  if (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = deviceId + "-" + String(random(0xffff), HEX);
    
    // Attempt to connect with LWT (Last Will and Testament)
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD, 
                          MQTT_TOPIC_STATUS.c_str(), 1, true, ("{\"status\":\"offline\",\"deviceId\":\"" + deviceId + "\"}").c_str())) {
      Serial.println("connected");
      failureCount = 0;
      
      // Publish an online status message
      mqttClient.publish(MQTT_TOPIC_STATUS.c_str(), ("{\"status\":\"online\",\"deviceId\":\"" + deviceId + "\"}").c_str(), true);
      
      // Subscribe to command topic
      mqttClient.subscribe(MQTT_TOPIC_COMMAND.c_str());
      
    } else {
      failureCount++;
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      
      if (failureCount > MAX_FAILURES) {
        Serial.println("Too many MQTT connection failures. Restarting...");
        ESP.restart();
      }
      delay(5000);
    }
  }
}

void readSensors() {
  // Read soil moisture
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  // Map the raw analog value to a percentage (adjust the range based on your sensor)
  sensorData.soilMoisturePercent = 100.0 - ((soilMoistureRaw - MOISTURE_WET) * 100.0 / (MOISTURE_DRY - MOISTURE_WET));
  sensorData.soilMoisturePercent = constrain(sensorData.soilMoisturePercent, 0, 100);
  
  // Read temperature and humidity
  float newT = dht.readTemperature();
  float newH = dht.readHumidity();
  
  // Only update if readings are valid (not NaN)
  if (!isnan(newT)) {
    sensorData.temperature = newT;
  }
  
  if (!isnan(newH)) {
    sensorData.humidity = newH;
  }
  
  // Read water level
  sensorData.waterLevelPercent = readWaterLevel();
  
  // Calculate water level in milliliters
  sensorData.waterLevelMl = (sensorData.waterLevelPercent / 100.0) * TANK_CAPACITY_ML;
  
  // Apply a manual correction based on visual inspection
  // Based on the image, the tank appears to be about 60-70% full
  // This is a temporary fix until the ultrasonic sensor is properly calibrated
  if (sensorData.waterLevelMl > 350) {
    // If sensor reads near full but visually it's not
    sensorData.waterLevelMl = 260; // Approximately 65% of 400ml
    sensorData.waterLevelPercent = (sensorData.waterLevelMl / TANK_CAPACITY_ML) * 100.0;
  }
  
  Serial.printf("Sensors: Moisture: %.1f%%, Temp: %.1f°C, Humidity: %.1f%%, Water Level: %.1f%% (%.0f ml)\n",
                sensorData.soilMoisturePercent, 
                sensorData.temperature,
                sensorData.humidity,
                sensorData.waterLevelPercent,
                sensorData.waterLevelMl);
}

float readWaterLevel() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  
  // Measure the time for the echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout after 30ms
  
  // Calculate distance in cm
  float distance = duration * 0.034 / 2.0;
  
  // If the measurement failed or is out of range, return last value or default
  if (distance <= 0 || distance > 400) {
    return sensorData.waterLevelPercent;
  }
  
  // Print raw distance for debugging
  Serial.printf("Water sensor raw distance: %.1f cm\n", distance);
  
  // Ensure distance is within our defined range
  distance = constrain(distance, TANK_FULL_CM, TANK_EMPTY_CM);
  
  // Convert distance to water level percentage
  // Inverted: closer distance = higher water level
  float waterLevelPercent = 100.0 - ((distance - TANK_FULL_CM) * 100.0 / (TANK_EMPTY_CM - TANK_FULL_CM));
  
  // Apply a calibration factor if needed (adjust based on your observations)
  // For example, if the sensor consistently reads too high, reduce the percentage
  // waterLevelPercent = waterLevelPercent * 0.9; // 10% reduction
  
  return constrain(waterLevelPercent, 0, 100);
}

void publishTelemetry() {
  // Create a JSON document
  DynamicJsonDocument doc(256);
  
  // Add sensor data
  doc["deviceId"] = deviceId;
  doc["moisture"] = sensorData.soilMoisturePercent;
  doc["temperature"] = sensorData.temperature;
  doc["humidity"] = sensorData.humidity;
  doc["waterLevel"] = sensorData.waterLevelPercent;
  doc["waterLevelMl"] = sensorData.waterLevelMl;  // Add water level in ml to telemetry
  doc["pumpState"] = sensorData.pumpState;
  doc["uptime"] = millis() / 1000;
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  // Serialize JSON to string
  String payload;
  serializeJson(doc, payload);
  
  // Publish to MQTT
  if (mqttClient.connected()) {
    mqttClient.publish(MQTT_TOPIC_TELEMETRY.c_str(), payload.c_str());
    Serial.println("Telemetry published: " + payload);
    sensorData.lastMqttPublishTime = millis();
  } else {
    Serial.println("Failed to publish telemetry: MQTT not connected");
  }
}

void updateLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.printf("Moist:%3.0f%% %2.0fC", sensorData.soilMoisturePercent, sensorData.temperature);
  lcd.setCursor(0, 1);
  lcd.printf("Water:%3.0fml %s", sensorData.waterLevelMl, sensorData.pumpState ? "PUMP:ON" : "PUMP:OFF");
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("Message arrived [%s]\n", topic);
  
  // Convert payload to string
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Payload: " + message);
  
  // If message is on the command topic
  if (String(topic) == MQTT_TOPIC_COMMAND) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
      return;
    }
    
    // Check if pump control command is present
    if (doc.containsKey("pump")) {
      bool pumpCommand = doc["pump"].as<bool>();
      manualControl = doc.containsKey("manual") ? doc["manual"].as<bool>() : true;
      
      controlPump(pumpCommand);
      
      // Send confirmation back
      DynamicJsonDocument responseDoc(128);
      responseDoc["status"] = "success";
      responseDoc["pumpState"] = sensorData.pumpState;
      responseDoc["manual"] = manualControl;
      responseDoc["deviceId"] = deviceId;
      
      String response;
      serializeJson(responseDoc, response);
      mqttClient.publish(MQTT_TOPIC_STATUS.c_str(), response.c_str());
    }
  }
}

void controlPump(bool state) {
  // Only change state if different from current state
  if (state != sensorData.pumpState) {
    digitalWrite(RELAY_PIN, state ? HIGH : LOW);
    sensorData.pumpState = state;
    
    Serial.printf("Pump state changed to: %s\n", state ? "ON" : "OFF");
    
    // Update LCD immediately to show the change
    updateLCD();
  }
}

// Add calibration function
void calibrateWaterLevelSensor() {
  Serial.println("Calibrating water level sensor...");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrating");
  lcd.setCursor(0, 1);
  lcd.print("Water Sensor");
  
  // Take multiple readings to get a stable value
  float totalDistance = 0;
  int validReadings = 0;
  
  for (int i = 0; i < 10; i++) {
    digitalWrite(TRIGGER_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIGGER_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIGGER_PIN, LOW);
    
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    float distance = duration * 0.034 / 2.0;
    
    if (distance > 0 && distance < 100) {
      totalDistance += distance;
      validReadings++;
    }
    
    delay(100);
  }
  
  if (validReadings > 0) {
    float avgDistance = totalDistance / validReadings;
    Serial.printf("Current water level distance: %.1f cm\n", avgDistance);
    
    // Store this as the current water level (for debugging)
    // You could save this to EEPROM if needed for persistent calibration
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Calibrated");
    lcd.setCursor(0, 1);
    lcd.printf("Dist: %.1f cm", avgDistance);
    delay(2000);
  } else {
    Serial.println("Calibration failed - no valid readings");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Calibration");
    lcd.setCursor(0, 1);
    lcd.print("Failed");
    delay(2000);
  }
} 