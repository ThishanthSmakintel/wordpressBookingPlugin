#!/usr/bin/env python3
"""
Quick Test Runner for AppointEase Atomic Booking
"""

import subprocess
import sys
import os

def check_requirements():
    """Check if required packages are installed"""
    try:
        import requests
        return True
    except ImportError:
        print("❌ Missing required package: requests")
        print("Install with: pip install requests")
        return False

def run_tests():
    """Run the atomic booking tests"""
    if not check_requirements():
        return False
        
    print("🧪 Running AppointEase Atomic Booking Tests...")
    print("-" * 40)
    
    try:
        # Run the test script
        result = subprocess.run([
            sys.executable, 
            "test_atomic_booking.py"
        ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        print(result.stdout)
        
        if result.stderr:
            print("Errors:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Failed to run tests: {e}")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)