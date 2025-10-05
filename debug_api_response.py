#!/usr/bin/env python3
"""
Debug API Response Script
"""

import requests

def debug_api():
    base_url = "http://localhost/wordpress/blog.promoplus.com"
    
    print("DEBUG API RESPONSE")
    print("=" * 40)
    
    # Test Settings API
    print("\nTesting Settings API:")
    try:
        response = requests.get(f"{base_url}/wp-json/appointease/v1/settings")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Raw Content: {response.content}")
        print(f"Text Content: {response.text}")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                data = response.json()
                print(f"JSON Data: {data}")
            except:
                print("Failed to parse as JSON")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_api()