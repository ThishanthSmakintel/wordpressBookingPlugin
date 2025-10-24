#!/usr/bin/env python3
"""
Atomic Booking Test Suite
Tests the industry-standard double booking prevention system
"""

import requests
import json
import time
import threading
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

class BookingTester:
    def __init__(self, base_url="http://localhost/wordpress/blog.promoplus.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/wp-json/appointease/v1"
        self.session = requests.Session()
        
    def test_atomic_booking(self):
        """Test atomic booking with race conditions"""
        print("🧪 Testing Atomic Booking System...")
        
        # Test data
        test_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:00:00")
        
        booking_data = {
            "name": "Test User",
            "email": "test@example.com", 
            "phone": "555-0123",
            "date": test_date,
            "service_id": 1,
            "employee_id": 1
        }
        
        # Test 1: Single booking (should succeed)
        print("\n📝 Test 1: Single booking")
        result = self.create_booking(booking_data)
        if result.get('success'):
            print("✅ Single booking successful")
            booking_id = result.get('strong_id')
            
            # Clean up
            self.cancel_booking(booking_id)
        else:
            print("❌ Single booking failed:", result)
            
        # Test 2: Concurrent bookings (race condition test)
        print("\n⚡ Test 2: Concurrent bookings (race condition)")
        self.test_race_condition(booking_data)
        
        # Test 3: Idempotency test
        print("\n🔄 Test 3: Idempotency test")
        self.test_idempotency(booking_data)
        
        # Test 4: Conflict detection
        print("\n⚠️ Test 4: Conflict detection")
        self.test_conflict_detection(booking_data)
        
    def create_booking(self, data, idempotency_key=None):
        """Create a booking with optional idempotency key"""
        headers = {'Content-Type': 'application/json'}
        if idempotency_key:
            headers['X-Idempotency-Key'] = idempotency_key
            
        try:
            response = self.session.post(
                f"{self.api_base}/appointments",
                json=data,
                headers=headers,
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
            
    def cancel_booking(self, booking_id):
        """Cancel a booking"""
        try:
            response = self.session.delete(f"{self.api_base}/appointments/{booking_id}")
            return response.json()
        except Exception as e:
            return {"error": str(e)}
            
    def check_slot(self, date, time, employee_id):
        """Check if slot is available"""
        try:
            response = self.session.post(
                f"{self.api_base}/check-slot",
                json={
                    "date": date.split()[0],
                    "time": time,
                    "employee_id": employee_id
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
            
    def test_race_condition(self, booking_data):
        """Test race condition with multiple concurrent requests"""
        num_threads = 5
        results = []
        
        def make_booking(thread_id):
            data = booking_data.copy()
            data['name'] = f"User {thread_id}"
            data['email'] = f"user{thread_id}@example.com"
            
            start_time = time.time()
            result = self.create_booking(data)
            end_time = time.time()
            
            return {
                'thread_id': thread_id,
                'result': result,
                'duration': end_time - start_time
            }
        
        # Execute concurrent bookings
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(make_booking, i) for i in range(num_threads)]
            
            for future in as_completed(futures):
                results.append(future.result())
        
        # Analyze results
        successful = [r for r in results if r['result'].get('success')]
        failed = [r for r in results if not r['result'].get('success')]
        
        print(f"   Successful bookings: {len(successful)}")
        print(f"   Failed bookings: {len(failed)}")
        
        if len(successful) == 1:
            print("✅ Race condition handled correctly - only 1 booking succeeded")
            # Clean up successful booking
            if successful[0]['result'].get('strong_id'):
                self.cancel_booking(successful[0]['result']['strong_id'])
        else:
            print("❌ Race condition failed - multiple bookings succeeded")
            
        # Show conflict reasons
        for fail in failed:
            if 'slot_taken' in str(fail['result']):
                print("✅ Proper conflict detection:", fail['result'].get('message', 'Slot taken'))
                
    def test_idempotency(self, booking_data):
        """Test idempotency key functionality"""
        idempotency_key = f"test_key_{int(time.time())}"
        
        # First request
        result1 = self.create_booking(booking_data, idempotency_key)
        
        # Second request with same key (should be duplicate)
        result2 = self.create_booking(booking_data, idempotency_key)
        
        if result1.get('success') and 'duplicate' in str(result2).lower():
            print("✅ Idempotency working - duplicate detected")
            if result1.get('strong_id'):
                self.cancel_booking(result1['strong_id'])
        else:
            print("❌ Idempotency failed")
            print("   First result:", result1)
            print("   Second result:", result2)
            
    def test_conflict_detection(self, booking_data):
        """Test real-time conflict detection"""
        # Create first booking
        result1 = self.create_booking(booking_data)
        
        if result1.get('success'):
            booking_id = result1.get('strong_id')
            
            # Try to book same slot (should detect conflict)
            conflict_data = booking_data.copy()
            conflict_data['name'] = "Conflict User"
            conflict_data['email'] = "conflict@example.com"
            
            result2 = self.create_booking(conflict_data)
            
            if not result2.get('success') and 'slot' in str(result2).lower():
                print("✅ Conflict detection working")
                
                # Check for suggested slots
                if result2.get('data', {}).get('suggested_slots'):
                    print("✅ Suggested alternatives provided")
                else:
                    print("⚠️ No suggested alternatives")
            else:
                print("❌ Conflict detection failed")
                print("   Result:", result2)
                
            # Clean up
            self.cancel_booking(booking_id)
        else:
            print("❌ Could not create initial booking for conflict test")
            
    def test_availability_api(self):
        """Test availability checking API"""
        print("\n🔍 Testing Availability API...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        try:
            response = self.session.post(
                f"{self.base_url}/wp-json/booking/v1/availability",
                json={
                    "date": tomorrow,
                    "employee_id": 1
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Availability API working")
                print(f"   Unavailable slots: {len(data.get('unavailable', []))}")
            else:
                print("❌ Availability API failed:", response.status_code)
                
        except Exception as e:
            print("❌ Availability API error:", str(e))
            
    def test_otp_system(self):
        """Test OTP generation and verification"""
        print("\n🔐 Testing OTP System...")
        
        test_email = "test@example.com"
        
        # Generate OTP
        try:
            response = self.session.post(
                f"{self.api_base}/generate-otp",
                json={"email": test_email}
            )
            
            if response.status_code == 200:
                print("✅ OTP generation successful")
                
                # Test verification with wrong OTP
                verify_response = self.session.post(
                    f"{self.api_base}/verify-otp",
                    json={"email": test_email, "otp": "000000"}
                )
                
                if verify_response.status_code != 200:
                    print("✅ OTP verification correctly rejects invalid code")
                else:
                    print("⚠️ OTP verification accepted invalid code")
                    
            else:
                print("❌ OTP generation failed:", response.status_code)
                
        except Exception as e:
            print("❌ OTP system error:", str(e))
            
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting AppointEase Atomic Booking Test Suite")
        print("=" * 50)
        
        start_time = time.time()
        
        try:
            self.test_atomic_booking()
            self.test_availability_api()
            self.test_otp_system()
            
        except Exception as e:
            print(f"❌ Test suite error: {e}")
            
        end_time = time.time()
        print(f"\n⏱️ Tests completed in {end_time - start_time:.2f} seconds")
        print("=" * 50)

if __name__ == "__main__":
    # Configuration
    BASE_URL = "http://localhost/wordpress/blog.promoplus.com"
    
    print("AppointEase Atomic Booking Test Suite")
    print("Testing double booking prevention system...")
    
    tester = BookingTester(BASE_URL)
    tester.run_all_tests()