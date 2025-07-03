import os
import json
import asyncio
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key 
API_KEY = "AIzaSyDxpFc98FziE5m7SqdWvHileish4xkkgjw"
print(f"API Key: {'Found (first 5 chars: ' + API_KEY[:5] + '...)' if API_KEY else 'Not found'}")

async def test_gemini():
    try:
        # Define the API URL with the API key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={API_KEY}"
        
        # Define the request payload
        payload = {
            "contents": [{
                "parts": [{
                    "text": "Hello, please respond with: I am working!"
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "topK": 40,
                "maxOutputTokens": 100
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
        
        print("Making request to Gemini API...")
        
        # Send the request to the API
        response = await asyncio.to_thread(
            lambda: requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            response_json = response.json()
            print(f"Response received!")
            
            # Extract the text from the response
            if (response_json and 
                "candidates" in response_json and 
                len(response_json["candidates"]) > 0 and 
                "content" in response_json["candidates"][0] and
                "parts" in response_json["candidates"][0]["content"] and
                len(response_json["candidates"][0]["content"]["parts"]) > 0 and
                "text" in response_json["candidates"][0]["content"]["parts"][0]):
                
                text = response_json["candidates"][0]["content"]["parts"][0]["text"]
                print(f"Response text: {text}")
                return True
            else:
                print(f"Unexpected response format: {response_json}")
                return False
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

# Run the test
if __name__ == "__main__":
    result = asyncio.run(test_gemini())
    
    if result:
        print("✅ Gemini API test successful!")
    else:
        print("❌ Gemini API test failed.")
        print("Suggestion: Make sure you've set the GEMINI_API_KEY environment variable or hardcoded it correctly.") 