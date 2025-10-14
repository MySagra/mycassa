# -*- coding: utf-8 -*-
"""
Configurazione per le API REST
"""
import os

# URL base dell'API REST
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:4300')

# Endpoint API
API_LOGIN = f"{API_BASE_URL}/auth/login"
API_FOODS = f"{API_BASE_URL}/v1/foods"
API_ORDERS = f"{API_BASE_URL}/v1/orders"
API_CATEGORIES = f"{API_BASE_URL}/v1/categories"

# Configurazione sessione
SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-secret-key-in-production')
SESSION_COOKIE_NAME = 'scontrini_session'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Impostare True in produzione con HTTPS

# Timeout per le richieste API (in secondi)
API_TIMEOUT = 30
