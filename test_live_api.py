#!/usr/bin/env python3
"""
Test Live API for AppointEase WordPress Plugin
"""

import requests
import json
from datetime import datetime, timedelta

def test_live_api():
    base_url = "http://blog.promoplus.com"
    
    print("TESTING LIVE API: blog.promoplus.com")
    print("=" * 50)
    
    endpoints = [
        ('/wp-json/appointease/v1/settings', 'Settings'),
        ('/wp-json/booking/v1/services', 'Services'),
        ('/wp-json/booking/v1/staff', 'Staff'),
        ('/wp-json/appointease/v1/business-hours', 'Business Hours'),
        ('/wp-json/appointease/v1/time-slots', 'Time Slots'),
        ('/wp-json/appointease/v1/server-date', 'Server Date')
    ]
    
    for endpoint, name in endpoints:
        print(f"\nTesting {name}:")
        print(f"URL: {base_url}{endpoint}")
        
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print("SUCCESS - JSON Response:")
                    print(json.dumps(data, indent=2)[:500] + "..." if len(str(data)) > 500 else json.dumps(data, indent=2))
                except:
                    print(f"SUCCESS - Text Response: {response.text[:200]}...")
            else:
                print(f"ERROR: {response.text[:200]}...")
                
        except requests.exceptions.Timeout:
            print("ERROR: Request timeout")
        except requests.exceptions.ConnectionError:
            print("ERROR: Connection failed")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    test_live_api()