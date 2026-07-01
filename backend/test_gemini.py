import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_mock_flow():
    print("Testing Audio Khata backend endpoint...")
    url = "http://127.0.0.1:8000/audio-khata"
    
    # We will simulate sending a tiny dummy file to see if the endpoint is up and returns the correct schema
    try:
        dummy_file = {"audio": ("test.m4a", b"dummy_audio_bytes_data")}
        response = requests.post(url, files=dummy_file)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response Keys:", list(data.keys()))
            if "reply" in data:
                print("Reply length:", len(data["reply"]))
            # Check keys
            expected_keys = ["amount", "type", "reason", "reply", "tts_language", "status"]
            missing_keys = [k for k in expected_keys if k not in data]
            
            if not missing_keys:
                print("Success: All expected keys are present in the response!")
            else:
                print(f"Error: Missing keys {missing_keys}")
        else:
            print(f"Error: Server returned non-200 status: {response.text}")
    except requests.exceptions.ConnectionError:
        print("Note: Could not connect to http://127.0.0.1:8000. Make sure uvicorn is running to test live connections.")

if __name__ == "__main__":
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        print("WARNING: GEMINI_API_KEY is not set or is placeholder. The backend will use mock fallback mode.")
    else:
        print("GEMINI_API_KEY is detected in environment!")
        
    test_mock_flow()
