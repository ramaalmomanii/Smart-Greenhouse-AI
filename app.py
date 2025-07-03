import os
import json
import asyncio
import logging
import ssl
import time
import threading
import queue
import paho.mqtt.client as mqtt
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv

import httpx
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("irrigation_app")

# Initialize FastAPI app
app = FastAPI(
    title="Smart Irrigation System",
    description="IoT-based irrigation system with ESP8266 and Gemini 2 Flash integration",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
MQTT_BROKER = os.getenv("MQTT_BROKER", "e1207c25157145d389f06bbfbc914e49.s1.eu.hivemq.cloud")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "feras")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "Green123@#")
MQTT_TOPIC_BASE = os.getenv("MQTT_TOPIC_BASE", "irrigation/esp8266/")
GEMINI_API_KEY = "AIzaSyDxpFc98FziE5m7SqdWvHileish4xkkgjw"

# Print configuration for debugging
print(f"MQTT Configuration: {MQTT_BROKER}:{MQTT_PORT}, User: {MQTT_USERNAME}")
print(f"Gemini API Key configured: {'Yes' if GEMINI_API_KEY else 'No'}")

# Data models
class SensorData(BaseModel):
    deviceId: str
    moisture: float = Field(..., description="Soil moisture percentage (0-100)")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity percentage (0-100)")
    waterLevel: float = Field(..., description="Water tank level percentage (0-100)")
    pumpState: bool = Field(..., description="Current pump state (true = ON, false = OFF)")
    uptime: Optional[int] = Field(None, description="Device uptime in seconds")
    rssi: Optional[int] = Field(None, description="WiFi signal strength in dBm")
    freeHeap: Optional[int] = Field(None, description="Free heap memory in bytes")
    timestamp: datetime = Field(default_factory=datetime.now)

class PumpCommand(BaseModel):
    pump: bool = Field(..., description="Desired pump state (true = ON, false = OFF)")
    manual: bool = Field(default=False, description="Whether this is a manual override")
    duration: Optional[int] = Field(None, description="Duration in seconds to run the pump")

class DeviceState:
    def __init__(self):
        self.devices = {}
        self.last_ai_decision = {}
        self.last_ai_reasoning = {}
    
    def update_device(self, device_id: str, data: SensorData):
        self.devices[device_id] = data
    
    def get_device(self, device_id: str) -> Optional[SensorData]:
        return self.devices.get(device_id)
    
    def get_all_devices(self) -> Dict[str, SensorData]:
        return self.devices
    
    def set_ai_decision(self, device_id: str, decision: bool, reasoning: str):
        self.last_ai_decision[device_id] = decision
        self.last_ai_reasoning[device_id] = reasoning
    
    def get_ai_decision(self, device_id: str) -> tuple:
        return (
            self.last_ai_decision.get(device_id, None),
            self.last_ai_reasoning.get(device_id, None)
        )

# Global state
device_state = DeviceState()
mqtt_client = None
mqtt_listener_thread = None
mqtt_message_queue = queue.Queue()  # Regular Python queue instead of asyncio.Queue

# Replace with your Atlas connection string
MONGO_URI = "mongodb+srv://ramaa:rama2003@cluster0.eua4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["smart_greenhouse"]
telemetry_collection = db["telemetry"]

