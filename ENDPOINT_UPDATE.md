# 🔄 Aggiornamento Endpoint API

## Modifiche Apportate

Le rotte API sono state aggiornate per riflettere la struttura corretta:

### ✅ Endpoint Aggiornati

| Vecchio | Nuovo | Descrizione |
|---------|-------|-------------|
| `/products` | `/v1/foods` | Lista prodotti alimentari |
| `/orders` | `/v1/orders` | Gestione ordini |
| - | `/v1/categories` | Lista categorie (nuovo) |
| `/auth/login` | `/auth/login` | Login (invariato) |

### 📝 Dettagli Endpoint

#### 1. **POST /auth/login**
Login utente - **non** ha il prefisso `/v1`
```
POST http://localhost:4300/auth/login
```

#### 2. **GET /v1/categories**
Recupera tutte le categorie disponibili
```
GET http://localhost:4300/v1/categories
Headers: Authorization: Bearer <token>
```

Risposta:
```json
[
  {
    "id": 1,
    "name": "Pizzeria"
  },
  {
    "id": 2,
    "name": "Bibite"
  }
]
```

#### 3. **GET /v1/foods**
Recupera tutti i prodotti alimentari
```
GET http://localhost:4300/v1/foods
Headers: Authorization: Bearer <token>
```

Risposta:
```json
[
  {
    "id": 1,
    "name": "Margherita",
    "category": {
      "id": 1,
      "name": "Pizzeria"
    },
    "price": 5.00,
    "active": true
  }
]
```

#### 4. **POST /v1/orders**
Crea un nuovo ordine
```
POST http://localhost:4300/v1/orders
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json
```

Request:
```json
{
  "table": "12",
  "customer": "Mario Rossi",
  "payment_method": "CONTANTI",
  "total": 15.50,
  "items": [
    {
      "name": "Margherita",
      "category": "Pizzeria",
      "quantity": 2,
      "unit_price": 5.00,
      "subtotal": 10.00,
      "additions": ["bufala"],
      "removals": ["cipolla"]
    }
  ]
}
```

### 🔧 File Modificati

1. **config.py**
   - `API_PRODUCTS` → `API_FOODS` (con `/v1/foods`)
   - Aggiunto `API_CATEGORIES` (`/v1/categories`)
   - `API_ORDERS` aggiornato a `/v1/orders`
   - `API_LOGIN` rimane `/auth/login` (senza `/v1`)

2. **api_client.py**
   - Aggiunta funzione `get_categories()`
   - `get_products()` ora usa `API_FOODS`
   - Gestione oggetto `category` nelle risposte dei foods
   - Aggiunto campo `id` ai prodotti organizzati

3. **test_api.py**
   - Aggiunto test per `/v1/categories`
   - Test per `/v1/foods` invece di `/products`
   - Migliorata visualizzazione output

4. **app.py**
   - Import di `get_categories` da `api_client`

### 🎯 Gestione Categoria

L'API può restituire `category` come:
- **Oggetto**: `{"id": 1, "name": "Pizzeria"}`
- **Stringa**: `"Pizzeria"`

Il client gestisce entrambi i formati automaticamente:
```python
category_data = food.get('category', {})
if isinstance(category_data, dict):
    category = category_data.get('name', 'Altro')
else:
    category = str(category_data) if category_data else 'Altro'
```

### ✅ Test

Per testare i nuovi endpoint:
```bash
python test_api.py
```

Il test verificherà:
1. ✅ Connessione API base
2. ✅ Login (`/auth/login`)
3. ✅ Categorie (`/v1/categories`)
4. ✅ Foods (`/v1/foods`)

### 📌 Note Importanti

- Solo **`/auth/login`** NON ha il prefisso `/v1`
- Tutte le altre risorse usano `/v1/` come prefisso
- La gestione delle categorie è retrocompatibile
- Il campo `id` dei prodotti viene preservato per riferimenti futuri

---

**Data aggiornamento**: 13 ottobre 2025
