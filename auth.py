# -*- coding: utf-8 -*-
"""
Modulo per la gestione dell'autenticazione con JWT
"""
import requests
from flask import session, redirect, url_for
from functools import wraps
from config import API_LOGIN, API_TIMEOUT


def login_user(username, password):
    """
    Effettua il login chiamando l'API REST e restituisce il token JWT.
    
    Args:
        username: Nome utente
        password: Password
        
    Returns:
        tuple: (success: bool, token: str or None, error_message: str or None)
    """
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
                return True, token, None
            else:
                return False, None, 'Token non ricevuto dalla risposta API'
        elif response.status_code == 401:
            return False, None, 'Credenziali non valide'
        else:
            return False, None, f'Errore server: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API'
    except Exception as e:
        return False, None, f'Errore imprevisto: {str(e)}'


def save_token_to_session(token):
    """
    Salva il token JWT nella sessione Flask.
    
    Args:
        token: Token JWT da salvare
    """
    session['jwt_token'] = token
    session.permanent = True


def get_token_from_session():
    """
    Recupera il token JWT dalla sessione.
    
    Returns:
        str or None: Il token JWT o None se non presente
    """
    return session.get('jwt_token')


def clear_session():
    """
    Rimuove il token dalla sessione (logout).
    """
    session.pop('jwt_token', None)


def is_authenticated():
    """
    Verifica se l'utente è autenticato (ha un token in sessione).
    
    Returns:
        bool: True se autenticato, False altrimenti
    """
    return 'jwt_token' in session


def login_required(f):
    """
    Decorator per proteggere le route che richiedono autenticazione.
    Redirige alla pagina di login se l'utente non è autenticato.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function


def get_auth_headers():
    """
    Restituisce gli header di autenticazione per le richieste API.
    
    Returns:
        dict: Dictionary con header Authorization
    """
    token = get_token_from_session()
    if token:
        return {'Authorization': f'Bearer {token}'}
    return {}
