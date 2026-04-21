export type Language = 'en' | 'az' | 'ru';

export interface Translations {
  /** Allow gradual rollout of new keys across surfaces without breaking typecheck. */
  [key: string]: string;
  // Navigation
  home: string;
  sales: string;
  money: string;
  reports: string;
  more: string;
  commandCenter: string;
  signedIn: string;
  system: string;
  inventory: string;
  procurement: string;
  finance: string;
  operations: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  confirm: string;
  search: string;
  actions: string;
  status: string;
  notes: string;
  active: string;
  inactive: string;
  new: string;
  update: string;
  create: string;
  pleaseWait: string;
  yes: string;
  no: string;

  // Dashboard
  todaySales: string;
  todayIncome: string;
  todayExpenses: string;
  balance: string;
  overview: string;
  period: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  tomorrow: string;
  thisMonth: string;
  week: string;
  month: string;
  custom: string;
  last7Days: string;
  sevenDay: string;
  last30Days: string;
  monthToDate: string;
  quarterToDate: string;
  liveMetrics: string;
  sevenDayVsPriorSevenDay: string;
  revenueMomentumLast14Days: string;
  noTrendData: string;
  profitabilitySignal: string;
  profitabilityWarning: string;
  operatingProfitPositiveMessage: string;
  operatingProfitNegativeMessage: string;
  startDate: string;
  endDate: string;
  orders: string;
  aov: string;
  /** KPI card helper line under Net Revenue */
  kpiNetRevenueHint: string;
  /** KPI card helper line under Operating Profit */
  kpiOperatingProfitHint: string;

  // Sales
  addSale: string;
  saleAmount: string;
  saleDescription: string;
  recordSale: string;
  recentSales: string;
  noSalesYet: string;
  salesByChannel: string;
  numberOfOrders: string;
  transactionDate: string;
  deleteSaleConfirm: string;
  /** Add Sale: only partner channels; kiosk/online are app-generated */
  salesManualEntryHint: string;
  salesNoManualChannelsConfigured: string;

  // Income/Expense
  addIncome: string;
  addExpense: string;
  amount: string;
  description: string;
  category: string;
  date: string;
  income: string;
  expense: string;
  expenses: string;
  operationalExpenses: string;
  netProfit: string;
  paymentMethod: string;
  paymentPlaceholder: string;
  noExpensesYet: string;

  // Reports
  daily: string;
  weekly: string;
  monthly: string;
  totalSales: string;
  totalIncome: string;
  totalExpenses: string;
  profit: string;
  financialInsights: string;
  categoryBreakdown: string;
  masterCategoryBreakdown: string;
  transactionHistory: string;
  ofSales: string;
  ofExpenses: string;
  transactions: string;
  type: string;

  // Settings
  settings: string;
  language: string;
  categories: string;
  manageCategories: string;
  categoryName: string;
  categoryType: string;
  addCategory: string;
  masterCategory: string;
  masterCategories: string;
  manageMasterCategories: string;
  addMasterCategory: string;
  noCategorySelected: string;
  deleteCategoryConfirm: string;
  deleteMasterCategoryConfirm: string;
  applicationPreferences: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  salesChannels: string;
  channelName: string;
  enterChannelName: string;
  enterDescription: string;
  addChannel: string;
  activeChannels: string;

  // Products
  products: string;
  addProduct: string;
  editProduct: string;
  addNewProduct: string;
  manageInventory: string;
  productName: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  stock: string;
  stockQuantity: string;
  lowStockAlert: string;
  minStockLevel: string;
  unit: string;
  unitOfMeasurement: string;
  supplier: string;
  noSupplier: string;
  noCategory: string;
  noProductsFound: string;
  searchProducts: string;
  deleteProductConfirm: string;
  product: string;

  // Units
  pieces: string;
  kilogram: string;
  gram: string;
  liter: string;
  milliliter: string;
  box: string;
  pack: string;
  unitSingle: string;

  // Purchases
  purchases: string;
  newPurchase: string;
  editPurchase: string;
  trackPurchases: string;
  selectProduct: string;
  selectSupplier: string;
  cost: string;
  purchaseDate: string;
  paymentStatus: string;
  pending: string;
  partial: string;
  paid: string;
  additionalNotes: string;
  pastPurchases: string;
  useThis: string;
  updatePurchase: string;
  createPurchase: string;
  noPurchasesYet: string;
  startTracking: string;
  createFirstPurchase: string;
  deletePurchaseConfirm: string;
  totalCost: string;

  // Suppliers
  suppliers: string;
  addSupplier: string;
  editSupplier: string;
  addNewSupplier: string;
  manageSuppliers: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  enterSupplierName: string;
  enterContactPerson: string;
  enterEmail: string;
  enterPhone: string;
  enterAddress: string;
  enterNotes: string;
  contact: string;
  noSuppliersYet: string;
  addFirstSupplier: string;
  deleteSupplierConfirm: string;
  productsWillBeUnlinked: string;

  // Users
  users: string;
  addNewUser: string;
  createNewUser: string;
  manageUsers: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  creating: string;
  createUser: string;
  fillAllFields: string;
  passwordsDontMatch: string;
  passwordTooShort: string;
  notAuthenticated: string;
  userCreated: string;
  userDeleted: string;
  deleteUserConfirm: string;
  noUsersFound: string;
  lastSignIn: string;
  never: string;
  user: string;
  createdAt: string;

  // Login
  welcomeBack: string;
  signInToAccount: string;
  signIn: string;
  businessManagement: string;
  staffAccessDeniedTitle: string;
  staffAccessDeniedBody: string;
  staffAccessRetry: string;
  staffGoToOrder: string;
  staffSignOut: string;
  adminAccessDeniedTitle: string;
  adminAccessDeniedBody: string;
  adminAccessGoToOrderManager: string;
  newUserRole: string;
  userRoleStaff: string;
  userRoleManager: string;
  userRoleAdmin: string;
  newUserStaffProfileHint: string;

  // Money
  trackMoney: string;
  salesIncome: string;
  productPurchases: string;
  quantity: string;

  // Messages
  savedSuccessfully: string;
  deletedSuccessfully: string;
  errorOccurred: string;
  foodCost: string;
  cogs: string;
  share: string;

  // Category Management
  manageCOGSAndFixedCost: string;
  cogsCategories: string;
  costOfGoodsSold: string;
  fixedCostCategories: string;
  cogsPurchase: string;
  fixedCostExpense: string;
  masterCategoryOptional: string;
  none: string;
  optionalDescription: string;
  color: string;
  icon: string;
  updateCategory: string;
  createCategory: string;
  noCOGSCategories: string;
  createFirstOne: string;
  deleteThisCategory: string;
  noFixedCostCategories: string;

  // Expenses
  newExpense: string;
  editExpense: string;
  trackFixedCosts: string;
  createNewCategory: string;
  descriptionOptional: string;
  createAndSelect: string;
  selectCategory: string;
  createNewCategoryOption: string;
  amountWithCurrency: string;
  dateRequired: string;
  paymentMethodExample: string;
  describeExpense: string;
  updateExpense: string;
  createExpense: string;
  noExpenses: string;
  startTrackingExpenses: string;
  createFirstExpense: string;
  deleteThisExpense: string;
  expenseItems: string;
  expenseItem: string;
  addExpenseItem: string;
  editExpenseItem: string;
  selectExpenseItem: string;
  expenseItemName: string;
  addNewExpenseItem: string;
  noExpenseItems: string;
  createFirstExpenseItem: string;
  selectMasterCategory: string;
  allMasterCategories: string;
  enterExpenseItemName: string;
  item: string;
  items: string;
  created: string;
  confirmDelete: string;

  // Money Screen
  noSalesRecorded: string;
  noPurchasesRecorded: string;
  payment: string;

  // Kiosk
  tapToOrder: string;
  addToCart: string;
  viewCart: string;
  placeOrder: string;
  confirmOrder: string;
  orderConfirmed: string;
  payAtCounter: string;
  yourOrderNumber: string;
  continueShopping: string;
  emptyCart: string;
  removeItem: string;
  orderTotal: string;
  backToMenu: string;
  noThanks: string;
  wouldYouLikeToAdd: string;
  menu: string;

  // KDS
  kitchenDisplay: string;
  startPreparing: string;
  markReady: string;
  markCompleted: string;
  awaitingPayment: string;
  newOrderAlert: string;
  activeOrders: string;
  prepTime: string;
  connected: string;
  reconnecting: string;
  kdsConnectionLostBanner: string;
  kdsPaymentPendingOnline: string;
  kdsPaymentCashCod: string;
  kdsPaymentConfirmed: string;
  kdsPrepTimeLabel: string;
  kdsBusyKitchenHint: string;
  kdsCourierNoteLabel: string;

  // Kiosk Admin
  kioskOrders: string;
  confirmPayment: string;
  printAgain: string;
  cancelOrder: string;
  orderSource: string;
  kiosk: string;
  manual: string;
  displayNumber: string;
  orderDetails: string;
  preparing: string;
  ready: string;
  dispatched: string;
  completed: string;
  cancelled: string;
  unpaid: string;
  allStatuses: string;
  filterByStatus: string;
  noKioskOrders: string;
  viewKiosk: string;
  kioskPaymentPendingBadge: string;
  kioskPaymentCashCodBadge: string;
  kioskPaymentPaidBadge: string;
  woltTrackingLink: string;
  woltOpenPortal: string;
  woltDispatchLocked: string;
  woltCopyAll: string;
  woltCopiedAll: string;
  woltTrackingUrlLabel: string;
  woltSaveDispatched: string;
  woltCopyCustomer: string;
  woltCopyPhone: string;
  woltCopyAddress: string;
  woltCopyNotes: string;
  woltCopyFailed: string;
  woltSaveFailed: string;
  saving: string;

  // Product extensions
  kioskVisible: string;
  onlineVisible: string;
  onlineDelivery: string;
  onlineTakeaway: string;
  productImage: string;
  sellingPriceLabel: string;

  // Menu Builder
  menuBuilder: string;
  manageMenu: string;
  modifiers: string;
  modifierGroups: string;
  addModifierGroup: string;
  editModifierGroup: string;
  groupName: string;
  minSelections: string;
  maxSelections: string;
  required: string;
  optional: string;
  addOption: string;
  editOption: string;
  optionName: string;
  priceAdjustment: string;
  freeOption: string;
  available: string;
  unavailable: string;
  defaultOption: string;
  chooseOne: string;
  chooseUpTo: string;
  customize: string;
  basePrice: string;
  noModifiers: string;
  noOptions: string;
  duplicateProduct: string;
  menuCategories: string;
  displayOrder: string;
  moveUp: string;
  moveDown: string;
  productDetails: string;
  selectRequired: string;
  manageModifiers: string;
  assignModifiers: string;
  assignedProducts: string;
  noAssignedProducts: string;
  assignToProducts: string;
  selectModifierGroups: string;
  usedInProducts: string;
  modifierLibrary: string;

  // Payouts
  payouts: string;
  platformPayouts: string;
  trackPlatformPayouts: string;
  addPayout: string;
  editPayout: string;
  selectPlatform: string;
  periodStart: string;
  periodEnd: string;
  payoutAmount: string;
  payoutDate: string;
  grossSales: string;
  netRevenueLabel: string;
  operatingProfitLabel: string;
  grossMarginLabel: string;
  revenueLabel: string;
  operationalExpenseLabel: string;
  purchaseCostLabel: string;
  revenueVsCostsTrend: string;
  orderMetricsTrend: string;
  topCategory: string;
  kpiRatioUnavailable: string;
  expenseComposition: string;
  payoutReconciliation: string;
  expected: string;
  actual: string;
  difference: string;
  matched: string;
  mismatched: string;
  weatherUnavailable: string;
  cached: string;
  clear: string;
  cloudy: string;
  fog: string;
  rain: string;
  snow: string;
  storm: string;
  mixed: string;
  noDataForPeriod: string;
  noTransactionsInPeriod: string;
  noItemsFound: string;
  searchExpenseItems: string;
  searchItems: string;
  addPurchase: string;
  commission: string;
  commissionRate: string;
  noPayoutsYet: string;
  createFirstPayout: string;
  deletePayoutConfirm: string;
  payoutSummary: string;
  totalCommissions: string;
  platformCosts: string;
  noSalesInPeriod: string;
  payoutReceived: string;
  /** Sum of recorded sales for the payout period (channel + dates) */
  periodRevenue: string;
  /** Commission implied as revenue minus payout (same idea as platform fee) */
  impliedCommission: string;
  /** Footer line: count of payout records in the selected range, e.g. "{count} payout periods" */
  payoutPeriodsInRange: string;
  /** Home / dashboard card title: revenue, payout, commission — not "reconciliation" */
  payoutSummaryCard: string;

  // Online order (customer / ChoiceQR-style)
  orderNavMenu: string;
  orderNavCart: string;
  orderNavAccount: string;
  orderSignIn: string;
  orderSignUp: string;
  orderSignOut: string;
  orderMyOrders: string;
  orderNoOrders: string;
  orderSavedAddresses: string;
  orderEmail: string;
  orderPassword: string;
  orderCreateAccountHint: string;
  orderYourName: string;
  orderYourPhone: string;
  orderSaveProfile: string;
  orderAddAddress: string;
  orderOnlineTitle: string;
  orderAllCategories: string;
  orderSubtotal: string;
  orderDeliveryFeeRow: string;
  orderFulfillmentTakeaway: string;
  orderFulfillmentDelivery: string;
  orderPhone: string;
  orderNameOptional: string;
  orderDeliveryAddress: string;
  orderUseLocation: string;
  orderGeoLocating: string;
  orderGeoNotSupported: string;
  orderGeoFailed: string;
  orderGeoUpdated: string;
  orderOutsideZone: string;
  /** Delivery address is outside all zones — inline error (checkout). */
  zoneErrorTitle: string;
  zoneErrorMessage: string;
  zoneSwitchTakeaway: string;
  /** Shown when Place Order is disabled because address is outside delivery zone. */
  orderSubmitDisabledOutsideZone: string;
  /** Kitchen is not accepting online orders (checkout banner). */
  kitchenClosedTitle: string;
  kitchenClosedMessage: string;
  /** Shown before hours line when reopening info exists */
  kitchenClosedReopenHint: string;
  kitchenClosedBackToMenu: string;
  /** Cart contains items no longer available for online order */
  cartUnavailableTitle: string;
  cartUnavailableIntro: string;
  cartUnavailableRemoveLine: string;
  cartUnavailableContinueWithout: string;
  cartUnavailableBackMenu: string;
  cartUnavailableServerHint: string;
  /** Fallback line label when an item can no longer be resolved by name */
  cartUnavailableGenericItemLabel: string;
  orderInZonePrefix: string;
  orderPayment: string;
  orderPayCod: string;
  orderPayCash: string;
  orderPayEpoint: string;
  orderPlacedTitle: string;
  orderTrackHint: string;
  orderOpenTracking: string;
  orderCheckout: string;
  orderFulfillmentTakeawayDisabled: string;
  orderOnlineDisabled: string;
  orderViewCart: string;
  orderAddressLabel: string;
  orderAddressStreet: string;
  orderLanguage: string;
  orderSelectSavedAddress: string;
  orderSaveAddressForNext: string;
  orderLoadingMenu: string;
  orderYourCart: string;
  orderAuthEmail: string;
  orderAuthSms: string;
  orderSendSmsCode: string;
  orderSmsCode: string;
  orderVerifySms: string;
  orderSmsSentHint: string;
  orderChangePhone: string;
  orderInvalidPhone: string;
  orderAccountPhone: string;
  orderMapSearchPlaceholder: string;
  orderMapPinHint: string;
  orderMapLoading: string;
  orderMapUnavailable: string;
  orderChooseFulfillmentTitle: string;
  orderSearchMenu: string;
  orderVenueInfoTitle: string;
  orderVenueHours: string;
  orderVenueAddress: string;
  orderVenuePhone: string;
  orderAddToCart: string;
  orderSearchNoResults: string;
  orderDeliveryDisabledInSettings: string;
  orderCombosSection: string;
  orderComboCustomize: string;
  orderComboBadge: string;
  orderPhoneFormatHint: string;
  orderDeliveryNotesLabel: string;
  orderDeliveryNotesPlaceholder: string;
  orderUpsellTitle: string;
  orderUpsellMakeItComboNamed: string;
  orderUpsellYes: string;
  orderUpsellNo: string;
  orderComboSavingsBadge: string;
  comboBuilderHeader: string;
  comboBuilderStepOf: string;
  comboBuilderAddToCart: string;
  comboBuilderNext: string;
  comboBuilderPickOne: string;

