#!/usr/bin/env python3
"""
Detailed API Testing Script for AppointEase WordPress Plugin
Shows actual response data from each endpoint.
"""

import requests
import json
from datetime import datetime, timedelta

def test_api_detailed():
    base_url = "http://localhost/wordpress/blog.promoplus.com"
    
    print("DETAILED API TEST RESULTS")
    print("=" * 60)
    
    # Test Settings API (the one causing issues)
    print("\n1. SETTINGS API TEST")
    print("-" * 30)
    try:
        response = requests.get(f"{base_url}/wp-json/appointease/v1/settings")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
            
            # Check if time_slots exist
            if 'time_slots' in data:
                print(f"\nTime Slots Found: {len(data['time_slots'])}")
                print(f"Slots: {data['time_slots']}")
            else:
                print("\nWARNING: No time_slots in response!")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test Services
    print("\n\n2. SERVICES API TEST")
    print("-" * 30)
    try:
        response = requests.get(f"{base_url}/wp-json/booking/v1/services")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Services Found: {len(data)}")
            for service in data:
                print(f"  - {service.get('name', 'Unknown')} (ID: {service.get('id')})")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test Staff
    print("\n\n3. STAFF API TEST")
    print("-" * 30)
    try:
        response = requests.get(f"{base_url}/wp-json/booking/v1/staff")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Staff Found: {len(data)}")
            for staff in data:
                print(f"  - {staff.get('name', 'Unknown')} (ID: {staff.get('id')})")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test Availability
    print("\n\n4. AVAILABILITY API TEST")
    print("-" * 30)
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        response = requests.post(f"{base_url}/wp-json/booking/v1/availability", 
                               json={'date': tomorrow, 'employee_id': 1})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Date: {tomorrow}")
            print(f"Unavailable slots: {data.get('unavailable', [])}")
            if 'booking_details' in data:
                print(f"Booking details: {len(data['booking_details'])} slots booked")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test Business Hours
    print("\n\n5. BUSINESS HOURS API TEST")
    print("-" * 30)
    try:
        response = requests.get(f"{base_url}/wp-json/appointease/v1/business-hours")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Business Hours:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test Time Slots
    print("\n\n6. TIME SLOTS API TEST")
    print("-" * 30)
    try:
        response = requests.get(f"{base_url}/wp-json/appointease/v1/time-slots")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Time Slots Response:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_api_detailed()