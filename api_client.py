# -*- coding: utf-8 -*-
"""
Client per le chiamate API REST
"""
import requests
import config
from config import API_FOODS, API_ORDERS, API_CATEGORIES, API_TIMEOUT
from auth import get_auth_headers


def get_categories():
    """
    Recupera la lista delle categorie disponibili dall'API.
    
    Returns:
        tuple: (success: bool, categories: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        # Usa l'endpoint per le categorie disponibili
        url = f"{config.API_BASE_URL}/v1/categories/available"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            categories = response.json()
            return True, categories, None
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def get_products():
    """
    Recupera la lista dei prodotti (foods) dall'API.
    
    Returns:
        tuple: (success: bool, data: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        response = requests.get(
            API_FOODS,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            foods = response.json()
            # Organizza i prodotti per categoria come faceva carica_prodotti()
            cats = {}
            for food in foods:
                # Filtra solo prodotti attivi
                if not food.get('active', True):
                    continue
                
                # L'API può restituire category come oggetto o come stringa
                category_data = food.get('category', {})
                if isinstance(category_data, dict):
                    category = str(category_data.get('name', 'Altro')).strip()
                else:
                    category = str(category_data).strip() if category_data else 'Altro'
                
                name = str(food.get('name', '')).strip()
                price = float(food.get('price', 0.0))
                
                if category and name:
                    cats.setdefault(category, []).append({
                        'name': name,
                        'price': price,
                        'id': food.get('id')  # Manteniamo l'ID per riferimenti futuri
                    })
            
            # Ordina per categoria e nome
            for cat in cats:
                cats[cat].sort(key=lambda x: x['name'])
            
            return True, cats, None
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def create_order(order_data):
    """
    Crea un nuovo ordine tramite l'API.
    
    Args:
        order_data: Dictionary con i dati dell'ordine:
            - items: lista di articoli con name, category, quantity, price, adds, removes
            - table: numero tavolo (stringa, verrà convertito in numero)
            - customer: nome cliente
            - payment_method: metodo di pagamento (CONTANTI/POS)
            - total: totale ordine
            
    Returns:
        tuple: (success: bool, order_id: int or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        headers['Content-Type'] = 'application/json'
        
        # Converte il tavolo in numero
        table_str = order_data.get('table', '0')
        try:
            table_num = int(table_str)
        except (ValueError, TypeError):
            table_num = 0
        
        # Prepara i dati nel formato richiesto dall'API
        # L'API richiede un formato molto semplice: solo table, customer e foodsOrdered con foodId e quantity
        payload = {
            'table': table_num,  # DEVE essere un numero
            'customer': order_data.get('customer', ''),
            'foodsOrdered': []  # Array di {foodId: number, quantity: number}
        }
        
        # Converte gli items nel formato API (solo foodId e quantity)
        for item in order_data.get('items', []):
            food_id = item.get('food_id') or item.get('id')
            if food_id:
                api_item = {
                    'foodId': int(food_id),
                    'quantity': int(item.get('qty', 1))
                }
                payload['foodsOrdered'].append(api_item)
        
        response = requests.post(
            API_ORDERS,
            json=payload,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code in (200, 201):
            result = response.json()
            order_id = result.get('id') or result.get('order_id') or result.get('orderId')
            return True, order_id, None
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        elif response.status_code == 400:
            error_detail = response.json().get('message', 'Dati non validi')
            return False, None, f'Errore validazione: {error_detail}'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def get_orders(filters=None):
    """
    Recupera la lista degli ordini dall'API.
    
    Args:
        filters: Dictionary con filtri opzionali (es. date, table, customer)
        
    Returns:
        tuple: (success: bool, orders: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        params = filters or {}
        
        response = requests.get(
            API_ORDERS,
            headers=headers,
            params=params,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            orders = response.json()
            return True, orders, None
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def get_foods_by_category(category_id):
    """
    Recupera i cibi disponibili per una specifica categoria dall'API.
    
    Args:
        category_id: ID della categoria
        
    Returns:
        tuple: (success: bool, foods: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        url = f"{config.API_BASE_URL}/v1/foods/available/categories/{category_id}"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            foods = response.json()
            return True, foods, None
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def get_order_by_id(order_id):
    """
    Recupera i dettagli di un ordine specifico dall'API tramite il suo ID.
    
    Args:
        order_id: ID o codice dell'ordine (stringa o numero)
        
    Returns:
        tuple: (success: bool, order: dict or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        url = f"{config.API_BASE_URL}/v1/orders/{order_id}"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            order = response.json()
            return True, order, None
        elif response.status_code == 404:
            return False, None, 'Ordine non trovato'
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def get_today_orders():
    """
    Recupera tutti gli ordini di oggi dall'API.
    
    Returns:
        tuple: (success: bool, orders: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        url = f"{config.API_BASE_URL}/v1/orders/day/today"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            orders = response.json()
            return True, orders, None
        elif response.status_code == 404:
            return False, None, 'Nessun ordine trovato per oggi'
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def search_daily_orders(search_value):
    """
    Cerca ordini giornalieri dall'API.
    
    Args:
        search_value: Valore da cercare (codice, tavolo, cliente, ecc.)
        
    Returns:
        tuple: (success: bool, orders: list or None, error_message: str or None)
    """
    try:
        headers = get_auth_headers()
        url = f"{config.API_BASE_URL}/v1/orders/search/daily/{search_value}"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            orders = response.json()
            return True, orders, None
        elif response.status_code == 404:
            return False, None, 'Nessun ordine trovato'
        elif response.status_code == 401:
            return False, None, 'Non autenticato. Effettua il login.'
        elif response.status_code == 403:
            return False, None, 'Accesso negato.'
        else:
            return False, None, f'Errore API: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'

