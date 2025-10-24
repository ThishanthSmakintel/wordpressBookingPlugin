#!/usr/bin/env python3
"""Complete AppointEase Atomic Booking Test Suite"""
import requests, json, time, threading
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost/wordpress/blog.promoplus.com"
API_URL = f"{BASE_URL}/wp-json/appointease/v1"

class AtomicBookingTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = {"passed": 0, "failed": 0, "tests": []}
    
    def log(self, test, status, message):
        icon = "✅" if status else "❌"
        print(f"{icon} {test}: {message}")
        self.results["tests"].append({"test": test, "status": status, "message": message})
        if status: self.results["passed"] += 1
        else: self.results["failed"] += 1
    
    def create_booking(self, data, idempotency_key=None):
        headers = {'Content-Type': 'application/json'}
        if idempotency_key: headers['X-Idempotency-Key'] = idempotency_key
        try:
            response = self.session.post(f"{API_URL}/appointments", json=data, headers=headers, timeout=10)
            return response.status_code, response.json()
        except Exception as e:
            return 500, {"error": str(e)}
    
    def cancel_booking(self, booking_id):
        try:
            response = self.session.delete(f"{API_URL}/appointments/{booking_id}")
            return response.status_code == 200
        except: return False
    
    def test_single_booking(self):
        """Test basic booking functionality"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:00:00")
        data = {"name": "Test User", "email": "test@example.com", "phone": "555-0123", 
                "date": tomorrow, "service_id": 1, "employee_id": 1}
        
        status_code, result = self.create_booking(data)
        
        if status_code == 200 and result.get('success'):
            booking_id = result.get('strong_id')
            self.log("Single Booking", True, f"Created booking {booking_id}")
            self.cancel_booking(booking_id)
            return booking_id
        else:
            self.log("Single Booking", False, f"Failed: {result}")
            return None
    
    def test_race_condition(self):
        """Test concurrent booking race condition"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 11:00:00")
        
        def make_booking(i):
            data = {"name": f"User{i}", "email": f"user{i}@test.com", "phone": f"555-012{i}",
                    "date": tomorrow, "service_id": 1, "employee_id": 1}
            return self.create_booking(data)
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_booking, i) for i in range(5)]
            results = [future.result() for future in as_completed(futures)]
        
        successful = [r for r in results if r[0] == 200 and r[1].get('success')]
        conflicts = [r for r in results if 'slot_taken' in str(r[1]) or r[0] == 409]
        
        if len(successful) == 1 and len(conflicts) >= 3:
            self.log("Race Condition", True, f"1 success, {len(conflicts)} conflicts detected")
            if successful[0][1].get('strong_id'):
                self.cancel_booking(successful[0][1]['strong_id'])
        else:
            self.log("Race Condition", False, f"{len(successful)} successes (should be 1)")
    
    def test_idempotency(self):
        """Test idempotency key functionality"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 12:00:00")
        data = {"name": "Idempotent User", "email": "idem@test.com", "phone": "555-0199",
                "date": tomorrow, "service_id": 1, "employee_id": 1}
        key = f"test_key_{int(time.time())}"
        
        status1, result1 = self.create_booking(data, key)
        status2, result2 = self.create_booking(data, key)
        
        if result1.get('success') and ('duplicate' in str(result2).lower() or status2 == 409):
            self.log("Idempotency", True, "Duplicate submission prevented")
            if result1.get('strong_id'): self.cancel_booking(result1['strong_id'])
        else:
            self.log("Idempotency", False, f"Failed to prevent duplicate: {result2}")
    
    def test_conflict_detection(self):
        """Test slot conflict detection"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 13:00:00")
        data1 = {"name": "First User", "email": "first@test.com", "phone": "555-0001",
                 "date": tomorrow, "service_id": 1, "employee_id": 1}
        data2 = {"name": "Second User", "email": "second@test.com", "phone": "555-0002",
                 "date": tomorrow, "service_id": 1, "employee_id": 1}
        
        status1, result1 = self.create_booking(data1)
        status2, result2 = self.create_booking(data2)
        
        if result1.get('success') and (status2 == 409 or 'slot' in str(result2).lower()):
            self.log("Conflict Detection", True, "Slot conflict properly detected")
            if result1.get('strong_id'): self.cancel_booking(result1['strong_id'])
        else:
            self.log("Conflict Detection", False, f"Conflict not detected: {result2}")
    
    def test_availability_api(self):
        """Test availability checking"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        try:
            response = self.session.post(f"{BASE_URL}/wp-json/booking/v1/availability",
                                       json={"date": tomorrow, "employee_id": 1}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log("Availability API", True, f"Working - {len(data.get('unavailable', []))} slots unavailable")
            else:
                self.log("Availability API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log("Availability API", False, f"Error: {e}")
    
    def test_otp_system(self):
        """Test OTP generation"""
        try:
            response = self.session.post(f"{API_URL}/generate-otp", json={"email": "test@example.com"}, timeout=10)
            if response.status_code == 200:
                self.log("OTP Generation", True, "OTP generated successfully")
                
                # Test invalid OTP
                verify = self.session.post(f"{API_URL}/verify-otp", 
                                         json={"email": "test@example.com", "otp": "000000"})
                if verify.status_code != 200:
                    self.log("OTP Verification", True, "Invalid OTP rejected")
                else:
                    self.log("OTP Verification", False, "Invalid OTP accepted")
            else:
                self.log("OTP Generation", False, f"Status {response.status_code}")
        except Exception as e:
            self.log("OTP System", False, f"Error: {e}")
    
    def test_check_slot_api(self):
        """Test slot checking API"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        try:
            response = self.session.post(f"{API_URL}/check-slot",
                                       json={"date": tomorrow, "time": "14:00", "employee_id": 1}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log("Check Slot API", True, f"Available: {data.get('available', False)}")
            else:
                self.log("Check Slot API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log("Check Slot API", False, f"Error: {e}")
    
    def run_all_tests(self):
        """Execute complete test suite"""
        print("🚀 AppointEase Atomic Booking Test Suite")
        print("=" * 50)
        start_time = time.time()
        
        try:
            self.test_single_booking()
            self.test_race_condition()
            self.test_idempotency()
            self.test_conflict_detection()
            self.test_availability_api()
            self.test_otp_system()
            self.test_check_slot_api()
        except Exception as e:
            print(f"❌ Test suite error: {e}")
        
        end_time = time.time()
        print("\n" + "=" * 50)
        print(f"📊 Results: {self.results['passed']} passed, {self.results['failed']} failed")
        print(f"⏱️  Duration: {end_time - start_time:.2f}s")
        
        if self.results['failed'] == 0:
            print("🎉 All tests passed! Atomic booking system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the atomic booking implementation.")

if __name__ == "__main__":
    tester = AtomicBookingTester()
    tester.run_all_tests()