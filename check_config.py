#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Verifica configurazione endpoint API
"""
from config import API_BASE_URL, API_LOGIN, API_FOODS, API_ORDERS, API_CATEGORIES

print("\n" + "=" * 60)
print("   🔍 CONFIGURAZIONE ENDPOINT API")
print("=" * 60 + "\n")

print(f"📡 Base URL: {API_BASE_URL}\n")

print("📌 Endpoint configurati:")
print(f"   ├─ Login:      {API_LOGIN}")
print(f"   ├─ Categories: {API_CATEGORIES}")
print(f"   ├─ Foods:      {API_FOODS}")
print(f"   └─ Orders:     {API_ORDERS}")

print("\n" + "=" * 60)
print("   ℹ️  NOTA")
print("=" * 60)
print("\n✅ /auth/login NON ha il prefisso /v1")
print("✅ Tutte le altre risorse usano /v1/ come prefisso\n")
print("Per testare la connettività, esegui:")
print("   python test_api.py\n")
