#!/usr/bin/env python3
"""
Factori Push Notification Dispatcher (Python Version - Extra Credit)

Sends an FCM HTTP v1 notification payload targeting an app instance with a
specific product page deep link.
"""

import json
import sys
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Send targeted push notification to Factori store app.")
    parser.add_argument("--store", default="Zolara", help="Store name")
    parser.add_argument("--product", default="https://zolara.in/products/embroidered-anarkali-kurti", help="Product deep link URL")
    parser.add_argument("--title", default="Special Offer from Zolara!", help="Notification title")
    parser.add_argument("--body", default="Limited stock available! Tap to order now.", help="Notification message")
    parser.add_argument("--token", default="SIMULATED_FCM_DEVICE_REGISTRATION_TOKEN_98765", help="Target FCM device token")

    args = parser.parse_args()

    payload = {
        "message": {
            "token": args.token,
            "notification": {
                "title": args.title,
                "body": args.body
            },
            "data": {
                "store_name": args.store,
                "target_url": args.product,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            "android": {
                "priority": "high",
                "notification": {
                    "channel_id": "promotions",
                    "click_action": "com.factori.shell.MAIN_ACTION"
                }
            }
        }
    }

    print("================================================================")
    print(" FACTORI PUSH DISPATCH SCRIPT (Python)")
    print("================================================================")
    print(f" Target Store:      {args.store}")
    print(f" Target Product:    {args.product}")
    print(f" Notification Text: {args.title} - {args.body}")
    print("----------------------------------------------------------------")
    print("FCM HTTP v1 Payload:")
    print(json.dumps(payload, indent=2))
    print("----------------------------------------------------------------")
    print(" Deep-link flow on Android device:")
    print(" 1. MainActivity receives intent with extra 'target_url'")
    print(f" 2. WebView directly opens '{args.product}'")
    print(" 3. Customer sees the product immediately with Add to Cart CTA")
    print("================================================================")

if __name__ == "__main__":
    main()

