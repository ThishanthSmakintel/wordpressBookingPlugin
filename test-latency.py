#!/usr/bin/env python3
import requests
import time
import json
from statistics import mean, median

BASE_URL = "http://blog.promoplus.com/wp-json/appointease/v1"

def test_slot_lock_latency(iterations=10):
    latencies = []
    
    print(f"\nTesting Slot Lock Latency ({iterations} iterations)...")
    print("-" * 60)
    
    for i in range(iterations):
        payload = {
            "date": "2025-10-28",
            "time": "09:00" if i % 2 == 0 else "09:15",
            "employee_id": 3
        }
        
        start = time.time()
        response = requests.post(f"{BASE_URL}/realtime/select", json=payload)
        end = time.time()
        
        latency_ms = (end - start) * 1000
        latencies.append(latency_ms)
        
        status = "OK" if response.status_code == 200 else "FAIL"
        print(f"  {status} Iteration {i+1}: {latency_ms:.2f}ms")
        
        time.sleep(0.1)
    
    print("\nLatency Statistics:")
    print(f"  Average: {mean(latencies):.2f}ms")
    print(f"  Median:  {median(latencies):.2f}ms")
    print(f"  Min:     {min(latencies):.2f}ms")
    print(f"  Max:     {max(latencies):.2f}ms")
    
    return latencies

def test_availability_check(iterations=10):
    latencies = []
    
    print(f"\nTesting Availability Check ({iterations} iterations)...")
    print("-" * 60)
    
    for i in range(iterations):
        payload = {
            "date": "2025-10-28",
            "employee_id": 3
        }
        
        start = time.time()
        response = requests.post(f"{BASE_URL}/availability", json=payload)
        end = time.time()
        
        latency_ms = (end - start) * 1000
        latencies.append(latency_ms)
        
        status = "OK" if response.status_code == 200 else "FAIL"
        print(f"  {status} Iteration {i+1}: {latency_ms:.2f}ms")
        
        time.sleep(0.1)
    
    print("\nLatency Statistics:")
    print(f"  Average: {mean(latencies):.2f}ms")
    print(f"  Median:  {median(latencies):.2f}ms")
    print(f"  Min:     {min(latencies):.2f}ms")
    print(f"  Max:     {max(latencies):.2f}ms")
    
    return latencies

def test_system_health():
    print(f"\nSystem Health Check...")
    print("-" * 60)
    
    endpoints = [
        ("/debug/locks", "GET"),
        ("/debug/selections", "GET"),
        ("/server-date", "GET")
    ]
    
    for endpoint, method in endpoints:
        try:
            start = time.time()
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}")
            end = time.time()
            
            latency_ms = (end - start) * 1000
            status = "OK" if response.status_code == 200 else "FAIL"
            print(f"  {status} {endpoint}: {latency_ms:.2f}ms")
        except Exception as e:
            print(f"  FAIL {endpoint}: Error - {e}")

def main():
    print("=" * 60)
    print("AppointEase Performance & Latency Test")
    print("=" * 60)
    
    lock_latencies = test_slot_lock_latency(10)
    avail_latencies = test_availability_check(10)
    test_system_health()
    
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"  Slot Lock Average:    {mean(lock_latencies):.2f}ms")
    print(f"  Availability Average: {mean(avail_latencies):.2f}ms")
    
    if mean(lock_latencies) < 100:
        print("\n  EXCELLENT: Sub-100ms latency achieved!")
    elif mean(lock_latencies) < 500:
        print("\n  GOOD: Acceptable latency for production")
    else:
        print("\n  WARNING: High latency detected")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