  // Customer tracking (/track)
  trackingPageTitle: string;
  trackingOrderLabel: string;
  trackingKitchenStatus: string;
  trackingPayment: string;
  trackingTotal: string;
  trackingLoading: string;
  trackingNotFound: string;
  trackingMissingToken: string;
  trackOnWolt: string;
  trackStatusPending: string;
  trackStatusPreparing: string;
  trackStatusReady: string;
  trackStatusDispatched: string;
  trackStatusCompleted: string;
  /** Cancelled with staff reason */
  orderCancelledTitle: string;
  orderCancelledReason: string;
  orderCancelledRefundNote: string;
  orderCancelledGeneric: string;
  trackingOrderAgain: string;
  trackingCancelledContact: string;
  trackStageOrderPlaced: string;
  trackStagePreparing: string;
  trackStageReady: string;
  trackStageReadyForPickup: string;
  trackStageOutForDelivery: string;
  trackStageDelivered: string;
  trackStageCollected: string;
  trackStageEtaMinutes: string;
  trackStageArrivingAround: string;
  trackEtaLabel: string;
  trackTimelineTitle: string;

  // Combos admin
  combosScreenTitle: string;
  combosScreenDescription: string;
  combosScreenGroupsHint: string;
  combosName: string;
  combosEmpty: string;
  comboGroupsTitle: string;
  comboGroupAdd: string;
  comboGroupRequired: string;
  comboItemsTitle: string;
  comboItemAdd: string;
  comboItemPriceAdjustment: string;
  comboUpsellLink: string;
  comboUpsellNone: string;

  // Order Manager
  omActiveOrders: string;
  omPastOrders: string;
  omMenuEditor: string;
  omNewOrders: string;
  omScheduledOrders: string;
  omInProgress: string;
  omReady: string;
  omInDelivery: string;
  omAccept: string;
  omMarkReady: string;
  omPickedUp: string;
  omDelivered: string;
  omSaveDispatch: string;
  omPrepTime: string;
  omReminderBefore: string;
  omToday: string;
  omYesterday: string;
  omLast7Days: string;
  omThisMonth: string;
  omLastMonth: string;
  omProducts: string;
  omCombos: string;
  omKioskToggle: string;
  omOnlineToggle: string;
  omActiveToggle: string;
  omNoActiveOrders: string;
  omNoScheduledOrders: string;
  omNoPastOrders: string;
  omSourceKiosk: string;
  omSourceTakeaway: string;
  omSourceDelivery: string;
  omTitle: string;
  omReminderSet: string;
  omSelfDelivery: string;
  omWoltDrive: string;
  omWoltDriveComingSoon: string;
  omConfirmSelfDispatch: string;
  omDispatchedSelfDelivery: string;
  omNoLocationData: string;
  omDistanceAway: string;
  omRecommended: string;
  omRejectOrder: string;
  omRejectReasonItemUnavailable: string;
  omRejectReasonTooBusy: string;
  omRejectReasonZoneIssue: string;
  omRejectReasonCustomerRequest: string;
  omRejectReasonOther: string;
  omRejectNotePlaceholder: string;
  omRejectConfirm: string;
  omRejectCancel: string;
  omRejectSelectReason: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    sales: 'Sales',
    money: 'Money',
    reports: 'Reports',
    more: 'More',
    commandCenter: 'Command Center',
    signedIn: 'Signed in',
    system: 'System',
    inventory: 'Inventory',
    procurement: 'Procurement',
    finance: 'Finance',
    operations: 'Operations',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    confirm: 'Confirm',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    notes: 'Notes',
    active: 'Active',
    inactive: 'Inactive',
    new: 'New',
    update: 'Update',
    create: 'Create',
    pleaseWait: 'Please wait...',
    yes: 'Yes',
    no: 'No',

    todaySales: "Today's Sales",
    todayIncome: "Today's Income",
    todayExpenses: "Today's Expenses",
    balance: 'Balance',
    overview: 'Overview and insights',
    period: 'Period',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    tomorrow: 'Tomorrow',
    thisMonth: 'This month',
    week: 'Week',
    month: 'Month',
    custom: 'Custom',
    last7Days: 'Last 7 Days',
    sevenDay: '7-day',
    last30Days: 'Last 30 Days',
    monthToDate: 'Month to Date',
    quarterToDate: 'Quarter to Date',
    liveMetrics: 'Live metrics',
    sevenDayVsPriorSevenDay: '7D vs prior 7D',
    revenueMomentumLast14Days: 'Revenue momentum (last 14 days)',
    noTrendData: 'No trend data',
    profitabilitySignal: 'Profitability signal',
    profitabilityWarning: 'Profitability warning',
    operatingProfitPositiveMessage: 'Operating profit is positive at {profit} with an average order value of {aov}.',
    operatingProfitNegativeMessage: 'Operating profit is negative at {profit}. Monitor COGS and operational expenses against sales momentum.',
    startDate: 'Start Date',
    endDate: 'End Date',
    orders: 'Orders',
    aov: 'AOV',
    kpiNetRevenueHint: 'After COGS',
    kpiOperatingProfitHint: 'After COGS & OPEX',

    addSale: 'Add Sale',
    saleAmount: 'Sale Amount',
    saleDescription: 'Description (optional)',
    recordSale: 'Record a new sale',
    recentSales: 'Recent Sales',
    noSalesYet: 'No sales recorded yet',
    salesByChannel: 'Sales by Channel',
    numberOfOrders: 'Number of Orders',
    transactionDate: 'Transaction Date',
    deleteSaleConfirm: 'Are you sure you want to delete this sale?',
    salesManualEntryHint:
      'Manual entry is for partner channels (Wolt, Bolt, ChoiceQR). Kiosk and web orders are created automatically by the app.',
    salesNoManualChannelsConfigured:
      'No partner channels available. Add or activate Wolt, Bolt, and ChoiceQR under Settings → Sales channels.',

    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    income: 'Income',
    expense: 'Expense',
    expenses: 'Expenses',
    operationalExpenses: 'Operational Expenses',
    netProfit: 'Net Profit',
    paymentMethod: 'Payment Method',
    paymentPlaceholder: 'Cash, Card, Bank Transfer...',
    noExpensesYet: 'No expenses recorded yet',

    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    totalSales: 'Total Sales',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    profit: 'Profit',
    financialInsights: 'Financial insights and analytics',
    categoryBreakdown: 'Category Breakdown',
    masterCategoryBreakdown: 'Master Category Breakdown',
    transactionHistory: 'Transaction History',
    ofSales: 'of sales',
    ofExpenses: 'of total expenses',
    transactions: 'transactions',
    type: 'Type',

    settings: 'Settings',
    language: 'Language',
    categories: 'Categories',
    manageCategories: 'Manage Categories',
    categoryName: 'Category Name',
    categoryType: 'Type',
    addCategory: 'Add Category',
    masterCategory: 'Master Category',
    masterCategories: 'Master Categories',
    manageMasterCategories: 'Manage Master Categories',
    addMasterCategory: 'Add Master Category',
    noCategorySelected: 'No Master Category',
    deleteCategoryConfirm: 'Are you sure you want to delete this category?',
    deleteMasterCategoryConfirm: 'Are you sure you want to delete this master category?',
    applicationPreferences: 'Application preferences',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    salesChannels: 'Sales Channels',
    channelName: 'Channel Name',
    enterChannelName: 'Enter channel name',
    enterDescription: 'Enter description',
    addChannel: 'Add Channel',
    activeChannels: 'Active Channels',

    products: 'Products & Services',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    addNewProduct: 'Add New Product',
    manageInventory: 'Manage your inventory and pricing',
    productName: 'Product Name',
    barcode: 'Barcode',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price',
    stock: 'Stock',
    stockQuantity: 'Stock Quantity',
    lowStockAlert: 'Low Stock Alert',
    minStockLevel: 'Low Stock Alert',
    unit: 'Unit',
    unitOfMeasurement: 'Unit of Measurement',
    supplier: 'Supplier',
    noSupplier: 'No Supplier',
    noCategory: 'No Category',
    noProductsFound: 'No products found',
    searchProducts: 'Search products...',
    deleteProductConfirm: 'Are you sure you want to delete',
    product: 'Product',

    pieces: 'Pieces (pcs)',
    kilogram: 'Kilogram (kg)',
    gram: 'Gram (g)',
    liter: 'Liter (l)',
    milliliter: 'Milliliter (ml)',
    box: 'Box',
    pack: 'Pack',
    unitSingle: 'Unit',

    purchases: 'Purchases',
    newPurchase: 'New Purchase',
    editPurchase: 'Edit Purchase',
    trackPurchases: 'Track product purchases from suppliers',
    selectProduct: 'Select product',
    selectSupplier: 'Select supplier',
    cost: 'Cost (₼)',
    purchaseDate: 'Purchase Date',
    paymentStatus: 'Payment Status',
    pending: 'Pending',
    partial: 'Partial',
    paid: 'Paid',
    additionalNotes: 'Additional notes about this purchase...',
    pastPurchases: 'Past Purchases',
    useThis: 'Use this',
    updatePurchase: 'Update Purchase',
    createPurchase: 'Create Purchase',
    noPurchasesYet: 'No purchases yet',
    startTracking: 'Start tracking product purchases from suppliers',
    createFirstPurchase: 'Create First Purchase',
    deletePurchaseConfirm: 'Delete this purchase?',
    totalCost: 'Total Cost',

    suppliers: 'Suppliers',
    addSupplier: 'Add Supplier',
    editSupplier: 'Edit Supplier',
    addNewSupplier: 'Add New Supplier',
    manageSuppliers: 'Manage your suppliers',
    supplierName: 'Supplier Name',
    contactPerson: 'Contact Person',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    enterSupplierName: 'Enter supplier name',
    enterContactPerson: 'Enter contact person',
    enterEmail: 'Enter email',
    enterPhone: 'Enter phone number',
    enterAddress: 'Enter address',
    enterNotes: 'Enter notes',
    contact: 'Contact:',
    noSuppliersYet: 'No suppliers yet. Add your first supplier to get started.',
    addFirstSupplier: 'Add First Supplier',
    deleteSupplierConfirm: 'Delete',
    productsWillBeUnlinked: 'Associated products will be unlinked.',

    users: 'Users',
    addNewUser: 'Add New User',
    createNewUser: 'Create New User',
    manageUsers: 'Manage user accounts',
    emailAddress: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    emailPlaceholder: 'user@example.com',
    passwordPlaceholder: 'Minimum 6 characters',
    confirmPasswordPlaceholder: 'Re-enter password',
    creating: 'Creating...',
    createUser: 'Create User',
    fillAllFields: 'Please fill in all fields',
    passwordsDontMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    notAuthenticated: 'Not authenticated',
    userCreated: 'User created successfully',
    userDeleted: 'User deleted successfully',
    deleteUserConfirm: 'Are you sure you want to delete this user?',
    noUsersFound: 'No users found',
    lastSignIn: 'Last Sign In',
    never: 'Never',
    user: 'User',
    createdAt: 'Created',

    welcomeBack: 'Welcome Back',
    signInToAccount: 'Sign in to your account',
    signIn: 'Sign In',
    businessManagement: 'Business Management System',
    staffAccessDeniedTitle: 'Staff access required',
    staffAccessDeniedBody:
      'This account is not set up as staff yet. Ask an admin to add you in Command Center → Users (Add New User), or use Order online if you are a customer only.',
    staffAccessRetry: 'Check again',
    staffGoToOrder: 'Order online',
    staffSignOut: 'Sign out',
    adminAccessDeniedTitle: 'Access Restricted',
    adminAccessDeniedBody:
      'You do not have permission to access the admin panel. Please use the Order Manager instead.',
    adminAccessGoToOrderManager: 'Go to Order Manager',
    newUserRole: 'Role',
    userRoleStaff: 'Staff',
    userRoleManager: 'Manager',
    userRoleAdmin: 'Admin',
    newUserStaffProfileHint:
      'Creates both login credentials and staff access to Command Center (same as your account).',

    trackMoney: 'Track sales, expenses, and purchases',
    salesIncome: 'Sales Income',
    productPurchases: 'Product Purchases',
    quantity: 'Quantity',

    savedSuccessfully: 'Saved successfully!',
    deletedSuccessfully: 'Deleted successfully!',
    errorOccurred: 'An error occurred',
    foodCost: 'Food Cost %',
    cogs: 'COGS',
    share: '% share',

    manageCOGSAndFixedCost: 'Manage COGS and Fixed Cost categories',
    cogsCategories: 'COGS Categories',
    costOfGoodsSold: 'Cost of Goods Sold',
    fixedCostCategories: 'Fixed Cost Categories',
    cogsPurchase: 'COGS (Purchase)',
    fixedCostExpense: 'Fixed Cost (Expense)',
    masterCategoryOptional: 'Master Category (Optional)',
    none: 'None',
    optionalDescription: 'Optional description',
    color: 'Color',
    icon: 'Icon',
    updateCategory: 'Update Category',
    createCategory: 'Create Category',
    noCOGSCategories: 'No COGS categories yet',
    createFirstOne: 'Create your first one',
    deleteThisCategory: 'Delete this category?',
    noFixedCostCategories: 'No fixed cost categories yet',

    newExpense: 'New Expense',
    editExpense: 'Edit Expense',
    trackFixedCosts: 'Track fixed costs and operational expenses',
    createNewCategory: 'Create New Category',
    descriptionOptional: 'Description (Optional)',
    createAndSelect: 'Create & Select',
    selectCategory: 'Select Category',
    createNewCategoryOption: '+ Create New Category',
    amountWithCurrency: 'Amount (₼) *',
    dateRequired: 'Date *',
    paymentMethodExample: 'e.g., Cash, Card, Bank Transfer',
    describeExpense: 'Describe this expense...',
    updateExpense: 'Update Expense',
    createExpense: 'Create Expense',
    noExpenses: 'No expenses yet',
    startTrackingExpenses: 'Start tracking your operational expenses',
    createFirstExpense: 'Create First Expense',
    deleteThisExpense: 'Delete this expense?',
    expenseItems: 'Expense Items',
    expenseItem: 'Expense Item',
    addExpenseItem: 'Add Expense Item',
    editExpenseItem: 'Edit Expense Item',
    selectExpenseItem: 'Select Expense Item',
    expenseItemName: 'Expense Item Name',
    addNewExpenseItem: 'Add New Expense Item',
    noExpenseItems: 'No expense items found',
    createFirstExpenseItem: 'Create your first expense item to get started',
    selectMasterCategory: 'Select Master Category',
    allMasterCategories: 'All Master Categories',
    enterExpenseItemName: 'Enter expense item name',
    item: 'item',
    items: 'items',
    created: 'Created',
    confirmDelete: 'Are you sure you want to delete?',

