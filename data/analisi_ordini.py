#!/usr/bin/env python3
# Analisi ordini con metriche giornaliere
import sys
import re
import pandas as pd
from pathlib import Path

KNOWN_CATEGORIES = {"bar": "Bar", "fritti": "Fritti", "pizzeria": "Pizzeria"}

segment_re = re.compile(
    r"""
    ^\s*
    (?P<cat>[^-xX;]+?)           # categoria
    \s*(?:-|–)\s*                # trattino
    (?P<item>.+?)                # nome articolo
    \s*[xX]\s*(?P<qty>\d+)       # 'x' e quantita'
    \s*$
    """,
    re.VERBOSE,
)

def parse_riepilogo(riepilogo: str):
    out = []
    if not isinstance(riepilogo, str) or not riepilogo.strip():
        return out
    parts = [p for p in (s.strip() for s in riepilogo.split(";")) if p]
    for p in parts:
        m = segment_re.match(p) or re.match(r"^\s*(?P<cat>\S+)\s*-\s*(?P<item>.+?)\s*[xX]\s*(?P<qty>\d+)\s*$", p)
        if m:
            cat_raw = m.group("cat").strip()
            item = m.group("item").strip()
            qty = int(m.group("qty"))
            if cat_raw.lower() in KNOWN_CATEGORIES:
                out.append({"Categoria": KNOWN_CATEGORIES[cat_raw.lower()], "Articolo": item, "Quantita": qty})
    return out

