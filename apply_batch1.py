#!/usr/bin/env python3
"""Apply guide translations batch 1: de, es, fr, pt, ja, ko, ar, fa, he, hi, id, ms, th"""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/Developer/dopplerLanding"))

MESSAGES_DIR = os.path.expanduser("~/Developer/dopplerLanding/messages")

# Import translations from translate_guides.py
exec(open(os.path.expanduser("~/Developer/dopplerLanding/translate_guides.py")).read())

for lang, guide_data in translations.items():
    filepath = os.path.join(MESSAGES_DIR, f"{lang}.json")
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath}")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data["guide"] = guide_data
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"OK: {lang}")

print("Done batch 1")