    noSalesRecorded: 'No sales recorded yet',
    noPurchasesRecorded: 'No purchases recorded yet',
    payment: 'Payment',

    tapToOrder: 'Tap to Order',
    addToCart: 'Add to Cart',
    viewCart: 'View Cart',
    placeOrder: 'Place Order',
    confirmOrder: 'Confirm Order',
    orderConfirmed: 'Your order has been received!',
    payAtCounter: 'Please pay at the counter',
    yourOrderNumber: 'Your Order Number',
    continueShopping: 'Continue Shopping',
    emptyCart: 'Your cart is empty',
    removeItem: 'Remove',
    orderTotal: 'Order Total',
    backToMenu: 'Back to Menu',
    noThanks: 'No Thanks',
    wouldYouLikeToAdd: 'Would you also like?',
    menu: 'Menu',

    kitchenDisplay: 'Kitchen Display',
    startPreparing: 'Start Preparing',
    markReady: 'Mark Ready',
    markCompleted: 'Complete',
    awaitingPayment: 'Awaiting Payment',
    newOrderAlert: 'New Order!',
    activeOrders: 'Active Orders',
    prepTime: 'Prep Time',
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    kdsConnectionLostBanner:
      'CONNECTION LOST — Orders may be missing. Tap here to reconnect.',
    kdsPaymentPendingOnline: 'PAYMENT PENDING — do not prepare yet',
    kdsPaymentCashCod: 'CASH / COD',
    kdsPaymentConfirmed: '✓ Payment Confirmed',
    kdsPrepTimeLabel: 'Prep time (minutes)',
    kdsBusyKitchenHint: 'Busy kitchen? 20 min is suggested.',
    kdsCourierNoteLabel: 'Courier',

    kioskOrders: 'Kiosk Orders',
    confirmPayment: 'Confirm Payment',
    printAgain: 'Print Again',
    cancelOrder: 'Cancel Order',
    orderSource: 'Source',
    kiosk: 'Kiosk',
    manual: 'Manual',
    displayNumber: 'Order #',
    orderDetails: 'Order Details',
    preparing: 'Preparing',
    ready: 'Ready',
    dispatched: 'Dispatched',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    allStatuses: 'All Statuses',
    filterByStatus: 'Filter by Status',
    noKioskOrders: 'No kiosk orders yet',
    viewKiosk: 'View Kiosk',
    kioskPaymentPendingBadge: 'Online payment pending',
    kioskPaymentCashCodBadge: 'CASH / COD',
    kioskPaymentPaidBadge: '✓ Paid',
    woltTrackingLink: 'Wolt tracking',
    woltOpenPortal: 'Open Wolt portal',
    woltDispatchLocked: 'Being booked… ({seconds}s)',
    woltCopyAll: 'Copy all for Wolt',
    woltCopiedAll: 'Copied!',
    woltTrackingUrlLabel: 'Tracking URL',
    woltSaveDispatched: 'Save & mark dispatched',
    woltCopyCustomer: 'Customer',
    woltCopyPhone: 'Phone',
    woltCopyAddress: 'Address',
    woltCopyNotes: 'Notes',
    woltCopyFailed: 'Could not copy to clipboard.',
    woltSaveFailed: 'Could not save tracking URL.',
    saving: 'Saving…',

    kioskVisible: 'Show on Kiosk',
    onlineVisible: 'Show on web order',
    onlineDelivery: 'Online · Delivery',
    onlineTakeaway: 'Online · Takeaway',
    productImage: 'Image URL',
    sellingPriceLabel: 'Selling Price',

    menuBuilder: 'Menu Builder',
    manageMenu: 'Design your kiosk menu, categories, and modifiers',
    modifiers: 'Modifiers',
    modifierGroups: 'Modifier Groups',
    addModifierGroup: 'Add Modifier Group',
    editModifierGroup: 'Edit Modifier Group',
    groupName: 'Group Name',
    minSelections: 'Min Selections',
    maxSelections: 'Max Selections',
    required: 'Required',
    optional: 'Optional',
    addOption: 'Add Option',
    editOption: 'Edit Option',
    optionName: 'Option Name',
    priceAdjustment: 'Price Adjustment',
    freeOption: 'Free',
    available: 'Available',
    unavailable: 'Unavailable',
    defaultOption: 'Default',
    chooseOne: 'Choose 1',
    chooseUpTo: 'Choose up to',
    customize: 'Customize',
    basePrice: 'Base Price',
    noModifiers: 'No modifier groups yet',
    noOptions: 'No options yet',
    duplicateProduct: 'Duplicate',
    menuCategories: 'Menu Categories',
    displayOrder: 'Display Order',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    productDetails: 'Product Details',
    selectRequired: 'Please make required selections',
    manageModifiers: 'Manage Modifiers',
    assignModifiers: 'Assign Modifiers',
    assignedProducts: 'Assigned Products',
    noAssignedProducts: 'Not assigned to any products',
    assignToProducts: 'Assign to Products',
    selectModifierGroups: 'Select modifier groups',
    usedInProducts: 'Used in products',
    modifierLibrary: 'Modifier Library',

    payouts: 'Payouts',
    platformPayouts: 'Platform Payouts',
    trackPlatformPayouts: 'Track payouts from delivery platforms',
    addPayout: 'Add Payout',
    editPayout: 'Edit Payout',
    selectPlatform: 'Select Platform',
    periodStart: 'Period Start',
    periodEnd: 'Period End',
    payoutAmount: 'Payout Amount',
    payoutDate: 'Payout Date',
    grossSales: 'Gross Sales',
    netRevenueLabel: 'Net Revenue',
    operatingProfitLabel: 'Operating Profit',
    grossMarginLabel: 'Gross Margin',
    revenueLabel: 'Revenue',
    operationalExpenseLabel: 'Operational Expense',
    purchaseCostLabel: 'Purchase Cost',
    revenueVsCostsTrend: 'Revenue vs Costs Trend',
    orderMetricsTrend: 'Orders & AOV',
    topCategory: 'Top category',
    kpiRatioUnavailable: '—',
    expenseComposition: 'Expense Composition',
    payoutReconciliation: 'Payout Reconciliation',
    expected: 'Expected',
    actual: 'Actual',
    difference: 'Difference',
    matched: 'Matched',
    mismatched: 'Mismatched',
    weatherUnavailable: 'Weather unavailable',
    cached: 'cached',
    clear: 'Clear',
    cloudy: 'Cloudy',
    fog: 'Fog',
    rain: 'Rain',
    snow: 'Snow',
    storm: 'Storm',
    mixed: 'Mixed',
    noDataForPeriod: 'No data for this period',
    noTransactionsInPeriod: 'No transactions in this period',
    noItemsFound: 'No items found',
    searchExpenseItems: 'Search expense items...',
    searchItems: 'Search items...',
    addPurchase: 'Add Purchase',
    commission: 'Commission',
    commissionRate: 'Commission Rate',
    noPayoutsYet: 'No payouts recorded yet',
    createFirstPayout: 'Record your first platform payout',
    deletePayoutConfirm: 'Delete this payout?',
    payoutSummary: 'Payout Summary',
    totalCommissions: 'Total Commissions',
    platformCosts: 'Platform Costs',
    noSalesInPeriod: 'No sales found for this period',
    payoutReceived: 'Payout Received',
    periodRevenue: 'Period revenue',
    impliedCommission: 'Commission',
    payoutPeriodsInRange: '{count} payout periods in this range',
    payoutSummaryCard: 'Payout summary',

    orderNavMenu: 'Menu',
    orderNavCart: 'Cart',
    orderNavAccount: 'Account',
    orderSignIn: 'Sign in',
    orderSignUp: 'Sign up',
    orderSignOut: 'Sign out',
    orderMyOrders: 'My orders',
    orderNoOrders: 'No orders yet',
    orderSavedAddresses: 'Saved addresses',
    orderEmail: 'Email',
    orderPassword: 'Password',
    orderCreateAccountHint: 'Create an account to save addresses and see order history.',
    orderYourName: 'Your name',
    orderYourPhone: 'Phone',
    orderSaveProfile: 'Save profile',
    orderAddAddress: 'Add address',
    orderOnlineTitle: 'Order online',
    orderAllCategories: 'All',
    orderSubtotal: 'Subtotal',
    orderDeliveryFeeRow: 'Delivery',
    orderFulfillmentTakeaway: 'Takeaway',
    orderFulfillmentDelivery: 'Delivery',
    orderPhone: 'Phone',
    orderNameOptional: 'Name (optional)',
    orderDeliveryAddress: 'Delivery address',
    orderUseLocation: 'Use my location',
    orderGeoLocating: 'Locating…',
    orderGeoNotSupported: 'Geolocation not supported',
    orderGeoFailed: 'Could not get location',
    orderGeoUpdated: 'Location updated',
    orderOutsideZone: 'Outside delivery zones — adjust location.',
    zoneErrorTitle: "We don't deliver to this address yet",
    zoneErrorMessage: 'Try a different address or choose Takeaway.',
    zoneSwitchTakeaway: 'Switch to Takeaway',
    orderSubmitDisabledOutsideZone:
      'Delivery is unavailable for this address. Switch to Takeaway or move the pin.',
    kitchenClosedTitle: "We're closed right now",
    kitchenClosedMessage: 'Online ordering is paused. Please check back when we reopen.',
    kitchenClosedReopenHint: 'Opening hours:',
    kitchenClosedBackToMenu: 'Back to menu',
    cartUnavailableTitle: 'Some items are no longer available',
    cartUnavailableIntro: 'Remove unavailable items to continue.',
    cartUnavailableRemoveLine: 'Remove',
    cartUnavailableContinueWithout: 'Continue without these items',
    cartUnavailableBackMenu: 'Go back to menu',
    cartUnavailableServerHint:
      'The menu changed while your cart was open. Update your cart and try again.',
    cartUnavailableGenericItemLabel: 'One or more items in your cart are no longer available',
    orderInZonePrefix: 'In zone',
    orderPayment: 'Payment',
    orderPayCod: 'Cash on pickup / delivery',
    orderPayCash: 'Cash',
    orderPayEpoint: 'Card (E-point)',
    orderPlacedTitle: 'Order placed',
    orderTrackHint: 'Track status',
    orderOpenTracking: 'Open tracking',
    orderCheckout: 'Checkout',
    orderFulfillmentTakeawayDisabled: 'Takeaway disabled — delivery only.',
    orderOnlineDisabled: 'Online ordering is turned off.',
    orderViewCart: 'View cart',
    orderAddressLabel: 'Label',
    orderAddressStreet: 'Street, building, apt',
    orderLanguage: 'Language',
    orderSelectSavedAddress: 'Use saved address',
    orderSaveAddressForNext: 'Save this address for next time',
    orderLoadingMenu: 'Loading menu…',
    orderYourCart: 'Your cart',
    orderAuthEmail: 'Email',
    orderAuthSms: 'SMS',
    orderSendSmsCode: 'Send code',
    orderSmsCode: 'SMS code',
    orderVerifySms: 'Verify & sign in',
    orderSmsSentHint: 'We sent a code to your phone. Enter it below.',
    orderChangePhone: 'Use a different number',
    orderInvalidPhone: 'Enter a valid number with country code (e.g. +994…).',
    orderAccountPhone: 'Phone',
    orderMapSearchPlaceholder: 'Search for a street or place…',
    orderMapPinHint: 'Drag the pin or search — we use the pin location for delivery.',
    orderMapLoading: 'Loading map…',
    orderMapUnavailable: 'Map preview unavailable. Type your address or use device location.',
    orderChooseFulfillmentTitle: 'Pickup or delivery?',
    orderSearchMenu: 'Search menu…',
    orderVenueInfoTitle: 'Restaurant',
    orderVenueHours: 'Hours',
    orderVenueAddress: 'Address',
    orderVenuePhone: 'Phone',
    orderAddToCart: 'Add',
    orderSearchNoResults: 'No dishes match your search.',
    orderDeliveryDisabledInSettings:
      'Delivery is turned off in your database. Set online_settings.delivery_enabled = true in Supabase (or run the latest migration), or choose pickup.',
    orderCombosSection: 'Combos',
    orderComboCustomize: 'Customize',
    orderComboBadge: 'Combo',
    orderPhoneFormatHint: 'Use Azerbaijan format: +994 followed by 9 digits.',
    orderDeliveryNotesLabel: 'Apartment / notes for courier',
    orderDeliveryNotesPlaceholder:
      'Apartment no., floor, entry code, or notes for the courier',
    orderUpsellTitle: 'Make {name} a combo?',
    orderUpsellMakeItComboNamed: 'Make it {name} for +₼{price}?',
    orderUpsellYes: 'Yes, upgrade',
    orderUpsellNo: 'No thanks',
    orderComboSavingsBadge: 'Save ₼{amount}',
    comboBuilderHeader: 'Build combo',
    comboBuilderStepOf: 'Step {n} of {t}',
    comboBuilderAddToCart: 'Add combo to cart',
    comboBuilderNext: 'Next',
    comboBuilderPickOne: 'Choose one option',

    trackingPageTitle: 'Order status',
    trackingOrderLabel: 'Order',
    trackingKitchenStatus: 'Kitchen status',
    trackingPayment: 'Payment',
    trackingTotal: 'Total',
    trackingLoading: 'Loading…',
    trackingNotFound: 'Order not found',
    trackingMissingToken: 'Missing tracking link',
    trackOnWolt: 'Track your order on Wolt',
    trackStatusPending: 'We received your order!',
    trackStatusPreparing: 'Your food is being prepared',
    trackStatusReady: 'Almost there — courier is being assigned',
    trackStatusDispatched: 'On the way!',
    trackStatusCompleted: 'Delivered — enjoy your meal!',
    orderCancelledTitle: 'Your order was cancelled',
    orderCancelledReason: 'Reason: {reason}',
    orderCancelledRefundNote:
      'A refund will be processed. Contact us at +994518962446 if you have questions.',
    orderCancelledGeneric: 'Your order was cancelled. Contact us if you have questions.',
    trackingOrderAgain: 'Order again',
    trackingCancelledContact: 'Questions? Call +994518962446',
    trackStageOrderPlaced: 'Order placed',
    trackStagePreparing: 'Being prepared',
    trackStageReady: 'Ready',
    trackStageReadyForPickup: 'Ready for pickup',
    trackStageOutForDelivery: 'Out for delivery',
    trackStageDelivered: 'Delivered',
    trackStageCollected: 'Collected',
    trackStageEtaMinutes: 'Est. {min} min',
    trackStageArrivingAround: 'Arriving around {time}',
    trackEtaLabel: 'ETA',
    trackTimelineTitle: 'Order status',

