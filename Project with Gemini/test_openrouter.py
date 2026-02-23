import os
import json
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
api_key = os.getenv("GEMINI_API_KEY", "")
print(f"API Key: {'Found (first 5 chars: ' + api_key[:5] + '...)' if api_key else 'Not found'}")

# Test function to call OpenRouter API
async def test_openrouter():
    # Create HTTP client
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://localhost:8300",
            "X-Title": "API Test", 
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "anthropic/claude-3-haiku",
            "messages": [
                {"role": "user", "content": "Hello, please respond with: I am working!"}
            ],
            "max_tokens": 50
        }
        
        print("Making request to OpenRouter API...")
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"Response status code: {response.status_code}")
            response_data = response.text
            print(f"Response: {response_data}")
            
            if response.status_code == 200:
                response_json = response.json()
                message = response_json["choices"][0]["message"]["content"]
                print(f"AI response: {message}")
                return True
            else:
                return False
                
        except Exception as e:
            print(f"Error: {e}")
            return False

# Run the test
if __name__ == "__main__":
    import asyncio
    result = asyncio.run(test_openrouter())
    
    if result:
        print("✅ API test successful!")
    else:
        print("❌ API test failed. Please check your API key and try again.")
        print("Suggestion: Make sure you've set the GEMINI_API_KEY environment variable in your .env file.")
        print("Format should be: GEMINI_API_KEY=your-openrouter-api-key") 