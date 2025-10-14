"""
Printer Manager - Gestisce la configurazione delle stampanti ESC/POS
"""

import json
import os
from typing import List, Dict, Optional

CONFIG_FILE = 'data/printer_config.json'

def ensure_data_dir():
    """Assicura che la directory data esista"""
    os.makedirs('data', exist_ok=True)

def load_printer_config() -> List[Dict]:
    """
    Carica la configurazione delle stampanti dal file JSON
    
    Returns:
        Lista di dizionari con configurazione stampanti
    """
    ensure_data_dir()
    
    if not os.path.exists(CONFIG_FILE):
        return []
    
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('printers', [])
    except Exception as e:
        print(f"Errore caricamento configurazione stampanti: {e}")
        return []

def save_printer_config(printers: List[Dict]) -> bool:
    """
    Salva la configurazione delle stampanti nel file JSON
    
    Args:
        printers: Lista di dizionari con configurazione stampanti
    
    Returns:
        True se il salvataggio è riuscito, False altrimenti
    """
    ensure_data_dir()
    
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({'printers': printers}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Errore salvataggio configurazione stampanti: {e}")
        return False

def get_printers_for_category(category_id: int) -> List[Dict]:
    """
    Ottiene tutte le stampanti che devono stampare una specifica categoria
    
    Args:
        category_id: ID della categoria
    
    Returns:
        Lista di stampanti configurate per quella categoria
    """
    printers = load_printer_config()
    
    result = []
    for printer in printers:
        if not printer.get('enabled', True):
            continue
        
        categories = printer.get('categories', [])
        if category_id in categories:
            result.append(printer)
    
    return result

def get_printer_by_id(printer_id: str) -> Optional[Dict]:
    """
    Ottiene una stampante specifica per ID
    
    Args:
        printer_id: ID della stampante
    
    Returns:
        Dizionario con configurazione stampante o None
    """
    printers = load_printer_config()
    
    for idx, printer in enumerate(printers):
        if str(idx) == printer_id or printer.get('id') == printer_id:
            return printer
    
    return None

def validate_printer_config(printer: Dict) -> tuple[bool, Optional[str]]:
    """
    Valida la configurazione di una stampante
    
    Args:
        printer: Dizionario con configurazione stampante
    
    Returns:
        Tupla (valido, messaggio_errore)
    """
    if not printer.get('ip'):
        return False, "Indirizzo IP mancante"
    
    port = printer.get('port', 9100)
    if not isinstance(port, int) or port < 1 or port > 65535:
        return False, "Porta non valida (deve essere tra 1 e 65535)"
    
    if not printer.get('name'):
        return False, "Nome stampante mancante"
    
    return True, None

def group_items_by_printer(items: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Raggruppa gli item dell'ordine per stampante in base alla categoria
    
    Args:
        items: Lista di item dell'ordine con campo 'category_id'
    
    Returns:
        Dizionario {printer_id: [items]}
    """
    printers = load_printer_config()
    result = {}
    
    for item in items:
        category_id = item.get('category_id')
        if not category_id:
            continue
        
        # Trova tutte le stampanti per questa categoria
        for idx, printer in enumerate(printers):
            if not printer.get('enabled', True):
                continue
            
            categories = printer.get('categories', [])
            if category_id in categories:
                printer_key = f"{printer.get('name', f'Printer_{idx}')}_{idx}"
                
                if printer_key not in result:
                    result[printer_key] = {
                        'printer': printer,
                        'items': []
                    }
                
                result[printer_key]['items'].append(item)
    
    return result
