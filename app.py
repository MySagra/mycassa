# -*- coding: utf-8 -*-
import os, json, uuid, io, datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from escpos_send import stampa_escpos_righe, carica_impostazioni
from auth import login_user, save_token_to_session, clear_session, login_required, is_authenticated
from api_client import get_products, get_categories, create_order
import config
import printer_manager

# Directory dell'applicazione
APP_DIR = os.path.dirname(__file__)

# Percorso per il contatore progressivo degli ordini
COUNTER_JSON = os.path.join(APP_DIR, 'data', 'counter.json')

def next_order_number() -> int:
    """Restituisce il prossimo numero progressivo per l'ordine.

    Legge il valore da COUNTER_JSON, lo incrementa e lo salva.
    Se il file non esiste o è corrotto, parte da 1.
    """
    # Assicurati che la directory esista
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

# Prezzo extra per ogni aggiunta
EXTRA_PER_ADD = 0.50

def bullet_lines(item):
    """
    Ritorna le linee descrittive in stile elenco puntato per ESC/POS.
    Ad esempio:
        Margherita:
            - aggiunte: bufala, acciughe
            - rimozioni: cipolla
    Se non ci sono modifiche, restituisce solo il nome seguito da due punti.
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
    Se non ci sono modifiche, restituisce semplicemente il nome.
    """
    base = item.get('name', '')
    adds = [a.strip() for a in (item.get('adds') or []) if a.strip()]
    rems = [r.strip() for r in (item.get('removes') or []) if r.strip()]
    # Nessuna aggiunta né rimozione
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
    Ogni aggiunta costa EXTRA_PER_ADD euro; le rimozioni non influiscono.
    """
    adds = [a for a in (item.get('adds') or []) if str(a).strip()]
    return float(item.get('price', 0)) + EXTRA_PER_ADD * len(adds)

# Percorsi file Excel (mantenuti per compatibilità ma non più usati per prodotti/ordini)
DATA_XLSX = os.path.join(APP_DIR, 'data', 'products.xlsx')
ORDINI_XLSX = os.path.join(APP_DIR, 'data', 'ordini.xlsx')

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = config.SECRET_KEY
app.config['SESSION_COOKIE_NAME'] = config.SESSION_COOKIE_NAME
app.config['SESSION_COOKIE_HTTPONLY'] = config.SESSION_COOKIE_HTTPONLY
app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE

def carica_prodotti():
    """
    Carica i prodotti dall'API REST invece che dal file Excel.
    Mantiene la compatibilità con il formato precedente.
    """
    success, cats, error = get_products()
    if success:
        return cats
    else:
        # In caso di errore, restituisce un dizionario vuoto e logga l'errore
        print(f"Errore caricamento prodotti: {error}")
        return {}

def append_log_ordine(codice, cart, totale, tavolo='', cliente='', pagamento=''):
    """
    Registra l'ordine tramite l'API REST invece che sul file Excel.
    Mantiene la compatibilità con la funzione precedente.
    """
    # Prepara i dati per l'API
    order_data = {
        'table': tavolo,
        'customer': cliente,
        'payment_method': pagamento,
        'total': float(totale),
        'items': cart
    }
    
    # Invia l'ordine all'API
    success, order_id, error = create_order(order_data)
    
    if success:
        print(f"Ordine {codice} creato con successo. ID API: {order_id}")
        return True, order_id
    else:
        print(f"Errore creazione ordine {codice}: {error}")
        return False, None

def formatta_righe_scontrino(categoria, articoli, valuta='€', codice='', tavolo='', cliente='', pagamento=''):
    """
    Prepara le righe per la stampa ESC/POS, includendo data/ora, aggiunte e rimozioni.
    Oltre al totale, stampa anche il metodo di pagamento se fornito.
    Le aggiunte incrementano il prezzo unitario di EXTRA_PER_ADD.
    """
    larghezza = 42
    righe = []
    header = 'Oratorio di Petosino - SeptemberFest'
    righe.append(header.center(larghezza))
    righe.append('')
    # Data e ora di emissione
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    righe.append(f"Emesso: {now}".center(larghezza))
    righe.append('')
    # Titolo categoria
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
        # Nome e quantità in grande
        righe.append("<<DH>>")
        name_line = (it.get('name', '') + ':')
        righe.append(name_line if len(name_line) <= larghezza else name_line[:larghezza])
        # Modifiche (aggiunte/rimozioni) dopo la parte ingrandita
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
        # Riga vuota di separazione
        righe.append('')
    # Riepilogo totale
    righe.append('-' * larghezza)
    sx = 'TOTALE'
    dx = f"{totale:.2f}{valuta}"
    righe.append(sx + ' ' * (larghezza - len(sx) - len(dx)) + dx)
    # Metodo di pagamento
    if pagamento:
        righe.append(f"Pagamento: {pagamento}")
    # Codice ordine
    if codice:
        righe.append('')
        righe.append('')
        righe.append(codice)
        righe.append('')
    # Tavolo e cliente (stampati in grande nella escpos_send)
    if tavolo or cliente:
        righe.append('')
        if tavolo:
            righe.append(f"TAVOLO N° {tavolo}")
        if cliente:
            righe.append(f"CLIENTE: {cliente}")
    righe.append('')
    return righe, totale

def html_scontrino(categoria, articoli, valuta, codice, totale, tavolo='', cliente='', pagamento=''):
    """
    Genera l'HTML per lo scontrino includendo data/ora, modifiche e metodo di pagamento.
    """
    # Prepara le righe della tabella con descrizione e prezzo unitario
    rows = []
    for it in articoli:
        qty = int(it.get('qty', 1))
        unit = prezzo_unitario(it)
        sub = qty * unit
        adds = [a.strip() for a in (it.get('adds') or []) if a.strip()]
        rems = [r.strip() for r in (it.get('removes') or []) if r.strip()]
        # Costruisci la colonna descrizione con elenco puntato
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
    # Logo opzionale
    logo_tag = ""
    logo_path = os.path.join(APP_DIR, 'static', 'logo.png')
    if os.path.exists(logo_path):
        logo_tag = "<img src='/static/logo.png' alt='logo' style='max-width:140px; display:block; margin:0 auto 6px;'/>"
    # Data e ora attuali
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    # Tavolo e cliente
    tav_cli = ""
    if tavolo or cliente:
        tc = []
        if tavolo:
            tc.append(f"TAVOLO N° {tavolo}")
        if cliente:
            tc.append(f"CLIENTE: {cliente}")
        tav_cli = "<div class='tc'>" + "<br/>".join(tc) + "</div>"
    # Pagamento html (al centro)
    pag_html = f"<div class='pay'>Pagamento: {pagamento}</div>" if pagamento else ""
    # Componi HTML
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
    # Se già autenticato, redirige alla home
    if is_authenticated():
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if not username or not password:
            return render_template('login.html', error='Username e password sono obbligatori')
        
        # Effettua il login tramite API
        success, token, error = login_user(username, password)
        
        if success:
            # Salva il token nella sessione
            save_token_to_session(token)
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error=error)
    
    return render_template('login.html')


@app.route('/logout')
def logout():
    """Effettua il logout cancellando il token dalla sessione"""
    clear_session()
    return redirect(url_for('login_page'))


@app.route('/')
@login_required
def home():
    """Pagina principale - ora protetta con autenticazione"""
    cfg = carica_impostazioni(os.path.join(APP_DIR, 'settings.json'))
    return render_template('index_new.html', cfg=cfg)

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

@app.post('/genera')
@login_required
def genera():
    js = request.json or {}
    cart = js.get('cart', [])
    valuta = js.get('currency', '€')
    auto_print = bool(js.get('auto_print', False))
    tavolo = (js.get('tavolo') or '').strip()
    cliente = (js.get('cliente') or '').strip()
    pagamento = (js.get('pagamento') or '').strip().upper()
    if not tavolo or not cliente:
        return jsonify({'ok': False, 'error': 'Tavolo e Cliente sono obbligatori.'}), 400
    # Valida metodo di pagamento
    if pagamento not in ('CONTANTI', 'POS'):
        return jsonify({'ok': False, 'error': 'Metodo di pagamento obbligatorio.'}), 400
    
    # PASSO 1: Prepara i dati per l'ordine (calcola totale)
    by_cat = {}
    tot = 0.0
    for it in cart:
        # Filtra articoli senza quantità o con qty zero
        if int(it.get('qty', 0)) <= 0:
            continue
        # Calcola il totale
        qty = int(it.get('qty', 0))
        unit_price = prezzo_unitario(it)
        tot += qty * unit_price
        
        # Inserisci nel raggruppamento per categoria includendo aggiunte e rimozioni
        by_cat.setdefault(it['category'], []).append({
            'name': it['name'],
            'qty': qty,
            'price': float(it['price']),
            'adds': it.get('adds') or [],
            'removes': it.get('removes') or []
        })
    
    # PASSO 2: Crea l'ordine tramite API PRIMA di stampare
    order_data = {
        'table': tavolo,
        'customer': cliente,
        'payment_method': pagamento,
        'total': tot,
        'items': cart
    }
    
    success, order_id, error = create_order(order_data)
    
    if not success:
        return jsonify({'ok': False, 'error': f'Errore creazione ordine: {error}'}), 500
    
    # PASSO 3: Usa il codice ordine dall'API per gli scontrini
    codice = f"ORDINE N° {order_id}"
    
    # PASSO 4: Genera gli scontrini con il codice ordine dall'API
    scontrini = []
    for cat, items in by_cat.items():
        # Usa codice ordine dall'API per ogni scontrino di categoria
        lines, sub = formatta_righe_scontrino(cat, items, valuta, codice, tavolo, cliente, pagamento)
        html = html_scontrino(cat, items, valuta, codice, sub, tavolo, cliente, pagamento)
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
    # Scontrino totale complessivo
    lines_all, _ = formatta_righe_scontrino('TOTALE COMPLESSIVO', all_items, valuta, codice, tavolo, cliente, pagamento)
    html_all = html_scontrino('TOTALE COMPLESSIVO', all_items, valuta, codice, tot, tavolo, cliente, pagamento)
    from zipfile import ZipFile, ZIP_DEFLATED
    bio = io.BytesIO()
    with ZipFile(bio, 'w', ZIP_DEFLATED) as z:
        for s in scontrini:
            z.writestr(f"scontrino_{s['categoria'].replace(' ','_')}.html", s['html'])
        z.writestr('scontrino_TOTALE.html', html_all)
    printed = []; errors = []
    if auto_print:
        for s in scontrini:
            ok, msg = stampa_escpos_righe(s['righe'], taglio=True, settings_path=os.path.join(APP_DIR, 'settings.json'))
            printed.append({'categoria': s['categoria'], 'ok': ok, 'msg': msg})
            if not ok: errors.append(msg)
        ok, msg = stampa_escpos_righe(lines_all, taglio=True, settings_path=os.path.join(APP_DIR, 'settings.json'))
        printed.append({'categoria': 'TOTALE', 'ok': ok, 'msg': msg});
        if not ok: errors.append(msg)
    # Restituisci l'ID ordine dall'API
    return jsonify({
        'ok': True,
        'zip_base64': bio.getvalue().hex(),
        'totale_generale': tot,
        'codice_ordine': order_id,  # Usa l'ID dall'API invece del contatore locale
        'stampe': printed,
        'errori': errors
    })

# ================== PRINTER CONFIG ROUTES ==================

@app.route('/printer-config')
@login_required
def printer_config():
    """Pagina di configurazione stampanti"""
    return render_template('printer_config.html', cfg=config)

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
        
        # Valida ogni stampante
        for idx, printer in enumerate(printers):
            is_valid, error_msg = printer_manager.validate_printer_config(printer)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': f"Stampante {idx + 1}: {error_msg}"
                }), 400
        
        # Salva la configurazione
        success = printer_manager.save_printer_config(printers)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Configurazione salvata con successo'
            })
        else:
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
        
        # Crea un test di stampa
        test_lines = [
            {'testo': '================================', 'stile': 'normale'},
            {'testo': 'TEST STAMPANTE', 'stile': 'title'},
            {'testo': '================================', 'stile': 'normale'},
            {'testo': '', 'stile': 'normale'},
            {'testo': f'IP: {ip}:{port}', 'stile': 'normale'},
            {'testo': f'Data: {datetime.datetime.now().strftime("%d/%m/%Y %H:%M")}', 'stile': 'normale'},
            {'testo': '', 'stile': 'normale'},
            {'testo': 'Se vedi questo messaggio,', 'stile': 'normale'},
            {'testo': 'la stampante funziona!', 'stile': 'bold'},
            {'testo': '', 'stile': 'normale'},
            {'testo': '================================', 'stile': 'normale'},
        ]
        
        # Crea settings temporanee con IP e porta fornite
        temp_settings = {
            'printer_ip': ip,
            'printer_port': port
        }
        
        # Salva temporaneamente le settings
        temp_settings_path = os.path.join(APP_DIR, 'temp_test_settings.json')
        with open(temp_settings_path, 'w', encoding='utf-8') as f:
            json.dump(temp_settings, f)
        
        # Invia il test di stampa
        ok, msg = stampa_escpos_righe(test_lines, taglio=True, settings_path=temp_settings_path)
        
        # Rimuovi file temporaneo
        try:
            os.remove(temp_settings_path)
        except:
            pass
        
        if ok:
            return jsonify({
                'success': True,
                'message': 'Test di stampa inviato con successo'
            })
        else:
            return jsonify({
                'success': False,
                'error': msg
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ========================================================

if __name__ == '__main__':
    # Avvia il server su tutte le interfacce di rete per essere raggiungibile da altre macchine
    app.run(host='0.0.0.0', port=7010, debug=False)