    combosScreenTitle: 'Combo deals',
    combosScreenDescription: 'Create bundled offers for the online menu.',
    combosScreenGroupsHint:
      'After creating a combo, add groups and menu items in Supabase Table Editor (combo_groups / combo_group_items) or extend this screen later.',
    combosName: 'Combo name',
    combosEmpty: 'No combos yet — create one above.',
    comboGroupsTitle: 'Groups',
    comboGroupAdd: 'Add group',
    comboGroupRequired: 'Required',
    comboItemsTitle: 'Items',
    comboItemAdd: 'Add item',
    comboItemPriceAdjustment: 'Price adjustment',
    comboUpsellLink: 'Upsell mapping',
    comboUpsellNone: 'No combo',

    omActiveOrders: 'Active Orders',
    omPastOrders: 'Past Orders',
    omMenuEditor: 'Menu Editor',
    omNewOrders: 'New Orders',
    omScheduledOrders: 'Scheduled Orders',
    omInProgress: 'In Progress',
    omReady: 'Ready',
    omInDelivery: 'In Delivery',
    omAccept: 'Accept',
    omMarkReady: 'Ready',
    omPickedUp: 'Picked up',
    omDelivered: 'Delivered',
    omSaveDispatch: 'Save & Dispatch',
    omPrepTime: 'Prep time',
    omReminderBefore: 'Reminder before',
    omToday: 'Today',
    omYesterday: 'Yesterday',
    omLast7Days: 'Last 7 days',
    omThisMonth: 'This month',
    omLastMonth: 'Last month',
    omProducts: 'Products',
    omCombos: 'Combos',
    omKioskToggle: 'Kiosk',
    omOnlineToggle: 'Online',
    omActiveToggle: 'Active',
    omNoActiveOrders: 'No active orders',
    omNoScheduledOrders: 'No scheduled orders',
    omNoPastOrders: 'No past orders for this range',
    omSourceKiosk: 'Kiosk',
    omSourceTakeaway: 'Online · Takeaway',
    omSourceDelivery: 'Online · Delivery',
    omTitle: 'Order Manager',
    omReminderSet: 'Reminder set',
    omSelfDelivery: 'Self Delivery',
    omWoltDrive: 'Wolt Drive',
    omWoltDriveComingSoon: 'Coming soon',
    omConfirmSelfDispatch: 'Confirm — Self Delivery',
    omDispatchedSelfDelivery: 'Dispatched — Self Delivery',
    omNoLocationData: 'No location data — assign manually',
    omDistanceAway: 'away',
    omRecommended: 'recommended',
    omRejectOrder: 'Reject order',
    omRejectReasonItemUnavailable: 'Item unavailable',
    omRejectReasonTooBusy: 'Kitchen too busy',
    omRejectReasonZoneIssue: 'Outside delivery zone',
    omRejectReasonCustomerRequest: 'Customer request',
    omRejectReasonOther: 'Other reason',
    omRejectNotePlaceholder: 'Add a note for the customer...',
    omRejectConfirm: 'Confirm Reject',
    omRejectCancel: 'Cancel',
    omRejectSelectReason: 'Select a reason...',
  },

  az: {
    home: 'Əsas',
    sales: 'Satışlar',
    money: 'Pul',
    reports: 'Hesabatlar',
    more: 'Daha çox',
    commandCenter: 'Komanda Mərkəzi',
    signedIn: 'Daxil olub',
    system: 'Sistem',
    inventory: 'Anbar',
    procurement: 'Təchizat',
    finance: 'Maliyyə',
    operations: 'Əməliyyatlar',

    save: 'Yadda saxla',
    cancel: 'Ləğv et',
    delete: 'Sil',
    edit: 'Redaktə et',
    add: 'Əlavə et',
    back: 'Geri',
    confirm: 'Təsdiq et',
    search: 'Axtar',
    actions: 'Əməliyyatlar',
    status: 'Status',
    notes: 'Qeydlər',
    active: 'Aktiv',
    inactive: 'Deaktiv',
    new: 'Yeni',
    update: 'Yenilə',
    create: 'Yarat',
    pleaseWait: 'Gözləyin...',
    yes: 'Bəli',
    no: 'Xeyr',

    todaySales: 'Bu günkü satışlar',
    todayIncome: 'Bu günkü gəlir',
    todayExpenses: 'Bu günkü xərclər',
    balance: 'Balans',
    overview: 'İcmal və statistika',
    period: 'Dövr',
    today: 'Bu gün',
    yesterday: 'Dünən',
    thisWeek: 'Bu həftə',
    tomorrow: 'Sabah',
    thisMonth: 'Bu ay',
    week: 'Həftə',
    month: 'Ay',
    custom: 'Xüsusi',
    last7Days: 'Son 7 gün',
    sevenDay: '7 günlük',
    last30Days: 'Son 30 gün',
    monthToDate: 'Ayın əvvəlindən',
    quarterToDate: 'Rübün əvvəlindən',
    liveMetrics: 'Canlı metriklər',
    sevenDayVsPriorSevenDay: 'Son 7 gün və əvvəlki 7 gün',
    revenueMomentumLast14Days: 'Gəlir dinamikası (son 14 gün)',
    noTrendData: 'Trend məlumatı yoxdur',
    profitabilitySignal: 'Mənfəətlilik siqnalı',
    profitabilityWarning: 'Mənfəətlilik xəbərdarlığı',
    operatingProfitPositiveMessage: 'Əməliyyat mənfəəti {profit} səviyyəsində müsbətdir, orta sifariş dəyəri isə {aov}-dir.',
    operatingProfitNegativeMessage: 'Əməliyyat mənfəəti {profit} səviyyəsində mənfidir. Maya dəyəri və əməliyyat xərclərini satış dinamikasına qarşı izləyin.',
    startDate: 'Başlama Tarixi',
    endDate: 'Bitmə Tarixi',
    orders: 'Sifarişlər',
    aov: 'Orta Sifariş',
    kpiNetRevenueHint: 'COGS-dan sonra',
    kpiOperatingProfitHint: 'COGS və OPEX-dan sonra',

    addSale: 'Satış əlavə et',
    saleAmount: 'Satış məbləği',
    saleDescription: 'Təsvir (istəyə görə)',
    recordSale: 'Yeni satış qeyd et',
    recentSales: 'Son Satışlar',
    noSalesYet: 'Hələ satış qeydə alınmayıb',
    salesByChannel: 'Kanallara Görə Satışlar',
    numberOfOrders: 'Sifarişlərin Sayı',
    transactionDate: 'Əməliyyat Tarixi',
    deleteSaleConfirm: 'Bu satışı silmək istədiyinizə əminsiniz?',
    salesManualEntryHint:
      'Əl ilə daxil etmə yalnız tərəfdaş kanalları üçündür (Wolt, Bolt, ChoiceQR). Kiosk və veb sifarişlər tətbiq tərəfindən avtomatik yaradılır.',
    salesNoManualChannelsConfigured:
      'Tərəfdaş kanalı yoxdur. Tənzimləmələr → Satış kanallarında Wolt, Bolt və ChoiceQR əlavə edin və ya aktiv edin.',

    addIncome: 'Gəlir əlavə et',
    addExpense: 'Xərc əlavə et',
    amount: 'Məbləğ',
    description: 'Təsvir',
    category: 'Kateqoriya',
    date: 'Tarix',
    income: 'Gəlir',
    expense: 'Xərc',
    expenses: 'Xərclər',
    operationalExpenses: 'Əməliyyat Xərcləri',
    netProfit: 'Xalis Mənfəət',
    paymentMethod: 'Ödəmə Üsulu',
    paymentPlaceholder: 'Nağd, Kart, Bank Köçürməsi...',
    noExpensesYet: 'Hələ xərc qeydə alınmayıb',

    daily: 'Günlük',
    weekly: 'Həftəlik',
    monthly: 'Aylıq',
    totalSales: 'Ümumi satışlar',
    totalIncome: 'Ümumi gəlir',
    totalExpenses: 'Ümumi xərclər',
    profit: 'Mənfəət',
    financialInsights: 'Maliyyə təhlili və statistika',
    categoryBreakdown: 'Kateqoriyalara Görə',
    masterCategoryBreakdown: 'Ana Kateqoriyalara Görə',
    transactionHistory: 'Əməliyyat Tarixçəsi',
    ofSales: 'satışdan',
    ofExpenses: 'ümumi xərclərdən',
    transactions: 'əməliyyat',
    type: 'Növ',

    settings: 'Tənzimləmələr',
    language: 'Dil',
    categories: 'Kateqoriyalar',
    manageCategories: 'Kateqoriyaları İdarə Et',
    categoryName: 'Kateqoriya Adı',
    categoryType: 'Növ',
    addCategory: 'Kateqoriya Əlavə Et',
    masterCategory: 'Ana Kateqoriya',
    masterCategories: 'Ana Kateqoriyalar',
    manageMasterCategories: 'Ana Kateqoriyaları İdarə Et',
    addMasterCategory: 'Ana Kateqoriya Əlavə Et',
    noCategorySelected: 'Ana Kateqoriya Yoxdur',
    deleteCategoryConfirm: 'Bu kateqoriyanı silmək istədiyinizə əminsiniz?',
    deleteMasterCategoryConfirm: 'Bu ana kateqoriyanı silmək istədiyinizə əminsiniz?',
    applicationPreferences: 'Tətbiq tənzimləmələri',
    theme: 'Tema',
    darkMode: 'Qaranlıq Rejim',
    lightMode: 'İşıqlı Rejim',
    salesChannels: 'Satış Kanalları',
    channelName: 'Kanal Adı',
    enterChannelName: 'Kanal adını daxil edin',
    enterDescription: 'Təsviri daxil edin',
    addChannel: 'Kanal Əlavə Et',
    activeChannels: 'Aktiv Kanallar',

    products: 'Məhsullar və Xidmətlər',
    addProduct: 'Məhsul Əlavə Et',
    editProduct: 'Məhsulu Redaktə Et',
    addNewProduct: 'Yeni Məhsul Əlavə Et',
    manageInventory: 'Inventar və qiymətləri idarə edin',
    productName: 'Məhsulun Adı',
    barcode: 'Barkod',
    costPrice: 'Maya Dəyəri',
    sellingPrice: 'Satış Qiyməti',
    stock: 'Ehtiyat',
    stockQuantity: 'Ehtiyat Miqdarı',
    lowStockAlert: 'Az Ehtiyat Xəbərdarlığı',
    minStockLevel: 'Minimum Ehtiyat Səviyyəsi',
    unit: 'Ölçü vahidi',
    unitOfMeasurement: 'Ölçü Vahidi',
    supplier: 'Təchizatçı',
    noSupplier: 'Təchizatçı Yoxdur',
    noCategory: 'Kateqoriya Yoxdur',
    noProductsFound: 'Məhsul tapılmadı',
    searchProducts: 'Məhsul axtar...',
    deleteProductConfirm: 'Silmək istədiyinizə əminsiniz',
    product: 'Məhsul',

    pieces: 'Ədəd (əd)',
    kilogram: 'Kiloqram (kq)',
    gram: 'Qram (q)',
    liter: 'Litr (l)',
    milliliter: 'Millilitr (ml)',
    box: 'Qutu',
    pack: 'Paket',
    unitSingle: 'Vahid',

    purchases: 'Alışlar',
    newPurchase: 'Yeni Alış',
    editPurchase: 'Alışı Redaktə Et',
    trackPurchases: 'Təchizatçılardan məhsul alışlarını izləyin',
    selectProduct: 'Məhsul seçin',
    selectSupplier: 'Təchizatçı seçin',
    cost: 'Dəyər (₼)',
    purchaseDate: 'Alış Tarixi',
    paymentStatus: 'Ödəniş Statusu',
    pending: 'Gözləyir',
    partial: 'Qismən',
    paid: 'Ödənilib',
    additionalNotes: 'Bu alış haqqında əlavə qeydlər...',
    pastPurchases: 'Keçmiş Alışlar',
    useThis: 'Bunu istifadə et',
    updatePurchase: 'Alışı Yenilə',
    createPurchase: 'Alış Yarat',
    noPurchasesYet: 'Hələ alış yoxdur',
    startTracking: 'Təchizatçılardan məhsul alışlarını izləməyə başlayın',
    createFirstPurchase: 'İlk Alışı Yarat',
    deletePurchaseConfirm: 'Bu alışı silirsiniz?',
    totalCost: 'Ümumi Dəyər',

    suppliers: 'Təchizatçılar',
    addSupplier: 'Təchizatçı Əlavə Et',
    editSupplier: 'Təchizatçını Redaktə Et',
    addNewSupplier: 'Yeni Təchizatçı Əlavə Et',
    manageSuppliers: 'Təchizatçılarınızı idarə edin',
    supplierName: 'Təchizatçının Adı',
    contactPerson: 'Əlaqə Şəxsi',
    email: 'E-poçt',
    phone: 'Telefon',
    address: 'Ünvan',
    enterSupplierName: 'Təchizatçının adını daxil edin',
    enterContactPerson: 'Əlaqə şəxsini daxil edin',
    enterEmail: 'E-poçtu daxil edin',
    enterPhone: 'Telefon nömrəsini daxil edin',
    enterAddress: 'Ünvanı daxil edin',
    enterNotes: 'Qeydləri daxil edin',
    contact: 'Əlaqə:',
    noSuppliersYet: 'Hələ təchizatçı yoxdur. Başlamaq üçün ilk təchizatçınızı əlavə edin.',
    addFirstSupplier: 'İlk Təchizatçını Əlavə Et',
    deleteSupplierConfirm: 'Sil',
    productsWillBeUnlinked: 'Əlaqəli məhsulların əlaqəsi silinəcək.',

    users: 'İstifadəçilər',
    addNewUser: 'Yeni İstifadəçi Əlavə Et',
    createNewUser: 'Yeni İstifadəçi Yarat',
    manageUsers: 'İstifadəçi hesablarını idarə et',
    emailAddress: 'E-poçt Ünvanı',
    password: 'Şifrə',
    confirmPassword: 'Şifrəni Təsdiq Et',
    emailPlaceholder: 'istifadeci@example.com',
    passwordPlaceholder: 'Minimum 6 simvol',
    confirmPasswordPlaceholder: 'Şifrəni yenidən daxil edin',
    creating: 'Yaradılır...',
    createUser: 'İstifadəçi Yarat',
    fillAllFields: 'Bütün xanaları doldurun',
    passwordsDontMatch: 'Şifrələr uyğun gəlmir',
    passwordTooShort: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır',
    notAuthenticated: 'Autentifikasiya olunmayıb',
    userCreated: 'İstifadəçi uğurla yaradıldı',
    userDeleted: 'İstifadəçi uğurla silindi',
    deleteUserConfirm: 'Bu istifadəçini silmək istədiyinizə əminsiniz?',
    noUsersFound: 'İstifadəçi tapılmadı',
    lastSignIn: 'Son Giriş',
    never: 'Heç vaxt',
    user: 'İstifadəçi',
    createdAt: 'Yaradılıb',

    welcomeBack: 'Xoş Gəlmisiniz',
    signInToAccount: 'Hesabınıza daxil olun',
    signIn: 'Daxil Ol',
    businessManagement: 'Biznes İdarəetmə Sistemi',
    staffAccessDeniedTitle: 'Staff girişi tələb olunur',
    staffAccessDeniedBody:
      'Bu hesab hələ staff kimi təyin edilməyib. Admin-dən Command Center → İstifadəçilər (Yeni istifadəçi) ilə əlavə etməsini istəyin; yalnız müştəriyənsə Onlayn sifarişdən istifadə edin.',
    staffAccessRetry: 'Yenidən yoxla',
    staffGoToOrder: 'Onlayn sifariş',
    staffSignOut: 'Çıxış',
    adminAccessDeniedTitle: 'Giriş məhduddur',
    adminAccessDeniedBody:
      'Admin panelinə giriş icazəniz yoxdur. Zəhmət olmasa Sifariş Menecerindən istifadə edin.',
    adminAccessGoToOrderManager: 'Sifariş menecerinə keç',
    newUserRole: 'Rol',
    userRoleStaff: 'Personal',
    userRoleManager: 'Menecer',
    userRoleAdmin: 'Admin',
    newUserStaffProfileHint:
      'Həm giriş yaradır, həm də Command Center üçün staff girişi (sizin hesabınız kimi).',

    trackMoney: 'Satışları, xərcləri və alışları izləyin',
    salesIncome: 'Satış Gəliri',
    productPurchases: 'Məhsul Alışları',
    quantity: 'Miqdar',

    savedSuccessfully: 'Uğurla yadda saxlanıldı!',
    deletedSuccessfully: 'Uğurla silindi!',
    errorOccurred: 'Xəta baş verdi',
    foodCost: 'Ərzaq Dəyəri %',
    cogs: 'Maya Dəyəri',
    share: '% pay',

    manageCOGSAndFixedCost: 'Maya Dəyəri və Sabit Xərc kateqoriyalarını idarə edin',
    cogsCategories: 'Maya Dəyəri Kateqoriyaları',
    costOfGoodsSold: 'Satılan Malların Dəyəri',
    fixedCostCategories: 'Sabit Xərc Kateqoriyaları',
    cogsPurchase: 'Maya Dəyəri (Alış)',
    fixedCostExpense: 'Sabit Xərc (Əməliyyat)',
    masterCategoryOptional: 'Ana Kateqoriya (İstəyə görə)',
    none: 'Yoxdur',
    optionalDescription: 'Təsvir (istəyə görə)',
    color: 'Rəng',
    icon: 'İkon',
    updateCategory: 'Kateqoriyanı Yenilə',
    createCategory: 'Kateqoriya Yarat',
    noCOGSCategories: 'Hələ maya dəyəri kateqoriyası yoxdur',
    createFirstOne: 'İlkini yaradın',
    deleteThisCategory: 'Bu kateqoriyanı silirsiniz?',
    noFixedCostCategories: 'Hələ sabit xərc kateqoriyası yoxdur',

    newExpense: 'Yeni Xərc',
    editExpense: 'Xərci Redaktə Et',
    trackFixedCosts: 'Sabit xərcləri və əməliyyat xərclərini izləyin',
    createNewCategory: 'Yeni Kateqoriya Yarat',
    descriptionOptional: 'Təsvir (İstəyə görə)',
    createAndSelect: 'Yarat və Seç',
    selectCategory: 'Kateqoriya Seçin',
    createNewCategoryOption: '+ Yeni Kateqoriya Yarat',
    amountWithCurrency: 'Məbləğ (₼) *',
    dateRequired: 'Tarix *',
    paymentMethodExample: 'məs., Nağd, Kart, Bank Köçürməsi',
    describeExpense: 'Bu xərc haqqında təsvir...',
    updateExpense: 'Xərci Yenilə',
    createExpense: 'Xərc Yarat',
    noExpenses: 'Hələ xərc yoxdur',
    startTrackingExpenses: 'Əməliyyat xərclərini izləməyə başlayın',
    createFirstExpense: 'İlk Xərci Yarat',
    deleteThisExpense: 'Bu xərci silirsiniz?',
    expenseItems: 'Xərc Maddələri',
    expenseItem: 'Xərc Maddəsi',
    addExpenseItem: 'Xərc Maddəsi Əlavə Et',
    editExpenseItem: 'Xərc Maddəsini Redaktə Et',
    selectExpenseItem: 'Xərc Maddəsini Seçin',
    expenseItemName: 'Xərc Maddəsinin Adı',
    addNewExpenseItem: 'Yeni Xərc Maddəsi Əlavə Et',
    noExpenseItems: 'Xərc maddəsi tapılmadı',
    createFirstExpenseItem: 'Başlamaq üçün ilk xərc maddəsini yaradın',
    selectMasterCategory: 'Ana Kateqoriya Seçin',
    allMasterCategories: 'Bütün Ana Kateqoriyalar',
    enterExpenseItemName: 'Xərc maddəsinin adını daxil edin',
    item: 'maddə',
    items: 'maddələr',
    created: 'Yaradılıb',
    confirmDelete: 'Silmək istədiyinizə əminsiniz?',

    noSalesRecorded: 'Hələ satış qeydə alınmayıb',
    noPurchasesRecorded: 'Hələ alış qeydə alınmayıb',
    payment: 'Ödəniş',

    tapToOrder: 'Sifariş üçün toxunun',
    addToCart: 'Səbətə əlavə et',
    viewCart: 'Səbətə bax',
    placeOrder: 'Sifariş ver',
    confirmOrder: 'Sifarişi təsdiq et',
    orderConfirmed: 'Sifarişiniz qəbul edildi!',
    payAtCounter: 'Kassada ödəyin',
    yourOrderNumber: 'Sifariş nömrəniz',
    continueShopping: 'Alış-verişə davam et',
    emptyCart: 'Səbətiniz boşdur',
    removeItem: 'Sil',
    orderTotal: 'Ümumi məbləğ',
    backToMenu: 'Menyuya qayıt',
    noThanks: 'Xeyr, təşəkkürlər',
    wouldYouLikeToAdd: 'Bunu da əlavə etmək istərdiniz?',
    menu: 'Menyu',

    kitchenDisplay: 'Mətbəx Ekranı',
    startPreparing: 'Hazırlamağa başla',
    markReady: 'Hazır qeyd et',
    markCompleted: 'Tamamla',
    awaitingPayment: 'Ödəniş gözlənilir',
    newOrderAlert: 'Yeni Sifariş!',
    activeOrders: 'Aktiv Sifarişlər',
    prepTime: 'Hazırlıq müddəti',
    connected: 'Bağlı',
    reconnecting: 'Yenidən bağlanılır',
    kdsConnectionLostBanner:
      'BAĞLANTI KƏSİLDİ — Sifarişlər çata bilməz. Yenidən bağlanmaq üçün toxunun.',
    kdsPaymentPendingOnline: 'ÖDƏNİŞ GÖZLƏNİR — hələ hazırlamayın',
    kdsPaymentCashCod: 'NAĞD / ÇATDIRILMADA',
    kdsPaymentConfirmed: '✓ Ödəniş təsdiqləndi',
    kdsPrepTimeLabel: 'Hazırlıq müddəti (dəqiqə)',
    kdsBusyKitchenHint: 'Mətbəx yüklüdür? 20 dəq tövsiyə olunur.',
    kdsCourierNoteLabel: 'Kuryer',

    kioskOrders: 'Kiosk Sifarişləri',
    confirmPayment: 'Ödənişi təsdiq et',
    printAgain: 'Yenidən çap et',
    cancelOrder: 'Sifarişi ləğv et',
    orderSource: 'Mənbə',
    kiosk: 'Kiosk',
    manual: 'Manual',
    displayNumber: 'Sifariş #',
    orderDetails: 'Sifariş Detalları',
    preparing: 'Hazırlanır',
    ready: 'Hazır',
    dispatched: 'Yoldadır',
    completed: 'Tamamlandı',
    cancelled: 'Ləğv edildi',
    unpaid: 'Ödənilməyib',
    allStatuses: 'Bütün Statuslar',
    filterByStatus: 'Statusa görə filtr',
    noKioskOrders: 'Hələ kiosk sifarişi yoxdur',
    viewKiosk: 'Kiosku Aç',
    kioskPaymentPendingBadge: 'Onlayn ödəniş gözlənilir',
    kioskPaymentCashCodBadge: 'NAĞD / ÇATDIRILMADA',
    kioskPaymentPaidBadge: '✓ Ödənilib',
    woltTrackingLink: 'Wolt izləmə',
    woltOpenPortal: 'Wolt portalını aç',
    woltDispatchLocked: 'Sifariş edilir… ({seconds}s)',
    woltCopyAll: 'Hamısını Wolt üçün kopyala',
    woltCopiedAll: 'Kopyalandı!',
    woltTrackingUrlLabel: 'İzləmə linki',
    woltSaveDispatched: 'Saxla və yola sal',
    woltCopyCustomer: 'Müştəri',
    woltCopyPhone: 'Telefon',
    woltCopyAddress: 'Ünvan',
    woltCopyNotes: 'Qeydlər',
    woltCopyFailed: 'Mübadilə buferinə kopyalamaq alınmadı.',
    woltSaveFailed: 'İzləmə linki saxlanılmadı.',
    saving: 'Saxlanılır…',

    kioskVisible: 'Kioskda göstər',
    onlineVisible: 'Web sifarişdə göstər',
    onlineDelivery: 'Onlayn · Çatdırılma',
    onlineTakeaway: 'Onlayn · Əlavə',
    productImage: 'Şəkil URL',
    sellingPriceLabel: 'Satış Qiyməti',

    menuBuilder: 'Menyu Qurucusu',
    manageMenu: 'Kiosk menyu, kateqoriya və modifikatorları idarə edin',
    modifiers: 'Modifikatorlar',
    modifierGroups: 'Modifikator Qrupları',
    addModifierGroup: 'Modifikator Qrupu Əlavə Et',
    editModifierGroup: 'Modifikator Qrupunu Redaktə Et',
    groupName: 'Qrup Adı',
    minSelections: 'Min Seçim',
    maxSelections: 'Maks Seçim',
    required: 'Məcburi',
    optional: 'İstəyə bağlı',
    addOption: 'Seçim Əlavə Et',
    editOption: 'Seçimi Redaktə Et',
    optionName: 'Seçim Adı',
    priceAdjustment: 'Qiymət Fərqi',
    freeOption: 'Pulsuz',
    available: 'Mövcud',
    unavailable: 'Mövcud deyil',
    defaultOption: 'Standart',
    chooseOne: '1 seçin',
    chooseUpTo: 'Maksimum seçin',
    customize: 'Fərdiləşdir',
    basePrice: 'Əsas Qiymət',
    noModifiers: 'Hələ modifikator qrupu yoxdur',
    noOptions: 'Hələ seçim yoxdur',
    duplicateProduct: 'Dublikat',
    menuCategories: 'Menyu Kateqoriyaları',
    displayOrder: 'Göstərmə Sırası',
    moveUp: 'Yuxarı',
    moveDown: 'Aşağı',
    productDetails: 'Məhsul Detalları',
    selectRequired: 'Məcburi seçimləri edin',
    manageModifiers: 'Modifikatorları İdarə Et',
    assignModifiers: 'Modifikatorları Təyin Et',
    assignedProducts: 'Təyin Edilmiş Məhsullar',
    noAssignedProducts: 'Heç bir məhsula təyin edilməyib',
    assignToProducts: 'Məhsullara Təyin Et',
    selectModifierGroups: 'Modifikator qruplarını seçin',
    usedInProducts: 'Məhsullarda istifadə olunur',
    modifierLibrary: 'Modifikator Kitabxanası',

    payouts: 'Ödənişlər',
    platformPayouts: 'Platforma Ödənişləri',
    trackPlatformPayouts: 'Çatdırılma platformalarından ödənişləri izləyin',
    addPayout: 'Ödəniş Əlavə Et',
    editPayout: 'Ödənişi Redaktə Et',
    selectPlatform: 'Platforma Seçin',
    periodStart: 'Dövr Başlanğıcı',
    periodEnd: 'Dövr Sonu',
    payoutAmount: 'Ödəniş Məbləği',
    payoutDate: 'Ödəniş Tarixi',
    grossSales: 'Ümumi Satış',
    netRevenueLabel: 'Xalis Gəlir',
    operatingProfitLabel: 'Əməliyyat Mənfəəti',
    grossMarginLabel: 'Ümumi Marja',
    revenueLabel: 'Gəlir',
    operationalExpenseLabel: 'Əməliyyat Xərci',
    purchaseCostLabel: 'Alış Dəyəri',
    revenueVsCostsTrend: 'Gəlir və Xərc Trendi',
    orderMetricsTrend: 'Sifarişlər və orta çek',
    topCategory: 'Əsas kateqoriya',
    kpiRatioUnavailable: '—',
    expenseComposition: 'Xərc Tərkibi',
    payoutReconciliation: 'Ödəniş Uzlaşdırması',
    expected: 'Gözlənilən',
    actual: 'Faktiki',
    difference: 'Fərq',
    matched: 'Uyğun',
    mismatched: 'Uyğunsuz',
    weatherUnavailable: 'Hava məlumatı mövcud deyil',
    cached: 'keş',
    clear: 'Açıq',
    cloudy: 'Buludlu',
    fog: 'Duman',
    rain: 'Yağış',
    snow: 'Qar',
    storm: 'Fırtına',
    mixed: 'Qarışıq',
    noDataForPeriod: 'Bu dövr üçün məlumat yoxdur',
    noTransactionsInPeriod: 'Bu dövrdə əməliyyat yoxdur',
    noItemsFound: 'Maddə tapılmadı',
    searchExpenseItems: 'Xərc maddələrini axtar...',
    searchItems: 'Maddələri axtar...',
    addPurchase: 'Alış əlavə et',
    commission: 'Komissiya',
    commissionRate: 'Komissiya Dərəcəsi',
    noPayoutsYet: 'Hələ ödəniş qeydə alınmayıb',
    createFirstPayout: 'İlk platforma ödənişini qeyd edin',
    deletePayoutConfirm: 'Bu ödənişi silirsiniz?',
    payoutSummary: 'Ödəniş Xülasəsi',
    totalCommissions: 'Ümumi Komissiyalar',
    platformCosts: 'Platforma Xərcləri',
    noSalesInPeriod: 'Bu dövr üçün satış tapılmadı',
    payoutReceived: 'Alınan Ödəniş',
    periodRevenue: 'Dövr üzrə gəlir',
    impliedCommission: 'Komissiya',
    payoutPeriodsInRange: 'Bu aralıqda {count} ödəniş dövrü',
    payoutSummaryCard: 'Ödəniş xülasəsi',

    orderNavMenu: 'Menyu',
    orderNavCart: 'Səbət',
    orderNavAccount: 'Hesab',
    orderSignIn: 'Daxil ol',
    orderSignUp: 'Qeydiyyat',
    orderSignOut: 'Çıxış',
    orderMyOrders: 'Sifarişlərim',
    orderNoOrders: 'Hələ sifariş yoxdur',
    orderSavedAddresses: 'Yadda saxlanılan ünvanlar',
    orderEmail: 'E-poçt',
    orderPassword: 'Şifrə',
    orderCreateAccountHint: 'Ünvanları saxlamaq və sifariş tarixçəsini görmək üçün hesab yaradın.',
    orderYourName: 'Adınız',
    orderYourPhone: 'Telefon',
    orderSaveProfile: 'Profili saxla',
    orderAddAddress: 'Ünvan əlavə et',
    orderOnlineTitle: 'Onlayn sifariş',
    orderAllCategories: 'Hamısı',
    orderSubtotal: 'Ara cəm',
    orderDeliveryFeeRow: 'Çatdırılma',
    orderFulfillmentTakeaway: 'Götürmə',
    orderFulfillmentDelivery: 'Çatdırılma',
    orderPhone: 'Telefon',
    orderNameOptional: 'Ad (istəyə bağlı)',
    orderDeliveryAddress: 'Çatdırılma ünvanı',
    orderUseLocation: 'Məkanımı istifadə et',
    orderGeoLocating: 'Müəyyən edilir…',
    orderGeoNotSupported: 'Geolokasiya dəstəklənmir',
    orderGeoFailed: 'Məkan alına bilmədi',
    orderGeoUpdated: 'Məkan yeniləndi',
    orderOutsideZone: 'Çatdırılma zonasından kənar — məkanı düzəldin.',
    zoneErrorTitle: 'Bu ünvana hələ çatdırmırıq',
    zoneErrorMessage: 'Başqa ünvan sınayın və ya Götürmə seçin.',
    zoneSwitchTakeaway: 'Götürməyə keç',
    orderSubmitDisabledOutsideZone:
      'Bu ünvan üçün çatdırılma yoxdur. Götürməyə keçin və ya işarəni dəyişin.',
    kitchenClosedTitle: 'Hal-hazırda bağıyıq',
    kitchenClosedMessage: 'Onlayn sifariş müvəqqəti dayandırılıb. Yenidən açılanda yoxlayın.',
    kitchenClosedReopenHint: 'İş saatları:',
    kitchenClosedBackToMenu: 'Menyuya qayıt',
    cartUnavailableTitle: 'Bəzi məhsullar artıq mövcud deyil',
    cartUnavailableIntro: 'Davam etmək üçün əlçatan olmayanları silin.',
    cartUnavailableRemoveLine: 'Sil',
    cartUnavailableContinueWithout: 'Bu məhsullarsız davam et',
    cartUnavailableBackMenu: 'Menyuya qayıt',
    cartUnavailableServerHint:
      'Səbətiniz açıq olanda menyu dəyişdi. Səbəti yeniləyib yenidən cəhd edin.',
    cartUnavailableGenericItemLabel:
      'Səbətinizdəki bəzi məhsullar artıq mövcud deyil',
    orderInZonePrefix: 'Zona',
    orderPayment: 'Ödəniş',
    orderPayCod: 'Nağd (götürmə/çatdırılma)',
    orderPayCash: 'Nağd',
    orderPayEpoint: 'Kart (E-point)',
    orderPlacedTitle: 'Sifariş verildi',
    orderTrackHint: 'Statusu izlə',
    orderOpenTracking: 'İzləməni aç',
    orderCheckout: 'Ödənişə keç',
    orderFulfillmentTakeawayDisabled: 'Götürmə söndürülüb — yalnız çatdırılma.',
    orderOnlineDisabled: 'Onlayn sifariş söndürülüb.',
    orderViewCart: 'Səbətə bax',
    orderAddressLabel: 'Etiket',
    orderAddressStreet: 'Küçə, bina, mənzil',
    orderLanguage: 'Dil',
    orderSelectSavedAddress: 'Saxlanılan ünvan',
    orderSaveAddressForNext: 'Bu ünvanı növbəti dəfə üçün saxla',
    orderLoadingMenu: 'Menyu yüklənir…',
    orderYourCart: 'Səbətiniz',
    orderAuthEmail: 'E-poçt',
    orderAuthSms: 'SMS',
    orderSendSmsCode: 'Kod göndər',
    orderSmsCode: 'SMS kodu',
    orderVerifySms: 'Təsdiqlə və daxil ol',
    orderSmsSentHint: 'Telefonunuza kod göndərildi. Aşağıya daxil edin.',
    orderChangePhone: 'Başqa nömrə',
    orderInvalidPhone: 'Ölkə kodu ilə düzgün nömrə daxil edin (məs. +994…).',
    orderAccountPhone: 'Telefon',
    orderMapSearchPlaceholder: 'Küçə və ya yer axtarın…',
    orderMapPinHint: 'İşarəni sürüyün və ya axtarın — çatdırılma üçün məkan işarədən götürülür.',
    orderMapLoading: 'Xəritə yüklənir…',
    orderMapUnavailable: 'Xəritə əlçatan deyil. Ünvanı yazın və ya cihaz məkanından istifadə edin.',
    orderChooseFulfillmentTitle: 'Götürmə və ya çatdırılma?',
    orderSearchMenu: 'Menyu axtar…',
    orderVenueInfoTitle: 'Restoran',
    orderVenueHours: 'İş saatları',
    orderVenueAddress: 'Ünvan',
    orderVenuePhone: 'Telefon',
    orderAddToCart: 'Əlavə et',
    orderSearchNoResults: 'Axtarışınıza uyğun yemək yoxdur.',
    orderDeliveryDisabledInSettings:
      'Çatdırılma verilənlər bazasında söndürülüb. Supabase-də online_settings.delivery_enabled = true edin və ya götürmə seçin.',
    orderCombosSection: 'Kombolar',
    orderComboCustomize: 'Fərdiləşdir',
    orderComboBadge: 'Kombo',
    orderPhoneFormatHint: 'Azərbaycan formatı: +994 və 9 rəqəm.',
    orderDeliveryNotesLabel: 'Mənzil / kuryer üçün qeyd',
    orderDeliveryNotesPlaceholder: 'Mənzil, mərtəbə, kod və ya kuryer üçün qeyd',
    orderUpsellTitle: '{name} kombo edək?',
    orderUpsellMakeItComboNamed: '{name} komboya +₼{price} əlavə edək?',
    orderUpsellYes: 'Bəli, yenilə',
    orderUpsellNo: 'Xeyr',
    orderComboSavingsBadge: '₼{amount} qənaət',
    comboBuilderHeader: 'Kombo yığ',
    comboBuilderStepOf: 'Addım {n} / {t}',
    comboBuilderAddToCart: 'Kombonu səbətə əlavə et',
    comboBuilderNext: 'Növbəti',
    comboBuilderPickOne: 'Bir seçim edin',

    trackingPageTitle: 'Sifariş statusu',
    trackingOrderLabel: 'Sifariş',
    trackingKitchenStatus: 'Mətbəx statusu',
    trackingPayment: 'Ödəniş',
    trackingTotal: 'Cəmi',
    trackingLoading: 'Yüklənir…',
    trackingNotFound: 'Sifariş tapılmadı',
    trackingMissingToken: 'İzləmə linki yoxdur',
    trackOnWolt: 'Wolt-da izlə',
    trackStatusPending: 'Sifarişiniz qəbul edildi!',
    trackStatusPreparing: 'Yeməyiniz hazırlanır',
    trackStatusReady: 'Demək olar hazırdır — kuryer təyin olunur',
    trackStatusDispatched: 'Yoldadır!',
    trackStatusCompleted: 'Çatdırıldı — nuş olsun!',
    orderCancelledTitle: 'Sifarişiniz ləğv edildi',
    orderCancelledReason: 'Səbəb: {reason}',
    orderCancelledRefundNote:
      'Geri ödəmə həyata keçiriləcək. Suallar üçün +994518962446 nömrəsi ilə əlaqə saxlayın.',
    orderCancelledGeneric: 'Sifarişiniz ləğv edildi. Suallar üçün bizimlə əlaqə saxlayın.',
    trackingOrderAgain: 'Yenidən sifariş',
    trackingCancelledContact: 'Suallar? +994518962446',
    trackStageOrderPlaced: 'Sifariş verildi',
    trackStagePreparing: 'Hazırlanır',
    trackStageReady: 'Hazırdır',
    trackStageReadyForPickup: 'Götürməyə hazırdır',
    trackStageOutForDelivery: 'Çatdırma yoldadır',
    trackStageDelivered: 'Çatdırıldı',
    trackStageCollected: 'Götürüldü',
    trackStageEtaMinutes: 'Təxminən {min} dəq',
    trackStageArrivingAround: 'Təxminən {time} çatacaq',
    trackEtaLabel: 'Çatdırılma vaxtı',
    trackTimelineTitle: 'Sifariş vəziyyəti',

    combosScreenTitle: 'Kombo təkliflər',
    combosScreenDescription: 'Onlayn menyu üçün paket təkliflər yaradın.',
    combosScreenGroupsHint:
      'Kombo yaratdıqdan sonra qruplar və məhsulları Supabase Table Editor-də əlavə edin (combo_groups / combo_group_items).',
    combosName: 'Kombo adı',
    combosEmpty: 'Hələ kombo yoxdur — yuxarıdan yaradın.',
    comboGroupsTitle: 'Qruplar',
    comboGroupAdd: 'Qrup əlavə et',
    comboGroupRequired: 'Məcburi',
    comboItemsTitle: 'Məhsullar',
    comboItemAdd: 'Məhsul əlavə et',
    comboItemPriceAdjustment: 'Qiymət fərqi',
    comboUpsellLink: 'Upsell uyğunluğu',
    comboUpsellNone: 'Kombo yoxdur',

    omActiveOrders: 'Aktiv sifarişlər',
    omPastOrders: 'Keçmiş sifarişlər',
    omMenuEditor: 'Menyu redaktoru',
    omNewOrders: 'Yeni sifarişlər',
    omScheduledOrders: 'Planlı sifarişlər',
    omInProgress: 'Hazırlanır',
    omReady: 'Hazır',
    omInDelivery: 'Çatdırılmada',
    omAccept: 'Qəbul et',
    omMarkReady: 'Hazır et',
    omPickedUp: 'Təhvil verildi',
    omDelivered: 'Çatdırıldı',
    omSaveDispatch: 'Saxla və yola sal',
    omPrepTime: 'Hazırlıq vaxtı',
    omReminderBefore: 'Xatırlatma',
    omToday: 'Bu gün',
    omYesterday: 'Dünən',
    omLast7Days: 'Son 7 gün',
    omThisMonth: 'Bu ay',
    omLastMonth: 'Ötən ay',
    omProducts: 'Məhsullar',
    omCombos: 'Kombolar',
    omKioskToggle: 'Kiosk',
    omOnlineToggle: 'Onlayn',
    omActiveToggle: 'Aktiv',
    omNoActiveOrders: 'Aktiv sifariş yoxdur',
    omNoScheduledOrders: 'Planlı sifariş yoxdur',
    omNoPastOrders: 'Bu aralıqda keçmiş sifariş yoxdur',
    omSourceKiosk: 'Kiosk',
    omSourceTakeaway: 'Onlayn · Əlavə',
    omSourceDelivery: 'Onlayn · Çatdırılma',
    omTitle: 'Sifariş meneceri',
    omReminderSet: 'Xatırlatma quruldu',
    omSelfDelivery: 'Öz çatdırılma',
    omWoltDrive: 'Wolt Drive',
    omWoltDriveComingSoon: 'Tezliklə',
    omConfirmSelfDispatch: 'Təsdiqlə — Öz çatdırılma',
    omDispatchedSelfDelivery: 'Yola salındı — Öz çatdırılma',
    omNoLocationData: 'Lokasiya məlumatı yoxdur — əl ilə təyin edin',
    omDistanceAway: 'uzaqda',
    omRecommended: 'tövsiyə olunur',
    omRejectOrder: 'Sifarişi rədd et',
    omRejectReasonItemUnavailable: 'Məhsul yoxdur',
    omRejectReasonTooBusy: 'Mətbəx çox yüklüdür',
    omRejectReasonZoneIssue: 'Çatdırılma zonasından kənar',
    omRejectReasonCustomerRequest: 'Müştəri istəyi',
    omRejectReasonOther: 'Başqa səbəb',
    omRejectNotePlaceholder: 'Müştəri üçün qeyd əlavə edin...',
    omRejectConfirm: 'Rədd etməni təsdiqlə',
    omRejectCancel: 'Ləğv et',
    omRejectSelectReason: 'Səbəb seçin...',
  },

  ru: {
    home: 'Главная',
    sales: 'Продажи',
    money: 'Деньги',
    reports: 'Отчёты',
    more: 'Ещё',
    commandCenter: 'Командный Центр',
    signedIn: 'Выполнен вход',
    system: 'Система',
    inventory: 'Инвентарь',
    procurement: 'Снабжение',
    finance: 'Финансы',
    operations: 'Операции',

    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Изменить',
    add: 'Добавить',
    back: 'Назад',
    confirm: 'Подтвердить',
    search: 'Поиск',
    actions: 'Действия',
    status: 'Статус',
    notes: 'Заметки',
    active: 'Активен',
    inactive: 'Неактивен',
    new: 'Новый',
    update: 'Обновить',
    create: 'Создать',
    pleaseWait: 'Пожалуйста, подождите...',
    yes: 'Да',
    no: 'Нет',

    todaySales: 'Продажи сегодня',
    todayIncome: 'Доход сегодня',
    todayExpenses: 'Расходы сегодня',
    balance: 'Баланс',
    overview: 'Обзор и статистика',
    period: 'Период',
    today: 'Сегодня',
    yesterday: 'Вчера',
    thisWeek: 'Эта неделя',
    tomorrow: 'Завтра',
    thisMonth: 'Этот месяц',
    week: 'Неделя',
    month: 'Месяц',
    custom: 'Настраиваемый',
    last7Days: 'Последние 7 дней',
    sevenDay: '7 дней',
    last30Days: 'Последние 30 дней',
    monthToDate: 'С начала месяца',
    quarterToDate: 'С начала квартала',
    liveMetrics: 'Живые метрики',
    sevenDayVsPriorSevenDay: '7 дней против предыдущих 7 дней',
    revenueMomentumLast14Days: 'Динамика выручки (последние 14 дней)',
    noTrendData: 'Нет данных по тренду',
    profitabilitySignal: 'Сигнал прибыльности',
    profitabilityWarning: 'Предупреждение о прибыльности',
    operatingProfitPositiveMessage: 'Операционная прибыль положительная: {profit}, при среднем чеке {aov}.',
    operatingProfitNegativeMessage: 'Операционная прибыль отрицательная: {profit}. Отслеживайте себестоимость и операционные расходы относительно динамики продаж.',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    orders: 'Заказы',
    aov: 'Ср. чек',
    kpiNetRevenueHint: 'После COGS',
    kpiOperatingProfitHint: 'После COGS и OPEX',

    addSale: 'Добавить продажу',
    saleAmount: 'Сумма продажи',
    saleDescription: 'Описание (необязательно)',
    recordSale: 'Записать новую продажу',
    recentSales: 'Недавние Продажи',
    noSalesYet: 'Продаж ещё не было',
    salesByChannel: 'Продажи по Каналам',
    numberOfOrders: 'Количество Заказов',
    transactionDate: 'Дата Транзакции',
    deleteSaleConfirm: 'Вы уверены, что хотите удалить эту продажу?',
    salesManualEntryHint:
      'Ручной ввод только для партнёрских каналов (Wolt, Bolt, ChoiceQR). Заказы киоска и веб создаются приложением автоматически.',
    salesNoManualChannelsConfigured:
      'Нет доступных партнёрских каналов. Добавьте или включите Wolt, Bolt и ChoiceQR в Настройки → Каналы продаж.',

    addIncome: 'Добавить доход',
    addExpense: 'Добавить расход',
    amount: 'Сумма',
    description: 'Описание',
    category: 'Категория',
    date: 'Дата',
    income: 'Доход',
    expense: 'Расход',
    expenses: 'Расходы',
    operationalExpenses: 'Операционные Расходы',
    netProfit: 'Чистая Прибыль',
    paymentMethod: 'Способ Оплаты',
    paymentPlaceholder: 'Наличные, Карта, Банковский перевод...',
    noExpensesYet: 'Расходов ещё не было',

    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    totalSales: 'Всего продаж',
    totalIncome: 'Всего доходов',
    totalExpenses: 'Всего расходов',
    profit: 'Прибыль',
    financialInsights: 'Финансовая аналитика и статистика',
    categoryBreakdown: 'Разбивка по Категориям',
    masterCategoryBreakdown: 'Разбивка по Главным Категориям',
    transactionHistory: 'История Транзакций',
    ofSales: 'от продаж',
    ofExpenses: 'от общих расходов',
    transactions: 'транзакций',
    type: 'Тип',

    settings: 'Настройки',
    language: 'Язык',
    categories: 'Категории',
    manageCategories: 'Управление Категориями',
    categoryName: 'Название Категории',
    categoryType: 'Тип',
    addCategory: 'Добавить Категорию',
    masterCategory: 'Главная Категория',
    masterCategories: 'Главные Категории',
    manageMasterCategories: 'Управление Главными Категориями',
    addMasterCategory: 'Добавить Главную Категорию',
    noCategorySelected: 'Без Главной Категории',
    deleteCategoryConfirm: 'Вы уверены, что хотите удалить эту категорию?',
    deleteMasterCategoryConfirm: 'Вы уверены, что хотите удалить эту главную категорию?',
    applicationPreferences: 'Настройки приложения',
    theme: 'Тема',
    darkMode: 'Темный режим',
    lightMode: 'Светлый режим',
    salesChannels: 'Каналы продаж',
    channelName: 'Название канала',
    enterChannelName: 'Введите название канала',
    enterDescription: 'Введите описание',
    addChannel: 'Добавить канал',
    activeChannels: 'Активные каналы',

    products: 'Продукты и Услуги',
    addProduct: 'Добавить Продукт',
    editProduct: 'Редактировать Продукт',
    addNewProduct: 'Добавить Новый Продукт',
    manageInventory: 'Управляйте своим инвентарем и ценами',
    productName: 'Название Продукта',
    barcode: 'Штрихкод',
    costPrice: 'Себестоимость',
    sellingPrice: 'Цена Продажи',
    stock: 'Склад',
    stockQuantity: 'Количество на Складе',
    lowStockAlert: 'Оповещение о Низком Запасе',
    minStockLevel: 'Минимальный Уровень Запаса',
    unit: 'Единица',
    unitOfMeasurement: 'Единица Измерения',
    supplier: 'Поставщик',
    noSupplier: 'Нет Поставщика',
    noCategory: 'Нет Категории',
    noProductsFound: 'Продукты не найдены',
    searchProducts: 'Поиск продуктов...',
    deleteProductConfirm: 'Вы уверены, что хотите удалить',
    product: 'Продукт',

    pieces: 'Штуки (шт)',
    kilogram: 'Килограмм (кг)',
    gram: 'Грамм (г)',
    liter: 'Литр (л)',
    milliliter: 'Миллилитр (мл)',
    box: 'Коробка',
    pack: 'Упаковка',
    unitSingle: 'Единица',

    purchases: 'Закупки',
    newPurchase: 'Новая Закупка',
    editPurchase: 'Редактировать Закупку',
    trackPurchases: 'Отслеживайте закупки товаров у поставщиков',
    selectProduct: 'Выберите продукт',
    selectSupplier: 'Выберите поставщика',
    cost: 'Стоимость (₼)',
    purchaseDate: 'Дата Закупки',
    paymentStatus: 'Статус Оплаты',
    pending: 'В ожидании',
    partial: 'Частичная',
    paid: 'Оплачено',
    additionalNotes: 'Дополнительные заметки об этой закупке...',
    pastPurchases: 'Прошлые Закупки',
    useThis: 'Использовать',
    updatePurchase: 'Обновить Закупку',
    createPurchase: 'Создать Закупку',
    noPurchasesYet: 'Закупок пока нет',
    startTracking: 'Начните отслеживать закупки товаров у поставщиков',
    createFirstPurchase: 'Создать Первую Закупку',
    deletePurchaseConfirm: 'Удалить эту закупку?',
    totalCost: 'Общая Стоимость',

    suppliers: 'Поставщики',
    addSupplier: 'Добавить Поставщика',
    editSupplier: 'Редактировать Поставщика',
    addNewSupplier: 'Добавить Нового Поставщика',
    manageSuppliers: 'Управляйте своими поставщиками',
    supplierName: 'Название Поставщика',
    contactPerson: 'Контактное Лицо',
    email: 'Email',
    phone: 'Телефон',
    address: 'Адрес',
    enterSupplierName: 'Введите название поставщика',
    enterContactPerson: 'Введите контактное лицо',
    enterEmail: 'Введите email',
    enterPhone: 'Введите номер телефона',
    enterAddress: 'Введите адрес',
    enterNotes: 'Введите заметки',
    contact: 'Контакт:',
    noSuppliersYet: 'Поставщиков пока нет. Добавьте первого поставщика для начала.',
    addFirstSupplier: 'Добавить Первого Поставщика',
    deleteSupplierConfirm: 'Удалить',
    productsWillBeUnlinked: 'Связанные продукты будут отсоединены.',

    users: 'Пользователи',
    addNewUser: 'Добавить Нового Пользователя',
    createNewUser: 'Создать Нового Пользователя',
    manageUsers: 'Управление учетными записями пользователей',
    emailAddress: 'Адрес Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите Пароль',
    emailPlaceholder: 'polzovatel@example.com',
    passwordPlaceholder: 'Минимум 6 символов',
    confirmPasswordPlaceholder: 'Введите пароль повторно',
    creating: 'Создание...',
    createUser: 'Создать Пользователя',
    fillAllFields: 'Пожалуйста, заполните все поля',
    passwordsDontMatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен содержать не менее 6 символов',
    notAuthenticated: 'Не авторизован',
    userCreated: 'Пользователь успешно создан',
    userDeleted: 'Пользователь успешно удалён',
    deleteUserConfirm: 'Вы уверены, что хотите удалить этого пользователя?',
    noUsersFound: 'Пользователи не найдены',
    lastSignIn: 'Последний Вход',
    never: 'Никогда',
    user: 'Пользователь',
    createdAt: 'Создан',

    welcomeBack: 'С Возвращением',
    signInToAccount: 'Войдите в свою учетную запись',
    signIn: 'Войти',
    businessManagement: 'Система Управления Бизнесом',
    staffAccessDeniedTitle: 'Нужен доступ сотрудника',
    staffAccessDeniedBody:
      'Этот аккаунт ещё не добавлен как сотрудник. Попросите администратора создать вас в Command Center → Пользователи (Новый пользователь), или заказывайте как клиент.',
    staffAccessRetry: 'Проверить снова',
    staffGoToOrder: 'Заказать онлайн',
    staffSignOut: 'Выйти',
    adminAccessDeniedTitle: 'Доступ ограничен',
    adminAccessDeniedBody:
      'У вас нет доступа к панели администратора. Пожалуйста, используйте Менеджер заказов.',
    adminAccessGoToOrderManager: 'Перейти в Менеджер заказов',
    newUserRole: 'Роль',
    userRoleStaff: 'Сотрудник',
    userRoleManager: 'Менеджер',
    userRoleAdmin: 'Администратор',
    newUserStaffProfileHint:
      'Создаёт учётную запись и доступ сотрудника в Command Center (как у вашей учётной записи).',

    trackMoney: 'Отслеживайте продажи, расходы и закупки',
    salesIncome: 'Доход от Продаж',
    productPurchases: 'Закупки Товаров',
    quantity: 'Количество',

    savedSuccessfully: 'Успешно сохранено!',
    deletedSuccessfully: 'Успешно удалено!',
    errorOccurred: 'Произошла ошибка',
    foodCost: 'Себестоимость Еды %',
    cogs: 'Себестоимость',
    share: '% доля',

    manageCOGSAndFixedCost: 'Управление категориями себестоимости и постоянных расходов',
    cogsCategories: 'Категории Себестоимости',
    costOfGoodsSold: 'Себестоимость Проданных Товаров',
    fixedCostCategories: 'Категории Постоянных Расходов',
    cogsPurchase: 'Себестоимость (Закупка)',
    fixedCostExpense: 'Постоянные Расходы (Операционные)',
    masterCategoryOptional: 'Главная Категория (Необязательно)',
    none: 'Нет',
    optionalDescription: 'Описание (необязательно)',
    color: 'Цвет',
    icon: 'Иконка',
    updateCategory: 'Обновить Категорию',
    createCategory: 'Создать Категорию',
    noCOGSCategories: 'Категорий себестоимости пока нет',
    createFirstOne: 'Создайте первую',
    deleteThisCategory: 'Удалить эту категорию?',
    noFixedCostCategories: 'Категорий постоянных расходов пока нет',

    newExpense: 'Новый Расход',
    editExpense: 'Редактировать Расход',
    trackFixedCosts: 'Отслеживайте постоянные и операционные расходы',
    createNewCategory: 'Создать Новую Категорию',
    descriptionOptional: 'Описание (Необязательно)',
    createAndSelect: 'Создать и Выбрать',
    selectCategory: 'Выберите Категорию',
    createNewCategoryOption: '+ Создать Новую Категорию',
    amountWithCurrency: 'Сумма (₼) *',
    dateRequired: 'Дата *',
    paymentMethodExample: 'напр., Наличные, Карта, Банковский перевод',
    describeExpense: 'Опишите этот расход...',
    updateExpense: 'Обновить Расход',
    createExpense: 'Создать Расход',
    noExpenses: 'Расходов пока нет',
    startTrackingExpenses: 'Начните отслеживать операционные расходы',
    createFirstExpense: 'Создать Первый Расход',
    deleteThisExpense: 'Удалить этот расход?',
    expenseItems: 'Статьи Расходов',
    expenseItem: 'Статья Расходов',
    addExpenseItem: 'Добавить Статью Расходов',
    editExpenseItem: 'Редактировать Статью Расходов',
    selectExpenseItem: 'Выберите Статью Расходов',
    expenseItemName: 'Название Статьи Расходов',
    addNewExpenseItem: 'Добавить Новую Статью Расходов',
    noExpenseItems: 'Статьи расходов не найдены',
    createFirstExpenseItem: 'Создайте первую статью расходов для начала',
    selectMasterCategory: 'Выберите Главную Категорию',
    allMasterCategories: 'Все Главные Категории',
    enterExpenseItemName: 'Введите название статьи расходов',
    item: 'элемент',
    items: 'элементов',
    created: 'Создано',
    confirmDelete: 'Вы уверены, что хотите удалить?',

    noSalesRecorded: 'Продаж ещё не было',
    noPurchasesRecorded: 'Закупок ещё не было',
    payment: 'Оплата',

    tapToOrder: 'Нажмите для заказа',
    addToCart: 'В корзину',
    viewCart: 'Корзина',
    placeOrder: 'Оформить заказ',
    confirmOrder: 'Подтвердить заказ',
    orderConfirmed: 'Ваш заказ принят!',
    payAtCounter: 'Оплатите на кассе',
    yourOrderNumber: 'Номер вашего заказа',
    continueShopping: 'Продолжить покупки',
    emptyCart: 'Корзина пуста',
    removeItem: 'Удалить',
    orderTotal: 'Итого',
    backToMenu: 'Назад в меню',
    noThanks: 'Нет, спасибо',
    wouldYouLikeToAdd: 'Хотите добавить?',
    menu: 'Меню',

    kitchenDisplay: 'Кухонный Дисплей',
    startPreparing: 'Начать готовить',
    markReady: 'Готово',
    markCompleted: 'Завершить',
    awaitingPayment: 'Ожидание оплаты',
    newOrderAlert: 'Новый Заказ!',
    activeOrders: 'Активные Заказы',
    prepTime: 'Время готовки',
    connected: 'Подключено',
    reconnecting: 'Переподключение',
    kdsConnectionLostBanner:
      'СОЕДИНЕНИЕ ПОТЕРЯНО — заказы могут не отображаться. Нажмите, чтобы переподключиться.',
    kdsPaymentPendingOnline: 'ОПЛАТА ОЖИДАЕТСЯ — не готовьте',
    kdsPaymentCashCod: 'НАЛИЧНЫЕ / ПРИ ПОЛУЧЕНИИ',
    kdsPaymentConfirmed: '✓ Оплата подтверждена',
    kdsPrepTimeLabel: 'Время приготовления (мин)',
    kdsBusyKitchenHint: 'Загруженная кухня? Рекомендуем 20 мин.',
    kdsCourierNoteLabel: 'Курьер',

    kioskOrders: 'Заказы с Киоска',
    confirmPayment: 'Подтвердить оплату',
    printAgain: 'Печать повторно',
    cancelOrder: 'Отменить заказ',
    orderSource: 'Источник',
    kiosk: 'Киоск',
    manual: 'Ручной',
    displayNumber: 'Заказ #',
    orderDetails: 'Детали Заказа',
    preparing: 'Готовится',
    ready: 'Готов',
    dispatched: 'В пути',
    completed: 'Завершён',
    cancelled: 'Отменён',
    unpaid: 'Не оплачен',
    allStatuses: 'Все Статусы',
    filterByStatus: 'Фильтр по статусу',
    noKioskOrders: 'Заказов с киоска пока нет',
    viewKiosk: 'Открыть Киоск',
    kioskPaymentPendingBadge: 'Ожидается онлайн-оплата',
    kioskPaymentCashCodBadge: 'НАЛИЧНЫЕ / ПРИ ПОЛУЧЕНИИ',
    kioskPaymentPaidBadge: '✓ Оплачено',
    woltTrackingLink: 'Отслеживание Wolt',
    woltOpenPortal: 'Открыть портал Wolt',
    woltDispatchLocked: 'Бронирование… ({seconds} с)',
    woltCopyAll: 'Копировать всё для Wolt',
    woltCopiedAll: 'Скопировано!',
    woltTrackingUrlLabel: 'Ссылка отслеживания',
    woltSaveDispatched: 'Сохранить и отправить',
    woltCopyCustomer: 'Клиент',
    woltCopyPhone: 'Телефон',
    woltCopyAddress: 'Адрес',
    woltCopyNotes: 'Примечания',
    woltCopyFailed: 'Не удалось скопировать.',
    woltSaveFailed: 'Не удалось сохранить ссылку.',
    saving: 'Сохранение…',

    kioskVisible: 'Показать на киоске',
    onlineVisible: 'Показать в веб-заказе',
    onlineDelivery: 'Онлайн · Доставка',
    onlineTakeaway: 'Онлайн · Самовывоз',
    productImage: 'URL изображения',
    sellingPriceLabel: 'Цена продажи',

    menuBuilder: 'Конструктор Меню',
    manageMenu: 'Управляйте меню киоска, категориями и модификаторами',
    modifiers: 'Модификаторы',
    modifierGroups: 'Группы Модификаторов',
    addModifierGroup: 'Добавить Группу Модификаторов',
    editModifierGroup: 'Редактировать Группу Модификаторов',
    groupName: 'Название Группы',
    minSelections: 'Мин. Выборов',
    maxSelections: 'Макс. Выборов',
    required: 'Обязательно',
    optional: 'Необязательно',
    addOption: 'Добавить Вариант',
    editOption: 'Редактировать Вариант',
    optionName: 'Название Варианта',
    priceAdjustment: 'Корректировка Цены',
    freeOption: 'Бесплатно',
    available: 'Доступно',
    unavailable: 'Недоступно',
    defaultOption: 'По умолчанию',
    chooseOne: 'Выберите 1',
    chooseUpTo: 'Выберите до',
    customize: 'Настроить',
    basePrice: 'Базовая Цена',
    noModifiers: 'Групп модификаторов пока нет',
    noOptions: 'Вариантов пока нет',
    duplicateProduct: 'Дублировать',
    menuCategories: 'Категории Меню',
    displayOrder: 'Порядок Отображения',
    moveUp: 'Вверх',
    moveDown: 'Вниз',
    productDetails: 'Детали Продукта',
    selectRequired: 'Сделайте обязательные выборы',
    manageModifiers: 'Управление Модификаторами',
    assignModifiers: 'Назначить Модификаторы',
    assignedProducts: 'Назначенные Продукты',
    noAssignedProducts: 'Не назначен ни одному продукту',
    assignToProducts: 'Назначить Продуктам',
    selectModifierGroups: 'Выберите группы модификаторов',
    usedInProducts: 'Используется в продуктах',
    modifierLibrary: 'Библиотека Модификаторов',

    payouts: 'Выплаты',
    platformPayouts: 'Выплаты Платформ',
    trackPlatformPayouts: 'Отслеживайте выплаты от платформ доставки',
    addPayout: 'Добавить Выплату',
    editPayout: 'Редактировать Выплату',
    selectPlatform: 'Выберите Платформу',
    periodStart: 'Начало Периода',
    periodEnd: 'Конец Периода',
    payoutAmount: 'Сумма Выплаты',
    payoutDate: 'Дата Выплаты',
    grossSales: 'Валовые Продажи',
    netRevenueLabel: 'Чистая Выручка',
    operatingProfitLabel: 'Операционная Прибыль',
    grossMarginLabel: 'Валовая Маржа',
    revenueLabel: 'Выручка',
    operationalExpenseLabel: 'Операционные Расходы',
    purchaseCostLabel: 'Закупочная Стоимость',
    revenueVsCostsTrend: 'Тренд выручки и затрат',
    orderMetricsTrend: 'Заказы и средний чек',
    topCategory: 'Топ категория',
    kpiRatioUnavailable: '—',
    expenseComposition: 'Структура расходов',
    payoutReconciliation: 'Сверка выплат',
    expected: 'Ожидаемо',
    actual: 'Фактически',
    difference: 'Разница',
    matched: 'Совпало',
    mismatched: 'Не совпало',
    weatherUnavailable: 'Погода недоступна',
    cached: 'кэш',
    clear: 'Ясно',
    cloudy: 'Облачно',
    fog: 'Туман',
    rain: 'Дождь',
    snow: 'Снег',
    storm: 'Шторм',
    mixed: 'Смешано',
    noDataForPeriod: 'Нет данных за этот период',
    noTransactionsInPeriod: 'Нет операций за этот период',
    noItemsFound: 'Элементы не найдены',
    searchExpenseItems: 'Поиск статей расхода...',
    searchItems: 'Поиск элементов...',
    addPurchase: 'Добавить закупку',
    commission: 'Комиссия',
    commissionRate: 'Ставка Комиссии',
    noPayoutsYet: 'Выплат пока нет',
    createFirstPayout: 'Запишите первую выплату от платформы',
    deletePayoutConfirm: 'Удалить эту выплату?',
    payoutSummary: 'Сводка Выплат',
    totalCommissions: 'Всего Комиссий',
    platformCosts: 'Расходы на Платформы',
    noSalesInPeriod: 'Продаж за этот период не найдено',
    payoutReceived: 'Получено от Платформы',
    periodRevenue: 'Выручка за период',
    impliedCommission: 'Комиссия',
    payoutPeriodsInRange: 'В этом диапазоне периодов выплат: {count}',
    payoutSummaryCard: 'Сводка выплат',

    orderNavMenu: 'Меню',
    orderNavCart: 'Корзина',
    orderNavAccount: 'Аккаунт',
    orderSignIn: 'Войти',
    orderSignUp: 'Регистрация',
    orderSignOut: 'Выйти',
    orderMyOrders: 'Мои заказы',
    orderNoOrders: 'Пока нет заказов',
    orderSavedAddresses: 'Сохранённые адреса',
    orderEmail: 'Email',
    orderPassword: 'Пароль',
    orderCreateAccountHint: 'Создайте аккаунт, чтобы сохранять адреса и видеть историю заказов.',
    orderYourName: 'Ваше имя',
    orderYourPhone: 'Телефон',
    orderSaveProfile: 'Сохранить профиль',
    orderAddAddress: 'Добавить адрес',
    orderOnlineTitle: 'Заказ онлайн',
    orderAllCategories: 'Все',
    orderSubtotal: 'Подытог',
    orderDeliveryFeeRow: 'Доставка',
    orderFulfillmentTakeaway: 'Самовывоз',
    orderFulfillmentDelivery: 'Доставка',
    orderPhone: 'Телефон',
    orderNameOptional: 'Имя (необязательно)',
    orderDeliveryAddress: 'Адрес доставки',
    orderUseLocation: 'Моё местоположение',
    orderGeoLocating: 'Определение…',
    orderGeoNotSupported: 'Геолокация не поддерживается',
    orderGeoFailed: 'Не удалось получить местоположение',
    orderGeoUpdated: 'Местоположение обновлено',
    orderOutsideZone: 'Вне зоны доставки — уточните точку.',
    zoneErrorTitle: 'Пока не доставляем по этому адресу',
    zoneErrorMessage: 'Попробуйте другой адрес или выберите самовывоз.',
    zoneSwitchTakeaway: 'Перейти к самовывозу',
    orderSubmitDisabledOutsideZone:
      'Доставка недоступна для этого адреса. Переключитесь на самовывоз или переместите метку.',
    kitchenClosedTitle: 'Сейчас мы закрыты',
    kitchenClosedMessage: 'Онлайн-заказы временно недоступны. Загляните позже.',
    kitchenClosedReopenHint: 'Часы работы:',
    kitchenClosedBackToMenu: 'В меню',
    cartUnavailableTitle: 'Некоторые позиции больше недоступны',
    cartUnavailableIntro: 'Удалите недоступные позиции, чтобы продолжить.',
    cartUnavailableRemoveLine: 'Убрать',
    cartUnavailableContinueWithout: 'Продолжить без этих позиций',
    cartUnavailableBackMenu: 'В меню',
    cartUnavailableServerHint:
      'Меню изменилось, пока корзина была открыта. Обновите корзину и попробуйте снова.',
    cartUnavailableGenericItemLabel:
      'Некоторых позиций в корзине больше нет в наличии',
    orderInZonePrefix: 'Зона',
    orderPayment: 'Оплата',
    orderPayCod: 'Наличные при получении',
    orderPayCash: 'Наличные',
    orderPayEpoint: 'Карта (E-point)',
    orderPlacedTitle: 'Заказ оформлен',
    orderTrackHint: 'Статус заказа',
    orderOpenTracking: 'Открыть отслеживание',
    orderCheckout: 'Оформить',
    orderFulfillmentTakeawayDisabled: 'Самовывоз отключён — только доставка.',
    orderOnlineDisabled: 'Онлайн-заказ отключён.',
    orderViewCart: 'К корзине',
    orderAddressLabel: 'Метка',
    orderAddressStreet: 'Улица, дом, кв.',
    orderLanguage: 'Язык',
    orderSelectSavedAddress: 'Сохранённый адрес',
    orderSaveAddressForNext: 'Сохранить этот адрес',
    orderLoadingMenu: 'Загрузка меню…',
    orderYourCart: 'Ваша корзина',
    orderAuthEmail: 'Email',
    orderAuthSms: 'SMS',
    orderSendSmsCode: 'Отправить код',
    orderSmsCode: 'Код из SMS',
    orderVerifySms: 'Подтвердить и войти',
    orderSmsSentHint: 'Мы отправили код на ваш телефон. Введите его ниже.',
    orderChangePhone: 'Другой номер',
    orderInvalidPhone: 'Укажите номер с кодом страны (например +994…).',
    orderAccountPhone: 'Телефон',
    orderMapSearchPlaceholder: 'Поиск улицы или места…',
    orderMapPinHint: 'Перетащите метку или найдите адрес — доставка по положению метки.',
    orderMapLoading: 'Загрузка карты…',
    orderMapUnavailable: 'Карта недоступна. Введите адрес или используйте геолокацию.',
    orderChooseFulfillmentTitle: 'Самовывоз или доставка?',
    orderSearchMenu: 'Поиск в меню…',
    orderVenueInfoTitle: 'Ресторан',
    orderVenueHours: 'Часы',
    orderVenueAddress: 'Адрес',
    orderVenuePhone: 'Телефон',
    orderAddToCart: 'В корзину',
    orderSearchNoResults: 'Ничего не найдено.',
    orderDeliveryDisabledInSettings:
      'Доставка отключена в базе. Включите online_settings.delivery_enabled = true в Supabase или выберите самовывоз.',
    orderCombosSection: 'Комбо',
    orderComboCustomize: 'Настроить',
    orderComboBadge: 'Комбо',
    orderPhoneFormatHint: 'Формат Азербайджана: +994 и 9 цифр.',
    orderDeliveryNotesLabel: 'Квартира / примечания для курьера',
    orderDeliveryNotesPlaceholder: 'Квартира, этаж, код домофона или примечания',
    orderUpsellTitle: 'Сделать «{name}» комбо?',
    orderUpsellMakeItComboNamed: 'Сделать {name} комбо за +₼{price}?',
    orderUpsellYes: 'Да, улучшить',
    orderUpsellNo: 'Нет',
    orderComboSavingsBadge: 'Экономия ₼{amount}',
    comboBuilderHeader: 'Собрать комбо',
    comboBuilderStepOf: 'Шаг {n} из {t}',
    comboBuilderAddToCart: 'Добавить комбо в корзину',
    comboBuilderNext: 'Далее',
    comboBuilderPickOne: 'Выберите один вариант',

    trackingPageTitle: 'Статус заказа',
    trackingOrderLabel: 'Заказ',
    trackingKitchenStatus: 'Статус кухни',
    trackingPayment: 'Оплата',
    trackingTotal: 'Итого',
    trackingLoading: 'Загрузка…',
    trackingNotFound: 'Заказ не найден',
    trackingMissingToken: 'Нет ссылки отслеживания',
    trackOnWolt: 'Отследить в Wolt',
    trackStatusPending: 'Мы получили ваш заказ!',
    trackStatusPreparing: 'Ваш заказ готовится',
    trackStatusReady: 'Почти готово — назначаем курьера',
    trackStatusDispatched: 'В пути!',
    trackStatusCompleted: 'Доставлено — приятного аппетита!',
    orderCancelledTitle: 'Заказ отменён',
    orderCancelledReason: 'Причина: {reason}',
    orderCancelledRefundNote:
      'Возврат будет обработан. Вопросы: +994518962446',
    orderCancelledGeneric: 'Заказ отменён. Свяжитесь с нами, если есть вопросы.',
    trackingOrderAgain: 'Заказать снова',
    trackingCancelledContact: 'Вопросы? Звоните +994518962446',
    trackStageOrderPlaced: 'Заказ оформлен',
    trackStagePreparing: 'Готовится',
    trackStageReady: 'Готово',
    trackStageReadyForPickup: 'Готов к выдаче',
    trackStageOutForDelivery: 'В пути к вам',
    trackStageDelivered: 'Доставлено',
    trackStageCollected: 'Получен',
    trackStageEtaMinutes: 'Около {min} мин',
    trackStageArrivingAround: 'Ожидается около {time}',
    trackEtaLabel: 'Прибытие',
    trackTimelineTitle: 'Статус заказа',

    combosScreenTitle: 'Комбо-предложения',
    combosScreenDescription: 'Создавайте пакетные предложения для онлайн-меню.',
    combosScreenGroupsHint:
      'После создания комбо добавьте группы и позиции в Supabase (таблицы combo_groups / combo_group_items).',
    combosName: 'Название комбо',
    combosEmpty: 'Комбо пока нет — создайте выше.',
    comboGroupsTitle: 'Группы',
    comboGroupAdd: 'Добавить группу',
    comboGroupRequired: 'Обязательно',
    comboItemsTitle: 'Позиции',
    comboItemAdd: 'Добавить позицию',
    comboItemPriceAdjustment: 'Корректировка цены',
    comboUpsellLink: 'Привязка upsell',
    comboUpsellNone: 'Без комбо',
    omActiveOrders: 'Активные заказы',
    omPastOrders: 'Прошлые заказы',
    omMenuEditor: 'Редактор меню',
    omNewOrders: 'Новые заказы',
    omScheduledOrders: 'Запланированные заказы',
    omInProgress: 'В работе',
    omReady: 'Готово',
    omInDelivery: 'В доставке',
    omAccept: 'Принять',
    omMarkReady: 'Готово',
    omPickedUp: 'Забрано',
    omDelivered: 'Доставлено',
    omSaveDispatch: 'Сохранить и отправить',
    omPrepTime: 'Время готовки',
    omReminderBefore: 'Напомнить за',
    omToday: 'Сегодня',
    omYesterday: 'Вчера',
    omLast7Days: 'Последние 7 дней',
    omThisMonth: 'Этот месяц',
    omLastMonth: 'Прошлый месяц',
    omProducts: 'Продукты',
    omCombos: 'Комбо',
    omKioskToggle: 'Киоск',
    omOnlineToggle: 'Онлайн',
    omActiveToggle: 'Активно',
    omNoActiveOrders: 'Нет активных заказов',
    omNoScheduledOrders: 'Нет запланированных заказов',
    omNoPastOrders: 'Нет прошлых заказов за период',
    omSourceKiosk: 'Киоск',
    omSourceTakeaway: 'Онлайн · Самовывоз',
    omSourceDelivery: 'Онлайн · Доставка',
    omTitle: 'Менеджер заказов',
    omReminderSet: 'Напоминание установлено',
    omSelfDelivery: 'Своя доставка',
    omWoltDrive: 'Wolt Drive',
    omWoltDriveComingSoon: 'Скоро',
    omConfirmSelfDispatch: 'Подтвердить — Своя доставка',
    omDispatchedSelfDelivery: 'Отправлено — Своя доставка',
    omNoLocationData: 'Нет данных о локации — назначьте вручную',
    omDistanceAway: 'от кухни',
    omRecommended: 'рекомендуется',
    omRejectOrder: 'Отклонить заказ',
    omRejectReasonItemUnavailable: 'Товар недоступен',
    omRejectReasonTooBusy: 'Кухня перегружена',
    omRejectReasonZoneIssue: 'Вне зоны доставки',
    omRejectReasonCustomerRequest: 'По просьбе клиента',
    omRejectReasonOther: 'Другая причина',
    omRejectNotePlaceholder: 'Добавьте комментарий для клиента...',
    omRejectConfirm: 'Подтвердить отказ',
    omRejectCancel: 'Отмена',
    omRejectSelectReason: 'Выберите причину...',
  },
};
