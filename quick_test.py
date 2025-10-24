#!/usr/bin/env python3
"""
Quick Manual Test for AppointEase Atomic Booking
Run this to test the double booking prevention system
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost/wordpress/blog.promoplus.com"
API_URL = f"{BASE_URL}/wp-json/appointease/v1"

def test_basic_booking():
    """Test basic booking functionality"""
    print("🧪 Testing Basic Booking...")
    
    # Test data
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:30:00")
    
    booking_data = {
        "name": "John Doe",
        "email": "john@test.com",
        "phone": "555-0123",
        "date": tomorrow,
        "service_id": 1,
        "employee_id": 1
    }
    
    try:
        response = requests.post(
            f"{API_URL}/appointments",
            json=booking_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if result.get('success'):
            print("✅ Booking successful!")
            return result.get('strong_id')
        else:
            print("❌ Booking failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_double_booking(existing_booking_id=None):
    """Test double booking prevention"""
    print("\n⚡ Testing Double Booking Prevention...")
    
    # Same slot as previous booking
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:30:00")
    
    conflict_data = {
        "name": "Jane Smith", 
        "email": "jane@test.com",
        "phone": "555-0124",
        "date": tomorrow,
        "service_id": 1,
        "employee_id": 1
    }
    
    try:
        response = requests.post(
            f"{API_URL}/appointments",
            json=conflict_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 409 or 'slot_taken' in str(result):
            print("✅ Double booking prevented!")
        elif result.get('success'):
            print("❌ Double booking allowed - this should not happen!")
        else:
            print("⚠️ Unexpected response")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_availability():
    """Test availability checking"""
    print("\n🔍 Testing Availability API...")
    
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    try:
        response = requests.post(
            f"{BASE_URL}/wp-json/booking/v1/availability",
            json={
                "date": tomorrow,
                "employee_id": 1
            },
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Unavailable slots: {result.get('unavailable', [])}")
        
        if response.status_code == 200:
            print("✅ Availability API working")
        else:
            print("❌ Availability API failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def cleanup_booking(booking_id):
    """Clean up test booking"""
    if not booking_id:
        return
        
    print(f"\n🧹 Cleaning up booking {booking_id}...")
    
    try:
        response = requests.delete(f"{API_URL}/appointments/{booking_id}")
        
        if response.status_code == 200:
            print("✅ Booking cancelled")
        else:
            print("⚠️ Could not cancel booking")
            
    except Exception as e:
        print(f"❌ Cleanup error: {e}")

def main():
    """Run all tests"""
    print("🚀 AppointEase Quick Test Suite")
    print("=" * 40)
    
    # Test 1: Basic booking
    booking_id = test_basic_booking()
    
    # Test 2: Double booking prevention
    test_double_booking(booking_id)
    
    # Test 3: Availability API
    test_availability()
    
    # Cleanup
    cleanup_booking(booking_id)
    
    print("\n✨ Tests completed!")
    print("=" * 40)

if __name__ == "__main__":
    main()