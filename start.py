#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script di avvio per l'applicazione Scontrini POS.
Carica le variabili d'ambiente e avvia il server Flask.
"""
import os

# Configurazione variabili d'ambiente (se non già impostate)
if 'API_BASE_URL' not in os.environ:
    print("⚠️  API_BASE_URL non impostata, uso valore di default: "
          "http://localhost:4300")
    os.environ['API_BASE_URL'] = 'http://localhost:4300'

if 'SECRET_KEY' not in os.environ:
    print("⚠️  SECRET_KEY non impostata, uso valore di default "
          "(NON SICURO PER PRODUZIONE!)")
    os.environ['SECRET_KEY'] = 'dev-secret-key-change-in-production'

# Importa e avvia l'applicazione
from app import app

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("   🍕 SCONTRINI POS - Sistema di gestione ordini")
    print("=" * 60)
    print(f"\n📡 API Base URL: {os.environ.get('API_BASE_URL')}")
    print(f"🔐 Autenticazione: JWT Token")
    print(f"🌐 Server: http://0.0.0.0:7010")
    print(f"\n💡 Prima di usare l'applicazione:")
    print("   1. Assicurati che l'API REST sia avviata")
    print("   2. Accedi a http://localhost:7010/login")
    print("   3. Inserisci le credenziali per autenticarti")
    print("\n" + "=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=7010, debug=False)
