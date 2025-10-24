#!/usr/bin/env python3
"""Test Available Endpoints"""
import requests, json

BASE_URL = "http://blog.promoplus.com"

def check_endpoints():
    print("🔍 Checking Available Endpoints")
    print("=" * 40)
    
    # Get all REST routes
    try:
        response = requests.get(f"{BASE_URL}/wp-json/")
        if response.status_code == 200:
            data = response.json()
            routes = data.get('routes', {})
            
            # Find booking-related routes
            booking_routes = [route for route in routes.keys() if 'booking' in route or 'appointease' in route]
            
            print("📋 Available booking routes:")
            for route in sorted(booking_routes):
                methods = routes[route].get('methods', [])
                print(f"  {route} - {methods}")
            
            # Test specific endpoints
            test_urls = [
                f"{BASE_URL}/wp-json/booking/v1/services",
                f"{BASE_URL}/wp-json/appointease/v1/services", 
                f"{BASE_URL}/wp-json/booking/v1/staff",
                f"{BASE_URL}/wp-json/appointease/v1/appointments"
            ]
            
            print("\n🧪 Testing endpoints:")
            for url in test_urls:
                try:
                    resp = requests.get(url, timeout=5)
                    print(f"  GET {url.split('/')[-2:]}: {resp.status_code}")
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"    Response: {len(data) if isinstance(data, list) else 'object'}")
                except Exception as e:
                    print(f"  GET {url.split('/')[-2:]}: Error - {e}")
            
            # Test POST to appointments
            print("\n📝 Testing appointment creation:")
            booking_data = {
                "name": "Test User",
                "email": "test@example.com", 
                "phone": "555-0123",
                "date": "2025-01-17 10:00:00",
                "service_id": 1,
                "employee_id": 1
            }
            
            post_urls = [
                f"{BASE_URL}/wp-json/appointease/v1/appointments",
                f"{BASE_URL}/wp-json/booking/v1/appointments"
            ]
            
            for url in post_urls:
                try:
                    resp = requests.post(url, json=booking_data, timeout=10)
                    print(f"  POST {url.split('/')[-2:]}: {resp.status_code}")
                    print(f"    Response: {resp.text[:100]}...")
                except Exception as e:
                    print(f"  POST {url.split('/')[-2:]}: Error - {e}")
                    
        else:
            print(f"❌ Failed to get REST routes: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_endpoints()