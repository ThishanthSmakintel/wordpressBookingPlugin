#!/usr/bin/env python3
"""Fixed AppointEase Test - Correct WordPress URL"""
import requests, json, time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# Fixed URL - WordPress is at root, not in subdirectory
BASE_URL = "http://blog.promoplus.com"
API_URL = f"{BASE_URL}/wp-json/appointease/v1"

class FixedTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = {"passed": 0, "failed": 0}
    
    def log(self, test, status, message):
        icon = "✅" if status else "❌"
        print(f"{icon} {test}: {message}")
        if status: self.results["passed"] += 1
        else: self.results["failed"] += 1
    
    def test_wordpress_connection(self):
        """Test WordPress connection"""
        try:
            # Test WordPress root
            response = self.session.get(BASE_URL, timeout=5)
            if response.status_code == 200 and 'wp-' in response.text.lower():
                self.log("WordPress Connection", True, "WordPress site accessible")
                return True
            else:
                self.log("WordPress Connection", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log("WordPress Connection", False, f"Error: {e}")
            return False
    
    def test_rest_api(self):
        """Test REST API root"""
        try:
            response = self.session.get(f"{BASE_URL}/wp-json/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if 'routes' in data:
                    self.log("REST API", True, "WordPress REST API working")
                    return True
            self.log("REST API", False, f"Status {response.status_code}")
            return False
        except Exception as e:
            self.log("REST API", False, f"Error: {e}")
            return False
    
    def test_plugin_endpoints(self):
        """Test plugin endpoints"""
        endpoints = [
            f"{BASE_URL}/wp-json/booking/v1/services",
            f"{BASE_URL}/wp-json/appointease/v1/services"
        ]
        
        for endpoint in endpoints:
            try:
                response = self.session.get(endpoint, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    self.log("Plugin Endpoints", True, f"Services endpoint working ({len(data)} services)")
                    return True
            except:
                continue
        
        self.log("Plugin Endpoints", False, "No working endpoints found")
        return False
    
    def create_booking(self, data):
        """Create booking with error handling"""
        try:
            response = self.session.post(
                f"{API_URL}/appointments",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, {"error": f"HTTP {response.status_code}", "response": response.text[:100]}
                
        except Exception as e:
            return False, {"error": str(e)}
    
    def test_basic_booking(self):
        """Test basic booking"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 10:00:00")
        data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "555-0123",
            "date": tomorrow,
            "service_id": 1,
            "employee_id": 1
        }
        
        success, result = self.create_booking(data)
        
        if success and result.get('success'):
            booking_id = result.get('strong_id')
            self.log("Basic Booking", True, f"Created {booking_id}")
            
            # Try to cancel
            try:
                cancel_response = self.session.delete(f"{API_URL}/appointments/{booking_id}")
                if cancel_response.status_code == 200:
                    self.log("Booking Cleanup", True, "Cancelled successfully")
            except:
                pass
                
            return True
        else:
            self.log("Basic Booking", False, f"Failed: {result}")
            return False
    
    def test_race_condition(self):
        """Test concurrent bookings"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 11:00:00")
        
        def make_booking(i):
            data = {
                "name": f"User{i}",
                "email": f"user{i}@test.com", 
                "phone": f"555-012{i}",
                "date": tomorrow,
                "service_id": 1,
                "employee_id": 1
            }
            return self.create_booking(data)
        
        # Run 3 concurrent bookings
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(make_booking, i) for i in range(3)]
            results = [future.result() for future in as_completed(futures)]
        
        successful = [r for r in results if r[0]]
        failed = [r for r in results if not r[0]]
        
        if len(successful) == 1:
            self.log("Race Condition", True, f"1 success, {len(failed)} conflicts")
            # Cleanup
            if successful[0][1].get('strong_id'):
                try:
                    self.session.delete(f"{API_URL}/appointments/{successful[0][1]['strong_id']}")
                except:
                    pass
        else:
            self.log("Race Condition", False, f"{len(successful)} successes (should be 1)")
    
    def run_tests(self):
        """Run all tests"""
        print("🚀 AppointEase Fixed Test Suite")
        print("=" * 40)
        
        # Test connection first
        if not self.test_wordpress_connection():
            print("\n❌ WordPress not accessible. Check:")
            print("1. XAMPP is running")
            print("2. WordPress is installed")
            print("3. Domain points to localhost")
            return
        
        if not self.test_rest_api():
            print("\n❌ REST API not working")
            return
            
        if not self.test_plugin_endpoints():
            print("\n❌ Plugin not active or endpoints missing")
            return
        
        # Run booking tests
        self.test_basic_booking()
        self.test_race_condition()
        
        print(f"\n📊 Results: {self.results['passed']} passed, {self.results['failed']} failed")
        
        if self.results['failed'] == 0:
            print("🎉 All tests passed!")
        else:
            print("⚠️ Some tests failed")

if __name__ == "__main__":
    tester = FixedTester()
    tester.run_tests()