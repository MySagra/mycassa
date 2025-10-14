# -*- coding: utf-8 -*-
"""
Modulo di supporto alla stampa ESC/POS.

Contiene funzioni per caricare le impostazioni della stampante da un file JSON e
per inviare righe di testo a una stampante termica tramite socket TCP.

Le righe di testo vengono codificate secondo la codepage configurata (vedere
`settings.json`). Se le righe contengono il simbolo dell'euro e la codepage
selezionata non lo supporta, il simbolo viene sostituito con " EUR ".

Le righe che iniziano con "TAVOLO N°" oppure "CLIENTE:" vengono stampate in
modalità doppia altezza e larghezza (0x30) per risultare più grandi sulla
stampante termica. Dopo queste righe, la modalità di stampa viene ripristinata.

Sono presenti alcune costanti per i comandi ESC/POS più comuni:
  - ESC_INIT: reset della stampante (ESC @)
  - GS_V_FULL_CUT: taglio completo della carta (GS V 0)
  - LF: codice di linea (\n)
"""

import json
import os
import socket
from typing import Iterable, Tuple

# Comandi ESC/POS di base
ESC_INIT = b"\x1B\x40"       # ESC @  - resetta la stampante
GS_V_FULL_CUT = b"\x1D\x56\x00"  # GS V 0 - taglio completo
LF = b"\n"                # newline


def carica_impostazioni(percorso: str = "settings.json") -> dict:
    """Carica le impostazioni della stampante dal file JSON indicato.

    Restituisce un dizionario con valori di default se il file non esiste o
    contiene dati non validi.
    """
    defaults = {
        "printer_ip": "",
        "printer_port": 9100,
        "receipt_width_chars": 42,
        "currency": "€",
        "escpos_encoding": "cp858",
        # Numero della codepage da selezionare con ESC t n (0x1B 0x74 n)
        "escpos_select_codepage": 19,
        # Numero di righe bianche aggiuntive dopo il codice prima del taglio
        "extra_feeds_after_code": 10,
    }
    try:
        with open(percorso, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            # Fonde i defaults con il contenuto del file
            defaults.update({k: cfg.get(k, defaults[k]) for k in defaults})
            return defaults
    except Exception:
        return defaults


def stampa_escpos_righe(
    righe: Iterable[str],
    taglio: bool = True,
    settings_path: str = "settings.json",
) -> Tuple[bool, str]:
    """Invia un elenco di righe di testo a una stampante ESC/POS.

    Le righe vengono inviate in sequenza, interpretando marker speciali
    inseriti dal generatore degli scontrini:

    - "<<DH>>" abilita la stampa a doppia altezza (0x10).
    - "<<NORM>>" ripristina la modalità normale.
    - Qualsiasi riga che inizia con "TAVOLO N°", "CLIENTE:" o "ORDINE #"
      viene stampata con doppia altezza e larghezza (0x30).

    Le righe vengono codificate usando l'encoding specificato in settings.json.
    Euro non supportati vengono sostituiti con " EUR ".

    Args:
        righe: lista di stringhe da stampare.
        taglio: se True, viene inviato il comando di taglio finale.
        settings_path: percorso al file di impostazioni JSON.

    Returns:
        (ok, messaggio) dove ok è True se la stampa è andata a buon fine.
    """
    cfg = carica_impostazioni(settings_path)
    ip = cfg.get("printer_ip") or ""
    port = int(cfg.get("printer_port", 9100))
    encoding = (cfg.get("escpos_encoding") or "cp858").lower()
    codepage_num = int(cfg.get("escpos_select_codepage", 19))
    extra_feeds = int(cfg.get("extra_feeds_after_code", 10))

    if not ip:
        return False, "Stampante non configurata in settings.json"

    def esc_select_codepage(n: int) -> bytes:
        return b"\x1B\x74" + bytes([n])

    def esc_print_mode(n: int) -> bytes:
        return b"\x1B\x21" + bytes([n])

    def safe_encode(s: str) -> bytes:
        try:
            return s.encode(encoding)
        except UnicodeEncodeError:
            return s.replace("€", " EUR ").encode(encoding, errors="replace")

    # Costruzione payload in modo sequenziale per gestire modalita' dinamiche
    data = bytearray()
    data += ESC_INIT
    data += esc_select_codepage(codepage_num)
    # Stato corrente di stampa: 0x00 normale, 0x10 doppia altezza, 0x30 doppia larghezza+altezza
    current_mode = 0x00
    for line in righe:
        stripped = line.strip()
        # Controlla i marker di modalità
        if stripped == "<<DH>>":
            # Doppia altezza (solo per righe successive)
            if current_mode != 0x10:
                data += esc_print_mode(0x10)
                current_mode = 0x10
            continue
        if stripped == "<<NORM>>":
            if current_mode != 0x00:
                data += esc_print_mode(0x00)
                current_mode = 0x00
            continue
        # Righe da stampare in grande (doppia larghezza + doppia altezza)
        if (stripped.startswith("TAVOLO N°") or stripped.startswith("CLIENTE:")
            or stripped.startswith("ORDINE N°") or stripped.startswith("ORDINE #")):
            # imposta modalità 0x30, stampa riga, poi ripristina modalità
            if current_mode != 0x30:
                data += esc_print_mode(0x30)
            data += safe_encode(line) + LF
            # ripristina modalità normale
            if current_mode != 0x00:
                data += esc_print_mode(0x00)
            current_mode = 0x00
            continue
        # Tutte le altre righe vengono stampate con la modalità corrente
        data += safe_encode(line) + LF
    # Righe bianche extra prima del taglio
    data += LF * extra_feeds
    if taglio:
        data += GS_V_FULL_CUT
    # Invio dati tramite socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    try:
        s.connect((ip, port))
        s.sendall(data)
        s.shutdown(socket.SHUT_WR)
        return True, f"Inviato a {ip}:{port}"
    except OSError as e:
        return False, str(e)
    finally:
        try:
            s.close()
        except Exception:
            pass