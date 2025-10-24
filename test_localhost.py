#!/usr/bin/env python3
"""Localhost Test - Direct XAMPP access"""
import requests, json
from datetime import datetime, timedelta

# Try different URL patterns
URLS_TO_TRY = [
    "http://localhost/blog.promoplus.com",
    "http://localhost/wordpress/blog.promoplus.com", 
    "http://localhost:80/blog.promoplus.com",
    "http://blog.promoplus.com",
    "http://localhost"
]

def find_wordpress():
    """Find the correct WordPress URL"""
    for url in URLS_TO_TRY:
        try:
            print(f"🔍 Trying: {url}")
            response = requests.get(url, timeout=3)
            
            if response.status_code == 200:
                # Check if it's WordPress
                if 'wp-content' in response.text or 'wp-json' in response.text:
                    print(f"✅ Found WordPress at: {url}")
                    
                    # Test REST API
                    rest_url = f"{url}/wp-json/"
                    rest_response = requests.get(rest_url, timeout=3)
                    
                    if rest_response.status_code == 200:
                        print(f"✅ REST API working at: {rest_url}")
                        return url
                    else:
                        print(f"❌ REST API not working: {rest_response.status_code}")
                        
        except Exception as e:
            print(f"❌ Failed: {e}")
            
    return None

def test_booking_api(base_url):
    """Test booking API with found URL"""
    api_url = f"{base_url}/wp-json/appointease/v1"
    
    # Test services endpoint
    try:
        services_response = requests.get(f"{base_url}/wp-json/booking/v1/services", timeout=5)
        if services_response.status_code == 200:
            services = services_response.json()
            print(f"✅ Services API working: {len(services)} services found")
        else:
            print(f"❌ Services API failed: {services_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Services API error: {e}")
        return False
    
    # Test booking creation
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
        booking_response = requests.post(
            f"{api_url}/appointments",
            json=booking_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Booking Status: {booking_response.status_code}")
        print(f"Booking Response: {booking_response.text[:200]}")
        
        if booking_response.status_code == 200:
            result = booking_response.json()
            if result.get('success'):
                print("✅ Booking API working!")
                
                # Cleanup
                booking_id = result.get('strong_id')
                if booking_id:
                    requests.delete(f"{api_url}/appointments/{booking_id}")
                    
                return True
            else:
                print(f"❌ Booking failed: {result}")
        else:
            print(f"❌ Booking HTTP error: {booking_response.status_code}")
            
    except Exception as e:
        print(f"❌ Booking error: {e}")
        
    return False

def main():
    print("🔍 Finding WordPress Installation...")
    print("=" * 40)
    
    wordpress_url = find_wordpress()
    
    if wordpress_url:
        print(f"\n🎯 Testing APIs at: {wordpress_url}")
        print("=" * 40)
        
        if test_booking_api(wordpress_url):
            print("\n🎉 Atomic booking system is working!")
            print(f"Use this URL in your tests: {wordpress_url}")
        else:
            print("\n❌ Booking API not working")
    else:
        print("\n❌ WordPress not found. Check XAMPP and installation.")

if __name__ == "__main__":
    main()