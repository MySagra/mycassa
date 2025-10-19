# -*- coding: utf-8 -*-
"""
Modulo per la gestione dell'autenticazione con JWT.
"""
from functools import wraps

import requests
from flask import redirect, session, url_for, request as flask_request

from config import API_LOGIN, API_LOGOUT, API_REFRESH, API_TIMEOUT


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
            # L'access token è nel body della risposta
            token = data.get('access_token') or data.get('accessToken') or data.get('token')
            if token:
                # Il refresh token è automaticamente salvato come cookie HttpOnly dal server
                return True, token, None
            else:
                return False, None, 'Access token non ricevuto dalla risposta API'
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


def refresh_access_token():
    """
    Richiede un nuovo access token usando il refresh token (cookie HttpOnly).
    Il refresh token viene inviato automaticamente dal browser via cookie.
    
    Returns:
        tuple: (success: bool, token: str or None, error_message: str or None)
    """
    try:
        # Ottieni i cookie dalla richiesta Flask corrente per inoltrarli al backend
        cookies = {}
        if flask_request:
            cookies = flask_request.cookies
        
        # Invia la richiesta di refresh con i cookie della richiesta corrente
        response = requests.post(
            API_REFRESH,
            timeout=API_TIMEOUT,
            cookies=cookies  # Inoltra i cookie (incluso il refresh token HttpOnly)
        )
        
        if response.status_code == 200:
            data = response.json()
            # Il nuovo access token è nel body della risposta
            token = data.get('access_token') or data.get('accessToken') or data.get('token')
            if token:
                return True, token, None
            else:
                return False, None, 'Access token non ricevuto dalla risposta di refresh'
        elif response.status_code == 401:
            return False, None, 'Refresh token scaduto o non valido'
        else:
            return False, None, f'Errore refresh: {response.status_code}'
            
    except requests.exceptions.Timeout:
        return False, None, 'Timeout della richiesta refresh'
    except requests.exceptions.ConnectionError:
        return False, None, 'Impossibile connettersi al server API per il refresh'
    except Exception as e:
        return False, None, f'Errore imprevisto durante refresh: {str(e)}'


def logout_user():
    """
    Effettua il logout chiamando l'API per invalidare il refresh token.
    
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    try:
        # Ottieni i cookie dalla richiesta Flask corrente
        cookies = {}
        if flask_request:
            cookies = flask_request.cookies
        
        # Chiama l'endpoint di logout per invalidare il refresh token sul server
        response = requests.post(
            API_LOGOUT,
            timeout=API_TIMEOUT,
            cookies=cookies  # Inoltra i cookie per identificare la sessione
        )
        
        if response.status_code in [200, 204]:
            return True, None
        else:
            # Anche se il logout remoto fallisce, procediamo con la pulizia locale
            return True, f'Logout locale eseguito (server response: {response.status_code})'
            
    except requests.exceptions.Timeout:
        return True, 'Logout locale eseguito (timeout server)'
    except requests.exceptions.ConnectionError:
        return True, 'Logout locale eseguito (server non raggiungibile)'
    except Exception as e:
        return True, f'Logout locale eseguito (errore: {str(e)})'


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