def main(inp: Path, outp: Path):
    df = pd.read_excel(inp)
    df = df.rename(columns={c: c.strip() for c in df.columns})
    required_cols = ["DataOra", "CodiceOrdine", "Tavolo", "Cliente", "Pagamento", "Riepilogo", "Totale"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise SystemExit(f"Colonne mancanti nel file: {missing}")

    # Normalizzo la data a livello 'giorno'
    df["DataOra"] = pd.to_datetime(df["DataOra"], errors="coerce")
    df["Data"] = df["DataOra"].dt.date

    rows = []
    for _, r in df.iterrows():
        for line in parse_riepilogo(r["Riepilogo"]):
            rows.append({
                "DataOra": r["DataOra"],
                "Data": r["Data"],
                "CodiceOrdine": r["CodiceOrdine"],
                "Tavolo": r["Tavolo"],
                "Cliente": r["Cliente"],
                "Pagamento": r["Pagamento"],
                "TotaleOrdine": r["Totale"],
                **line
            })
    exploded = pd.DataFrame(rows)

    # ----- Aggregati (globali) -----
    if not exploded.empty:
        items_totals = (
            exploded.groupby(["Categoria", "Articolo"], as_index=False)["Quantita"]
            .sum().sort_values(["Categoria", "Quantita"], ascending=[True, False])
        )
        items_by_pay = (
            exploded.groupby(["Pagamento", "Categoria", "Articolo"], as_index=False)["Quantita"]
            .sum().sort_values(["Pagamento", "Categoria", "Quantita"], ascending=[True, True, False])
        )
        category_counts = (
            exploded.groupby("Categoria", as_index=False)["Quantita"]
            .sum().sort_values("Quantita", ascending=False)
            .rename(columns={"Quantita": "TotaleQuantita"})
        )
        payments_totals = (
            df.groupby("Pagamento", as_index=False)
            .agg(TotaleIncasso=("Totale", "sum"), NumeroOrdini=("CodiceOrdine", "nunique"))
            .sort_values("TotaleIncasso", ascending=False)
        )
        category_by_pay_qty = (
            exploded.groupby(["Pagamento", "Categoria"], as_index=False)["Quantita"]
            .sum()
            .rename(columns={"Quantita": "TotaleQuantita"})
            .sort_values(["Pagamento", "TotaleQuantita"], ascending=[True, False])
        )
    else:
        items_totals = pd.DataFrame(columns=["Categoria", "Articolo", "Quantita"])
        items_by_pay = pd.DataFrame(columns=["Pagamento", "Categoria", "Articolo", "Quantita"])
        category_counts = pd.DataFrame(columns=["Categoria", "TotaleQuantita"])
        payments_totals = (
            df.groupby("Pagamento", as_index=False)
            .agg(TotaleIncasso=("Totale", "sum"), NumeroOrdini=("CodiceOrdine", "nunique"))
            .sort_values("TotaleIncasso", ascending=False)
            if "Pagamento" in df.columns and "Totale" in df.columns
            else pd.DataFrame(columns=["Pagamento", "TotaleIncasso", "NumeroOrdini"])
        )
        category_by_pay_qty = pd.DataFrame(columns=["Pagamento", "Categoria", "TotaleQuantita"])

    # ----- Nuove metriche aggregate per DATA -----
    # 1) Incassi giornalieri + numero ordini e valore medio
    daily_orders = (
        df.groupby("Data", as_index=False)
          .agg(
              TotaleIncasso=("Totale", "sum"),
              NumeroOrdini=("CodiceOrdine", "nunique")
          )
          .assign(ValoreMedioOrdine=lambda d: (d["TotaleIncasso"] / d["NumeroOrdini"]).round(2))
          .sort_values("Data")
    )

    # 2) Incasso giornaliero per tipo di pagamento
    daily_payments = (
        df.groupby(["Data", "Pagamento"], as_index=False)
          .agg(TotaleIncasso=("Totale", "sum"), NumeroOrdini=("CodiceOrdine","nunique"))
          .sort_values(["Data", "TotaleIncasso"], ascending=[True, False])
    )

    if not exploded.empty:
        # 3) Quantità giornaliere per categoria
        daily_category_qty = (
            exploded.groupby(["Data", "Categoria"], as_index=False)["Quantita"]
                    .sum()
                    .rename(columns={"Quantita":"TotaleQuantita"})
                    .sort_values(["Data", "TotaleQuantita"], ascending=[True, False])
        )

        # 4) Quantità giornaliere per articolo (dentro categoria)
        daily_item_qty = (
            exploded.groupby(["Data", "Categoria", "Articolo"], as_index=False)["Quantita"]
                    .sum()
                    .sort_values(["Data", "Categoria", "Quantita"], ascending=[True, True, False])
        )
    else:
        daily_category_qty = pd.DataFrame(columns=["Data","Categoria","TotaleQuantita"])
        daily_item_qty = pd.DataFrame(columns=["Data","Categoria","Articolo","Quantita"])

    with pd.ExcelWriter(outp, engine="xlsxwriter") as writer:
        # Dettaglio
        exploded.to_excel(writer, index=False, sheet_name="DettaglioItems")

        # Aggregati globali
        items_totals.to_excel(writer, index=False, sheet_name="TotalePerArticolo")
        items_by_pay.to_excel(writer, index=False, sheet_name="ArticoloPerPagamento")
        category_counts.to_excel(writer, index=False, sheet_name="TotalePerCategoria")
        payments_totals.to_excel(writer, index=False, sheet_name="IncassoPerPagamento")
        category_by_pay_qty.to_excel(writer, index=False, sheet_name="CategoriaPerPagamento")

        # Nuovi fogli giornalieri
        daily_orders.to_excel(writer, index=False, sheet_name="Giornaliero_Ordini_Incassi")
        daily_payments.to_excel(writer, index=False, sheet_name="Giornaliero_PerPagamento")
        daily_category_qty.to_excel(writer, index=False, sheet_name="Giornaliero_PerCategoria")
        daily_item_qty.to_excel(writer, index=False, sheet_name="Giornaliero_PerArticolo")

    print("OK")
    print(f"Righe ordine: {len(df)}")
    print(f"Righe items estratte: {len(exploded)}")
    print(f"Report: {outp}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python analisi_ordini.py input.xlsx [output.xlsx]")
    inp = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        outp = Path(sys.argv[2])
    else:
        outp = inp.with_name("report_aggregati_ordini.xlsx")
    main(inp, outp)
