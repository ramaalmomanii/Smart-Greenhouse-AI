import time
import paho.mqtt.client as mqtt
import ssl
import os
import json

# MQTT Configuration
MQTT_BROKER = "e1207c25157145d389f06bbfbc914e49.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "feras"
MQTT_PASSWORD = "Green123@#"
MQTT_TOPIC_BASE = "irrigation/esp8266/"

# Callback when the client receives a CONNACK response from the server
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected to MQTT broker ({MQTT_BROKER}:{MQTT_PORT}) successfully")
        # Subscribe to topics upon successful connection
        client.subscribe(MQTT_TOPIC_BASE + "telemetry")
        client.subscribe(MQTT_TOPIC_BASE + "status")
        print(f"Subscribed to topics: {MQTT_TOPIC_BASE}telemetry, {MQTT_TOPIC_BASE}status")
        
        # Publish a test message
        test_msg = {
            "type": "server_connection_test",
            "timestamp": time.time()
        }
        client.publish(
            MQTT_TOPIC_BASE + "status", 
            json.dumps(test_msg), 
            qos=1
        )
        print(f"Published test message to {MQTT_TOPIC_BASE}status")
    else:
        print(f"Failed to connect to MQTT broker, return code: {rc}")

# Callback when a message is received from the server
def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")

# Create a new MQTT client instance
client = mqtt.Client(client_id=f"smart-irrigation-test-{time.time()}")

# Set username and password
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

# Set up TLS for secure connection
client.tls_set_context(ssl.create_default_context())
client.tls_insecure_set(True)  # Don't verify the server hostname

# Set up the callbacks
client.on_connect = on_connect
client.on_message = on_message

# Connect to the MQTT broker
print(f"Connecting to MQTT broker {MQTT_BROKER}:{MQTT_PORT}...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Start the network loop
client.loop_start()

try:
    # Keep the script running
    print("MQTT test client running, press Ctrl+C to exit")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Exiting...")
    client.loop_stop()
    client.disconnect()
    print("Disconnected from MQTT broker") 