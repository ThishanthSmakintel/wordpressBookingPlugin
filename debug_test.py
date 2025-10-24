#!/usr/bin/env python3
"""Debug Test - Check API endpoints and responses"""
import requests

BASE_URL = "http://localhost/wordpress/blog.promoplus.com"

def check_endpoint(url, method="GET", data=None):
    print(f"\n🔍 Testing: {method} {url}")
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'}, timeout=10)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Raw Response: {response.text[:200]}...")
        
        if response.text:
            try:
                json_data = response.json()
                print(f"JSON: {json_data}")
            except:
                print("❌ Not valid JSON")
        else:
            print("❌ Empty response")
            
    except Exception as e:
        print(f"❌ Error: {e}")

# Test WordPress REST API
print("🚀 WordPress REST API Debug")
print("=" * 50)

# Check if WordPress is running
check_endpoint(f"{BASE_URL}")

# Check REST API root
check_endpoint(f"{BASE_URL}/wp-json/")

# Check our plugin endpoints
check_endpoint(f"{BASE_URL}/wp-json/appointease/v1/services")
check_endpoint(f"{BASE_URL}/wp-json/booking/v1/services")

# Test appointment creation
tomorrow = "2025-01-16 10:00:00"
booking_data = {
    "name": "Test User",
    "email": "test@example.com", 
    "phone": "555-0123",
    "date": tomorrow,
    "service_id": 1,
    "employee_id": 1
}

check_endpoint(f"{BASE_URL}/wp-json/appointease/v1/appointments", "POST", booking_data)

# Check availability
check_endpoint(f"{BASE_URL}/wp-json/booking/v1/availability", "POST", {"date": "2025-01-16", "employee_id": 1})

print("\n" + "=" * 50)
print("Debug complete. Check if:")
print("1. WordPress is running on localhost")
print("2. Plugin is activated") 
print("3. Database tables exist")
print("4. REST API is enabled")