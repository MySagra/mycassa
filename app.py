# -*- coding: utf-8 -*-
import datetime
import io
import json
import os
from zipfile import ZIP_DEFLATED, ZipFile

import requests
from flask import (Flask, jsonify, redirect, render_template, request,
                   send_from_directory, url_for)

import config
import printer_manager
from api_client import create_order, get_categories, get_products
from auth import (clear_session, is_authenticated, login_required, login_user,
                  save_token_to_session, logout_user)
from escpos_send import carica_impostazioni, stampa_escpos_righe

# Directory dell'applicazione
APP_DIR = os.path.dirname(__file__)

# Percorso per il contatore progressivo degli ordini
COUNTER_JSON = os.path.join(APP_DIR, 'data', 'counter.json')

def next_order_number() -> int:
    """
    Restituisce il prossimo numero progressivo per l'ordine.
    Legge il valore da COUNTER_JSON, lo incrementa e lo salva.
    
    Returns:
        int: Numero progressivo dell'ordine
    """
    os.makedirs(os.path.dirname(COUNTER_JSON), exist_ok=True)
    last = 0
    if os.path.exists(COUNTER_JSON):
        try:
            with open(COUNTER_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
                last = int(data.get('last', 0))
        except Exception:
            last = 0
    
    num = last + 1
    try:
        with open(COUNTER_JSON, 'w', encoding='utf-8') as f:
            json.dump({'last': num}, f)
    except Exception:
        pass
    return num


EXTRA_PER_ADD = 0.50

def bullet_lines(item):
    """
    Ritorna le linee descrittive in stile elenco puntato per ESC/POS.
    
    Args:
        item: Dizionario con dati articolo (name, adds, removes)
    
    Returns:
        List[str]: Lista di linee formattate
    """
    name = item.get('name', '')
    adds = [a.strip() for a in (item.get('adds') or []) if a.strip()]
    rems = [r.strip() for r in (item.get('removes') or []) if r.strip()]
    lines = [f"{name}:"]
    if adds:
        lines.append("    - aggiunte: " + ", ".join(adds))
    if rems:
        lines.append("    - rimozioni: " + ", ".join(rems))
    return lines


def descrizione_con_modifiche(item):
    """
    Restituisce una descrizione estesa della pizza con aggiunte e rimozioni.
    
    Args:
        item: Dizionario con dati articolo (name, adds, removes)
    
    Returns:
        str: Descrizione formattata dell'articolo
    """
    base = item.get('name', '')
    adds = [a.strip() for a in (item.get('adds') or []) if a.strip()]
    rems = [r.strip() for r in (item.get('removes') or []) if r.strip()]
    
    if not adds and not rems:
        return base
    
    parti = [f"pizza base: {base}"]
    if adds:
        parti.append("aggiunte: " + ", ".join(adds))
    if rems:
        parti.append("rimozione: " + ", ".join(rems))
    return " + ".join(parti)


def prezzo_unitario(item):
    """
    Calcola il prezzo unitario di un articolo considerando le aggiunte.
    
    Args:
        item: Dizionario con dati articolo (price, adds)
    
    Returns:
        float: Prezzo unitario calcolato
    """
    adds = [a for a in (item.get('adds') or []) if str(a).strip()]
    return float(item.get('price', 0)) + EXTRA_PER_ADD * len(adds)

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = config.SECRET_KEY
app.config['SESSION_COOKIE_NAME'] = config.SESSION_COOKIE_NAME
app.config['SESSION_COOKIE_HTTPONLY'] = config.SESSION_COOKIE_HTTPONLY
app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE

def carica_prodotti():
    """
    Carica i prodotti dall'API REST.
    
    Returns:
        dict: Dizionario con categorie e prodotti, vuoto in caso di errore
    """
    success, cats, error = get_products()
    if success:
        return cats
    print(f"Errore caricamento prodotti: {error}")
    return {}

def append_log_ordine(codice, cart, totale, tavolo='', cliente='', pagamento=''):
    """
    Registra l'ordine tramite l'API REST.
    
    Args:
        codice: Codice ordine (non utilizzato, mantenuto per compatibilità)
        cart: Lista articoli del carrello
        totale: Totale dell'ordine
        tavolo: Numero tavolo
        cliente: Nome cliente
        pagamento: Metodo di pagamento
        
    Returns:
        tuple: (success: bool, order_id: int or None)
    """
    order_data = {
        'table': tavolo,
        'customer': cliente,
        'payment_method': pagamento,
        'total': float(totale),
        'items': cart
    }
    
    success, order_id, error = create_order(order_data)
    
    if success:
        print(f"Ordine {codice} creato con successo. ID API: {order_id}")
        return True, order_id
    
    print(f"Errore creazione ordine {codice}: {error}")
    return False, None

def formatta_righe_scontrino(categoria, articoli, valuta='€', codice='', 
                            tavolo='', cliente='', pagamento=''):
    """
    Prepara le righe per la stampa ESC/POS.
    
    Args:
        categoria: Nome categoria
        articoli: Lista articoli
        valuta: Simbolo valuta
        codice: Codice ordine
        tavolo: Numero tavolo
        cliente: Nome cliente
        pagamento: Metodo di pagamento
    
    Returns:
        tuple: (righe: List[str], totale: float)
    """
    larghezza = 42
    righe = []
    header = 'Oratorio di Petosino - SeptemberFest'
    righe.append(header.center(larghezza))
    righe.append('')
    
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    righe.append(f"Emesso: {now}".center(larghezza))
    righe.append('')
    
    righe.append("<<DH>>")
    titolo = f"** {categoria.upper()} **"
    righe.append(titolo.center(larghezza))
    righe.append("<<NORM>>")
    righe.append('-' * larghezza)
    
    totale = 0.0
    for it in articoli:
        q = int(it.get('qty', 1))
        unit = prezzo_unitario(it)
        sub = q * unit
        totale += sub
        
        righe.append("<<DH>>")
        name_line = (it.get('name', '') + ':')
        righe.append(name_line if len(name_line) <= larghezza 
                    else name_line[:larghezza])
        
        adds = [a.strip() for a in (it.get('adds') or []) if a.strip()]
        rems = [r.strip() for r in (it.get('removes') or []) if r.strip()]
        if adds:
            line = "    - aggiunte: " + ", ".join(adds)
            righe.append(line if len(line) <= larghezza else line[:larghezza])
        if rems:
            line = "    - rimozioni: " + ", ".join(rems)
            righe.append(line if len(line) <= larghezza else line[:larghezza])
        
        sx = f"x{q}"
        dx = f"{sub:.2f}{valuta}"
        spazi = max(1, larghezza - len(sx) - len(dx))
        righe.append(sx + ' ' * spazi + dx)
        righe.append("<<NORM>>")
        righe.append('')
    
    righe.append('-' * larghezza)
    sx = 'TOTALE'
    dx = f"{totale:.2f}{valuta}"
    righe.append(sx + ' ' * (larghezza - len(sx) - len(dx)) + dx)
    
    if pagamento:
        righe.append(f"Pagamento: {pagamento}")
    
    if codice:
        righe.append('')
        righe.append('')
        righe.append(codice)
        righe.append('')
    
    if tavolo or cliente:
        righe.append('')
        if tavolo:
            righe.append(f"TAVOLO N° {tavolo}")
        if cliente:
            righe.append(f"CLIENTE: {cliente}")
    righe.append('')
    return righe, totale

def html_scontrino(categoria, articoli, valuta, codice, totale, 
                  tavolo='', cliente='', pagamento=''):
    """
    Genera l'HTML per lo scontrino.
    
    Args:
        categoria: Nome categoria
        articoli: Lista articoli
        valuta: Simbolo valuta
        codice: Codice ordine
        totale: Totale ordine
        tavolo: Numero tavolo
        cliente: Nome cliente
        pagamento: Metodo di pagamento
    
    Returns:
        str: HTML formattato dello scontrino
    """
    rows = []
    for it in articoli:
        qty = int(it.get('qty', 1))
        unit = prezzo_unitario(it)
        sub = qty * unit
        adds = [a.strip() for a in (it.get('adds') or []) if a.strip()]
        rems = [r.strip() for r in (it.get('removes') or []) if r.strip()]
        
        nome_html = f"<div>{it['name']}:</div>"
        if adds or rems:
            nome_html += "<ul class='mb-0'>"
            if adds:
                nome_html += f"<li>aggiunte: {', '.join(adds)}</li>"
            if rems:
                nome_html += f"<li>rimozioni: {', '.join(rems)}</li>"
            nome_html += "</ul>"
        
        rows.append(
            "<tr>"
            f"<td class='first'>{nome_html}</td>"
            f"<td class='q'>{qty}</td>"
            f"<td class='p'>{unit:.2f} {valuta}</td>"
            f"<td class='s'>{sub:.2f} {valuta}</td>"
            "</tr>"
        )
    
    righe_table = "\n".join(rows)
    
    logo_tag = ""
    logo_path = os.path.join(APP_DIR, 'static', 'logo.png')
    if os.path.exists(logo_path):
        logo_tag = ("<img src='/static/logo.png' alt='logo' "
                   "style='max-width:140px; display:block; margin:0 auto 6px;'/>")
    
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    tav_cli = ""
    if tavolo or cliente:
        tc = []
        if tavolo:
            tc.append(f"TAVOLO N° {tavolo}")
        if cliente:
            tc.append(f"CLIENTE: {cliente}")
        tav_cli = "<div class='tc'>" + "<br/>".join(tc) + "</div>"
    
    pag_html = (f"<div class='pay'>Pagamento: {pagamento}</div>" 
               if pagamento else "")
    html = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        f"<title>Scontrino - {categoria}</title>"
        "<style>"
        "body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;}"
        ".receipt{width:320px;margin:0 auto;}"
        "h1{text-align:center;font-size:18px;margin:6px 0;}"
        ".evt{text-align:center;font-size:12px;margin:0 0 6px 0;font-weight:600;}"
        ".dt{text-align:center;font-size:12px;margin:0 0 6px 0;}"
        "table{width:100%;border-collapse:collapse;font-size:12px;}"
        "th,td{padding:4px 0;}"
        "th{text-align:left;border-bottom:1px solid #000;}"
        "td.q,td.p,td.s{text-align:right;}"
        ".total{border-top:1px solid #000;margin-top:6px;padding-top:6px;font-weight:700;}"
        ".first{font-size:16px;font-weight:600;}"
        ".q{font-size:16px;font-weight:700;text-align:right;}"
        ".tc{text-align:center;font-size:18px;margin-top:8px;font-weight:800;}"
        ".ord{text-align:center;font-size:22px;margin-top:8px;font-weight:800;}"
        ".pay{text-align:center;font-size:13px;margin-top:6px;}"
        "@media print{.no-print{display:none;}body{margin:0;}}"
        "</style></head><body>"
        "<div class='receipt'>"
        f"{logo_tag}"
        "<div class='evt'>Oratorio di Petosino - SeptemberFest</div>"
        f"<div class='dt'>Emesso: {now}</div>"
        f"<h1>{categoria}</h1>"
        "<table><thead><tr><th>Prodotto</th><th class='q'>Qtà</th><th class='p'>Prezzo</th><th class='s'>Subtot.</th></tr></thead><tbody>"
        f"{righe_table}"
        "</tbody></table>"
        f"<div class='total'>TOTALE: {totale:.2f} {valuta}</div>"
        f"{pag_html}"
        f"<div class='ord'>{codice}</div>"
        f"{tav_cli}"
        "<div style='height:60px'></div>"
        "<div class='no-print' style='text-align:center;margin-top:10px;'><button onclick='window.print()'>Stampa</button></div>"
        "</div></body></html>"
    )
    return html

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    """Pagina di login per l'autenticazione"""
    if is_authenticated():
        return redirect(url_for('home'))
    
    cfg = {'api_base_url': config.API_BASE_URL}
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if not username or not password:
            return render_template('login.html', error='Username e password sono obbligatori', cfg=cfg)
        
        # Effettua il login tramite API
        success, token, error = login_user(username, password)
        
        if success:
            # Salva il token nella sessione
            save_token_to_session(token)
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error=error, cfg=cfg)
    
    return render_template('login.html', cfg=cfg)