# MQTT client callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"Connected to MQTT broker ({MQTT_BROKER}:{MQTT_PORT}) successfully")
        # Subscribe to topics upon successful connection
        client.subscribe(MQTT_TOPIC_BASE + "telemetry")
        client.subscribe(MQTT_TOPIC_BASE + "status")
        logger.info(f"Subscribed to topics: {MQTT_TOPIC_BASE}telemetry, {MQTT_TOPIC_BASE}status")
    else:
        logger.error(f"Failed to connect to MQTT broker, return code: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        topic = msg.topic
        logger.debug(f"Received message on topic {topic}: {payload}")
        
        # Add message to queue for async processing (using standard queue, not asyncio queue)
        mqtt_message_queue.put((topic, payload))
    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        logger.warning(f"Unexpected MQTT disconnection (code {rc}). Reconnecting...")

# MQTT message processing coroutine
async def process_mqtt_messages():
    while True:
        try:
            # Non-blocking check if there are messages in the queue
            if not mqtt_message_queue.empty():
                try:
                    # Get message from queue
                    topic, payload = mqtt_message_queue.get_nowait()
                    
                    if topic == MQTT_TOPIC_BASE + "telemetry":
                        # Process telemetry data
                        device_id = payload.get("deviceId")
                        if device_id:
                            sensor_data = SensorData(**payload)
                            device_state.update_device(device_id, sensor_data)
                            # Store in MongoDB
                            telemetry_collection.insert_one(sensor_data.dict())
                            await process_with_ai(device_id, sensor_data)
                    
                    elif topic == MQTT_TOPIC_BASE + "status":
                        # Process status updates
                        logger.info(f"Status update: {payload}")
                        
                    mqtt_message_queue.task_done()
                except queue.Empty:
                    # Queue was empty - continue
                    pass
            
            # Yield control to allow other async tasks to run
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Error processing MQTT message from queue: {e}")
            await asyncio.sleep(1)  # Avoid tight error loop

# Function to start MQTT client in a separate thread
def start_mqtt_client():
    global mqtt_client
    try:
        # Create a new MQTT client instance
        mqtt_client = mqtt.Client(client_id=f"smart-irrigation-{time.time()}")
        
        # Set username and password
        mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        # Set up TLS for secure connection
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        mqtt_client.tls_set_context(context)
        mqtt_client.tls_insecure_set(True)  # Don't verify the server hostname
        
        # Set up the callbacks
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        mqtt_client.on_disconnect = on_disconnect
        
        # Connect to the MQTT broker
        logger.info(f"Connecting to MQTT broker {MQTT_BROKER}:{MQTT_PORT}...")
        
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_forever()  # Start the network loop
    except Exception as e:
        logger.error(f"Error in MQTT client thread: {e}")
        # Try to reconnect after a delay
        time.sleep(5)
        start_mqtt_client()  # Recursive call to restart

# Helper function to publish a message to MQTT
async def publish_mqtt_message(topic: str, payload: dict, qos: int = 1):
    try:
        # Get the client from the global scope
        client = mqtt_client
        if client is not None:
            # Prepare and publish the message
            payload_json = json.dumps(payload)
            info = client.publish(
                topic,
                payload_json,
                qos=qos
            )
            # Wait for publication (this will block, but it's important for reliability)
            info.wait_for_publish(timeout=5)
            if info.is_published():
                logger.debug(f"Published message to {topic}: {payload}")
                return True
            else:
                logger.error(f"Failed to publish message to {topic}")
                return False
        else:
            logger.error("MQTT client not connected, cannot publish message")
            return False
    except Exception as e:
        logger.error(f"Error publishing MQTT message: {e}")
        return False

# Helper to send pump commands
async def send_pump_command(device_id: str, pump_state: bool, manual: bool = True):
    try:
        command_topic = MQTT_TOPIC_BASE + "command"
        
        command = {
            "pump": pump_state,
            "manual": manual,
            "timestamp": datetime.now().isoformat()
        }
        
        success = await publish_mqtt_message(command_topic, command)
        
        return success
    except Exception as e:
        logger.error(f"Error sending pump command: {e}")
        return False

# Gemini AI Integration
async def process_with_ai(device_id: str, sensor_data: SensorData):
    """Process sensor data with Gemini AI to make irrigation decisions"""
    # Skip if the pump is already manually controlled
    last_decision, _ = device_state.get_ai_decision(device_id)
    
    # Only run AI decision every 10 minutes or on significant sensor changes
    should_analyze = True
    
    if should_analyze:
        try:
            # Print the API key (first few characters) for debugging
            api_key_preview = GEMINI_API_KEY[:5] + '...' if GEMINI_API_KEY and len(GEMINI_API_KEY) > 5 else "not set"
            logger.info(f"Using Gemini API key: {api_key_preview}")
            
            # Prepare the prompt for Gemini
            prompt = f"""
            You are an intelligent irrigation system controller. 
            Analyze the following sensor data and determine if the pump should be turned ON or OFF:
            
            Device ID: {device_id}
            Soil Moisture: {sensor_data.moisture}% (0% = dry, 100% = saturated)
            Temperature: {sensor_data.temperature}°C
            Humidity: {sensor_data.humidity}%
            Water Tank Level: {sensor_data.waterLevel}%
            Current Pump State: {"ON" if sensor_data.pumpState else "OFF"}
            
            Follow these specific irrigation rules:
            1. If soil moisture < 30% AND water level > 20%, turn pump ON.
            2. If moisture is between 30-40%, and temperature is high (>30°C) and humidity is low (<40%), turn ON.
            3. If moisture > 70%, always turn OFF.
            4. If pump has been ON for more than 30 seconds and moisture hasn't increased, turn OFF.
            5. If water level is below 20%, always turn OFF.
            
            Return ONLY a valid JSON object in this format WITHOUT any markdown code blocks (no ```):
            {{"pump": true/false, "reasoning": "Your explanation here"}}
            """
            
            # Define the API URL with the API key
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={GEMINI_API_KEY}"
            
            # Define the request payload
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.3,  # Low temperature for more deterministic outputs
                    "topP": 0.8,
                    "topK": 40,
                    "maxOutputTokens": 150
                },
                "safetySettings": [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    }
                ]
            }
            
            # Send the request to the API using asyncio
            response = await asyncio.to_thread(
                lambda: requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            )
            
            logger.info(f"Gemini API response status: {response.status_code}")
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the JSON response
                response_json = response.json()
                
                # Extract the text from the response
                if (response_json and 
                    "candidates" in response_json and 
                    len(response_json["candidates"]) > 0 and 
                    "content" in response_json["candidates"][0] and
                    "parts" in response_json["candidates"][0]["content"] and
                    len(response_json["candidates"][0]["content"]["parts"]) > 0 and
                    "text" in response_json["candidates"][0]["content"]["parts"][0]):
                    
                    response_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
                    logger.debug(f"Raw response text: {response_text}")
                    
                    try:
                        # Clean the response text if it contains Markdown code blocks
                        if response_text.startswith("```json") and "```" in response_text:
                            # Remove the Markdown code block delimiters
                            response_text = response_text.replace("```json", "", 1)
                            response_text = response_text.rsplit("```", 1)[0].strip()
                        elif response_text.startswith("```") and response_text.endswith("```"):
                            # Remove the Markdown code block delimiters without language specification
                            response_text = response_text.replace("```", "", 1)
                            response_text = response_text.rsplit("```", 1)[0].strip()
                        
                        logger.debug(f"Cleaned response text: {response_text}")
                        
                        # Fix common JSON issues
                        # 1. Handle unterminated strings by finding basic JSON structure
                        if response_text.startswith("{") and '"pump":' in response_text and '"reasoning":' in response_text:
                            # Try to extract a complete JSON object with regex
                            import re
                            match = re.search(r'\{\s*"pump"\s*:\s*(true|false)\s*,\s*"reasoning"\s*:\s*"([^"]*)', response_text)
                            if match:
                                pump_value = match.group(1)
                                reasoning = match.group(2)
                                # Truncate reasoning to avoid potential unterminated strings
                                reasoning = reasoning[:500]  # Limit to 500 chars
                                # Create a proper JSON manually
                                response_text = f'{{"pump": {pump_value}, "reasoning": "{reasoning}"}}'
                                logger.debug(f"Fixed JSON: {response_text}")
                        
                        # Extract JSON from the cleaned response
                        response_json = json.loads(response_text)
                        
                        # Check if response has required fields
                        if "pump" in response_json and "reasoning" in response_json:
                            pump_decision = bool(response_json["pump"])
                            reasoning = response_json["reasoning"]
                            
                            # Update AI decision in state
                            device_state.set_ai_decision(device_id, pump_decision, reasoning)
                            
                            # Send command if decision is different from current state
                            if pump_decision != sensor_data.pumpState:
                                await send_pump_command(device_id, pump_decision, False)
                                
                                logger.info(f"AI decision for {device_id}: Pump {'ON' if pump_decision else 'OFF'}")
                                logger.info(f"Reasoning: {reasoning}")
                            
                            return pump_decision, reasoning
                        else:
                            logger.error(f"Invalid response format from AI: {response_json}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse AI response as JSON: {response_text}")
                        logger.error(f"JSON error: {str(e)}")
                else:
                    logger.error(f"Unexpected response format: {response_json}")
            else:
                response_text = response.text
                logger.error(f"Gemini API error: {response.status_code} {response_text}")
        
        except Exception as e:
            logger.error(f"Error processing with Gemini AI: {e}")
    
    return None, None

