# -*- coding: utf-8 -*-
"""
Configurazione per le API REST.
"""
import os
import re
from pathlib import Path


def load_env_file():
    """
    Carica le variabili dal file .env.
    
    Returns:
        dict: Dizionario con le variabili d'ambiente caricate
    """
    env_file = Path('.env')
    env_vars = {}
    
    if env_file.exists():
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        match = re.match(r'^([A-Z_]+)=(.*)$', line)
                        if match:
                            key, value = match.groups()
                            env_vars[key] = value
        except Exception as e:
            print(f"Errore nel caricamento del file .env: {e}")
    
    return env_vars


def save_to_env_file(key, value):
    """
    Salva o aggiorna una variabile nel file .env.
    
    Args:
        key: Nome della variabile
        value: Valore da salvare
    """
    env_file = Path('.env')
    lines = []
    key_found = False
    
    if env_file.exists():
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            print(f"Errore nella lettura del file .env: {e}")
    
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(f'{key}='):
            new_lines.append(f'{key}={value}\n')
            key_found = True
        else:
            new_lines.append(line)
    
    if not key_found:
        inserted = False
        for i, line in enumerate(new_lines):
            if '# Configurazione API' in line or 'API_' in line:
                j = i + 1
                while j < len(new_lines) and (new_lines[j].strip().startswith('API_') 
                                             or not new_lines[j].strip()):
                    j += 1
                new_lines.insert(j, f'{key}={value}\n')
                inserted = True
                break
        
        if not inserted:
            if new_lines and not new_lines[0].startswith('#'):
                new_lines.insert(0, '# Configurazione API\n')
            new_lines.insert(1 if new_lines else 0, f'{key}={value}\n')
    
    try:
        with open(env_file, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"Errore nella scrittura del file .env: {e}")
        raise

# Carica variabili dal .env
_env_vars = load_env_file()

# URL base dell'API REST
API_BASE_URL = (_env_vars.get('API_BASE_URL') or 
                os.getenv('API_BASE_URL', 'http://localhost:4300'))

# Endpoint API
API_LOGIN = f"{API_BASE_URL}/auth/login"
API_FOODS = f"{API_BASE_URL}/v1/foods"
API_ORDERS = f"{API_BASE_URL}/v1/orders"
API_CATEGORIES = f"{API_BASE_URL}/v1/categories"

# Configurazione sessione
SECRET_KEY = (_env_vars.get('SECRET_KEY') or 
              os.getenv('SECRET_KEY', 'change-this-secret-key-in-production'))
SESSION_COOKIE_NAME = 'scontrini_session'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Impostare True in produzione con HTTPS

# Timeout per le richieste API (in secondi)
API_TIMEOUT = 30


def reload_api_config():
    """
    Ricarica la configurazione API e aggiorna le variabili globali.
    
    Returns:
        str: Nuovo URL base dell'API
    """
    global API_BASE_URL, API_LOGIN, API_FOODS, API_ORDERS, API_CATEGORIES
    
    # Ricarica le variabili dal file .env
    _env_vars = load_env_file()
    API_BASE_URL = _env_vars.get('API_BASE_URL') or os.getenv('API_BASE_URL', 'http://localhost:4300')
    
    # Aggiorna tutti gli endpoint
    API_LOGIN = f"{API_BASE_URL}/auth/login"
    API_FOODS = f"{API_BASE_URL}/v1/foods"
    API_ORDERS = f"{API_BASE_URL}/v1/orders"
    API_CATEGORIES = f"{API_BASE_URL}/v1/categories"
    
    return API_BASE_URL