@app.route('/api/save-api-url', methods=['POST'])
def save_api_url_public():
    """Salva l'URL dell'API senza richiedere autenticazione"""
    try:
        data = request.get_json()
        api_base_url = data.get('api_base_url', '').strip()
        
        if not api_base_url:
            return jsonify({
                'success': False,
                'error': 'URL API richiesto'
            }), 400
        
        api_base_url = api_base_url.rstrip('/')
        
        config.save_to_env_file('API_BASE_URL', api_base_url)
        
        new_url = config.reload_api_config()
        
        return jsonify({
            'success': True,
            'message': f'Configurazione API salvata: {new_url}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/logout')
def logout():
    """Effettua il logout cancellando il token dalla sessione e invalidando il refresh token sul server"""
    # Chiama l'API di logout per invalidare il refresh token
    logout_user()
    # Pulisce la sessione locale
    clear_session()
    return redirect(url_for('login_page'))


@app.route('/')
@login_required
def home():
    """Pagina principale protetta con autenticazione"""
    cfg = carica_impostazioni(os.path.join(APP_DIR, 'settings.json'))
    return render_template('index.html', cfg=cfg)

@app.route('/static/manifest.json')
def manifest():
    """Serve il manifest.json per PWA"""
    return send_from_directory('static', 'manifest.json', 
                              mimetype='application/manifest+json')


@app.route('/static/sw.js')
def service_worker():
    """Serve il service worker per PWA"""
    response = send_from_directory('static', 'sw.js', 
                                   mimetype='application/javascript')
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/api/categories')
@login_required
def api_categories():
    """API endpoint per ottenere le categorie disponibili"""
    success, categories, error = get_categories()
    if success:
        return jsonify({'success': True, 'categories': categories})
    else:
        return jsonify({'success': False, 'error': error}), 500

@app.route('/api/foods/category/<int:category_id>')
@login_required
def api_foods_by_category(category_id):
    """API endpoint per ottenere i cibi di una specifica categoria"""
    from api_client import get_foods_by_category
    success, foods, error = get_foods_by_category(category_id)
    if success:
        return jsonify({'success': True, 'foods': foods})
    else:
        return jsonify({'success': False, 'error': error}), 500

@app.route('/api/orders/<string:order_code>')
@login_required
def api_get_order(order_code):
    """API endpoint per ottenere un ordine tramite il suo codice"""
    from api_client import get_order_by_id
    print(f"[DEBUG] Ricerca ordine con codice: {order_code}")
    success, order, error = get_order_by_id(order_code)
    print(f"[DEBUG] Risultato: success={success}, error={error}")
    if success:
        return jsonify({'success': True, 'order': order})
    else:
        return jsonify({'success': False, 'error': error}), 404


@app.route('/api/orders/day/today')
@login_required
def api_get_today_orders():
    """API endpoint per ottenere tutti gli ordini di oggi"""
    from api_client import get_today_orders
    print(f"[DEBUG] Richiesta ordini di oggi")
    success, orders, error = get_today_orders()
    print(f"[DEBUG] Risultato: success={success}, numero ordini={len(orders) if orders else 0}, error={error}")
    if success:
        # Restituisce direttamente l'array di ordini come fa l'API originale
        return jsonify(orders if orders else [])
    else:
        status_code = 404 if error == 'Nessun ordine trovato per oggi' else 500
        return jsonify({'success': False, 'error': error}), status_code


@app.route('/api/orders/search/daily/<string:value>')
@login_required
def api_search_daily_orders(value):
    """API endpoint per cercare ordini giornalieri"""
    from api_client import search_daily_orders
    print(f"[DEBUG] Ricerca ordini giornalieri con valore: {value}")
    success, orders, error = search_daily_orders(value)
    print(f"[DEBUG] Risultato: success={success}, numero ordini={len(orders) if orders else 0}, error={error}")
    if success:
        return jsonify(orders if orders else [])
    else:
        status_code = 404 if 'non trovato' in error.lower() else 500
        return jsonify({'success': False, 'error': error}), status_code

@app.post('/genera')
@login_required
def genera():
    """Gestisce la generazione e creazione di un ordine"""
    js = request.json or {}
    cart = js.get('cart', [])
    valuta = js.get('currency', '€')
    auto_print = bool(js.get('auto_print', False))
    tavolo = (js.get('tavolo') or '').strip()
    cliente = (js.get('cliente') or '').strip()
    pagamento = (js.get('pagamento') or '').strip().upper()
    
    if not tavolo or not cliente:
        return jsonify({
            'ok': False, 
            'error': 'Tavolo e Cliente sono obbligatori.'
        }), 400
    
    if pagamento not in ('CONTANTI', 'POS'):
        return jsonify({
            'ok': False, 
            'error': 'Metodo di pagamento obbligatorio.'
        }), 400
    
    by_cat = {}
    tot = 0.0
    for it in cart:
        if int(it.get('qty', 0)) <= 0:
            continue
        
        qty = int(it.get('qty', 0))
        unit_price = prezzo_unitario(it)
        tot += qty * unit_price
        
        by_cat.setdefault(it['category'], []).append({
            'name': it['name'],
            'qty': qty,
            'price': float(it['price']),
            'adds': it.get('adds') or [],
            'removes': it.get('removes') or []
        })
    
    order_data = {
        'table': tavolo,
        'customer': cliente,
        'payment_method': pagamento,
        'total': tot,
        'items': cart
    }
    
    success, order_id, error = create_order(order_data)
    
    if not success:
        return jsonify({
            'ok': False, 
            'error': f'Errore creazione ordine: {error}'
        }), 500
    
    codice = f"ORDINE N° {order_id}"
    
    scontrini = []
    for cat, items in by_cat.items():
        lines, sub = formatta_righe_scontrino(cat, items, valuta, codice, 
                                             tavolo, cliente, pagamento)
        html = html_scontrino(cat, items, valuta, codice, sub, 
                            tavolo, cliente, pagamento)
        scontrini.append({'categoria': cat, 'righe': lines, 'html': html})
    
    scontrini.sort(key=lambda x: 0 if x["categoria"].lower() == "pizzeria" else 1)
    all_items = []
    for it in cart:
        if int(it.get('qty', 0)) <= 0:
            continue
        all_items.append({
            'category': f"{it['category']}",
            'name_with_category': f"{it['category']} - {it['name']}",
            'name': f"{it['name']}",
            'qty': int(it['qty']),
            'price': float(it['price']),
            'adds': it.get('adds') or [],
            'removes': it.get('removes') or []
        })
    
    lines_all, _ = formatta_righe_scontrino('TOTALE COMPLESSIVO', all_items, 
                                           valuta, codice, tavolo, cliente, 
                                           pagamento)
    html_all = html_scontrino('TOTALE COMPLESSIVO', all_items, valuta, codice, 
                             tot, tavolo, cliente, pagamento)
    
    bio = io.BytesIO()
    with ZipFile(bio, 'w', ZIP_DEFLATED) as z:
        for s in scontrini:
            filename = f"scontrino_{s['categoria'].replace(' ','_')}.html"
            z.writestr(filename, s['html'])
        z.writestr('scontrino_TOTALE.html', html_all)
    
    printed = []
    errors = []
    if auto_print:
        settings_path = os.path.join(APP_DIR, 'settings.json')
        for s in scontrini:
            ok, msg = stampa_escpos_righe(s['righe'], taglio=True, 
                                         settings_path=settings_path)
            printed.append({'categoria': s['categoria'], 'ok': ok, 'msg': msg})
            if not ok:
                errors.append(msg)
        
        ok, msg = stampa_escpos_righe(lines_all, taglio=True, 
                                      settings_path=settings_path)
        printed.append({'categoria': 'TOTALE', 'ok': ok, 'msg': msg})
        if not ok:
            errors.append(msg)
    
    return jsonify({
        'ok': True,
        'zip_base64': bio.getvalue().hex(),
        'totale_generale': tot,
        'codice_ordine': order_id,
        'stampe': printed,
        'errori': errors
    })

@app.route('/printer-config')
@login_required
def printer_config():
    """Pagina di configurazione stampanti"""
    return render_template('printer_config.html', cfg=config)

@app.route('/settings')
@login_required
def settings():
    """Pagina impostazioni"""
    return render_template('settings.html', 
                          cfg={'api_base_url': config.API_BASE_URL})

@app.route('/api/printers/config', methods=['GET'])
@login_required
def api_get_printers():
    """Ottiene la configurazione delle stampanti"""
    try:
        printers = printer_manager.load_printer_config()
        return jsonify({
            'success': True,
            'printers': printers
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/printers/config', methods=['POST'])
@login_required
def api_save_printers():
    """Salva la configurazione delle stampanti"""
    try:
        data = request.json
        printers = data.get('printers', [])
        
        for idx, printer in enumerate(printers):
            is_valid, error_msg = printer_manager.validate_printer_config(printer)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': f"Stampante {idx + 1}: {error_msg}"
                }), 400
        
        success = printer_manager.save_printer_config(printers)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Configurazione salvata con successo'
            })
        
        return jsonify({
            'success': False,
            'error': 'Errore durante il salvataggio'
        }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/printers/test', methods=['POST'])
@login_required
def api_test_printer():
    """Invia un test di stampa a una stampante"""
    try:
        data = request.json
        ip = data.get('ip')
        port = data.get('port', 9100)
        
        if not ip:
            return jsonify({
                'success': False,
                'error': 'Indirizzo IP mancante'
            }), 400
        
        test_lines = [
            {'testo': '================================', 'stile': 'normale'},
            {'testo': 'TEST STAMPANTE', 'stile': 'title'},
            {'testo': '================================', 'stile': 'normale'},
            {'testo': '', 'stile': 'normale'},
            {'testo': f'IP: {ip}:{port}', 'stile': 'normale'},
            {'testo': f'Data: {datetime.datetime.now().strftime("%d/%m/%Y %H:%M")}', 
             'stile': 'normale'},
            {'testo': '', 'stile': 'normale'},
            {'testo': 'Se vedi questo messaggio,', 'stile': 'normale'},
            {'testo': 'la stampante funziona!', 'stile': 'bold'},
            {'testo': '', 'stile': 'normale'},
            {'testo': '================================', 'stile': 'normale'},
        ]
        
        temp_settings = {
            'printer_ip': ip,
            'printer_port': port
        }
        
        temp_settings_path = os.path.join(APP_DIR, 'temp_test_settings.json')
        with open(temp_settings_path, 'w', encoding='utf-8') as f:
            json.dump(temp_settings, f)
        
        ok, msg = stampa_escpos_righe(test_lines, taglio=True, 
                                      settings_path=temp_settings_path)
        
        try:
            os.remove(temp_settings_path)
        except:
            pass
        
        if ok:
            return jsonify({
                'success': True,
                'message': 'Test di stampa inviato con successo'
            })
        
        return jsonify({
            'success': False,
            'error': msg
        }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
@app.route('/api/settings/api', methods=['POST'])
@login_required
def api_save_api_settings():
    """Salva la configurazione dell'URL dell'API"""
    try:
        data = request.get_json()
        api_base_url = data.get('api_base_url', '').strip()
        
        if not api_base_url:
            return jsonify({
                'success': False,
                'error': 'URL API richiesto'
            }), 400
        
        api_base_url = api_base_url.rstrip('/')
        
        config.save_to_env_file('API_BASE_URL', api_base_url)
        new_url = config.reload_api_config()
        
        clear_session()
        
        return jsonify({
            'success': True,
            'message': 'Configurazione API salvata. Effettua nuovamente il login.',
            'reload': True
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/settings/test', methods=['POST'])
@login_required
def api_test_connection():
    """Testa la connessione all'API usando l'endpoint /health"""
    try:
        data = request.get_json()
        api_base_url = data.get('api_base_url', '').strip()
        
        if not api_base_url:
            return jsonify({
                'success': False,
                'error': 'URL API richiesto'
            }), 400
        
        api_base_url = api_base_url.rstrip('/')
        health_url = f"{api_base_url}/health"
        
        response = requests.get(health_url, timeout=5)
        
        if response.status_code == 200:
            try:
                health_data = response.json()
                status = health_data.get('status', 'unknown')
                
                if status == 'ok':
                    uptime = health_data.get('uptime', 0)
                    uptime_str = (f"{uptime:.1f}s" if uptime < 60 
                                 else f"{uptime/60:.1f}m")
                    return jsonify({
                        'success': True,
                        'message': '✅ Connessione riuscita! Server API operativo.',
                        'details': f'Status: {status} | Uptime: {uptime_str}'
                    })
                
                return jsonify({
                    'success': False,
                    'error': f'⚠️ Server raggiunto ma status non valido: {status}'
                }), 400
            except Exception as parse_error:
                return jsonify({
                    'success': False,
                    'error': f'Server raggiunto ma risposta non valida: {str(parse_error)}'
                }), 400
        
        return jsonify({
            'success': False,
            'error': f'Server raggiunto ma risposta non valida (HTTP {response.status_code})'
        }), 400
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': '⏱️ Timeout: Il server non risponde entro 5 secondi'
        }), 408
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'error': '🔌 Server non raggiungibile. Verifica l\'indirizzo IP e la porta.'
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Errore imprevisto: {str(e)}'
        }), 500
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7010, debug=False)
