export const en = {
  translation: {
    userMenu: {
      settings: "Settings",
      lightTheme: "Light theme",
      darkTheme: "Dark theme",
      notices: "Display Notices",
      language: "Language",
      italian: "Italiano",
      english: "English",
      logout: "Logout"
    },
    orderForm: {
      loadOrder: "Load Order",
      orderCodePlaceholder: "ORDER CODE (E.G. ABC)",
      customer: "Customer",
      customerPlaceholder: "E.g. John Doe",
      table: "Table",
      tablePlaceholder: "E.g. 12 or Table A5",
      tableDisabled: "TABLE DISABLED"
    },
    payment: {
      subtotal: "Subtotal",
      surcharges: "Total surcharges",
      discount: "Discount applied",
      total: "TOTAL",
      paymentMethod: "Payment Method",
      cash: "Cash",
      card: "Card",
      paidByCustomer: "Paid by customer",
      change: "Change"
    },
    cartSidebar: {
      title: "Cart",
      dailyOrders: "Daily Orders",
      emptyCart: "Empty cart",
      clearCartHover: "Clear cart",
      clearCartTitle: "Clear the cart?",
      clearCartDesc: "This action cannot be undone.",
      cancel: "Cancel",
      clear: "Clear",
      creatingOrder: "Creating...",
      createOrder: "Create Order",
      applyDiscount: "Apply discount",
      toastCleared: "Cart cleared"
    },
    cartItem: {
      unavailable: "Unavailable"
    },
    dailyOrders: {
      title: "Daily Orders",
      showAllOrders: "Show all orders",
      tooltipAll: "You are viewing all orders",
      tooltipPending: "You are viewing only pending orders",
      searchOrder: "Search Order",
      searchPlaceholder: "Search by code, table or customer...",
      loading: "Loading orders...",
      noOrders: "No orders found for today"
    },
    dailyOrderCard: {
      statusPending: "Pending",
      statusConfirmed: "Confirmed",
      statusCompleted: "Completed",
      statusPickedUp: "Picked up",
      statusCancelled: "Cancelled",
      tablePrefix: "Table",
      view: "View",
      load: "Load",
      cancel: "Cancel",
      tooltipLoadOnlyPending: "Only pending orders can be loaded",
      tooltipCancelOnlyConfirmed: "Only confirmed orders can be cancelled",
      cancelDialogTitle: "Cancel order",
      cancelDialogDesc: "Are you sure you want to cancel order {{displayCode}}? This action cannot be undone.",
      cancelDialogConfirm: "Cancel order",
      cancelDialogCancel: "Go back"
    },
    orderDetailDialog: {
      title: "Order Detail",
      description: "View complete order details",
      loading: "Loading...",
      customer: "Customer",
      table: "Table",
      code: "Code",
      ticket: "Ticket",
      creationDate: "Creation date",
      confirmationDate: "Confirmation date",
      payment: "Payment",
      status: "Status",
      products: "Products",
      notes: "Notes:",
      quantity: "Quantity:",
      subtotal: "Subtotal:",
      totalSurcharges: "Total surcharges:",
      discount: "Discount:",
      total: "Total:",
      cashRegister: "Register:",
      operator: "Operator:",
      print: "Print",
      close: "Close",
      statusPending: "PENDING",
      statusConfirmed: "CONFIRMED",
      statusReady: "READY",
      statusPickedUp: "PICKED UP",
      paymentCard: "CARD",
      paymentCash: "CASH"
    },
    editItemDialog: {
      title: "Edit Product",
      quantityPrompt: "Quantity with this modification",
      quantityHint: "Indicate how many units should have this customization (max: {{max}})",
      ingredients: "Ingredients",
      ingredientsHint: "Set ingredients quantity (0 = none)",
      addIngredients: "Add Ingredients",
      searchPlaceholder: "Search...",
      note: "Note",
      notePlaceholder: "Add a note for this product...",
      cancel: "Cancel",
      save: "Save"
    },
    discountDialog: {
      toastApplied: "Discount of {{amount}} € applied",
      toastRemoved: "Discount removed",
      discountCapped: "Discount reduced to {{amount}} € (equals the order total)",
      title: "Apply Discount",
      description: "Enter the discount amount to apply to the order total",
      discountLabel: "Discount (€)",
      maxDiscount: "Max discount: 9999.99 €",
      currentDiscount: "Currently applied discount:",
      cancel: "Cancel",
      removeDiscount: "Remove Discount",
      apply: "Apply"
    },
    configDialog: {
      errorLoading: "Error loading registers",
      selectRegisterToast: "Select a register",
      configuredToast: "Register configured successfully",
      title: "Missing configuration",
      description: "To use MyCassa you must first configure the register.",
      selectRegisterLabel: "Select register",
      loading: "Loading...",
      selectRegisterPlaceholder: "Select a register",
      saveConfig: "Save configuration"
    },
    header: {
      searchFood: "Search food...",
      clearSearch: "Clear search",
      closureConfirmTitle: "Register Closure",
      closureConfirmDesc: "Are you sure you want to perform the cash register closure? This operation cannot be undone.",
      cancel: "Cancel",
      confirm: "Confirm",
      closureButton: "Register Closure",
      invalidCashRegister: "Invalid register"
    },
    settings: {
      printers: {
        title: "Printers",
        description: "Configure the settings of printers connected to the application",
        selectRegister: "Select register",
        loading: "Loading...",
        selectRegisterPlaceholder: "Select a register",
        toastSaved: "Selected register saved"
      },
      appearance: {
        title: "Appearance",
        description: "Customize the appearance of the application",
        theme: "Theme",
        themeDescription: "Choose between light and dark theme",
        light: "Light",
        dark: "Dark"
      },
      header: {
        title: "Settings",
        backToCashier: "Back to Register"
      }
    },
    loginForm: {
      usernameRequired: "Username is required",
      passwordRequired: "Password is required",
      invalidCredentials: "Invalid credentials",
      loginError: "Error during login",
      bothRequired: "Username and Password are required",
      validationError: "Validation error",
      welcome: "Welcome!",
      subtitle: "Log in to your MyCassa account",
      usernameLabel: "Username",
      usernamePlaceholder: "Username or Email",
      passwordLabel: "Password",
      passwordPlaceholder: "Your password",
      loggingIn: "Logging in...",
      loginButton: "Login"
    },
    categorySideBar: {
      allCategories: "All Categories",
      loading: "Loading...",
      notAvailable: "N/A"
    },
    foods: {
      notAvailable: "N/A"
    },
    mobile: {
      header: {
        verifyOrder: "Search orders"
      },
      foodPicker: {
        title: "Add product",
        noResults: "No products found",
        addButton: "Add"
      },
      changeCalculator: {
        title: "Change Calculator",
        totalLabel: "Total to pay",
        applyButton: "Use amount"
      },
      layout: {
        editCart: "Edit",
        addProduct: "Add"
      },
      editItem: {
        noIngredientFound: "No ingredient found"
      },
      orderConfirmed: "Order confirmed!"
    },
    toast: {
      newOrder: "New order: {{displayCode}}",
      orderLoaded: "Order {{displayCode}} loaded successfully",
      orderLoadedToCart: "Order {{displayCode}} loaded in cart",
      orderCreated: "Order created successfully",
      orderConfirmed: "Order confirmed successfully",
      orderLoadError: "Unable to load order",
      orderCodeRequired: "Enter an order code",
      orderAlreadyConfirmed: "The order has already been confirmed",
      emptyCart: "Cart is empty",
      categoriesLoadError: "Unable to load categories",
      foodUnavailable: "\"{{foodName}}\" is no longer available",
      foodAvailable: "\"{{foodName}}\" is now available",
      foodAvailableAgain: "\"{{foodName}}\" is available again",
      categoryUnavailable: "Category \"{{categoryName}}\" is no longer available",
      categoryAvailable: "Category \"{{categoryName}}\" is now available",
      printerOnline: "{{label}} is online",
      printerOnlineDesc: "Printer operational",
      printerOffline: "{{label}} is offline",
      printerOfflineDesc: "Printer unreachable",
      printerError: "{{label}} is in error",
      printerErrorDesc: "Status: {{status}}",
      tokenExpired: "Token expired",
      noCashRegisterSelected: "You must select a register before confirming the order",
      cashierNotSelected: "No register selected",
      generalClosureSuccess: "Register closure performed successfully",
      generalClosureError: "Error during register closure",
      authError401: "Session expired. Please log in again.",
      authError403: "Access denied. Contact the administrator.",
      orderCancelled: "Order cancelled successfully",
      orderCancelError: "Unable to cancel the order"
    }
  }
};