# API Routes
@app.get("/")
async def root():
    return {"message": "Smart Irrigation System API"}

@app.get("/devices")
async def get_devices():
    return device_state.get_all_devices()

@app.get("/devices/{device_id}")
async def get_device(device_id: str):
    device = device_state.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.post("/devices/{device_id}/pump")
async def control_pump(device_id: str, command: PumpCommand):
    device = device_state.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    success = await send_pump_command(device_id, command.pump, command.manual)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send pump command")
    
    return {"success": True, "message": f"Pump command sent: {'ON' if command.pump else 'OFF'}"}

@app.get("/devices/{device_id}/ai-decision")
async def get_ai_decision(device_id: str):
    device = device_state.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    decision, reasoning = device_state.get_ai_decision(device_id)
    
    if decision is None:
        # Trigger a new AI analysis
        decision, reasoning = await process_with_ai(device_id, device)
    
    return {
        "device_id": device_id,
        "pump_decision": decision,
        "reasoning": reasoning,
        "current_data": device
    }

@app.post("/devices/{device_id}/analyze")
async def force_ai_analysis(device_id: str):
    device = device_state.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    decision, reasoning = await process_with_ai(device_id, device)
    
    if decision is None:
        raise HTTPException(status_code=500, detail="Failed to get AI decision")
    
    return {
        "device_id": device_id,
        "pump_decision": decision,
        "reasoning": reasoning,
        "current_data": device
    }

@app.get("/telemetry/{device_id}")
async def get_telemetry(device_id: str):
    docs = list(telemetry_collection.find({"deviceId": device_id}).sort("timestamp", -1).limit(100))
    for doc in docs:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string for JSON
    return docs

@app.get("/api/readings/history")
async def get_readings_history(device_id: str, days: int = 7):
    since = datetime.now() - timedelta(days=days)
    docs = list(telemetry_collection.find({
        "deviceId": device_id,
        "timestamp": {"$gte": since}
    }).sort("timestamp", 1))
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    global mqtt_client, mqtt_listener_thread
    
    # Start MQTT message processing task
    asyncio.create_task(process_mqtt_messages())
    
    # Start MQTT client in a separate thread
    mqtt_listener_thread = threading.Thread(target=start_mqtt_client, daemon=True)
    mqtt_listener_thread.start()
    
    logger.info("MQTT background thread started")

@app.on_event("shutdown")
async def shutdown_event():
    global mqtt_client
    
    # Disconnect MQTT client
    if mqtt_client:
        mqtt_client.disconnect()
        mqtt_client = None
        logger.info("MQTT client disconnected")

# Run the app with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 