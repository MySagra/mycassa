#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script di test per verificare la connettività con l'API REST
"""
import requests
from config import API_BASE_URL, API_LOGIN, API_FOODS, API_ORDERS, API_CATEGORIES, API_TIMEOUT


def test_api_connection():
    """Verifica che l'API sia raggiungibile"""
    print(f"🔍 Test connessione API: {API_BASE_URL}")
    print("-" * 50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"✅ API raggiungibile (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Impossibile connettersi a {API_BASE_URL}")
        print("   Verifica che l'API sia avviata e l'URL sia corretto")
        return False
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False


def test_login(username, password):
    """Testa il login con le credenziali fornite"""
    print(f"\n🔐 Test login con username: {username}")
    print("-" * 50)
    
    try:
        response = requests.post(
            API_LOGIN,
            json={'username': username, 'password': password},
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token') or data.get('access_token')
            if token:
                print(f"✅ Login riuscito!")
                print(f"   Token: {token[:20]}...")
                return True, token
            else:
                print(f"⚠️  Login riuscito ma token non trovato nella risposta")
                print(f"   Risposta: {data}")
                return False, None
        elif response.status_code == 401:
            print(f"❌ Credenziali non valide")
            return False, None
        else:
            print(f"❌ Errore login: {response.status_code}")
            print(f"   Risposta: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False, None


def test_categories(token):
    """Testa il recupero delle categorie"""
    print(f"\n📁 Test recupero categorie")
    print("-" * 50)
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(
            API_CATEGORIES,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Categorie recuperate: {len(categories)} categorie trovate")
            
            # Mostra le categorie
            if categories:
                print("\n   Categorie disponibili:")
                for cat in categories:
                    cat_name = cat.get('name', '?') if isinstance(cat, dict) else str(cat)
                    print(f"   - {cat_name}")
            
            return True
        elif response.status_code == 401:
            print(f"❌ Token non valido o scaduto")
            return False
        else:
            print(f"❌ Errore: {response.status_code}")
            print(f"   Risposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False


def test_foods(token):
    """Testa il recupero dei prodotti (foods)"""
    print(f"\n🍕 Test recupero prodotti (foods)")
    print("-" * 50)
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(
            API_FOODS,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            foods = response.json()
            print(f"✅ Prodotti recuperati: {len(foods)} prodotti trovati")
            
            # Mostra i primi 3 prodotti
            if foods:
                print("\n   Primi prodotti:")
                for food in foods[:3]:
                    category = food.get('category', {})
                    cat_name = category.get('name', '?') if isinstance(category, dict) else str(category)
                    print(f"   - {cat_name}: {food.get('name', '?')} ({food.get('price', 0)}€)")
            
            return True
        elif response.status_code == 401:
            print(f"❌ Token non valido o scaduto")
            return False
        else:
            print(f"❌ Errore: {response.status_code}")
            print(f"   Risposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False


def main():
    """Esegue tutti i test"""
    print("\n" + "=" * 50)
    print("   TEST CONNETTIVITÀ API REST")
    print("=" * 50 + "\n")
    
    # Test 1: Connessione base
    if not test_api_connection():
        print("\n⚠️  Impossibile procedere senza connessione all'API")
        return
    
    # Test 2: Login
    print("\n👤 Inserisci le credenziali per testare il login:")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    
    if not username or not password:
        print("\n⚠️  Username e password sono obbligatori")
        return
    
    success, token = test_login(username, password)
    if not success:
        print("\n⚠️  Login fallito, impossibile testare gli altri endpoint")
        return
    
    # Test 3: Categorie
    test_categories(token)
    
    # Test 4: Prodotti (Foods)
    test_foods(token)
    
    print("\n" + "=" * 50)
    print("   TEST COMPLETATI")
    print("=" * 50 + "\n")


if __name__ == '__main__':
    main()
