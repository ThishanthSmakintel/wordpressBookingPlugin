#!/usr/bin/env python3
"""Simple Atomic Booking Test - No Auth Required"""
import requests, json, time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://blog.promoplus.com"

def test_atomic_booking():
    print("🧪 Testing Atomic Booking System")
    print("=" * 40)
    
    # Test 1: Single booking
    print("\n📝 Test 1: Single Booking")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:00:00")
    
    booking_data = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "555-0123",
        "date": tomorrow,
        "service_id": 1,
        "employee_id": 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/wp-json/booking/v1/appointments",  # Try legacy endpoint
            json=booking_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('id'):
                print("✅ Single booking successful!")
                booking_id = result.get('id')
                
                # Test 2: Double booking (should fail)
                print("\n⚡ Test 2: Double Booking Prevention")
                
                conflict_data = booking_data.copy()
                conflict_data['name'] = "Conflict User"
                conflict_data['email'] = "conflict@test.com"
                
                conflict_response = requests.post(
                    f"{BASE_URL}/wp-json/booking/v1/appointments",
                    json=conflict_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                print(f"Conflict Status: {conflict_response.status_code}")
                print(f"Conflict Response: {conflict_response.text}")
                
                if conflict_response.status_code != 200:
                    print("✅ Double booking prevented!")
                else:
                    print("❌ Double booking allowed")
                
                # Cleanup
                try:
                    requests.delete(f"{BASE_URL}/wp-json/booking/v1/appointments/{booking_id}")
                    print("🧹 Cleanup completed")
                except:
                    pass
                    
            else:
                print("❌ Booking failed - no ID returned")
        else:
            print(f"❌ Booking failed - HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Race condition
    print("\n🏃 Test 3: Race Condition")
    
    def make_concurrent_booking(i):
        data = {
            "name": f"User{i}",
            "email": f"user{i}@test.com",
            "phone": f"555-012{i}",
            "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 11:00:00"),
            "service_id": 1,
            "employee_id": 1
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/wp-json/booking/v1/appointments",
                json=data,
                timeout=10
            )
            return response.status_code == 200, response.json() if response.status_code == 200 else response.text
        except Exception as e:
            return False, str(e)
    
    # Run 3 concurrent bookings
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(make_concurrent_booking, i) for i in range(3)]
        results = [future.result() for future in futures]
    
    successful = [r for r in results if r[0]]
    failed = [r for r in results if not r[0]]
    
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if len(successful) == 1:
        print("✅ Race condition handled correctly!")
        # Cleanup
        if successful[0][1].get('id'):
            try:
                requests.delete(f"{BASE_URL}/wp-json/booking/v1/appointments/{successful[0][1]['id']}")
            except:
                pass
    else:
        print("❌ Race condition not handled properly")
    
    print("\n🎯 Test Summary:")
    print("- Single booking: ✅" if len(successful) > 0 else "- Single booking: ❌")
    print("- Double booking prevention: ✅" if len(failed) > 0 else "- Double booking prevention: ❌") 
    print("- Race condition: ✅" if len(successful) == 1 else "- Race condition: ❌")

if __name__ == "__main__":
    test_atomic_booking()