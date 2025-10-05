#!/usr/bin/env python3
"""
API Testing Script for AppointEase WordPress Plugin
Tests all REST API endpoints to ensure they're working correctly.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

class APITester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def test_endpoint(self, method, endpoint, data=None, headers=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            return {
                'status': response.status_code,
                'success': response.status_code < 400,
                'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                'url': url
            }
        except Exception as e:
            return {
                'status': 0,
                'success': False,
                'error': str(e),
                'url': url
            }

    def run_tests(self):
        """Run all API tests"""
        print("Testing AppointEase API Endpoints")
        print("=" * 50)
        
        tests = [
            # Core Data Endpoints
            ('GET', '/wp-json/booking/v1/services', None, 'Get Services'),
            ('GET', '/wp-json/booking/v1/staff', None, 'Get Staff'),
            ('GET', '/wp-json/appointease/v1/settings', None, 'Get Settings'),
            ('GET', '/wp-json/appointease/v1/business-hours', None, 'Get Business Hours'),
            ('GET', '/wp-json/appointease/v1/time-slots', None, 'Get Time Slots'),
            ('GET', '/wp-json/appointease/v1/server-date', None, 'Get Server Date'),
            
            # Availability Check
            ('POST', '/wp-json/booking/v1/availability', {
                'date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                'employee_id': 1
            }, 'Check Availability'),
            
            # Appointment Management
            ('POST', '/wp-json/appointease/v1/appointments', {
                'name': 'Test User',
                'email': 'test@example.com',
                'phone': '555-0123',
                'date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d 10:00:00'),
                'service_id': 1,
                'employee_id': 1
            }, 'Create Appointment'),
            
            # User Appointments
            ('POST', '/wp-json/appointease/v1/user-appointments', {
                'email': 'test@example.com'
            }, 'Get User Appointments'),
            
            # Debug Endpoints
            ('GET', '/wp-json/appointease/v1/debug/appointments', None, 'Debug All Appointments'),
            ('GET', '/wp-json/appointease/v1/debug/working-days', None, 'Debug Working Days'),
            
            # Health Check
            ('GET', '/wp-json/appointease/v1/health', None, 'Health Check'),
        ]
        
        results = []
        for method, endpoint, data, description in tests:
            print(f"\nTesting: {description}")
            print(f"   {method} {endpoint}")
            
            result = self.test_endpoint(method, endpoint, data)
            results.append({
                'description': description,
                'method': method,
                'endpoint': endpoint,
                'result': result
            })
            
            if result['success']:
                print(f"   SUCCESS ({result['status']})")
                if isinstance(result['data'], dict):
                    if 'time_slots' in result['data']:
                        print(f"      Time slots: {len(result['data']['time_slots'])} found")
                    elif 'appointments' in result['data']:
                        print(f"      Appointments: {len(result['data']['appointments'])} found")
                    elif 'all_appointments' in result['data']:
                        print(f"      Total appointments: {result['data']['total_count']}")
            else:
                print(f"   FAILED ({result['status']})")
                if 'error' in result:
                    print(f"      Error: {result['error']}")
                elif 'data' in result:
                    print(f"      Response: {result['data']}")
        
        # Summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for r in results if r['result']['success'])
        total = len(results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Failed tests details
        failed_tests = [r for r in results if not r['result']['success']]
        if failed_tests:
            print("\nFAILED TESTS:")
            for test in failed_tests:
                print(f"   - {test['description']}")
                print(f"     {test['method']} {test['endpoint']}")
                if 'error' in test['result']:
                    print(f"     Error: {test['result']['error']}")
        
        return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_apis.py <wordpress_site_url>")
        print("Example: python test_apis.py http://localhost/wordpress")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = APITester(base_url)
    results = tester.run_tests()
    
    # Exit with error code if any tests failed
    failed_count = sum(1 for r in results if not r['result']['success'])
    sys.exit(failed_count)

if __name__ == "__main__":
    main()