export const it = {
  translation: {
    userMenu: {
      settings: "Impostazioni",
      lightTheme: "Tema chiaro",
      darkTheme: "Tema scuro",
      notices: "Avvisi Display",
      language: "Lingua",
      italian: "Italiano",
      english: "English",
      logout: "Esci"
    },
    orderForm: {
      loadOrder: "Carica Ordine",
      orderCodePlaceholder: "CODICE ORDINE (ES. ABC)",
      customer: "Cliente",
      customerPlaceholder: "Es. Mario Rossi",
      table: "Tavolo",
      tablePlaceholder: "Es. 12 o Tavolo A5",
      tableDisabled: "TAVOLO DISABILITATO"
    },
    payment: {
      subtotal: "Subtotale",
      surcharges: "Sovrapprezzi totali",
      discount: "Sconto applicato",
      total: "TOTALE",
      paymentMethod: "Metodo Pagamento",
      cash: "Contanti",
      card: "Carta",
      paidByCustomer: "Pagato dal cliente",
      change: "Resto"
    },
    cartSidebar: {
      title: "Carrello",
      dailyOrders: "Ordini Giornalieri",
      emptyCart: "Carrello vuoto",
      clearCartHover: "Svuota carrello",
      clearCartTitle: "Svuotare il carrello?",
      clearCartDesc: "L'azione non può essere annullata.",
      cancel: "Annulla",
      clear: "Svuota",
      creatingOrder: "Creazione in corso...",
      createOrder: "Crea Ordine",
      applyDiscount: "Applica sconto",
      toastCleared: "Carrello svuotato"
    },
    cartItem: {
      unavailable: "Non disponibile"
    },
    dailyOrders: {
      title: "Ordini Giornalieri",
      showAllOrders: "Mostra tutti gli ordini",
      tooltipAll: "Stai visualizzando tutti gli ordini",
      tooltipPending: "Stai visualizzando solo gli ordini in attesa",
      searchOrder: "Cerca Ordine",
      searchPlaceholder: "Cerca per codice, tavolo o cliente...",
      loading: "Caricamento ordini...",
      noOrders: "Nessun ordine trovato per oggi"
    },
    dailyOrderCard: {
      statusPending: "In attesa",
      statusConfirmed: "Confermato",
      statusCompleted: "Completato",
      statusPickedUp: "Ritirato",
      tablePrefix: "Tavolo",
      view: "Visualizza",
      load: "Carica",
      tooltipLoadOnlyPending: "Solo gli ordini in attesa possono essere caricati"
    },
    orderDetailDialog: {
      title: "Dettaglio Ordine",
      description: "Visualizza i dettagli completi dell'ordine",
      loading: "Caricamento...",
      customer: "Cliente",
      table: "Tavolo",
      code: "Codice",
      ticket: "Comanda",
      creationDate: "Data creazione",
      confirmationDate: "Data conferma",
      payment: "Pagamento",
      status: "Stato",
      products: "Prodotti",
      notes: "Note:",
      quantity: "Quantità:",
      subtotal: "Subtotale:",
      totalSurcharges: "Totale sovrapprezzi:",
      discount: "Sconto:",
      total: "Totale:",
      cashRegister: "Cassa:",
      operator: "Operatore:",
      print: "Stampa",
      close: "Chiudi",
      statusPending: "IN ATTESA",
      statusConfirmed: "CONFERMATO",
      statusReady: "PRONTO",
      statusPickedUp: "RITIRATO",
      paymentCard: "CARTA",
      paymentCash: "CONTANTI"
    },
    editItemDialog: {
      title: "Modifica Prodotto",
      quantityPrompt: "Quantità con questa modifica",
      quantityHint: "Indica quante unità devono avere questa personalizzazione (max: {{max}})",
      ingredients: "Ingredienti",
      ingredientsHint: "Imposta la quantità degli ingredienti (0 = nessuno)",
      addIngredients: "Aggiungi Ingredienti",
      searchPlaceholder: "Cerca...",
      note: "Nota",
      notePlaceholder: "Aggiungi una nota per questo prodotto...",
      cancel: "Annulla",
      save: "Salva"
    },
    discountDialog: {
      toastApplied: "Sconto di {{amount}} € applicato",
      toastRemoved: "Sconto rimosso",
      discountCapped: "Sconto ridotto a {{amount}} € (pari al totale dell'ordine)",
      title: "Applica Sconto",
      description: "Inserisci l'importo dello sconto da applicare al totale dell'ordine",
      discountLabel: "Sconto (€)",
      maxDiscount: "Sconto massimo: 9999.99 €",
      currentDiscount: "Sconto attualmente applicato:",
      cancel: "Annulla",
      removeDiscount: "Rimuovi Sconto",
      apply: "Applica"
    },
    configDialog: {
      errorLoading: "Errore nel caricamento delle casse",
      selectRegisterToast: "Seleziona una cassa",
      configuredToast: "Cassa configurata con successo",
      title: "Configurazione mancante",
      description: "Per utilizzare MyCassa devi prima configurare la cassa.",
      selectRegisterLabel: "Seleziona cassa",
      loading: "Caricamento...",
      selectRegisterPlaceholder: "Seleziona una cassa",
      saveConfig: "Salva configurazione"
    },
    header: {
      searchFood: "Cerca un cibo...",
      clearSearch: "Cancella ricerca",
      closureConfirmTitle: "Chiusura Sagra",
      closureConfirmDesc: "Sei sicuro di voler eseguire la chiusura cassa? Questa operazione non può essere annullata.",
      cancel: "Annulla",
      confirm: "Conferma",
      closureButton: "Chiusura Sagra"
    },
    settings: {
      printers: {
        title: "Stampanti",
        description: "Configura le impostazioni delle stampanti connesse all'applicazione",
        selectRegister: "Seleziona cassa",
        loading: "Caricamento...",
        selectRegisterPlaceholder: "Seleziona una cashier",
        toastSaved: "Cassa selezionata salvata"
      },
      appearance: {
        title: "Aspetto",
        description: "Personalizza l'aspetto dell'applicazione",
        theme: "Tema",
        themeDescription: "Scegli tra tema chiaro e scuro",
        light: "Chiaro",
        dark: "Scuro"
      },
      header: {
        title: "Impostazioni",
        backToCashier: "Torna alla cassa"
      }
    },
    loginForm: {
      usernameRequired: "Username obbligatorio",
      passwordRequired: "Password obbligatoria",
      invalidCredentials: "Credenziali non valide",
      loginError: "Errore durante il login",
      bothRequired: "Username e Password sono obbligatori",
      validationError: "Errore di validazione",
      welcome: "Benvenuto!",
      subtitle: "Esegui il login al tuo account MyCassa",
      usernameLabel: "Username",
      usernamePlaceholder: "Username o Email",
      passwordLabel: "Password",
      passwordPlaceholder: "La tua password",
      loggingIn: "Accesso...",
      loginButton: "Accedi"
    },
    categorySideBar: {
      allCategories: "Tutte le Categorie",
      loading: "Caricamento...",
      notAvailable: "Non disp."
    },
    foods: {
      notAvailable: "Non disp."
    },
    mobile: {
      header: {
        verifyOrder: "Cerca ordini"
      },
      foodPicker: {
        title: "Aggiungi prodotto",
        noResults: "Nessun prodotto trovato",
        addButton: "Aggiungi"
      },
      changeCalculator: {
        title: "Calcolatore Resto",
        totalLabel: "Totale da pagare",
        applyButton: "Usa importo"
      },
      layout: {
        editCart: "Modifica",
        addProduct: "Aggiungi"
      },
      editItem: {
        noIngredientFound: "Nessun ingrediente trovato"
      },
      orderConfirmed: "Ordine confermato!"
    },
    toast: {
      newOrder: "Nuovo ordine: {{displayCode}}",
      orderLoaded: "Ordine {{displayCode}} caricato con successo",
      orderLoadedToCart: "Ordine {{displayCode}} caricato nel carrello",
      orderCreated: "Ordine creato con successo",
      orderConfirmed: "Ordine confermato con successo",
      orderLoadError: "Impossibile caricare l'ordine",
      orderCodeRequired: "Inserisci un codice ordine",
      orderAlreadyConfirmed: "L'ordine è stato già confermato",
      emptyCart: "Il carrello è vuoto",
      categoriesLoadError: "Impossibile caricare le categorie",
      foodUnavailable: "\"{{foodName}}\" non è più disponibile",
      foodAvailable: "\"{{foodName}}\" è ora disponibile",
      foodAvailableAgain: "\"{{foodName}}\" è nuovamente disponibile",
      categoryUnavailable: "Categoria \"{{categoryName}}\" non è più disponibile",
      categoryAvailable: "Categoria \"{{categoryName}}\" è ora disponibile",
      printerOnline: "{{label}} è online",
      printerOnlineDesc: "Stampante operativa",
      printerOffline: "{{label}} è offline",
      printerOfflineDesc: "Stampante non raggiungibile",
      printerError: "{{label}} è in errore",
      printerErrorDesc: "Stato: {{status}}",
      tokenExpired: "Token scaduto",
      noCashRegisterSelected: "Devi selezionare una cashier prima di confermare l'ordine",
      cashierNotSelected: "Nessuna cashier selezionata",
      generalClosureSuccess: "Chiusura cashier eseguita con successo",
      generalClosureError: "Errore durante la chiusura cashier",
      authError401: "Sessione scaduta. Effettua il login nuovamente.",
      authError403: "Accesso vietato. Contatta l'amministratore."
    }
  }
};
