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
  navOverview: string;
  navOrders: string;
  navCatalog: string;
  navFinance: string;
  navHubIncome: string;
  navHubSpending: string;
  navHubCashAccounts: string;
  navHubPayroll: string;
  navHubInsights: string;
  navSystem: string;
  cockpitLoadingContent: string;
  cockpitResetFilters: string;
  cockpitEmptyFilteredHint: string;
  cockpitTestRecordLabel: string;
  cockpitNeedsReview: string;
  cockpitReviewHighCommission: string;
  cockpitReviewUnusualAmount: string;
  settingsAppearance: string;
  collapseSidebar: string;
  expandSidebar: string;
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
  halal: string;
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
  kpiNetProfitHint: string;
  comparePreviousPeriod: string;
  netProfitLabel: string;
  sourceFilter: string;
  orderSourceMix: string;
  avgPrepTime: string;
  kitchenSla: string;
  paymentHealth: string;
  payoutCommission: string;
  topProducts: string;
  peakHours: string;
  operationalInsights: string;
  paidOrders: string;
  unpaidOrders: string;
  cardPayments: string;
  codPayments: string;
  matchedPayouts: string;
  mismatchedPayouts: string;
  pendingPayouts: string;
  expandDetails: string;
  collapseDetails: string;
  viewFullReport: string;
  viewPayouts: string;
  revenueShare: string;
  dashboardOrdersHint: string;
  dashboardAovHint: string;
  dataConsistencyWarning: string;
  pos: string;

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
  deleteChannelConfirmTitle: string;
  deleteChannelConfirmMessage: string;
  deleteChannelError: string;
  channelRemovedSuccess: string;
  systemSalesChannel: string;
  salesChannelProtectedError: string;
  dismiss: string;
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
  changeRole: string;
  resetPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordResetSuccess: string;
  roleUpdated: string;
  cannotChangeOwnRole: string;
  passwordMinLength: string;

  // Audit log (admin)
  auditLog: string;
  auditLogTitle: string;
  auditLogSubtitle: string;
  auditLogTabActions: string;
  auditLogTabChanges: string;
  auditLogTabSignIns: string;
  auditLogEmpty: string;
  auditLogColWhen: string;
  auditLogColWho: string;
  auditLogColAction: string;
  auditLogColResource: string;
  auditLogColDetails: string;
  auditLogColSurface: string;
  auditLogColDevice: string;
  auditLogSurfaceCockpit: string;
  auditLogSurfacePos: string;
  auditLogSurfaceKds: string;
  auditLogSurfaceKiosk: string;
  auditLogSurfaceOrderManager: string;

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
  adminAccessGoToPos: string;
  adminAccessGoToKds: string;
  adminAccessGoToKiosk: string;
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
  updatedSuccessfully: string;
  deletedSuccessfully: string;
  errorOccurred: string;
  amountMustBePositive: string;
  expenseItemRequired: string;
  paymentMethodRequired: string;
  descriptionRequired: string;
  expenseDateRequired: string;
  quantityMustBePositive: string;
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
  createNamed: string;
  newItem: string;
  assignToCategory: string;
  newCategory: string;
  newSupplierName: string;
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
  kioskWelcomeTitle: string;
  kioskEatIn: string;
  kioskTakeOut: string;
  kioskExploreMenu: string;
  kioskRestartMenu: string;
  kioskOrderNow: string;
  kioskOrderMore: string;
  kioskDoneCountdown: string;
  kioskNoCategories: string;
  kioskNoProducts: string;
  addToCart: string;
  viewCart: string;
  placeOrder: string;
  confirmOrder: string;
  kioskOrderCreateFailed: string;
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
  /** Staff-facing: cash at counter (new + legacy cod/cash on takeaway). */
  payMethodBadgeCashPickup: string;
  /** Staff-facing: cash when courier delivers (new + legacy cod/cash on delivery). */
  payMethodBadgeCashDelivery: string;
  /** Staff-facing: online card not settled yet — never use for cash orders. */
  payMethodBadgeCardAuthorizing: string;
  kdsPrepTimeLabel: string;
  kdsBusyKitchenHint: string;
  kdsCourierNoteLabel: string;
  kdsStatusUpdating: string;
  kdsChannelDelivery: string;
  kdsChannelTakeaway: string;
  kdsChannelKiosk: string;
  kdsChannelPosEatIn: string;
  kdsChannelPosTakeaway: string;
  kdsChannelPosDelivery: string;
  kdsFilterAll: string;
  kdsSearchPlaceholder: string;
  kdsHistoryTitle: string;
  kdsHistoryEmpty: string;
  kdsUndoComplete: string;
  kdsUndoSeconds: string;
  kdsUndoButton: string;
  kdsAllItemsPrepared: string;
  kdsMarkItemPrepared: string;
  kdsMarkItemUnprepared: string;
  kdsEmptyQueueTitle: string;
  kdsEmptyQueueHint: string;
  kdsEmptyColumn: string;
  kdsEmptyFiltered: string;
  kdsEmptyFilteredHint: string;
  kdsHistorySubtitle: string;

  // Kiosk Admin
  orderManagerTitle: string;
  orderManagerDescription: string;
  openOnlineOrder: string;
  refreshOrders: string;
  totalOrders: string;
  ordersInQueue: string;
  todayRevenue: string;
  searchOrderManagerPlaceholder: string;
  allSources: string;
  allPayments: string;
  unpaidOnly: string;
  paidOnly: string;
  kioskOrders: string;
  cockpitQuickLinks: string;
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

  // Staff / Salaries
  staff: string;
  staffScreenTitle: string;
  staffScreenDescription: string;
  staffAddEmployee: string;
  staffEditEmployee: string;
  staffRecordPayment: string;
  staffEditPayment: string;
  staffFullName: string;
  staffDesignation: string;
  staffTotalSalary: string;
  staffActiveLabel: string;
  staffActiveEmployees: string;
  staffMonthlyPayrollTarget: string;
  staffPaidInPeriod: string;
  staffEmployee: string;
  staffSelectEmployee: string;
  staffPaymentType: string;
  staffPaymentTypeSalary: string;
  staffPaymentTypeAdvance: string;
  staffPaymentTypeBonus: string;
  staffPaymentTypePartial: string;
  staffNameRequired: string;
  staffInvalidSalary: string;
  staffInvalidPaymentAmount: string;
  staffEmployeeAdded: string;
  staffEmployeeUpdated: string;
  staffEmployeeDeleted: string;
  staffPaymentAdded: string;
  staffPaymentUpdated: string;
  staffPaymentDeleted: string;
  staffDeleteEmployeeConfirm: string;
  staffDeletePaymentConfirm: string;
  staffNoEmployees: string;
  staffNoPaymentsInPeriod: string;
  staffInactive: string;
  staffNoDesignation: string;
  staffDoubleEntryWarning: string;
  staffSalariesLabel: string;
  staffSalariesHint: string;
  kpiNetProfitHintExtended: string;

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
  /** Label for choosing which account a payout landed in */
  payoutReceivedInto: string;
  /** Helper under the received-account selector */
  payoutReceivedIntoHint: string;
  /** Warning when a payout has no account chosen (won't affect balances) */
  payoutNoAccountWarning: string;
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
  kitchenPausedTitle: string;
  kitchenPausedMessage: string;
  orderClosedPausedUntil: string;
  orderClosedUntilNextOpen: string;
  orderClosedSchedulePromptTitle: string;
  orderClosedSchedulePromptHint: string;
  orderClosedScheduleAction: string;
  closingSoonBanner: string;
  closingSoonCheckoutNote: string;
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
  orderPayCashUnifiedTakeaway: string;
  orderPayCashUnifiedDelivery: string;
  orderPayEpoint: string;
  orderPayCardWithWallet: string;
  orderSaveCardForFuture: string;
  orderSavedCardsAvailable: string;
  orderPlacedTitle: string;
  orderPlacedSubtitle: string;
  orderTrackHint: string;
  orderOpenTracking: string;
  orderCopyTrackingLink: string;
  orderCopyTrackingDone: string;
  orderConfirmationOrderNumber: string;
  orderConfirmationSummaryTitle: string;
  orderConfirmationEtaLabel: string;
  orderConfirmationEtaFallback: string;
  orderCheckout: string;
  orderStepFulfillment: string;
  orderStepAddress: string;
  orderStepTiming: string;
  orderStepContact: string;
  orderStepPayment: string;
  orderStepReview: string;
  orderFulfillmentTakeawayDisabled: string;
  orderFulfillmentTakeawayHint: string;
  orderFulfillmentDeliveryHint: string;
  orderOnlineDisabled: string;
  /** Shown under the top bar when only pickup is offered (delivery UI hidden). */
  orderTakeawayOnlyNotice: string;
  orderViewCart: string;
  orderSummaryTitle: string;
  orderAddressLabel: string;
  orderAddressStreet: string;
  orderLanguage: string;
  orderSelectSavedAddress: string;
  orderAddressClearSelection: string;
  orderSaveAddressForNext: string;
  orderLoadingMenu: string;
  orderYourCart: string;
  /** Shown in cart/checkout when sign-in is required before order placement. */
  orderAuthRequired: string;
  /** Shown in cart before checkout to indicate auth happens in checkout. */
  orderAuthInlineHint: string;
  orderAuthEmail: string;
  orderAuthSms: string;
  orderAuthGoogle: string;
  /** Staff cockpit login — Google OAuth button. */
  orderSignInGoogle: string;
  orderSignInGoogleRedirecting: string;
  orderForgotPassword: string;
  orderForgotPasswordSent: string;
  orderSignUpInlinePrompt: string;
  orderSignUpInlineAction: string;
  orderEmailConfirmAfterSignup: string;
  orderResetPasswordTitle: string;
  orderResetPasswordHint: string;
  orderResetPasswordNew: string;
  orderResetPasswordConfirm: string;
  orderResetPasswordSubmit: string;
  orderResetPasswordSuccess: string;
  orderResetPasswordMismatch: string;
  orderSendSmsCode: string;
  orderSmsCode: string;
  orderVerifySms: string;
  orderSmsSentHint: string;
  orderSmsResend: string;
  orderSmsResendWait: string;
  orderSmsCodeExpiredHint: string;
  orderSmsEnterCodeHint: string;
  orderSmsSendFailedHint: string;
  orderSmsCodeSentConfirmation: string;
  orderChangePhone: string;
  orderInvalidPhone: string;
  orderAccountPhone: string;
  orderMapSearchPlaceholder: string;
  orderMapNoResults: string;
  orderMapSearchFailed: string;
  orderMapSelectFailed: string;
  orderMapLoadFailed: string;
  orderZonePillIn: string;
  orderMapPinHint: string;
  orderMapLoading: string;
  orderMapUnavailable: string;
  orderItemNotes: string;
  orderItemNotesPlaceholder: string;
  orderReorder: string;
  orderAddressesSection: string;
  orderOrdersSection: string;
  orderAddressApartment: string;
  orderAddressFloor: string;
  orderAddressEdit: string;
  orderAddressDelete: string;
  orderAddressSetDefault: string;
  orderAddressCancelEdit: string;
  orderAddressSaveChanges: string;
  orderAddressDeleteConfirm: string;
  orderOrderDate: string;
  orderFulfillmentLabel: string;
  orderTrackOrder: string;
  orderViewDetails: string;
  orderHideDetails: string;
  orderRemoveLine: string;
  orderDecreaseQty: string;
  orderIncreaseQty: string;
  orderChooseFulfillmentTitle: string;
  orderScheduleNow: string;
  orderScheduleLater: string;
  orderScheduleFor: string;
  orderScheduleDay: string;
  orderScheduleTime: string;
  orderScheduleNoSlots: string;
  orderPromoCode: string;
  orderPromoPlaceholder: string;
  orderTip: string;
  orderOrderNotes: string;
  orderPaymentCodHint: string;
  orderPaymentCashHint: string;
  orderPaymentCashUnifiedHintTakeaway: string;
  orderPaymentCashUnifiedHintDelivery: string;
  orderPaymentEpointHint: string;
  orderPaymentExtras: string;
  orderPaymentExtrasShow: string;
  orderPaymentExtrasHide: string;
  orderReviewHint: string;
  orderReviewFulfillment: string;
  orderReviewTiming: string;
  orderReviewContact: string;
  orderReviewPayment: string;
  orderReviewAddress: string;
  orderReviewAsap: string;
  orderReviewMissing: string;
  orderContactSignedIn: string;
  orderContactGuestHint: string;
  orderContactVerifyHint: string;
  orderAuthErrorFallback: string;
  orderConsentLabel: string;
  orderTerms: string;
  orderPrivacy: string;
  orderRefundPolicy: string;
  orderConsentRequired: string;
  orderErrInvalidEmail: string;
  retry: string;
  cookieConsentCopy: string;
  cookieConsentAccept: string;
  orderSearchMenu: string;
  orderVenueInfoTitle: string;
  orderVenueHours: string;
  orderVenueAddress: string;
  orderVenuePhone: string;
  orderAddToCart: string;
  /** Shown on menu cards and order modal when a product has no photo (trust / freshness). */
  orderProductNoPhotoCaption: string;
  orderFavoriteAdd: string;
  orderFavoriteRemove: string;
  orderSearchNoResults: string;
  orderCategoryEmpty: string;
  orderChooseOptions: string;
  orderDishSingle: string;
  orderDishPlural: string;
  orderDeliveryDisabledInSettings: string;
  orderCombosSection: string;
  orderComboCustomize: string;
  orderComboBadge: string;
  orderPhoneFormatHint: string;
  orderDeliveryNotesLabel: string;
  orderDeliveryNotesPlaceholder: string;
  orderAddressTypeTitle: string;
  orderAddressTypeApartment: string;
  orderAddressTypeHouse: string;
  orderAddressTypeOffice: string;
  orderAddressTypeHotel: string;
  orderAddressTypeOther: string;
  orderAddressBuildingName: string;
  orderAddressEntrance: string;
  orderAddressDoorNameOrNumber: string;
  orderAddressCompanyName: string;
  orderAddressLeaveAt: string;
  orderAddressLeaveAtOffice: string;
  orderAddressLeaveAtReception: string;
  orderAddressAccessMethod: string;
  orderAccessIntercom: string;
  orderAccessDoorCode: string;
  orderAccessDoorOpen: string;
  orderAddressIntercomNameOrNumber: string;
  orderAddressDoorCode: string;
  orderAddressAccessOtherInstructions: string;
  orderSignInPromptTitle: string;
  orderSignInPromptSubtitle: string;
  orderOr: string;
  orderLegalPassivePrefix: string;
  orderProfileCompletionTitle: string;
  orderProfileCompletionSubtitle: string;
  orderProfileFirstName: string;
  orderProfileLastName: string;
  orderProfilePhoneOptional: string;
  orderProfilePhoneOptionalHint: string;
  orderProfileCompletionSave: string;
  orderProfileCompletionNameRequired: string;
  orderProfileCompletionConsentRequired: string;
  orderProfileCompletionPending: string;
  orderPhoneVerificationRequired: string;
  orderCheckoutAuthTitle: string;
  orderCheckoutAuthHelper: string;
  orderCheckoutAuthGooglePhoneNext: string;
  orderCheckoutAuthSmsCta: string;
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
  comboBuilderEmptyGroup: string;
  comboBuilderEmptyCombo: string;
  orderErrKitchenClosed: string;
  orderErrKitchenPaused: string;
  orderErrScheduleWhilePaused: string;
  orderErrScheduleOutsideHours: string;
  orderPayCodDescription: string;
  orderPayCashDescription: string;
  orderPayEpointDescription: string;
  orderCheckoutSummary: string;
  orderCheckoutBrand: string;
  orderProfileSection: string;
  orderAddressDefaultBadge: string;
  orderAddressHomeLabel: string;
  orderPromoCodePlaceholder: string;
  orderZonePillChecking: string;
  orderErrGeneric: string;
  orderErrAuthRequired: string;
  orderErrCartEmpty: string;
  orderErrPhoneRequired: string;
  orderErrPhoneInvalid: string;
  orderErrOnlineUnavailable: string;
  orderErrTakeawayDisabled: string;
  orderErrDeliveryDisabled: string;
  orderErrLocationRequired: string;
  orderErrAddressRequired: string;
  orderErrOutsideZone: string;
  orderErrMinimumOrder: string;
  orderErrZoneMinimumOrder: string;
  orderErrPaymentInitFailed: string;
  orderErrScheduleRequired: string;
  orderErrScheduleInvalid: string;
  orderErrScheduleTooSoon: string;
  orderErrInvalidQuantity: string;

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
  trackScheduledForLabel: string;
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
  omMenuEditorUpdateFailed: string;
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
  omAll: string;
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
  omSourcePos: string;
  omTitle: string;
  posTitle: string;
  posTabActive: string;
  posTabHistory: string;
  posTabNewOrder: string;
  posTabSettings: string;
  posSettingsTitle: string;
  posPrintAgentUrl: string;
  posPrinterProfile: string;
  posProfileEscpos80: string;
  posProfileZpl58: string;
  posProfileZpl40x30: string;
  posTestConnection: string;
  posTestPrint: string;
  posAgentConnected: string;
  posAgentUnreachable: string;
  posTestPrintSent: string;
  posTestPrintFailed: string;
  posFulfillmentEatIn: string;
  posFulfillmentTakeaway: string;
  posFulfillmentDelivery: string;
  posSourceEatIn: string;
  posSourceTakeaway: string;
  posSourceDelivery: string;
  posCustomerPanelTitle: string;
  posCustomerName: string;
  posCustomerPhone: string;
  posOrderNotes: string;
  posDeliveryPanelTitle: string;
  posCartTitle: string;
  posCartEmpty: string;
  posSubmitOrder: string;
  posSubmitFailed: string;
  posOrderCreated: string;
  posViewActiveOrders: string;
  posNewOrderTitle: string;
  posOutsideZone: string;
  posDeliveryRequired: string;
  posReprintLabels: string;
  posPrintSent: string;
  posPrintPending: string;
  posPrintFailed: string;
  posPrintPendingCount: string;
  posMapSearch: string;
  posMapPinHint: string;
  posMapsUnavailable: string;
  omKitchenStatusTitle: string;
  omKitchenStatusOnline: string;
  omKitchenStatusPausedUntil: string;
  omKitchenStatusOffline: string;
  omKitchenStatusClosed: string;
  omKitchenPause30: string;
  omKitchenPause60: string;
  omKitchenPauseUntilNextOpen: string;
  omKitchenPauseIndefinite: string;
  omKitchenResume: string;
  omKitchenStatusHint: string;
  omKitchenNoNextOpen: string;
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
  orderSupport: string;
  orderSupportDescription: string;
  orderSupportOpenOrderPage: string;
  orderSupportFilter_all: string;
  orderSupportFilter_active: string;
  orderSupportFilter_dispatched: string;
  orderSupportFilter_completed: string;
  orderSupportFilter_cancelled: string;
  orderSupportOrdersFound: string;
  orderSupportSourceAll: string;
  orderSupportSearch: string;
  orderSupportNoOrders: string;
  orderSupportColTime: string;
  orderSupportColCustomer: string;
  orderSupportColItems: string;
  orderSupportColTotal: string;
  orderSupportColStatus: string;
  orderSupportOrderActions: string;
  orderSupportPrepareQuick: string;
  orderSupportScheduledHint: string;
  payments: string;
  paymentsScreenTitle: string;
  paymentsScreenDescription: string;
  paymentsFilterAll: string;
  paymentsFilterPending: string;
  paymentsFilterSuccess: string;
  paymentsFilterFailed: string;
  paymentsProviderAll: string;
  paymentsSearch: string;
  paymentsFound: string;
  paymentsNoRows: string;
  paymentsColTime: string;
  paymentsColOrder: string;
  paymentsColCustomer: string;
  paymentsColAmount: string;
  paymentsColProvider: string;
  paymentsColPaymentStatus: string;
  paymentsColSaleStatus: string;
  paymentsColMismatch: string;
  paymentsMismatchYes: string;
  paymentsDetailProvider: string;
  paymentsDetailClientOrderId: string;
  paymentsDetailTransactionId: string;
  paymentsDetailProviderStatus: string;
  paymentsDetailPaidAt: string;
  paymentsDetailError: string;
  paymentsDetailRawPayload: string;
  paymentsRecheckButton: string;
  paymentsRechecking: string;
  paymentsRecheckSuccess: string;
  paymentsRecheckFailed: string;
  paymentsRecheckForbidden: string;
  paymentsStatusPending: string;
  paymentsStatusSuccess: string;
  paymentsStatusFailed: string;
  paymentsProviderEpoint: string;
  paymentsProviderUnited: string;
  paymentsProviderOther: string;
  cashDebt: string;
  cashDebtScreenTitle: string;
  cashDebtScreenDescription: string;
  cashDebtTabLoans: string;
  cashDebtTabWithdrawals: string;
  outstandingDebtLabel: string;
  outstandingDebtHint: string;
  supplierOutstanding: string;
  supplierPayButton: string;
  supplierOpeningBalance: string;
  supplierOpeningBalanceDate: string;
  supplierAddDebt: string;
  supplierDebtHistory: string;
  supplierDebtCleared: string;
  supplierCreditBalance: string;
  supplierDebtFromPurchase: string;
  supplierManualDebt: string;
  supplierClearDebt: string;
  supplierAccountView: string;
  supplierRecentPayments: string;
  supplierAccountExplainer: string;
  supplierYouOwe: string;
  supplierPrepaid: string;
  supplierSettled: string;
  supplierStatement: string;
  supplierBalanceColumn: string;
  supplierPaymentLabel: string;
  supplierAddDebtHint: string;
  supplierNoActivity: string;
  supplierSearchPlaceholder: string;
  supplierNoMatches: string;
  supplierTotalSpend: string;
  purchaseOnAccountHint: string;
  purchasePaidNowHint: string;
  purchaseOnAccount: string;
  purchasePaidNow: string;
  purchasePaymentMode: string;
  purchaseDiscountPercent: string;
  purchaseDiscountCustom: string;
  purchaseListTotal: string;
  purchaseDiscountAmount: string;
  purchaseNetTotal: string;
  purchaseSetDefaultDiscount: string;
  liabilityAdd: string;
  liabilityEdit: string;
  liabilityRecordPayment: string;
  liabilityEditPayment: string;
  liabilityDeleteConfirm: string;
  liabilityDeletePaymentConfirm: string;
  liabilityPaymentHistory: string;
  liabilityDueDate: string;
  liabilityTypeLoan: string;
  liabilityTypeOther: string;
  liabilityCounterparty: string;
  liabilityLenderOwedTo: string;
  liabilityLenderHelp: string;
  cashDebtLoansHelp: string;
  liabilityEmpty: string;
  liabilityStatusOpen: string;
  liabilityStatusPartial: string;
  liabilityStatusSettled: string;
  withdrawalLog: string;
  withdrawalMethodCashier: string;
  withdrawalMethodAbbAtm: string;
  withdrawalFeePreview: string;
  withdrawalFeesPeriodTotal: string;
  withdrawalEmpty: string;
  withdrawalAvailableInAccount: string;
  withdrawalInsufficientFunds: string;
  withdrawalMethod: string;
  withdrawalFee: string;
  posPaymentMethod: string;
  posPayCash: string;
  posPayCard: string;
  cashDrawerTab: string;
  cashOnHand: string;
  cashOnHandHint: string;
  accountCash: string;
  accountBank: string;
  accountCard: string;
  accountBalancesTitle: string;
  accountBankHint: string;
  accountCardHint: string;
  accountManage: string;
  accountSetupTitle: string;
  accountCurrentBalance: string;
  accountTransferAction: string;
  accountActivityTitle: string;
  accountActivityEmpty: string;
  accountActivityFilterAll: string;
  accountLedgerOpening: string;
  accountLedgerTransferIn: string;
  accountLedgerTransferOut: string;
  accountLedgerWithdrawal: string;
  accountLedgerExpense: string;
  accountLedgerPurchase: string;
  accountLedgerPayout: string;
  accountLedgerManagedElsewhere: string;
  accountLedgerManagedPayouts: string;
  accountTransferDeleted: string;
  accountOpeningBalance: string;
  accountOpeningDate: string;
  accountOpeningBalanceSaved: string;
  accountTransferBankToCard: string;
  accountTransferSaved: string;
  paymentCash: string;
  paymentCard: string;
  paymentBankTransfer: string;
  selectPaymentMethod: string;
  withdrawalMethodCardAccount: string;
  cashDrawerTitle: string;
  cashDrawerSubtitle: string;
  cashOpeningBalance: string;
  cashClosingBalance: string;
  cashInTotal: string;
  cashOutTotal: string;
  cashFromOrders: string;
  cashFromWithdrawals: string;
  cashFromPayouts: string;
  cashAdjustmentsIn: string;
  cashToExpenses: string;
  cashToPurchases: string;
  cashToSuppliers: string;
  cashToLiabilities: string;
  cashBankDeposits: string;
  cashMovementLog: string;
  cashMovementEmpty: string;
  cashAddMovement: string;
  cashMovementCategory: string;
  cashCategoryOpeningFloat: string;
  cashCategoryBankDeposit: string;
  cashCategoryAdjustment: string;
  cashCategoryOther: string;
  cashMovementDirection: string;
  cashDirectionIn: string;
  cashDirectionOut: string;
  cashMovementAdded: string;
  cashMovementDeleted: string;
  deliveryScreenTitle: string;
  orderLocations: string;
  orderLocationsTitle: string;
  orderLocationsSubtitle: string;
  orderLocationsEmpty: string;
  orderLocationsLoading: string;
  orderLocationsUnavailable: string;
  orderLocationsMapHint: string;
  orderLocationsTotalOrders: string;
  orderLocationsSourceAll: string;
  orderLocationsSourceOnline: string;
  orderLocationsSourcePos: string;
  orderLocationsOrderLabel: string;
  deliveryScreenDescription: string;
  deliveryRefresh: string;
  deliveryTabZones: string;
  deliveryTabSettings: string;
  deliveryTabDispatch: string;
  deliveryZonesTitle: string;
  deliveryZonesDescription: string;
  deliveryZonesNew: string;
  deliveryZonesEmptyTitle: string;
  deliveryZonesEmptyHint: string;
  deliveryZonesColName: string;
  deliveryZonesColVertices: string;
  deliveryZonesColFee: string;
  deliveryZonesColMinOrder: string;
  deliveryZonesColActive: string;
  deliveryZonesColActions: string;
  deliveryZoneNewTitle: string;
  deliveryZoneEditTitle: string;
  deliveryZoneFieldName: string;
  deliveryZoneFieldFee: string;
  deliveryZoneFieldMinOrder: string;
  deliveryZoneFieldFreeThreshold: string;
  deliveryZoneFieldSortOrder: string;
  deliveryZoneFieldActive: string;
  deliveryZoneFieldPolygon: string;
  deliveryZonePolygonHint: string;
  deliveryZoneClearShape: string;
  deliveryZonePolygonRequired: string;
  deliveryZonePreview: string;
  deliveryZonePreviewLoading: string;
  deliveryZonePreviewUnavailable: string;
  deliveryZonePreviewEmpty: string;
  deliveryZoneVertices: string;
  deliveryZoneSave: string;
  deliveryZoneSaving: string;
  deliveryZoneSaveError: string;
  deliveryZoneDeleteConfirm: string;
  deliveryZoneDeleteError: string;
  deliveryZoneToggleError: string;
  deliverySettingsTitle: string;
  deliverySettingsDescription: string;
  deliverySettingsKitchenOpen: string;
  deliverySettingsKitchenOpenHint: string;
  deliverySettingsDeliveryEnabled: string;
  deliverySettingsTakeawayEnabled: string;
  deliverySettingsGlobalMinOrder: string;
  deliverySettingsDefaultPrep: string;
  deliverySettingsDefaultPrepHint: string;
  deliverySettingsGlobalFreeThreshold: string;
  deliverySettingsDispatchMode: string;
  deliverySettingsDispatchAuto: string;
  deliverySettingsDispatchManual: string;
  deliverySettingsHours: string;
  deliverySettingsHoursHint: string;
  deliverySettingsClosed: string;
  deliverySettingsOpenAt: string;
  deliverySettingsCloseAt: string;
  deliverySettingsSave: string;
  deliverySettingsSaving: string;
  deliverySettingsSaved: string;
  deliverySettingsSaveError: string;
  deliverySettingsClosingSoonLabel: string;
  deliverySettingsClosingSoonHint: string;
  deliverySettingsPauseActive: string;
  deliverySettingsCancelPause: string;
  deliverySettingsHoursInvalid: string;
  deliverySettingsDayMon: string;
  deliverySettingsDayTue: string;
  deliverySettingsDayWed: string;
  deliverySettingsDayThu: string;
  deliverySettingsDayFri: string;
  deliverySettingsDaySat: string;
  deliverySettingsDaySun: string;
  deliverySettingsStatusOpenNow: string;
  deliverySettingsStatusClosedNow: string;
  deliverySettingsStatusPaused: string;
  deliverySettingsTodayHours: string;
  deliverySettingsTodayClosed: string;
  deliverySettingsSpecialDayBadge: string;
  deliverySettingsAcceptingOrders: string;
  deliverySettingsStoppedOrders: string;
  deliverySettingsAcceptingOrdersHint: string;
  deliverySettingsStoppedOrdersHint: string;
  deliverySettingsDayOpen: string;
  deliverySettingsWeeklyHours: string;
  deliverySettingsSpecialDaysTitle: string;
  deliverySettingsSpecialDaysHint: string;
  deliverySettingsSpecialDayAdd: string;
  deliverySettingsSpecialDayRemove: string;
  deliverySettingsSpecialDayDate: string;
  deliverySettingsSpecialDayClosedAllDay: string;
  deliverySettingsSpecialDayCustomHours: string;
  deliverySettingsSpecialDayNote: string;
  deliverySettingsSpecialDayNoteHint: string;
  deliverySettingsSpecialDayNoteEn: string;
  deliverySettingsSpecialDayNoteAz: string;
  deliverySettingsSpecialDayNoteRu: string;
  deliverySettingsSpecialDayDuplicateDate: string;
  deliverySettingsSpecialDaysInvalid: string;
  orderSpecialDayNoticeTitle: string;
  orderSpecialDayNoticeDismiss: string;
  deliveryDispatchTitle: string;
  deliveryDispatchDescription: string;
  deliveryDispatchEmpty: string;
  deliveryDispatchColOrder: string;
  deliveryDispatchColCustomer: string;
  deliveryDispatchColAddress: string;
  deliveryDispatchColStatus: string;
  deliveryDispatchColActions: string;
  deliveryDispatchNoWolt: string;
  deliveryDispatchManuallyDispatched: string;
  deliveryDispatchTrackOpen: string;
  deliveryDispatchTrackCopy: string;
  deliveryDispatchTrackCopied: string;
  deliveryDispatchActionDispatch: string;
  deliveryDispatchActionMarkManual: string;
  deliveryDispatchActionCancel: string;
  deliveryDispatchInvokeError: string;
  deliveryDispatchInvokeOk: string;
  deliveryDispatchTrackingUrlPrompt: string;
  deliveryDispatchTrackingUrlInvalid: string;
  deliverySettingsKitchenLocationTitle: string;
  deliverySettingsKitchenLocationHint: string;
  deliverySettingsKitchenLatitude: string;
  deliverySettingsKitchenLongitude: string;
  deliverySettingsKitchenLocationInvalid: string;
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
    navOverview: 'Overview',
    navOrders: 'Orders',
    navCatalog: 'Catalog',
    navFinance: 'Finance',
    navHubIncome: 'Income',
    navHubSpending: 'Spending',
    navHubCashAccounts: 'Cash & Accounts',
    navHubPayroll: 'Payroll',
    navHubInsights: 'Insights',
    navSystem: 'System',
    cockpitLoadingContent: 'Loading…',
    cockpitResetFilters: 'Reset filters',
    cockpitEmptyFilteredHint: 'Try widening the date range or clearing filters.',
    cockpitTestRecordLabel: 'Test record',
    cockpitNeedsReview: 'Needs review',
    cockpitReviewHighCommission: 'Commission rate looks unusually high — verify channel settings.',
    cockpitReviewUnusualAmount: 'This amount is unusually large — confirm before trusting totals.',
    settingsAppearance: 'Appearance',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
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
    halal: 'Halal',
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
    kpiNetProfitHint: 'After bank fees (₼{fees})',
    comparePreviousPeriod: 'Compare vs prior period',
    netProfitLabel: 'Net profit',
    sourceFilter: 'Source',
    orderSourceMix: 'Order source mix',
    avgPrepTime: 'Avg prep time',
    kitchenSla: 'Kitchen SLA met',
    paymentHealth: 'Payment health',
    payoutCommission: 'Payout commission',
    topProducts: 'Top products',
    peakHours: 'Peak hours',
    operationalInsights: 'Operational insights',
    paidOrders: 'paid',
    unpaidOrders: 'unpaid',
    cardPayments: 'card',
    codPayments: 'COD',
    matchedPayouts: 'Matched',
    mismatchedPayouts: 'Mismatch',
    pendingPayouts: 'Pending',
    expandDetails: 'Show expense & payout details',
    collapseDetails: 'Hide expense & payout details',
    viewFullReport: 'View full report',
    viewPayouts: 'View payouts',
    revenueShare: 'share',
    dashboardOrdersHint: 'Distinct orders in period',
    dashboardAovHint: 'Net revenue per order',
    dataConsistencyWarning: 'Detected {count} consistency issue(s) in aggregated KPI data.',
    pos: 'POS',

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
    deleteChannelConfirmTitle: 'Remove sales channel?',
    deleteChannelConfirmMessage: 'Remove "{name}" from active channels? Past sales and payouts stay linked in reports.',
    deleteChannelError: 'Could not remove this channel. Try again or contact an admin.',
    channelRemovedSuccess: 'Channel removed.',
    systemSalesChannel: 'System',
    salesChannelProtectedError: 'This channel is required by the app and cannot be removed or deactivated.',
    dismiss: 'Dismiss',
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
    changeRole: 'Change Role',
    resetPassword: 'Reset Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordResetSuccess: 'Password updated successfully',
    roleUpdated: 'Role updated',
    cannotChangeOwnRole: 'You cannot change your own role',
    passwordMinLength: 'Password must be at least 8 characters',

    auditLog: 'Audit log',
    auditLogTitle: 'Audit log',
    auditLogSubtitle: 'Admin actions, database changes, and staff sign-ins',
    auditLogTabActions: 'Admin actions',
    auditLogTabChanges: 'Row changes',
    auditLogTabSignIns: 'Sign-ins',
    auditLogEmpty: 'No entries yet',
    auditLogColWhen: 'When',
    auditLogColWho: 'Who',
    auditLogColAction: 'Action',
    auditLogColResource: 'Resource',
    auditLogColDetails: 'Details',
    auditLogColSurface: 'Surface',
    auditLogColDevice: 'Device',
    auditLogSurfaceCockpit: 'Command center',
    auditLogSurfacePos: 'Point of Sale',
    auditLogSurfaceKds: 'Kitchen Display',
    auditLogSurfaceKiosk: 'Kiosk',
    auditLogSurfaceOrderManager: 'Order Manager',

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
      'The command center is for administrators. Your account works on the floor apps — open Point of Sale, the Kitchen Display, or the Kiosk below.',
    adminAccessGoToOrderManager: 'Go to Order Manager',
    adminAccessGoToPos: 'Open Point of Sale',
    adminAccessGoToKds: 'Open Kitchen Display',
    adminAccessGoToKiosk: 'Open Kiosk',
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
    updatedSuccessfully: 'Updated successfully!',
    deletedSuccessfully: 'Deleted successfully!',
    errorOccurred: 'An error occurred',
    amountMustBePositive: 'Amount must be greater than zero',
    expenseItemRequired: 'Please select an expense item',
    paymentMethodRequired: 'Please select a payment method',
    descriptionRequired: 'Please enter a description',
    expenseDateRequired: 'Please select a date',
    quantityMustBePositive: 'Quantity must be greater than zero',
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
    createNamed: 'Create "{name}"',
    newItem: 'New item',
    assignToCategory: 'Assign to category',
    newCategory: 'New category',
    newSupplierName: 'Supplier name',
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
    kioskWelcomeTitle: 'Where will you be eating today?',
    kioskEatIn: 'Eat In',
    kioskTakeOut: 'Take Out',
    kioskExploreMenu: 'Explore our Menu',
    kioskRestartMenu: 'Restart Menu',
    kioskOrderNow: 'Order Now',
    kioskOrderMore: 'Order More',
    kioskDoneCountdown: 'Done ({seconds}s)',
    kioskNoCategories: 'No menu categories available',
    kioskNoProducts: 'No products available',
    addToCart: 'Add to Cart',
    viewCart: 'View Cart',
    placeOrder: 'Place Order',
    confirmOrder: 'Confirm Order',
    kioskOrderCreateFailed: 'Could not place your order. Please try again.',
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
    payMethodBadgeCashPickup: 'CASH — pay at pickup',
    payMethodBadgeCashDelivery: 'CASH — pay on delivery',
    payMethodBadgeCardAuthorizing: 'CARD — bank confirming (do not prep yet)',
    kdsPrepTimeLabel: 'Prep time (minutes)',
    kdsBusyKitchenHint: 'Busy kitchen? 20 min is suggested.',
    kdsCourierNoteLabel: 'Courier',
    kdsStatusUpdating: 'Updating…',
    kdsChannelDelivery: 'Delivery',
    kdsChannelTakeaway: 'Takeaway',
    kdsChannelKiosk: 'Kiosk',
    kdsChannelPosEatIn: 'POS · Eat In',
    kdsChannelPosTakeaway: 'POS · Takeaway',
    kdsChannelPosDelivery: 'POS · Delivery',
    kdsFilterAll: 'All',
    kdsSearchPlaceholder: 'Search #…',
    kdsHistoryTitle: 'History',
    kdsHistoryEmpty: 'No completed orders today',
    kdsUndoComplete: 'Order {number} complete',
    kdsUndoSeconds: 'Undo',
    kdsUndoButton: 'Undo',
    kdsAllItemsPrepared: 'All items prepared',
    kdsMarkItemPrepared: 'Mark item prepared',
    kdsMarkItemUnprepared: 'Mark item not prepared',
    kdsEmptyQueueTitle: 'No active orders',
    kdsEmptyQueueHint: 'New tickets from kiosk and online ordering appear here automatically.',
    kdsEmptyColumn: 'Nothing here yet',
    kdsEmptyFiltered: 'No orders match your filters',
    kdsEmptyFilteredHint: 'Try a different channel or clear the search.',
    kdsHistorySubtitle: 'Completed today',

    orderManagerTitle: 'Order Manager',
    orderManagerDescription: 'Monitor and act on kiosk and online orders in one queue',
    openOnlineOrder: 'Open Online Order',
    refreshOrders: 'Refresh orders',
    totalOrders: 'Total orders',
    ordersInQueue: 'Orders in queue',
    todayRevenue: 'Today revenue',
    searchOrderManagerPlaceholder: 'Search order #, phone, or ID',
    allSources: 'All sources',
    allPayments: 'All payments',
    unpaidOnly: 'Unpaid only',
    paidOnly: 'Paid only',
    kioskOrders: 'Kiosk Orders',
    cockpitQuickLinks: 'Quick links',
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

    staff: 'Staff & Salaries',
    staffScreenTitle: 'Staff & Salaries',
    staffScreenDescription: 'Employee roster and dated salary payment ledger.',
    staffAddEmployee: 'Add employee',
    staffEditEmployee: 'Edit employee',
    staffRecordPayment: 'Record payment',
    staffEditPayment: 'Edit payment',
    staffFullName: 'Full name',
    staffDesignation: 'Designation',
    staffTotalSalary: 'Monthly salary',
    staffActiveLabel: 'Active employee',
    staffActiveEmployees: 'Active employees',
    staffMonthlyPayrollTarget: 'Monthly payroll target',
    staffPaidInPeriod: 'Paid in period',
    staffEmployee: 'Employee',
    staffSelectEmployee: 'Select employee',
    staffPaymentType: 'Payment type',
    staffPaymentTypeSalary: 'Salary',
    staffPaymentTypeAdvance: 'Advance',
    staffPaymentTypeBonus: 'Bonus',
    staffPaymentTypePartial: 'Partial',
    staffNameRequired: 'Employee name is required',
    staffInvalidSalary: 'Enter valid salary amounts',
    staffInvalidPaymentAmount: 'Enter a valid payment amount',
    staffEmployeeAdded: 'Employee added',
    staffEmployeeUpdated: 'Employee updated',
    staffEmployeeDeleted: 'Employee deleted',
    staffPaymentAdded: 'Payment recorded',
    staffPaymentUpdated: 'Payment updated',
    staffPaymentDeleted: 'Payment deleted',
    staffDeleteEmployeeConfirm: 'Delete this employee and all payment history?',
    staffDeletePaymentConfirm: 'Delete this payment?',
    staffNoEmployees: 'No employees yet. Add your first team member.',
    staffNoPaymentsInPeriod: 'No payments in this period.',
    staffInactive: 'Inactive',
    staffNoDesignation: 'No designation',
    staffDoubleEntryWarning: 'Record salaries here instead of the Expenses “Salaries” category to avoid double-counting in reports.',
    staffSalariesLabel: 'Salaries paid',
    staffSalariesHint: 'Salary payments recorded in the Staff module',
    kpiNetProfitHintExtended: 'After bank fees ₼{fees}, platform commissions ₼{commissions}, and salaries ₼{payroll}',

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
    payoutReceivedInto: 'Received into',
    payoutReceivedIntoHint: 'Which account did this payout land in? The balance updates automatically.',
    payoutNoAccountWarning: 'No account selected — this payout will not update any balance.',
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
    kitchenPausedTitle: 'Kitchen paused',
    kitchenPausedMessage:
      'We are not taking immediate orders right now. You can still schedule for a later time when we are open.',
    orderClosedPausedUntil: 'Back online around {time} (Baku time).',
    orderClosedUntilNextOpen: 'Next opening: {when}',
    orderClosedSchedulePromptTitle: 'Schedule your order',
    orderClosedSchedulePromptHint: 'Pick a slot during our opening hours.',
    orderClosedScheduleAction: 'Schedule for later',
    closingSoonBanner:
      'Our kitchen is wrapping up soon. Orders placed now may be subject to kitchen confirmation.',
    closingSoonCheckoutNote:
      'We are approaching closing time ({time}, Baku). We will do our best to fulfill your order.',
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
    orderPayCashUnifiedTakeaway: 'Pay with cash at pickup',
    orderPayCashUnifiedDelivery: 'Pay with cash on delivery',
    orderPayEpoint: 'Card online',
    orderPayCardWithWallet: 'Use Apple Pay / Google Pay when available',
    orderSaveCardForFuture: 'Save card for future orders',
    orderSavedCardsAvailable: '{count} saved cards available in your account.',
    orderPlacedTitle: 'Order placed',
    orderPlacedSubtitle: "We've received your order and will start preparing it shortly.",
    orderTrackHint: 'Track status',
    orderOpenTracking: 'Open tracking',
    orderCopyTrackingLink: 'Copy tracking link',
    orderCopyTrackingDone: 'Tracking link copied.',
    orderConfirmationOrderNumber: 'Order number',
    orderConfirmationSummaryTitle: 'Order summary',
    orderConfirmationEtaLabel: 'Estimated time',
    orderConfirmationEtaFallback: "We'll start preparing shortly",
    orderCheckout: 'Checkout',
    orderStepFulfillment: 'Fulfillment',
    orderStepAddress: 'Address',
    orderStepTiming: 'Timing',
    orderStepContact: 'Contact',
    orderStepPayment: 'Payment',
    orderStepReview: 'Review',
    orderFulfillmentTakeawayDisabled: 'Takeaway disabled — delivery only.',
    orderFulfillmentTakeawayHint: "Pick up from Ming's kitchen",
    orderFulfillmentDeliveryHint: 'Delivered to your address',
    orderOnlineDisabled: 'Online ordering is turned off.',
    orderTakeawayOnlyNotice: "Order ahead for pickup from Ming's.",
    orderViewCart: 'View cart',
    orderSummaryTitle: 'Summary',
    orderAddressLabel: 'Label',
    orderAddressStreet: 'Street, building, apt',
    orderLanguage: 'Language',
    orderSelectSavedAddress: 'Use saved address',
    orderAddressClearSelection: 'Clear',
    orderSaveAddressForNext: 'Save this address for next time',
    orderLoadingMenu: 'Loading menu…',
    orderYourCart: 'Your cart',
    orderAuthRequired: 'Please sign in to continue to checkout.',
    orderAuthInlineHint: 'Quick SMS verification before we send your order to the kitchen.',
    orderAuthEmail: 'Email',
    orderAuthSms: 'SMS',
    orderAuthGoogle: 'Continue with Google',
    orderSignInGoogle: 'Sign in with Google',
    orderSignInGoogleRedirecting: 'Redirecting to Google…',
    orderForgotPassword: 'Forgot password?',
    orderForgotPasswordSent: 'If this email exists, reset instructions were sent.',
    orderSignUpInlinePrompt: "Don't have an account yet?",
    orderSignUpInlineAction: 'Sign up here',
    orderEmailConfirmAfterSignup: 'Check your email to confirm your account before first login.',
    orderResetPasswordTitle: 'Set a new password',
    orderResetPasswordHint: 'Create a new password to finish account recovery.',
    orderResetPasswordNew: 'New password',
    orderResetPasswordConfirm: 'Confirm new password',
    orderResetPasswordSubmit: 'Update password',
    orderResetPasswordSuccess: 'Password updated. You can continue using your account.',
    orderResetPasswordMismatch: 'Passwords do not match.',
    orderSendSmsCode: 'Send code',
    orderSmsCode: 'SMS code',
    orderVerifySms: 'Verify & sign in',
    orderSmsSentHint: 'Code sent to {phone}. Enter it below.',
    orderSmsResend: 'Resend code',
    orderSmsResendWait: 'Resend in {seconds}s',
    orderSmsCodeExpiredHint: 'Code expired or invalid. Request a new SMS code.',
    orderSmsEnterCodeHint: 'Enter the full code from your SMS (usually 6 digits).',
    orderSmsSendFailedHint:
      'We could not send an SMS. Check your number and try again, or sign in with email or Google.',
    orderSmsCodeSentConfirmation: 'Code sent!',
    orderChangePhone: 'Use a different number',
    orderInvalidPhone: 'Enter a valid number with country code (e.g. +994…).',
    orderAccountPhone: 'Phone',
    orderMapSearchPlaceholder: 'Search for a street or place…',
    orderMapNoResults: 'No matches in Baku.',
    orderMapSearchFailed: 'Could not search addresses. Please try again.',
    orderMapSelectFailed: 'Could not resolve this address. Try another result.',
    orderMapLoadFailed: 'Map search is unavailable right now.',
    orderZonePillIn: 'Delivering to {zone} · ₼{fee}',
    orderMapPinHint: 'Move the map so the pin points to your building entrance.',
    orderMapLoading: 'Loading map…',
    orderMapUnavailable: 'Map preview unavailable. Type your address or use device location.',
    orderItemNotes: 'Item notes',
    orderItemNotesPlaceholder: 'Allergies, no onions, extra spicy…',
    orderReorder: 'Reorder',
    orderAddressesSection: 'Saved addresses',
    orderOrdersSection: 'Orders',
    orderAddressApartment: 'Apartment / unit',
    orderAddressFloor: 'Floor',
    orderAddressEdit: 'Edit',
    orderAddressDelete: 'Delete',
    orderAddressSetDefault: 'Set default',
    orderAddressCancelEdit: 'Cancel',
    orderAddressSaveChanges: 'Save changes',
    orderAddressDeleteConfirm: 'Delete this address?',
    orderOrderDate: 'Date',
    orderFulfillmentLabel: 'Fulfillment',
    orderTrackOrder: 'Track order',
    orderViewDetails: 'View details',
    orderHideDetails: 'Hide details',
    orderRemoveLine: 'Remove item',
    orderDecreaseQty: 'Decrease quantity',
    orderIncreaseQty: 'Increase quantity',
    orderChooseFulfillmentTitle: 'Pickup or delivery?',
    orderScheduleNow: 'ASAP',
    orderScheduleLater: 'Schedule',
    orderScheduleFor: 'Choose a time slot',
    orderScheduleDay: 'Day',
    orderScheduleTime: 'Time',
    orderScheduleNoSlots: 'No schedule slots available right now.',
    orderPromoCode: 'Promo code',
    orderPromoPlaceholder: 'Enter promo code',
    orderTip: 'Tip',
    orderOrderNotes: 'Order notes',
    orderPaymentCodHint: 'Pay with cash on pickup or delivery',
    orderPaymentCashHint: 'Pay cash at the counter',
    orderPaymentCashUnifiedHintTakeaway: "Pay in cash when you collect from Ming's",
    orderPaymentCashUnifiedHintDelivery: 'Pay in cash to the courier on arrival',
    orderPaymentEpointHint: 'Pay securely online with card',
    orderPaymentExtras: 'Promo, tip, and notes',
    orderPaymentExtrasShow: 'Show optional payment details',
    orderPaymentExtrasHide: 'Hide optional payment details',
    orderReviewHint: 'Please review everything before placing your order.',
    orderReviewFulfillment: 'Fulfillment',
    orderReviewTiming: 'Timing',
    orderReviewContact: 'Contact',
    orderReviewPayment: 'Payment',
    orderReviewAddress: 'Address',
    orderReviewAsap: 'ASAP',
    orderReviewMissing: 'Missing',
    orderContactSignedIn: 'Signed in. Your order can be placed now.',
    orderContactGuestHint: 'Please verify your phone to place the order.',
    orderContactVerifyHint: 'Enter the SMS code sent to your phone.',
    orderAuthErrorFallback: 'Could not verify right now. Please try again.',
    orderConsentLabel: 'I agree to the',
    orderTerms: 'Terms',
    orderPrivacy: 'Privacy',
    orderRefundPolicy: 'Refund policy',
    orderConsentRequired: 'Please accept terms before placing order.',
    orderErrInvalidEmail: 'Please enter a valid email address.',
    retry: 'Retry',
    cookieConsentCopy: 'We use cookies to improve ordering and analytics.',
    cookieConsentAccept: 'Accept cookies',
    orderSearchMenu: 'Search menu…',
    orderVenueInfoTitle: 'Restaurant',
    orderVenueHours: 'Hours',
    orderVenueAddress: 'Address',
    orderVenuePhone: 'Phone',
    orderAddToCart: 'Add',
    orderProductNoPhotoCaption: 'Made fresh to order',
    orderFavoriteAdd: 'Add to favorites',
    orderFavoriteRemove: 'Remove from favorites',
    orderSearchNoResults: 'No dishes match your search.',
    orderCategoryEmpty: 'No dishes in this category yet.',
    orderChooseOptions: 'Choose options',
    orderDishSingle: 'dish',
    orderDishPlural: 'dishes',
    orderDeliveryDisabledInSettings:
      'Delivery is turned off in your database. Set online_settings.delivery_enabled = true in Supabase (or run the latest migration), or choose pickup.',
    orderCombosSection: 'Combos',
    orderComboCustomize: 'Customize',
    orderComboBadge: 'Combo',
    orderPhoneFormatHint: 'Use Azerbaijan format: +994 followed by 9 digits.',
    orderDeliveryNotesLabel: 'Notes for courier',
    orderDeliveryNotesPlaceholder: 'Anything that helps us find you faster',
    orderAddressTypeTitle: 'Where are we delivering?',
    orderAddressTypeApartment: 'Apartment',
    orderAddressTypeHouse: 'House',
    orderAddressTypeOffice: 'Office',
    orderAddressTypeHotel: 'Hotel',
    orderAddressTypeOther: 'Other',
    orderAddressBuildingName: 'Building name',
    orderAddressEntrance: 'Entrance / staircase',
    orderAddressDoorNameOrNumber: 'Name/number on door',
    orderAddressCompanyName: 'Company name',
    orderAddressLeaveAt: 'Where should we leave delivery?',
    orderAddressLeaveAtOffice: 'To the office',
    orderAddressLeaveAtReception: 'To reception',
    orderAddressAccessMethod: 'How do we get in?',
    orderAccessIntercom: 'Doorbell / Intercom',
    orderAccessDoorCode: 'Door code',
    orderAccessDoorOpen: 'Door is open',
    orderAddressIntercomNameOrNumber: 'Name/number on intercom',
    orderAddressDoorCode: 'Door code',
    orderAddressAccessOtherInstructions: 'Other instructions for access',
    orderSignInPromptTitle: 'Sign in for faster checkout',
    orderSignInPromptSubtitle: 'Use Google or phone OTP. You can still browse without signing in.',
    orderOr: 'or',
    orderLegalPassivePrefix: 'By placing this order, you agree to our',
    orderProfileCompletionTitle: 'Complete your profile',
    orderProfileCompletionSubtitle: 'Please confirm your name and accept policies to continue.',
    orderProfileFirstName: 'First name',
    orderProfileLastName: 'Last name',
    orderProfilePhoneOptional: 'Phone (optional)',
    orderProfilePhoneOptionalHint: 'If skipped, checkout will ask for phone verification later.',
    orderProfileCompletionSave: 'Save and continue',
    orderProfileCompletionNameRequired: 'First and last name are required.',
    orderProfileCompletionConsentRequired: 'Please accept Terms, Privacy, and Refund Policy.',
    orderProfileCompletionPending: 'Please complete your profile before placing the order.',
    orderPhoneVerificationRequired: 'Please verify your phone before placing the order.',
    orderCheckoutAuthTitle: 'Sign in to place your order',
    orderCheckoutAuthHelper: 'Track your order and receive delivery updates.',
    orderCheckoutAuthGooglePhoneNext: "You'll verify your phone next.",
    orderCheckoutAuthSmsCta: 'Continue with SMS code',
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
    comboBuilderEmptyGroup: 'This combo step is currently unavailable.',
    comboBuilderEmptyCombo: 'This combo has no steps configured.',
    orderErrGeneric: 'Could not place your order. Please try again.',
    orderErrAuthRequired: 'Please sign in to place your order.',
    orderErrCartEmpty: 'Your cart is empty.',
    orderErrPhoneRequired: 'Phone number is required.',
    orderErrPhoneInvalid: 'Enter a valid phone number with country code.',
    orderErrOnlineUnavailable: 'Online ordering is currently unavailable.',
    orderErrTakeawayDisabled: 'Takeaway is currently unavailable.',
    orderErrDeliveryDisabled: 'Delivery is currently unavailable.',
    orderErrLocationRequired: 'Please set your delivery location.',
    orderErrAddressRequired: 'Please enter your delivery address.',
    orderErrOutsideZone: 'Your address is outside our delivery zone.',
    orderErrMinimumOrder: 'Order total is below the minimum amount.',
    orderErrZoneMinimumOrder: 'Order subtotal is below this zone minimum.',
    orderErrPaymentInitFailed: 'Payment could not be initialized. Please try again.',
    orderErrScheduleRequired: 'Please choose a scheduled time.',
    orderErrScheduleInvalid: 'Scheduled time is invalid.',
    orderErrScheduleTooSoon: 'Please choose a later time slot.',
    orderErrInvalidQuantity: 'One or more cart items have invalid quantity.',
    orderErrKitchenClosed: 'The kitchen is closed for online orders right now.',
    orderErrKitchenPaused: 'The kitchen is temporarily paused. Try a scheduled time or check back soon.',
    orderErrScheduleWhilePaused: 'That time is still within a kitchen pause. Pick a later slot.',
    orderErrScheduleOutsideHours: 'That time is outside our opening hours. Pick another slot.',
    orderPayCodDescription: 'Pay on pickup or to the courier.',
    orderPayCashDescription: 'Cash in store.',
    orderPayEpointDescription: 'Secure hosted card payment.',
    orderCheckoutSummary: 'Summary',
    orderCheckoutBrand: "Ming's",
    orderProfileSection: 'Profile',
    orderAddressDefaultBadge: 'Default',
    orderAddressHomeLabel: 'Home',
    orderPromoCodePlaceholder: 'MINGS10',
    orderZonePillChecking: 'Checking delivery zone…',

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
    trackScheduledForLabel: 'Scheduled for:',
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
    omMenuEditorUpdateFailed: 'Could not update menu item. Try signing in again.',
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
    omAll: 'All',
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
    omSourcePos: 'POS',
    omTitle: 'Order Manager',
    posTitle: 'Point of Sale',
    posTabActive: 'Active',
    posTabHistory: 'History',
    posTabNewOrder: 'New Order',
    posTabSettings: 'Settings',
    posSettingsTitle: 'Print settings',
    posPrintAgentUrl: 'Print agent URL',
    posPrinterProfile: 'Printer profile',
    posProfileEscpos80: 'ESC/POS · 80mm thermal',
    posProfileZpl58: 'ZPL · 58mm label',
    posProfileZpl40x30: 'ZPL · 40×30mm label',
    posTestConnection: 'Test connection',
    posTestPrint: 'Test print',
    posAgentConnected: 'Print agent is reachable',
    posAgentUnreachable: 'Cannot reach print agent',
    posTestPrintSent: 'Test label sent to printer',
    posTestPrintFailed: 'Test print failed',
    posFulfillmentEatIn: 'Eat In',
    posFulfillmentTakeaway: 'Takeaway',
    posFulfillmentDelivery: 'Delivery',
    posSourceEatIn: 'POS · Eat In',
    posSourceTakeaway: 'POS · Takeaway',
    posSourceDelivery: 'POS · Delivery',
    posCustomerPanelTitle: 'Customer',
    posCustomerName: 'Name (optional)',
    posCustomerPhone: 'Phone (optional)',
    posOrderNotes: 'Order notes',
    posDeliveryPanelTitle: 'Delivery address',
    posCartTitle: 'Cart',
    posCartEmpty: 'Cart is empty',
    posSubmitOrder: 'Create order',
    posSubmitFailed: 'Could not create order',
    posOrderCreated: 'Order created',
    posViewActiveOrders: 'View active orders',
    posNewOrderTitle: 'New order',
    posOutsideZone: 'Address is outside delivery zones',
    posDeliveryRequired: 'Set delivery pin and address',
    posReprintLabels: 'Reprint labels',
    posPrintSent: 'Labels sent to printer',
    posPrintPending: 'Print queued — agent offline',
    posPrintFailed: 'Print failed',
    posPrintPendingCount: '{count} label job(s) waiting for print agent',
    posMapSearch: 'Search address in Baku',
    posMapPinHint: 'Drag pin or tap map to set location',
    posMapsUnavailable: 'Maps unavailable',
    omKitchenStatusTitle: 'Online kitchen',
    omKitchenStatusOnline: 'Accepting orders',
    omKitchenStatusPausedUntil: 'Paused until {time}',
    omKitchenStatusOffline: 'Offline (no new orders)',
    omKitchenStatusClosed: 'Closed by hours',
    omKitchenPause30: 'Pause 30 min',
    omKitchenPause60: 'Pause 1 hour',
    omKitchenPauseUntilNextOpen: 'Until next opening',
    omKitchenPauseIndefinite: 'Offline until I turn back on',
    omKitchenResume: 'Open now',
    omKitchenStatusHint: 'Customers can still schedule after the pause if slots are available.',
    omKitchenNoNextOpen: 'No next opening found in hours — set hours in Delivery settings.',
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
    orderSupport: 'Order Support',
    orderSupportDescription: 'Monitor and support order operations in real time',
    orderSupportOpenOrderPage: 'Open Order Page',
    orderSupportFilter_all: 'All',
    orderSupportFilter_active: 'Active',
    orderSupportFilter_dispatched: 'Dispatched',
    orderSupportFilter_completed: 'Completed',
    orderSupportFilter_cancelled: 'Cancelled',
    orderSupportOrdersFound: 'orders found',
    orderSupportSourceAll: 'All sources',
    orderSupportSearch: 'Search by order #, customer, phone',
    orderSupportNoOrders: 'No orders found for this filter',
    orderSupportColTime: 'Time',
    orderSupportColCustomer: 'Customer',
    orderSupportColItems: 'Items',
    orderSupportColTotal: 'Total',
    orderSupportColStatus: 'Status',
    orderSupportOrderActions: 'Order actions',
    orderSupportPrepareQuick: 'Prepare (15 min)',
    orderSupportScheduledHint:
      'This order is scheduled. Reminder timing is safest from Order Manager; you can still view details here.',
    payments: 'Payments',
    paymentsScreenTitle: 'Payments',
    paymentsScreenDescription: 'View online payment records, detect mismatches, and re-check status with the provider',
    paymentsFilterAll: 'All',
    paymentsFilterPending: 'Pending',
    paymentsFilterSuccess: 'Paid',
    paymentsFilterFailed: 'Failed',
    paymentsProviderAll: 'All providers',
    paymentsSearch: 'Search by order #, customer, phone, transaction id',
    paymentsFound: 'payments found',
    paymentsNoRows: 'No payments found for this filter',
    paymentsColTime: 'Time',
    paymentsColOrder: 'Order',
    paymentsColCustomer: 'Customer',
    paymentsColAmount: 'Amount',
    paymentsColProvider: 'Provider',
    paymentsColPaymentStatus: 'Payment',
    paymentsColSaleStatus: 'Sale',
    paymentsColMismatch: 'Mismatch',
    paymentsMismatchYes: 'Mismatch',
    paymentsDetailProvider: 'Provider',
    paymentsDetailClientOrderId: 'Client order id',
    paymentsDetailTransactionId: 'Transaction id',
    paymentsDetailProviderStatus: 'Provider status',
    paymentsDetailPaidAt: 'Paid at',
    paymentsDetailError: 'Error',
    paymentsDetailRawPayload: 'Raw payload',
    paymentsRecheckButton: 'Re-check status with provider',
    paymentsRechecking: 'Re-checking…',
    paymentsRecheckSuccess: 'Provider status re-checked. List refreshed.',
    paymentsRecheckFailed: 'Re-check failed',
    paymentsRecheckForbidden: 'Only managers and admins can re-check payment status',
    paymentsStatusPending: 'Pending',
    paymentsStatusSuccess: 'Paid',
    paymentsStatusFailed: 'Failed',
    paymentsProviderEpoint: 'Epoint',
    paymentsProviderUnited: 'United Payment',
    paymentsProviderOther: 'Other',
    cashDebt: 'Cash & Accounts',
    cashDebtScreenTitle: 'Cash & Debt',
    cashDebtScreenDescription: 'Loans, other liabilities, and bank withdrawal fees.',
    cashDebtTabLoans: 'Loans & other',
    cashDebtTabWithdrawals: 'Bank withdrawals',
    outstandingDebtLabel: 'Outstanding debt',
    outstandingDebtHint: 'Supplier accounts + loans (balance sheet)',
    supplierOutstanding: 'Owed',
    supplierPayButton: 'Pay supplier',
    supplierOpeningBalance: 'Opening balance',
    supplierOpeningBalanceDate: 'Balance as of',
    supplierAddDebt: 'Add debt',
    supplierDebtHistory: 'Debt history',
    supplierDebtCleared: 'Cleared',
    supplierCreditBalance: 'Credit balance',
    supplierDebtFromPurchase: 'Purchase (on account)',
    supplierManualDebt: 'Manual debt',
    supplierClearDebt: 'Clear debt',
    supplierAccountView: 'Account',
    supplierRecentPayments: 'Recent payments',
    supplierAccountExplainer:
      "A supplier's balance is a running tab: on-account purchases add to it, payments reduce it. Pay it down with “Clear debt”.",
    supplierYouOwe: 'Debt',
    supplierPrepaid: 'Overpayment',
    supplierSettled: 'Paid',
    supplierStatement: 'Account statement',
    supplierBalanceColumn: 'Balance',
    supplierPaymentLabel: 'Payment',
    supplierAddDebtHint: 'Only for amounts not from a recorded purchase (e.g. an opening balance you already owed).',
    supplierNoActivity: 'No purchases or payments yet.',
    supplierSearchPlaceholder: 'Search suppliers…',
    supplierNoMatches: 'No suppliers match your search.',
    supplierTotalSpend: 'Total spend',
    purchaseOnAccountHint: 'Adds this purchase to the supplier’s balance until you pay it.',
    purchasePaidNowHint: 'Deducts this purchase from the selected account balance now.',
    purchaseOnAccount: 'On account',
    purchasePaidNow: 'Paid now',
    purchasePaymentMode: 'Payment',
    purchaseDiscountPercent: 'Vendor discount %',
    purchaseDiscountCustom: 'Custom',
    purchaseListTotal: 'List total',
    purchaseDiscountAmount: 'Discount',
    purchaseNetTotal: 'Net total',
    purchaseSetDefaultDiscount: 'Save as default discount',
    liabilityAdd: 'Add liability',
    liabilityEdit: 'Edit liability',
    liabilityRecordPayment: 'Record payment',
    liabilityEditPayment: 'Edit payment',
    liabilityDeleteConfirm: 'Delete this liability and all its payments?',
    liabilityDeletePaymentConfirm: 'Delete this payment?',
    liabilityPaymentHistory: 'Payment history',
    liabilityDueDate: 'Due date',
    liabilityTypeLoan: 'Loan',
    liabilityTypeOther: 'Other',
    liabilityCounterparty: 'Counterparty',
    liabilityLenderOwedTo: 'Lender / owed to',
    liabilityLenderHelp: 'Who you owe — bank name, friend, etc. Supplier debt is tracked on the Suppliers screen.',
    cashDebtLoansHelp: 'Use this for bank loans and personal debt. Supplier debt belongs on Suppliers.',
    liabilityEmpty: 'No loans or other liabilities yet.',
    liabilityStatusOpen: 'Open',
    liabilityStatusPartial: 'Partially paid',
    liabilityStatusSettled: 'Settled',
    withdrawalLog: 'Log withdrawal',
    withdrawalMethodCashier: 'Cashier (0.5%)',
    withdrawalMethodAbbAtm: 'ABB ATM (1%, min ₼1)',
    withdrawalFeePreview: 'Bank fee',
    withdrawalFeesPeriodTotal: 'Fees in list',
    withdrawalEmpty: 'No withdrawals logged yet.',
    withdrawalAvailableInAccount: 'Available in {account}: {available}',
    withdrawalInsufficientFunds: 'Not enough in {account}. Available: {available}.',
    withdrawalMethod: 'Method',
    withdrawalFee: 'Fee',
    posPaymentMethod: 'Payment method',
    posPayCash: 'Cash',
    posPayCard: 'Card',
    cashDrawerTab: 'Cash drawer',
    cashOnHand: 'Cash on hand',
    cashOnHandHint: 'Physical cash you should have now',
    accountCash: 'Cash on hand',
    accountBank: 'Main (bank) account',
    accountCard: 'Card account',
    accountBalancesTitle: 'Account balances',
    accountBankHint: 'Payouts land here; cheque withdrawals come from it',
    accountCardHint: 'Funded by transfers; used for ATM withdrawals',
    accountManage: 'Manage accounts',
    accountSetupTitle: 'Account setup',
    accountCurrentBalance: 'Current',
    accountTransferAction: 'Transfer',
    accountActivityTitle: 'Account activity',
    accountActivityEmpty: 'No bank or card activity yet.',
    accountActivityFilterAll: 'All accounts',
    accountLedgerOpening: 'Opening balance',
    accountLedgerTransferIn: 'Transfer in',
    accountLedgerTransferOut: 'Transfer out',
    accountLedgerWithdrawal: 'Withdrawal',
    accountLedgerExpense: 'Expense',
    accountLedgerPurchase: 'Purchase',
    accountLedgerPayout: 'Payout received',
    accountLedgerManagedElsewhere: 'Managed on the Expenses screen',
    accountLedgerManagedPayouts: 'Managed on the Payouts screen',
    accountTransferDeleted: 'Transfer deleted',
    accountOpeningBalance: 'Opening balance',
    accountOpeningDate: 'As of date',
    accountOpeningBalanceSaved: 'Opening balance saved',
    accountTransferBankToCard: 'Transfer main → card',
    accountTransferSaved: 'Transfer recorded',
    paymentCash: 'Cash',
    paymentCard: 'Card',
    paymentBankTransfer: 'Bank transfer',
    selectPaymentMethod: 'Select payment method',
    withdrawalMethodCardAccount: 'Card account (ABB ATM, 1%, min ₼1)',
    cashDrawerTitle: 'Cash drawer',
    cashDrawerSubtitle: 'Track physical cash to reconcile the drawer at month end.',
    cashOpeningBalance: 'Opening balance',
    cashClosingBalance: 'Closing balance',
    cashInTotal: 'Cash in',
    cashOutTotal: 'Cash out',
    cashFromOrders: 'Cash orders collected',
    cashFromWithdrawals: 'Bank withdrawals (net of fees)',
    cashFromPayouts: 'Cash payouts received',
    cashAdjustmentsIn: 'Float & adjustments in',
    cashToExpenses: 'Cash expenses',
    cashToPurchases: 'Cash purchases',
    cashToSuppliers: 'Cash to suppliers',
    cashToLiabilities: 'Cash to loans',
    cashBankDeposits: 'Bank deposits & adjustments out',
    cashMovementLog: 'Cash movements',
    cashMovementEmpty: 'No manual cash movements yet.',
    cashAddMovement: 'Add movement',
    cashMovementCategory: 'Category',
    cashCategoryOpeningFloat: 'Opening float',
    cashCategoryBankDeposit: 'Bank deposit',
    cashCategoryAdjustment: 'Adjustment',
    cashCategoryOther: 'Other',
    cashMovementDirection: 'Direction',
    cashDirectionIn: 'Cash in',
    cashDirectionOut: 'Cash out',
    cashMovementAdded: 'Cash movement added',
    cashMovementDeleted: 'Cash movement deleted',
    deliveryScreenTitle: 'Delivery',
    orderLocations: 'Order map',
    orderLocationsTitle: 'Delivery order map',
    orderLocationsSubtitle: 'See where delivery orders come from in Baku — one dot per order location.',
    orderLocationsEmpty: 'No delivery locations in this period. Try a wider date range or another source filter.',
    orderLocationsLoading: 'Loading map…',
    orderLocationsUnavailable: 'Add VITE_GOOGLE_MAPS_API_KEY to show the order map.',
    orderLocationsMapHint: 'Click a dot for order details. Map is limited to Baku.',
    orderLocationsTotalOrders: 'Orders with location',
    orderLocationsSourceAll: 'All delivery',
    orderLocationsSourceOnline: 'Website delivery',
    orderLocationsSourcePos: 'POS delivery',
    orderLocationsOrderLabel: 'Order',
    deliveryScreenDescription: 'Manage zones, kitchen rules, and manual dispatch',
    deliveryRefresh: 'Refresh delivery data',
    deliveryTabZones: 'Zones',
    deliveryTabSettings: 'Settings',
    deliveryTabDispatch: 'Dispatch',
    deliveryZonesTitle: 'Delivery zones',
    deliveryZonesDescription: 'Configure active coverage polygons and pricing rules.',
    deliveryZonesNew: 'New zone',
    deliveryZonesEmptyTitle: 'No delivery zones yet',
    deliveryZonesEmptyHint: 'Create your first zone to enable address-based delivery pricing.',
    deliveryZonesColName: 'Name',
    deliveryZonesColVertices: 'Vertices',
    deliveryZonesColFee: 'Fee',
    deliveryZonesColMinOrder: 'Min order',
    deliveryZonesColActive: 'Active',
    deliveryZonesColActions: 'Actions',
    deliveryZoneNewTitle: 'Create delivery zone',
    deliveryZoneEditTitle: 'Edit delivery zone',
    deliveryZoneFieldName: 'Zone name',
    deliveryZoneFieldFee: 'Delivery fee',
    deliveryZoneFieldMinOrder: 'Minimum order',
    deliveryZoneFieldFreeThreshold: 'Free delivery threshold',
    deliveryZoneFieldSortOrder: 'Sort order',
    deliveryZoneFieldActive: 'Active',
    deliveryZoneFieldPolygon: 'Zone polygon',
    deliveryZonePolygonHint: 'Click the map to add points (min. 3). Double-click or click the first point to finish.',
    deliveryZoneClearShape: 'Clear shape',
    deliveryZonePolygonRequired: 'Polygon is required',
    deliveryZonePreview: 'Zone preview',
    deliveryZonePreviewLoading: 'Loading map...',
    deliveryZonePreviewUnavailable: 'Map unavailable',
    deliveryZonePreviewEmpty: 'No polygon yet',
    deliveryZoneVertices: 'vertices',
    deliveryZoneSave: 'Save zone',
    deliveryZoneSaving: 'Saving...',
    deliveryZoneSaveError: 'Failed to save zone',
    deliveryZoneDeleteConfirm: 'Delete zone {name}?',
    deliveryZoneDeleteError: 'Failed to delete zone',
    deliveryZoneToggleError: 'Failed to update zone status',
    deliverySettingsTitle: 'Delivery settings',
    deliverySettingsDescription: 'Control kitchen availability, prep defaults, and dispatch behavior.',
    deliverySettingsKitchenOpen: 'Kitchen is open',
    deliverySettingsKitchenOpenHint: 'When closed, online ordering is disabled for customers.',
    deliverySettingsDeliveryEnabled: 'Delivery enabled',
    deliverySettingsTakeawayEnabled: 'Takeaway enabled',
    deliverySettingsGlobalMinOrder: 'Global minimum order',
    deliverySettingsDefaultPrep: 'Default prep time (minutes)',
    deliverySettingsDefaultPrepHint: 'Used when no order-specific prep estimate is set.',
    deliverySettingsGlobalFreeThreshold: 'Global free delivery threshold',
    deliverySettingsDispatchMode: 'Dispatch mode',
    deliverySettingsDispatchAuto: 'Auto (dispatch via provider)',
    deliverySettingsDispatchManual: 'Manual (staff dispatches)',
    deliverySettingsHours: 'Operating hours',
    deliverySettingsHoursHint: 'Set open and close times for each weekday.',
    deliverySettingsClosed: 'Closed',
    deliverySettingsOpenAt: 'Open',
    deliverySettingsCloseAt: 'Close',
    deliverySettingsSave: 'Save settings',
    deliverySettingsSaving: 'Saving...',
    deliverySettingsSaved: 'Settings saved',
    deliverySettingsSaveError: 'Failed to save settings',
    deliverySettingsClosingSoonLabel: 'Last-call window (minutes before close)',
    deliverySettingsClosingSoonHint:
      '0 disables. During this window, customers still submit orders but see a “closing soon” notice.',
    deliverySettingsPauseActive: 'Timed pause active until {time} (Baku).',
    deliverySettingsCancelPause: 'Cancel pause & open now',
    deliverySettingsHoursInvalid: 'Each open day needs valid open and close times (HH:MM).',
    deliverySettingsDayMon: 'Mon',
    deliverySettingsDayTue: 'Tue',
    deliverySettingsDayWed: 'Wed',
    deliverySettingsDayThu: 'Thu',
    deliverySettingsDayFri: 'Fri',
    deliverySettingsDaySat: 'Sat',
    deliverySettingsDaySun: 'Sun',
    deliverySettingsStatusOpenNow: 'Open now — accepting orders',
    deliverySettingsStatusClosedNow: 'Closed now — outside operating hours',
    deliverySettingsStatusPaused: 'Paused — online orders stopped manually',
    deliverySettingsTodayHours: "Today's hours: {hours}",
    deliverySettingsTodayClosed: 'Closed all day today',
    deliverySettingsSpecialDayBadge: 'Special schedule today',
    deliverySettingsAcceptingOrders: 'Accepting online orders',
    deliverySettingsStoppedOrders: 'All online orders stopped',
    deliverySettingsAcceptingOrdersHint: 'Customers can place orders when inside your hours below.',
    deliverySettingsStoppedOrdersHint: 'No new online orders until you turn this back on (overrides hours).',
    deliverySettingsDayOpen: 'Open',
    deliverySettingsWeeklyHours: 'Weekly schedule',
    deliverySettingsSpecialDaysTitle: 'Special days & holidays',
    deliverySettingsSpecialDaysHint:
      'One-off dates that override the weekly schedule. Add a customer note to show a popup on the order website.',
    deliverySettingsSpecialDayAdd: 'Add special day',
    deliverySettingsSpecialDayRemove: 'Remove',
    deliverySettingsSpecialDayDate: 'Date',
    deliverySettingsSpecialDayClosedAllDay: 'Closed all day',
    deliverySettingsSpecialDayCustomHours: 'Custom hours',
    deliverySettingsSpecialDayNote: 'Customer notice (optional)',
    deliverySettingsSpecialDayNoteHint: 'Shown as a popup on order.mings.az when this date is active.',
    deliverySettingsSpecialDayNoteEn: 'English',
    deliverySettingsSpecialDayNoteAz: 'Azerbaijani',
    deliverySettingsSpecialDayNoteRu: 'Russian',
    deliverySettingsSpecialDayDuplicateDate: 'Each special day must have a unique date.',
    deliverySettingsSpecialDaysInvalid: 'Special days need a date and valid hours when not closed all day.',
    orderSpecialDayNoticeTitle: 'Notice',
    orderSpecialDayNoticeDismiss: 'Got it',
    deliveryDispatchTitle: 'Dispatch center',
    deliveryDispatchDescription: 'Manage active deliveries and dispatch actions.',
    deliveryDispatchEmpty: 'No dispatchable orders for this range.',
    deliveryDispatchColOrder: 'Order',
    deliveryDispatchColCustomer: 'Customer',
    deliveryDispatchColAddress: 'Address',
    deliveryDispatchColStatus: 'Status',
    deliveryDispatchColActions: 'Actions',
    deliveryDispatchNoWolt: 'No Wolt task',
    deliveryDispatchManuallyDispatched: 'Marked manual',
    deliveryDispatchTrackOpen: 'Open tracking',
    deliveryDispatchTrackCopy: 'Copy tracking URL',
    deliveryDispatchTrackCopied: 'Copied',
    deliveryDispatchActionDispatch: 'Dispatch',
    deliveryDispatchActionMarkManual: 'Mark manual',
    deliveryDispatchActionCancel: 'Cancel task',
    deliveryDispatchInvokeError: 'Dispatch action failed',
    deliveryDispatchInvokeOk: 'Dispatch action completed',
    deliveryDispatchTrackingUrlPrompt: 'Enter the courier tracking URL (https://…)',
    deliveryDispatchTrackingUrlInvalid: 'Enter a valid http or https tracking URL',
    deliverySettingsKitchenLocationTitle: 'Kitchen location',
    deliverySettingsKitchenLocationHint:
      'Used for distance, ETA, and self-delivery recommendations. Leave empty to use default location.',
    deliverySettingsKitchenLatitude: 'Kitchen latitude',
    deliverySettingsKitchenLongitude: 'Kitchen longitude',
    deliverySettingsKitchenLocationInvalid: 'Enter valid kitchen coordinates (lat: -90..90, lng: -180..180).',
  },

  az: {
    home: 'Əsas',
    sales: 'Satışlar',
    money: 'Pul',
    reports: 'Hesabatlar',
    more: 'Daha çox',
    commandCenter: 'Komanda Mərkəzi',
    signedIn: 'Daxil olub',
    navOverview: 'İcmal',
    navOrders: 'Sifarişlər',
    navCatalog: 'Kataloq',
    navFinance: 'Maliyyə',
    navHubIncome: 'Gəlir',
    navHubSpending: 'Xərclər',
    navHubCashAccounts: 'Nağd və hesablar',
    navHubPayroll: 'Maaş',
    navHubInsights: 'Analitika',
    navSystem: 'Sistem',
    cockpitLoadingContent: 'Yüklənir…',
    cockpitResetFilters: 'Filtrləri sıfırla',
    cockpitEmptyFilteredHint: 'Tarix aralığını genişləndirin və ya filtrləri təmizləyin.',
    cockpitTestRecordLabel: 'Test qeydi',
    cockpitNeedsReview: 'Yoxlama lazımdır',
    cockpitReviewHighCommission: 'Komissiya faizi qeyri-adi yüksəkdir — kanal parametrlərini yoxlayın.',
    cockpitReviewUnusualAmount: 'Bu məbləğ qeyri-adi böyükdür — cəmlərə etibar etməzdən əvvəl təsdiqləyin.',
    settingsAppearance: 'Görünüş',
    collapseSidebar: 'Yan paneli yığ',
    expandSidebar: 'Yan paneli aç',
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
    halal: 'Halal',
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
    kpiNetProfitHint: 'Bank haqlarından sonra (₼{fees})',
    comparePreviousPeriod: 'Əvvəlki periodla müqayisə',
    netProfitLabel: 'Xalis mənfəət',
    sourceFilter: 'Mənbə',
    orderSourceMix: 'Sifariş mənbəyi',
    avgPrepTime: 'Orta hazırlanma',
    kitchenSla: 'Mətbəx SLA',
    paymentHealth: 'Ödəniş vəziyyəti',
    payoutCommission: 'Platforma komissiyası',
    topProducts: 'Top məhsullar',
    peakHours: 'Pik saatlar',
    operationalInsights: 'Əməliyyat statistikası',
    paidOrders: 'ödənilib',
    unpaidOrders: 'ödənilməyib',
    cardPayments: 'kart',
    codPayments: 'COD',
    matchedPayouts: 'Uyğun',
    mismatchedPayouts: 'Uyğunsuz',
    pendingPayouts: 'Gözləyir',
    expandDetails: 'Xərc və payout detallarını göstər',
    collapseDetails: 'Xərc və payout detallarını gizlət',
    viewFullReport: 'Tam hesabat',
    viewPayouts: 'Payout-lara bax',
    revenueShare: 'pay',
    dashboardOrdersHint: 'Period üzrə unikal sifarişlər',
    dashboardAovHint: 'Sifariş başına xalis gəlir',
    dataConsistencyWarning: 'Agregat KPI məlumatında {count} uyğunsuzluq aşkarlandı.',
    pos: 'POS',

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
    deleteChannelConfirmTitle: 'Satış kanalını silmək?',
    deleteChannelConfirmMessage: '"{name}" aktiv kanallardan silinsin? Keçmiş satış və payout-lar hesabatlarda qalır.',
    deleteChannelError: 'Kanal silinmədi. Yenidən cəhd edin və ya adminə müraciət edin.',
    channelRemovedSuccess: 'Kanal silindi.',
    systemSalesChannel: 'Sistem',
    salesChannelProtectedError: 'Bu kanal tətbiq üçün vacibdir — silinə və ya deaktiv edilə bilməz.',
    dismiss: 'Bağla',
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
    changeRole: 'Rolu dəyiş',
    resetPassword: 'Şifrəni sıfırla',
    newPassword: 'Yeni şifrə',
    confirmNewPassword: 'Yeni şifrəni təsdiqləyin',
    passwordResetSuccess: 'Şifrə uğurla yeniləndi',
    roleUpdated: 'Rol yeniləndi',
    cannotChangeOwnRole: 'Öz rolunuzu dəyişə bilməzsiniz',
    passwordMinLength: 'Şifrə ən az 8 simvol olmalıdır',

    auditLog: 'Audit jurnalı',
    auditLogTitle: 'Audit jurnalı',
    auditLogSubtitle: 'Admin əməliyyatları, verilənlər bazası dəyişiklikləri və staff girişləri',
    auditLogTabActions: 'Admin əməliyyatları',
    auditLogTabChanges: 'Sətir dəyişiklikləri',
    auditLogTabSignIns: 'Girişlər',
    auditLogEmpty: 'Hələ qeyd yoxdur',
    auditLogColWhen: 'Vaxt',
    auditLogColWho: 'Kim',
    auditLogColAction: 'Əməliyyat',
    auditLogColResource: 'Resurs',
    auditLogColDetails: 'Detallar',
    auditLogColSurface: 'Səth',
    auditLogColDevice: 'Cihaz',
    auditLogSurfaceCockpit: 'İdarəetmə mərkəzi',
    auditLogSurfacePos: 'Satış nöqtəsi',
    auditLogSurfaceKds: 'Mətbəx ekranı',
    auditLogSurfaceKiosk: 'Kiosk',
    auditLogSurfaceOrderManager: 'Sifariş meneceri',

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
      'İdarəetmə mərkəzi administratorlar üçündür. Hesabınız zal tətbiqləri ilə işləyir — aşağıdan Satış nöqtəsini, Mətbəx ekranını və ya Kiosku açın.',
    adminAccessGoToOrderManager: 'Sifariş menecerinə keç',
    adminAccessGoToPos: 'Satış nöqtəsini aç',
    adminAccessGoToKds: 'Mətbəx ekranını aç',
    adminAccessGoToKiosk: 'Kiosku aç',
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
    updatedSuccessfully: 'Uğurla yeniləndi!',
    deletedSuccessfully: 'Uğurla silindi!',
    errorOccurred: 'Xəta baş verdi',
    amountMustBePositive: 'Məbləğ sıfırdan böyük olmalıdır',
    expenseItemRequired: 'Xərc maddəsi seçin',
    paymentMethodRequired: 'Ödəniş üsulu seçin',
    descriptionRequired: 'Təsvir daxil edin',
    expenseDateRequired: 'Tarix seçin',
    quantityMustBePositive: 'Miqdar sıfırdan böyük olmalıdır',
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
    createNamed: '"{name}" yarat',
    newItem: 'Yeni maddə',
    assignToCategory: 'Kateqoriyaya təyin et',
    newCategory: 'Yeni kateqoriya',
    newSupplierName: 'Təchizatçı adı',
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
    kioskWelcomeTitle: 'Bu gün harada yemək yeyəcəksiniz?',
    kioskEatIn: 'Burada yemək',
    kioskTakeOut: 'Paket',
    kioskExploreMenu: 'Menyumuzu kəşf edin',
    kioskRestartMenu: 'Menyunu yenidən başlat',
    kioskOrderNow: 'Sifariş ver',
    kioskOrderMore: 'Daha çox sifariş',
    kioskDoneCountdown: 'Bitdi ({seconds}s)',
    kioskNoCategories: 'Menyu kateqoriyası yoxdur',
    kioskNoProducts: 'Məhsul mövcud deyil',
    addToCart: 'Səbətə əlavə et',
    viewCart: 'Səbətə bax',
    placeOrder: 'Sifariş ver',
    confirmOrder: 'Sifarişi təsdiq et',
    kioskOrderCreateFailed: 'Sifarişi göndərmək mümkün olmadı. Yenidən cəhd edin.',
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
    payMethodBadgeCashPickup: 'NAĞD — götürmədə ödəniş',
    payMethodBadgeCashDelivery: 'NAĞD — çatdırılma zamanı ödəniş',
    payMethodBadgeCardAuthorizing: 'KART — bank təsdiqi (hələ hazırlamayın)',
    kdsPrepTimeLabel: 'Hazırlıq müddəti (dəqiqə)',
    kdsBusyKitchenHint: 'Mətbəx yüklüdür? 20 dəq tövsiyə olunur.',
    kdsCourierNoteLabel: 'Kuryer',
    kdsStatusUpdating: 'Yenilənir…',
    kdsChannelDelivery: 'Çatdırılma',
    kdsChannelTakeaway: 'Götürmə',
    kdsChannelKiosk: 'Kiosk',
    kdsChannelPosEatIn: 'POS · Yerdə',
    kdsChannelPosTakeaway: 'POS · Götürmə',
    kdsChannelPosDelivery: 'POS · Çatdırılma',
    kdsFilterAll: 'Hamısı',
    kdsSearchPlaceholder: '# axtar…',
    kdsHistoryTitle: 'Tarixçə',
    kdsHistoryEmpty: 'Bu gün tamamlanmış sifariş yoxdur',
    kdsUndoComplete: 'Sifariş {number} tamamlandı',
    kdsUndoSeconds: 'Geri al',
    kdsUndoButton: 'Geri al',
    kdsAllItemsPrepared: 'Bütün məhsullar hazırdır',
    kdsMarkItemPrepared: 'Məhsulu hazır kimi işarələ',
    kdsMarkItemUnprepared: 'Məhsulu hazır deyil kimi işarələ',
    kdsEmptyQueueTitle: 'Aktiv sifariş yoxdur',
    kdsEmptyQueueHint: 'Kiosk və onlayn sifarişlər avtomatik burada görünəcək.',
    kdsEmptyColumn: 'Hələ boşdur',
    kdsEmptyFiltered: 'Filtrə uyğun sifariş yoxdur',
    kdsEmptyFilteredHint: 'Başqa kanal seçin və ya axtarışı təmizləyin.',
    kdsHistorySubtitle: 'Bu gün tamamlananlar',

    orderManagerTitle: 'Sifariş Meneceri',
    orderManagerDescription: 'Kiosk və onlayn sifarişləri bir növbədə izləyin və idarə edin',
    openOnlineOrder: 'Onlayn sifarişi aç',
    refreshOrders: 'Sifarişləri yenilə',
    totalOrders: 'Ümumi sifarişlər',
    ordersInQueue: 'Növbədə olan sifarişlər',
    todayRevenue: 'Bugünkü gəlir',
    searchOrderManagerPlaceholder: 'Sifariş #, telefon və ya ID axtar',
    allSources: 'Bütün mənbələr',
    allPayments: 'Bütün ödənişlər',
    unpaidOnly: 'Yalnız ödənilməmiş',
    paidOnly: 'Yalnız ödənilmiş',
    kioskOrders: 'Kiosk Sifarişləri',
    cockpitQuickLinks: 'Sürətli keçidlər',
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

    staff: 'Kadr və maaşlar',
    staffScreenTitle: 'Kadr və maaşlar',
    staffScreenDescription: 'İşçi siyahısı və tarixli maaş ödənişləri.',
    staffAddEmployee: 'İşçi əlavə et',
    staffEditEmployee: 'İşçini redaktə et',
    staffRecordPayment: 'Ödəniş qeyd et',
    staffEditPayment: 'Ödənişi redaktə et',
    staffFullName: 'Ad soyad',
    staffDesignation: 'Vəzifə',
    staffTotalSalary: 'Aylıq maaş',
    staffActiveLabel: 'Aktiv işçi',
    staffActiveEmployees: 'Aktiv işçilər',
    staffMonthlyPayrollTarget: 'Aylıq maaş hədəfi',
    staffPaidInPeriod: 'Dövr üzrə ödənilib',
    staffEmployee: 'İşçi',
    staffSelectEmployee: 'İşçi seçin',
    staffPaymentType: 'Ödəniş növü',
    staffPaymentTypeSalary: 'Maaş',
    staffPaymentTypeAdvance: 'Avans',
    staffPaymentTypeBonus: 'Bonus',
    staffPaymentTypePartial: 'Qismən',
    staffNameRequired: 'İşçi adı tələb olunur',
    staffInvalidSalary: 'Düzgün maaş məbləğləri daxil edin',
    staffInvalidPaymentAmount: 'Düzgün ödəniş məbləği daxil edin',
    staffEmployeeAdded: 'İşçi əlavə edildi',
    staffEmployeeUpdated: 'İşçi yeniləndi',
    staffEmployeeDeleted: 'İşçi silindi',
    staffPaymentAdded: 'Ödəniş qeyd edildi',
    staffPaymentUpdated: 'Ödəniş yeniləndi',
    staffPaymentDeleted: 'Ödəniş silindi',
    staffDeleteEmployeeConfirm: 'Bu işçi və bütün ödəniş tarixçəsi silinsin?',
    staffDeletePaymentConfirm: 'Bu ödəniş silinsin?',
    staffNoEmployees: 'Hələ işçi yoxdur. İlk komanda üzvünü əlavə edin.',
    staffNoPaymentsInPeriod: 'Bu dövrdə ödəniş yoxdur.',
    staffInactive: 'Qeyri-aktiv',
    staffNoDesignation: 'Vəzifə yoxdur',
    staffDoubleEntryWarning: 'Hesabatlarda təkrar sayılmasın deyə maaşları Xərclər “Maaşlar” kateqoriyası əvəzinə burada qeyd edin.',
    staffSalariesLabel: 'Ödənilən maaşlar',
    staffSalariesHint: 'Maaş modulunda qeyd edilən ödənişlər',
    kpiNetProfitHintExtended: 'Bank haqları ₼{fees}, platform komissiyaları ₼{commissions} və maaşlar ₼{payroll} çıxıldıqdan sonra',

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
    payoutReceivedInto: 'Hara daxil oldu',
    payoutReceivedIntoHint: 'Bu ödəniş hansı hesaba düşdü? Balans avtomatik yenilənir.',
    payoutNoAccountWarning: 'Hesab seçilməyib — bu ödəniş heç bir balansı yeniləməyəcək.',
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
    kitchenPausedTitle: 'Mətbəx dayandırılıb',
    kitchenPausedMessage:
      'Hal-hazırda dərhal sifariş qəbul etmirik. Açıq olduğumuz vaxt üçün planlı slot seçə bilərsiniz.',
    orderClosedPausedUntil: 'Təxminən {time} (Bakı vaxtı) yenidən onlayn.',
    orderClosedUntilNextOpen: 'Növbəti açılış: {when}',
    orderClosedSchedulePromptTitle: 'Sifarişi planlayın',
    orderClosedSchedulePromptHint: 'İş saatlarımızda slot seçin.',
    orderClosedScheduleAction: 'Sonra üçün planla',
    closingSoonBanner:
      'Mətbəx tezliklə bağlanır. İndi verilən sifarişlər mətbəxin təsdiqinə tabe ola bilər.',
    closingSoonCheckoutNote:
      'Bağlanış vaxtına yaxınlaşırıq ({time}, Bakı). Sifarişi yerinə yetirməyə çalışacağıq.',
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
    orderPayCashUnifiedTakeaway: 'Götürmədə nağd ödə',
    orderPayCashUnifiedDelivery: 'Çatdırılmada nağd ödə',
    orderPayEpoint: 'Onlayn kart',
    orderPayCardWithWallet: 'Mövcuddursa Apple Pay / Google Pay istifadə et',
    orderSaveCardForFuture: 'Kartı növbəti sifarişlər üçün yadda saxla',
    orderSavedCardsAvailable: 'Hesabınızda {count} saxlanmış kart var.',
    orderPlacedTitle: 'Sifariş verildi',
    orderPlacedSubtitle: 'Sifarişinizi qəbul etdik və tezliklə hazırlamağa başlayacağıq.',
    orderTrackHint: 'Statusu izlə',
    orderOpenTracking: 'İzləməni aç',
    orderCopyTrackingLink: 'İzləmə linkini kopyala',
    orderCopyTrackingDone: 'İzləmə linki kopyalandı.',
    orderConfirmationOrderNumber: 'Sifariş nömrəsi',
    orderConfirmationSummaryTitle: 'Sifariş xülasəsi',
    orderConfirmationEtaLabel: 'Təxmini vaxt',
    orderConfirmationEtaFallback: 'Hazırlığa tezliklə başlayacağıq',
    orderCheckout: 'Ödənişə keç',
    orderStepFulfillment: 'Təhvil üsulu',
    orderStepAddress: 'Ünvan',
    orderStepTiming: 'Vaxt',
    orderStepContact: 'Əlaqə',
    orderStepPayment: 'Ödəniş',
    orderStepReview: 'Yoxlama',
    orderFulfillmentTakeawayDisabled: 'Götürmə söndürülüb — yalnız çatdırılma.',
    orderFulfillmentTakeawayHint: "Ming's mətbəxindən götür",
    orderFulfillmentDeliveryHint: 'Ünvana çatdırılma',
    orderOnlineDisabled: 'Onlayn sifariş söndürülüb.',
    orderTakeawayOnlyNotice: "Ming's-dan götürmə üçün əvvəlcədən sifariş verin.",
    orderViewCart: 'Səbətə bax',
    orderSummaryTitle: 'Xülasə',
    orderAddressLabel: 'Etiket',
    orderAddressStreet: 'Küçə, bina, mənzil',
    orderLanguage: 'Dil',
    orderSelectSavedAddress: 'Saxlanılan ünvan',
    orderAddressClearSelection: 'Təmizlə',
    orderSaveAddressForNext: 'Bu ünvanı növbəti dəfə üçün saxla',
    orderLoadingMenu: 'Menyu yüklənir…',
    orderYourCart: 'Səbətiniz',
    orderAuthRequired: 'Checkout üçün davam etməkdən əvvəl daxil olun.',
    orderAuthInlineHint:
      'Sifarişi mətbəxə göndərməzdən əvvəl tez SMS təsdiqi — nömrənizi yoxlayırıq.',
    orderAuthEmail: 'E-poçt',
    orderAuthSms: 'SMS',
    orderAuthGoogle: 'Google ilə davam et',
    orderSignInGoogle: 'Google ilə daxil olun',
    orderSignInGoogleRedirecting: 'Google-a yönləndirilir…',
    orderForgotPassword: 'Şifrəni unutmusunuz?',
    orderForgotPasswordSent: 'Bu e-poçt mövcuddursa, bərpa təlimatı göndərildi.',
    orderSignUpInlinePrompt: 'Hələ hesabınız yoxdur?',
    orderSignUpInlineAction: 'Buradan qeydiyyat',
    orderEmailConfirmAfterSignup: 'İlk girişdən əvvəl hesabı təsdiqləmək üçün e-poçtunuzu yoxlayın.',
    orderResetPasswordTitle: 'Yeni şifrə təyin edin',
    orderResetPasswordHint: 'Hesab bərpasını tamamlamaq üçün yeni şifrə yaradın.',
    orderResetPasswordNew: 'Yeni şifrə',
    orderResetPasswordConfirm: 'Yeni şifrəni təsdiqləyin',
    orderResetPasswordSubmit: 'Şifrəni yenilə',
    orderResetPasswordSuccess: 'Şifrə yeniləndi. Hesabdan istifadə etməyə davam edə bilərsiniz.',
    orderResetPasswordMismatch: 'Şifrələr eyni deyil.',
    orderSendSmsCode: 'Kod göndər',
    orderSmsCode: 'SMS kodu',
    orderVerifySms: 'Təsdiqlə və daxil ol',
    orderSmsSentHint: 'Kod {phone} nömrəsinə göndərildi. Aşağıya daxil edin.',
    orderSmsResend: 'Kodu yenidən göndər',
    orderSmsResendWait: '{seconds}s sonra yenidən göndər',
    orderSmsCodeExpiredHint: 'Kodun vaxtı bitib və ya yanlışdır. Yeni SMS kodu istəyin.',
    orderSmsEnterCodeHint: 'SMS-dən tam kodu daxil edin (adətən 6 rəqəm).',
    orderSmsSendFailedHint:
      'SMS göndərilmədi. Nömrəni yoxlayıb yenidən cəhd edin və ya e-poçt/Google ilə daxil olun.',
    orderSmsCodeSentConfirmation: 'Kod göndərildi!',
    orderChangePhone: 'Başqa nömrə',
    orderInvalidPhone: 'Ölkə kodu ilə düzgün nömrə daxil edin (məs. +994…).',
    orderAccountPhone: 'Telefon',
    orderMapSearchPlaceholder: 'Küçə və ya yer axtarın…',
    orderMapNoResults: 'Bakıda uyğun nəticə tapılmadı.',
    orderMapSearchFailed: 'Ünvan axtarışı alınmadı. Yenidən cəhd edin.',
    orderMapSelectFailed: 'Bu ünvan təsdiqlənmədi. Başqa nəticəni seçin.',
    orderMapLoadFailed: 'Xəritə axtarışı hazırda əlçatan deyil.',
    orderZonePillIn: '{zone} üçün çatdırılma · ₼{fee}',
    orderMapPinHint: 'Xəritəni hərəkət etdirin ki, işarə binanızın giriş nöqtəsini göstərsin.',
    orderMapLoading: 'Xəritə yüklənir…',
    orderMapUnavailable: 'Xəritə əlçatan deyil. Ünvanı yazın və ya cihaz məkanından istifadə edin.',
    orderItemNotes: 'Məhsul qeydləri',
    orderItemNotesPlaceholder: 'Allergiya, soğansız, daha acı…',
    orderReorder: 'Yenidən sifariş et',
    orderAddressesSection: 'Yadda saxlanılan ünvanlar',
    orderOrdersSection: 'Sifarişlər',
    orderAddressApartment: 'Mənzil / blok',
    orderAddressFloor: 'Mərtəbə',
    orderAddressEdit: 'Dəyiş',
    orderAddressDelete: 'Sil',
    orderAddressSetDefault: 'Əsas et',
    orderAddressCancelEdit: 'Ləğv et',
    orderAddressSaveChanges: 'Dəyişiklikləri saxla',
    orderAddressDeleteConfirm: 'Bu ünvan silinsin?',
    orderOrderDate: 'Tarix',
    orderFulfillmentLabel: 'Təhvil üsulu',
    orderTrackOrder: 'Sifarişi izlə',
    orderViewDetails: 'Detallara bax',
    orderHideDetails: 'Detalları gizlət',
    orderRemoveLine: 'Məhsulu sil',
    orderDecreaseQty: 'Sayı azaldın',
    orderIncreaseQty: 'Sayı artırın',
    orderChooseFulfillmentTitle: 'Götürmə və ya çatdırılma?',
    orderScheduleNow: 'İndi',
    orderScheduleLater: 'Planla',
    orderScheduleFor: 'Vaxt seçin',
    orderScheduleDay: 'Gün',
    orderScheduleTime: 'Saat',
    orderScheduleNoSlots: 'Hazırda planlı slot mövcud deyil.',
    orderPromoCode: 'Promo kod',
    orderPromoPlaceholder: 'Promo kodu daxil edin',
    orderTip: 'Bəxşiş',
    orderOrderNotes: 'Sifariş qeydi',
    orderPaymentCodHint: 'Götürmədə və ya çatdırılmada nağd ödə',
    orderPaymentCashHint: 'Məntəqədə nağd ödə',
    orderPaymentCashUnifiedHintTakeaway: "Ming's-dən götürəndə nağd ödəniş edin",
    orderPaymentCashUnifiedHintDelivery: 'Kuryer çatdıranda nağd ödəniş edin',
    orderPaymentEpointHint: 'Kartla təhlükəsiz onlayn ödəniş',
    orderPaymentExtras: 'Promo, bəxşiş və qeyd',
    orderPaymentExtrasShow: 'Əlavə seçimləri göstər',
    orderPaymentExtrasHide: 'Əlavə seçimləri gizlət',
    orderReviewHint: 'Sifarişi təsdiqləmədən əvvəl məlumatları yoxlayın.',
    orderReviewFulfillment: 'Təhvil üsulu',
    orderReviewTiming: 'Vaxt',
    orderReviewContact: 'Əlaqə',
    orderReviewPayment: 'Ödəniş',
    orderReviewAddress: 'Ünvan',
    orderReviewAsap: 'İndi',
    orderReviewMissing: 'Daxil edilməyib',
    orderContactSignedIn: 'Daxil olmusunuz. Sifarişi təsdiqləyə bilərsiniz.',
    orderContactGuestHint: 'Sifariş üçün telefonunuzu təsdiqləyin.',
    orderContactVerifyHint: 'Telefonunuza göndərilən SMS kodunu daxil edin.',
    orderAuthErrorFallback: 'Hazırda təsdiqləmə alınmadı. Yenidən cəhd edin.',
    orderConsentLabel: 'Mən razıyam:',
    orderTerms: 'Şərtlər',
    orderPrivacy: 'Məxfilik',
    orderRefundPolicy: 'Geri qaytarma siyasəti',
    orderConsentRequired: 'Sifarişdən əvvəl şərtləri qəbul edin.',
    orderErrInvalidEmail: 'Düzgün e-poçt ünvanı daxil edin.',
    retry: 'Yenidən cəhd et',
    cookieConsentCopy: 'Sifariş təcrübəsi və analitika üçün kukilərdən istifadə edirik.',
    cookieConsentAccept: 'Kukiləri qəbul et',
    orderSearchMenu: 'Menyu axtar…',
    orderVenueInfoTitle: 'Restoran',
    orderVenueHours: 'İş saatları',
    orderVenueAddress: 'Ünvan',
    orderVenuePhone: 'Telefon',
    orderAddToCart: 'Əlavə et',
    orderProductNoPhotoCaption: 'Sifarişlə təzə hazırlanır',
    orderFavoriteAdd: 'Sevimlilərə əlavə et',
    orderFavoriteRemove: 'Sevimlilərdən sil',
    orderSearchNoResults: 'Axtarışınıza uyğun yemək yoxdur.',
    orderCategoryEmpty: 'Bu kateqoriyada hələ yemək yoxdur.',
    orderChooseOptions: 'Seçim et',
    orderDishSingle: 'yemək',
    orderDishPlural: 'yemək',
    orderDeliveryDisabledInSettings:
      'Çatdırılma verilənlər bazasında söndürülüb. Supabase-də online_settings.delivery_enabled = true edin və ya götürmə seçin.',
    orderCombosSection: 'Kombolar',
    orderComboCustomize: 'Fərdiləşdir',
    orderComboBadge: 'Kombo',
    orderPhoneFormatHint: 'Azərbaycan formatı: +994 və 9 rəqəm.',
    orderDeliveryNotesLabel: 'Kuryer üçün qeydlər',
    orderDeliveryNotesPlaceholder: 'Sizi daha tez tapmağımıza kömək edən hər şey',
    orderAddressTypeTitle: 'Hara çatdıraq?',
    orderAddressTypeApartment: 'Mənzil',
    orderAddressTypeHouse: 'Ev',
    orderAddressTypeOffice: 'Ofis',
    orderAddressTypeHotel: 'Otel',
    orderAddressTypeOther: 'Digər',
    orderAddressBuildingName: 'Bina adı',
    orderAddressEntrance: 'Giriş / blok',
    orderAddressDoorNameOrNumber: 'Qapıdakı ad/nömrə',
    orderAddressCompanyName: 'Şirkət adı',
    orderAddressLeaveAt: 'Sifarişi hara qoyaq?',
    orderAddressLeaveAtOffice: 'Ofisə',
    orderAddressLeaveAtReception: 'Resepsiyaya',
    orderAddressAccessMethod: 'Necə daxil olaq?',
    orderAccessIntercom: 'Domofon / zəng',
    orderAccessDoorCode: 'Qapı kodu',
    orderAccessDoorOpen: 'Qapı açıqdır',
    orderAddressIntercomNameOrNumber: 'Domofonda ad/nömrə',
    orderAddressDoorCode: 'Qapı kodu',
    orderAddressAccessOtherInstructions: 'Digər giriş təlimatı',
    orderSignInPromptTitle: 'Daha sürətli checkout üçün daxil olun',
    orderSignInPromptSubtitle: 'Google və ya SMS OTP ilə daxil olun. Daxil olmadan da baxa bilərsiniz.',
    orderOr: 'və ya',
    orderLegalPassivePrefix: 'Bu sifarişi verərək aşağıdakılarla razılaşırsınız:',
    orderProfileCompletionTitle: 'Profilinizi tamamlayın',
    orderProfileCompletionSubtitle: 'Davam etmək üçün adınızı təsdiqləyin və siyasətləri qəbul edin.',
    orderProfileFirstName: 'Ad',
    orderProfileLastName: 'Soyad',
    orderProfilePhoneOptional: 'Telefon (opsional)',
    orderProfilePhoneOptionalHint: 'Boş buraxsanız, checkout zamanı telefon təsdiqi istənəcək.',
    orderProfileCompletionSave: 'Yadda saxla və davam et',
    orderProfileCompletionNameRequired: 'Ad və soyad mütləqdir.',
    orderProfileCompletionConsentRequired: 'Şərtlər, Məxfilik və Geri qaytarma siyasətini qəbul edin.',
    orderProfileCompletionPending: 'Sifarişdən əvvəl profilinizi tamamlayın.',
    orderPhoneVerificationRequired: 'Sifarişdən əvvəl telefonunuzu təsdiqləyin.',
    orderCheckoutAuthTitle: 'Sifariş üçün daxil olun',
    orderCheckoutAuthHelper: 'Sifarişinizi izləyin və çatdırılma yeniliklərini alın.',
    orderCheckoutAuthGooglePhoneNext: 'Növbəti addımda telefon təsdiqi edəcəksiniz.',
    orderCheckoutAuthSmsCta: 'SMS kodu ilə davam et',
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
    comboBuilderEmptyGroup: 'Bu kombo addımı hazırda əlçatan deyil.',
    comboBuilderEmptyCombo: 'Bu kombo üçün addımlar konfiqurasiya edilməyib.',
    orderErrGeneric: 'Sifarişi tamamlamaq olmadı. Yenidən cəhd edin.',
    orderErrAuthRequired: 'Sifariş vermək üçün daxil olun.',
    orderErrCartEmpty: 'Səbət boşdur.',
    orderErrPhoneRequired: 'Telefon nömrəsi tələb olunur.',
    orderErrPhoneInvalid: 'Ölkə kodu ilə düzgün telefon nömrəsi daxil edin.',
    orderErrOnlineUnavailable: 'Onlayn sifariş hazırda əlçatan deyil.',
    orderErrTakeawayDisabled: 'Götürmə hazırda əlçatan deyil.',
    orderErrDeliveryDisabled: 'Çatdırılma hazırda əlçatan deyil.',
    orderErrLocationRequired: 'Çatdırılma məkanını seçin.',
    orderErrAddressRequired: 'Çatdırılma ünvanını daxil edin.',
    orderErrOutsideZone: 'Ünvanınız çatdırılma zonasından kənardadır.',
    orderErrMinimumOrder: 'Sifariş məbləği minimum tələbdən azdır.',
    orderErrZoneMinimumOrder: 'Bu zona üçün minimum məbləğdən azdır.',
    orderErrPaymentInitFailed: 'Ödəniş başladılmadı. Yenidən cəhd edin.',
    orderErrScheduleRequired: 'Planlı sifariş üçün vaxt seçin.',
    orderErrScheduleInvalid: 'Seçilən vaxt etibarsızdır.',
    orderErrScheduleTooSoon: 'Daha gec bir slot seçin.',
    orderErrInvalidQuantity: 'Səbətdəki bəzi məhsulların sayı etibarsızdır.',
    orderErrKitchenClosed: 'Mətbəx onlayn sifarişlər üçün hazırda bağlıdır.',
    orderErrKitchenPaused: 'Mətbəx müvəqqəti dayandırılıb. Planlı vaxt sınayın və ya sonra yoxlayın.',
    orderErrScheduleWhilePaused: 'Bu vaxt hələ dayanma müddətindədir. Daha sonrakı slot seçin.',
    orderErrScheduleOutsideHours: 'Bu vaxt iş saatlarımızdan kənardır. Başqa slot seçin.',
    orderPayCodDescription: 'Götürmə zamanı və ya kuryerə nağd ödəniş.',
    orderPayCashDescription: 'Restoranda nağd.',
    orderPayEpointDescription: 'Təhlükəsiz host edilmiş kart ödənişi.',
    orderCheckoutSummary: 'Xülasə',
    orderCheckoutBrand: "Ming's",
    orderProfileSection: 'Profil',
    orderAddressDefaultBadge: 'Defolt',
    orderAddressHomeLabel: 'Ev',
    orderPromoCodePlaceholder: 'MINGS10',
    orderZonePillChecking: 'Çatdırılma zonası yoxlanır…',

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
    trackScheduledForLabel: 'Planlanıb:',
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
    omMenuEditorUpdateFailed: 'Menyu elementi yenilənmədi. Yenidən daxil olmağı sınayın.',
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
    omAll: 'Hamısı',
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
    omSourcePos: 'POS',
    omTitle: 'Sifariş meneceri',
    posTitle: 'Satış nöqtəsi',
    posTabActive: 'Aktiv',
    posTabHistory: 'Tarixçə',
    posTabNewOrder: 'Yeni sifariş',
    posTabSettings: 'Parametrlər',
    posSettingsTitle: 'Çap parametrləri',
    posPrintAgentUrl: 'Çap agenti URL',
    posPrinterProfile: 'Printer profili',
    posProfileEscpos80: 'ESC/POS · 80mm termal',
    posProfileZpl58: 'ZPL · 58mm etiket',
    posProfileZpl40x30: 'ZPL · 40×30mm etiket',
    posTestConnection: 'Bağlantını yoxla',
    posTestPrint: 'Test çapı',
    posAgentConnected: 'Çap agentinə çatmaq mümkündür',
    posAgentUnreachable: 'Çap agentinə çatmaq mümkün deyil',
    posTestPrintSent: 'Test etiketi printerə göndərildi',
    posTestPrintFailed: 'Test çapı uğursuz oldu',
    posFulfillmentEatIn: 'Yerdə',
    posFulfillmentTakeaway: 'Götürmə',
    posFulfillmentDelivery: 'Çatdırılma',
    posSourceEatIn: 'POS · Yerdə',
    posSourceTakeaway: 'POS · Götürmə',
    posSourceDelivery: 'POS · Çatdırılma',
    posCustomerPanelTitle: 'Müştəri',
    posCustomerName: 'Ad (istəyə bağlı)',
    posCustomerPhone: 'Telefon (istəyə bağlı)',
    posOrderNotes: 'Sifariş qeydləri',
    posDeliveryPanelTitle: 'Çatdırılma ünvanı',
    posCartTitle: 'Səbət',
    posCartEmpty: 'Səbət boşdur',
    posSubmitOrder: 'Sifariş yarat',
    posSubmitFailed: 'Sifariş yaradıla bilmədi',
    posOrderCreated: 'Sifariş yaradıldı',
    posViewActiveOrders: 'Aktiv sifarişlərə bax',
    posNewOrderTitle: 'Yeni sifariş',
    posOutsideZone: 'Ünvan çatdırılma zonasından kənardadır',
    posDeliveryRequired: 'Çatdırılma ünvanı və pin təyin edin',
    posReprintLabels: 'Etiketləri yenidən çap et',
    posPrintSent: 'Etiketlər printerə göndərildi',
    posPrintPending: 'Çap növbədə — agent offline',
    posPrintFailed: 'Çap uğursuz oldu',
    posPrintPendingCount: '{count} çap işi agent gözləyir',
    posMapSearch: 'Bakıda ünvan axtar',
    posMapPinHint: 'Pin sürüşdürün və ya xəritəyə toxunun',
    posMapsUnavailable: 'Xəritə əlçatan deyil',
    omKitchenStatusTitle: 'Onlayn mətbəx',
    omKitchenStatusOnline: 'Sifariş qəbul edilir',
    omKitchenStatusPausedUntil: '{time}-ə qədər dayanır',
    omKitchenStatusOffline: 'Oflayn (yeni sifariş yox)',
    omKitchenStatusClosed: 'Saatlara görə bağlı',
    omKitchenPause30: '30 dəq dayan',
    omKitchenPause60: '1 saat dayan',
    omKitchenPauseUntilNextOpen: 'Növbəti açılışadək',
    omKitchenPauseIndefinite: 'Yenidən açana qədər oflayn',
    omKitchenResume: 'İndi aç',
    omKitchenStatusHint: 'Dayanmadan sonra slotlar varsa müştərilər planlaya bilər.',
    omKitchenNoNextOpen: 'Növbəti açılış tapılmadı — saatları Çatdırılma ayarlarında yoxlayın.',
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
    orderSupport: 'Sifariş Dəstəyi',
    orderSupportDescription: 'Sifariş əməliyyatlarını real vaxtda izləyin və dəstəkləyin',
    orderSupportOpenOrderPage: 'Sifariş səhifəsini aç',
    orderSupportFilter_all: 'Hamısı',
    orderSupportFilter_active: 'Aktiv',
    orderSupportFilter_dispatched: 'Yola salınıb',
    orderSupportFilter_completed: 'Tamamlanıb',
    orderSupportFilter_cancelled: 'Ləğv edilib',
    orderSupportOrdersFound: 'sifariş tapıldı',
    orderSupportSourceAll: 'Bütün mənbələr',
    orderSupportSearch: 'Sifariş #, müştəri, telefon ilə axtar',
    orderSupportNoOrders: 'Bu filtr üçün sifariş tapılmadı',
    orderSupportColTime: 'Vaxt',
    orderSupportColCustomer: 'Müştəri',
    orderSupportColItems: 'Məhsullar',
    orderSupportColTotal: 'Cəmi',
    orderSupportColStatus: 'Status',
    orderSupportOrderActions: 'Sifariş əməliyyatları',
    orderSupportPrepareQuick: 'Hazırlığa başla (15 dəq)',
    orderSupportScheduledHint:
      'Bu sifariş planlıdır. Xatırlatma üçün Sifariş Meneceri daha təhlükəsizdir; detalları burada görə bilərsiniz.',
    payments: 'Ödənişlər',
    paymentsScreenTitle: 'Ödənişlər',
    paymentsScreenDescription: 'Onlayn ödəniş qeydlərinə baxın, uyğunsuzluqları görün və provayderdə statusu yenidən yoxlayın',
    paymentsFilterAll: 'Hamısı',
    paymentsFilterPending: 'Gözləyir',
    paymentsFilterSuccess: 'Ödənilib',
    paymentsFilterFailed: 'Uğursuz',
    paymentsProviderAll: 'Bütün provayderlər',
    paymentsSearch: 'Sifariş #, müştəri, telefon, tranzaksiya id ilə axtar',
    paymentsFound: 'ödəniş tapıldı',
    paymentsNoRows: 'Bu filtr üçün ödəniş tapılmadı',
    paymentsColTime: 'Vaxt',
    paymentsColOrder: 'Sifariş',
    paymentsColCustomer: 'Müştəri',
    paymentsColAmount: 'Məbləğ',
    paymentsColProvider: 'Provayder',
    paymentsColPaymentStatus: 'Ödəniş',
    paymentsColSaleStatus: 'Satış',
    paymentsColMismatch: 'Uyğunsuzluq',
    paymentsMismatchYes: 'Uyğunsuzluq',
    paymentsDetailProvider: 'Provayder',
    paymentsDetailClientOrderId: 'Müştəri sifariş id',
    paymentsDetailTransactionId: 'Tranzaksiya id',
    paymentsDetailProviderStatus: 'Provayder statusu',
    paymentsDetailPaidAt: 'Ödənilmə vaxtı',
    paymentsDetailError: 'Xəta',
    paymentsDetailRawPayload: 'Xam payload',
    paymentsRecheckButton: 'Provayderdə statusu yenidən yoxla',
    paymentsRechecking: 'Yenidən yoxlanılır…',
    paymentsRecheckSuccess: 'Provayder statusu yenidən yoxlandı. Siyahı yeniləndi.',
    paymentsRecheckFailed: 'Yenidən yoxlama uğursuz oldu',
    paymentsRecheckForbidden: 'Yalnız menecer və admin ödəniş statusunu yenidən yoxlaya bilər',
    paymentsStatusPending: 'Gözləyir',
    paymentsStatusSuccess: 'Ödənilib',
    paymentsStatusFailed: 'Uğursuz',
    paymentsProviderEpoint: 'Epoint',
    paymentsProviderUnited: 'United Payment',
    paymentsProviderOther: 'Digər',
    cashDebt: 'Nağd və hesablar',
    cashDebtScreenTitle: 'Nağd və borc',
    cashDebtScreenDescription: 'Kreditlər, digər öhdəliklər və bank çıxarış haqları.',
    cashDebtTabLoans: 'Kreditlər və digər',
    cashDebtTabWithdrawals: 'Bank çıxarışları',
    outstandingDebtLabel: 'Ödənilməmiş borc',
    outstandingDebtHint: 'Təchizatçı hesabları + kreditlər (balans)',
    supplierOutstanding: 'Borc',
    supplierPayButton: 'Təchizatçıya ödə',
    supplierOpeningBalance: 'Açılış balansı',
    supplierOpeningBalanceDate: 'Balans tarixi',
    supplierAddDebt: 'Borc əlavə et',
    supplierDebtHistory: 'Borc tarixçəsi',
    supplierDebtCleared: 'Bağlanıb',
    supplierCreditBalance: 'Kredit balansı',
    supplierDebtFromPurchase: 'Alış (hesabdan)',
    supplierManualDebt: 'Manual borc',
    supplierClearDebt: 'Borcu bağla',
    supplierAccountView: 'Hesab',
    supplierRecentPayments: 'Son ödənişlər',
    supplierAccountExplainer:
      'Təchizatçının balansı davamlı hesabdır: hesabdan alışlar onu artırır, ödənişlər azaldır. “Borcu bağla” ilə ödəyin.',
    supplierYouOwe: 'Borc',
    supplierPrepaid: 'Artıq ödəniş',
    supplierSettled: 'Ödənilib',
    supplierStatement: 'Hesab çıxarışı',
    supplierBalanceColumn: 'Balans',
    supplierPaymentLabel: 'Ödəniş',
    supplierAddDebtHint: 'Yalnız qeydə alınmış alışdan olmayan məbləğlər üçün (məsələn, əvvəlcədən mövcud borc).',
    supplierNoActivity: 'Hələ alış və ya ödəniş yoxdur.',
    supplierSearchPlaceholder: 'Təchizatçı axtar…',
    supplierNoMatches: 'Axtarışa uyğun təchizatçı tapılmadı.',
    supplierTotalSpend: 'Ümumi xərc',
    purchaseOnAccountHint: 'Ödəyənə qədər bu alışı təchizatçının balansına əlavə edir.',
    purchasePaidNowHint: 'Bu alışı indi seçilmiş hesab balansından çıxır.',
    purchaseOnAccount: 'Hesabdan',
    purchasePaidNow: 'İndi ödənilib',
    purchasePaymentMode: 'Ödəniş',
    purchaseDiscountPercent: 'Təchizatçı endirimi %',
    purchaseDiscountCustom: 'Fərdi',
    purchaseListTotal: 'Siyahı cəmi',
    purchaseDiscountAmount: 'Endirim',
    purchaseNetTotal: 'Xalis cəmi',
    purchaseSetDefaultDiscount: 'Standart endirim kimi saxla',
    liabilityAdd: 'Öhdəlik əlavə et',
    liabilityEdit: 'Öhdəliyi redaktə et',
    liabilityRecordPayment: 'Ödəniş qeyd et',
    liabilityEditPayment: 'Ödənişi redaktə et',
    liabilityDeleteConfirm: 'Bu öhdəlik və bütün ödənişləri silinsin?',
    liabilityDeletePaymentConfirm: 'Bu ödəniş silinsin?',
    liabilityPaymentHistory: 'Ödəniş tarixçəsi',
    liabilityDueDate: 'Son tarix',
    liabilityTypeLoan: 'Kredit',
    liabilityTypeOther: 'Digər',
    liabilityCounterparty: 'Kontragent',
    liabilityLenderOwedTo: 'Kreditor / borclu olduğunuz',
    liabilityLenderHelp: 'Kimə borclusunuz — bank, dost və s. Təchizatçı borcu Təchizatçılar ekranındadır.',
    cashDebtLoansHelp: 'Bank kreditləri və şəxsi borclar üçün. Təchizatçı borcu Təchizatçılar ekranındadır.',
    liabilityEmpty: 'Hələ kredit və ya digər öhdəlik yoxdur.',
    liabilityStatusOpen: 'Açıq',
    liabilityStatusPartial: 'Qismən ödənilib',
    liabilityStatusSettled: 'Bağlanıb',
    withdrawalLog: 'Çıxarış qeyd et',
    withdrawalMethodCashier: 'Kassir (0.5%)',
    withdrawalMethodAbbAtm: 'ABB ATM (1%, min ₼1)',
    withdrawalFeePreview: 'Bank haqqı',
    withdrawalFeesPeriodTotal: 'Siyahıdakı haqlar',
    withdrawalEmpty: 'Hələ çıxarış qeyd olunmayıb.',
    withdrawalAvailableInAccount: '{account} hesabında mövcuddur: {available}',
    withdrawalInsufficientFunds: '{account} hesabında kifayət deyil. Mövcud: {available}.',
    withdrawalMethod: 'Üsul',
    withdrawalFee: 'Haqq',
    posPaymentMethod: 'Ödəniş üsulu',
    posPayCash: 'Nağd',
    posPayCard: 'Kart',
    cashDrawerTab: 'Kassa',
    cashOnHand: 'Kassada nağd',
    cashOnHandHint: 'İndi əlinizdə olmalı olan nağd pul',
    accountCash: 'Kassada nağd',
    accountBank: 'Əsas (bank) hesabı',
    accountCard: 'Kart hesabı',
    accountBalancesTitle: 'Hesab qalıqları',
    accountBankHint: 'Ödənişlər bura gəlir; çek üzrə çıxarışlar buradan',
    accountCardHint: 'Köçürmələrlə doldurulur; bankomatdan çıxarışlar üçün',
    accountManage: 'Hesabları idarə et',
    accountSetupTitle: 'Hesab quraşdırması',
    accountCurrentBalance: 'Cari',
    accountTransferAction: 'Köçür',
    accountActivityTitle: 'Hesab hərəkətləri',
    accountActivityEmpty: 'Hələ bank və ya kart hərəkəti yoxdur.',
    accountActivityFilterAll: 'Bütün hesablar',
    accountLedgerOpening: 'Açılış qalığı',
    accountLedgerTransferIn: 'Daxil olan köçürmə',
    accountLedgerTransferOut: 'Çıxan köçürmə',
    accountLedgerWithdrawal: 'Çıxarış',
    accountLedgerExpense: 'Xərc',
    accountLedgerPurchase: 'Alış',
    accountLedgerPayout: 'Alınan ödəniş',
    accountLedgerManagedElsewhere: 'Xərclər ekranında idarə olunur',
    accountLedgerManagedPayouts: 'Ödənişlər ekranında idarə olunur',
    accountTransferDeleted: 'Köçürmə silindi',
    accountOpeningBalance: 'Açılış qalığı',
    accountOpeningDate: 'Tarix',
    accountOpeningBalanceSaved: 'Açılış qalığı yadda saxlanıldı',
    accountTransferBankToCard: 'Əsas → kart köçürməsi',
    accountTransferSaved: 'Köçürmə qeyd olundu',
    paymentCash: 'Nağd',
    paymentCard: 'Kart',
    paymentBankTransfer: 'Bank köçürməsi',
    selectPaymentMethod: 'Ödəmə üsulunu seçin',
    withdrawalMethodCardAccount: 'Kart hesabı (ABB ATM, 1%, min ₼1)',
    cashDrawerTitle: 'Kassa',
    cashDrawerSubtitle: 'Ay sonunda kassanı tutuşdurmaq üçün nağd pulu izləyin.',
    cashOpeningBalance: 'Açılış qalığı',
    cashClosingBalance: 'Bağlanış qalığı',
    cashInTotal: 'Nağd daxilolma',
    cashOutTotal: 'Nağd çıxış',
    cashFromOrders: 'Yığılan nağd sifarişlər',
    cashFromWithdrawals: 'Bankdan çıxarış (xalis)',
    cashFromPayouts: 'Alınan nağd ödənişlər',
    cashAdjustmentsIn: 'İlkin nağd və düzəlişlər',
    cashToExpenses: 'Nağd xərclər',
    cashToPurchases: 'Nağd alışlar',
    cashToSuppliers: 'Təchizatçılara nağd',
    cashToLiabilities: 'Kreditlərə nağd',
    cashBankDeposits: 'Banka köçürmə və çıxış düzəlişləri',
    cashMovementLog: 'Nağd hərəkətləri',
    cashMovementEmpty: 'Hələ əl ilə nağd hərəkəti yoxdur.',
    cashAddMovement: 'Hərəkət əlavə et',
    cashMovementCategory: 'Kateqoriya',
    cashCategoryOpeningFloat: 'İlkin nağd',
    cashCategoryBankDeposit: 'Banka köçürmə',
    cashCategoryAdjustment: 'Düzəliş',
    cashCategoryOther: 'Digər',
    cashMovementDirection: 'İstiqamət',
    cashDirectionIn: 'Nağd daxilolma',
    cashDirectionOut: 'Nağd çıxış',
    cashMovementAdded: 'Nağd hərəkəti əlavə edildi',
    cashMovementDeleted: 'Nağd hərəkəti silindi',
    deliveryScreenTitle: 'Çatdırılma',
    orderLocations: 'Sifariş xəritəsi',
    orderLocationsTitle: 'Çatdırılma sifariş xəritəsi',
    orderLocationsSubtitle: 'Bakıda çatdırılma sifarişlərinin haradan gəldiyini görün — hər nöqtə bir sifarişdir.',
    orderLocationsEmpty: 'Bu periodda çatdırılma ünvanı yoxdur. Tarix aralığını və ya mənbə filtrini dəyişin.',
    orderLocationsLoading: 'Xəritə yüklənir…',
    orderLocationsUnavailable: 'Sifariş xəritəsi üçün VITE_GOOGLE_MAPS_API_KEY əlavə edin.',
    orderLocationsMapHint: 'Sifariş detalları üçün nöqtəyə klik edin. Xəritə Bakı ilə məhdudlaşır.',
    orderLocationsTotalOrders: 'Ünvanı olan sifarişlər',
    orderLocationsSourceAll: 'Bütün çatdırılma',
    orderLocationsSourceOnline: 'Sayt çatdırılması',
    orderLocationsSourcePos: 'POS çatdırılması',
    orderLocationsOrderLabel: 'Sifariş',
    deliveryScreenDescription: 'Zonaları, mətbəx qaydalarını və əl ilə yola salmanı idarə edin',
    deliveryRefresh: 'Çatdırılma məlumatını yenilə',
    deliveryTabZones: 'Zonalar',
    deliveryTabSettings: 'Ayarlar',
    deliveryTabDispatch: 'Yola salma',
    deliveryZonesTitle: 'Çatdırılma zonaları',
    deliveryZonesDescription: 'Aktiv xidmət poliqonlarını və qiymət qaydalarını tənzimləyin.',
    deliveryZonesNew: 'Yeni zona',
    deliveryZonesEmptyTitle: 'Hələ çatdırılma zonası yoxdur',
    deliveryZonesEmptyHint: 'Ünvan əsaslı qiymətləndirmə üçün ilk zonanı yaradın.',
    deliveryZonesColName: 'Ad',
    deliveryZonesColVertices: 'Nöqtələr',
    deliveryZonesColFee: 'Haqq',
    deliveryZonesColMinOrder: 'Min sifariş',
    deliveryZonesColActive: 'Aktiv',
    deliveryZonesColActions: 'Əməliyyatlar',
    deliveryZoneNewTitle: 'Çatdırılma zonası yarat',
    deliveryZoneEditTitle: 'Çatdırılma zonasını redaktə et',
    deliveryZoneFieldName: 'Zona adı',
    deliveryZoneFieldFee: 'Çatdırılma haqqı',
    deliveryZoneFieldMinOrder: 'Minimum sifariş',
    deliveryZoneFieldFreeThreshold: 'Pulsuz çatdırılma həddi',
    deliveryZoneFieldSortOrder: 'Sıralama',
    deliveryZoneFieldActive: 'Aktiv',
    deliveryZoneFieldPolygon: 'Zona poliqonu',
    deliveryZonePolygonHint: 'Zonanı çəkmək üçün xəritəyə klik edin (min. 3). Bitirmək üçün iki dəfə klik edin və ya birinci nöqtəyə klik edin.',
    deliveryZoneClearShape: 'Formanı təmizlə',
    deliveryZonePolygonRequired: 'Poliqon tələb olunur',
    deliveryZonePreview: 'Zona önizləməsi',
    deliveryZonePreviewLoading: 'Xəritə yüklənir...',
    deliveryZonePreviewUnavailable: 'Xəritə əlçatan deyil',
    deliveryZonePreviewEmpty: 'Hələ poliqon yoxdur',
    deliveryZoneVertices: 'nöqtə',
    deliveryZoneSave: 'Zonanı yadda saxla',
    deliveryZoneSaving: 'Yadda saxlanır...',
    deliveryZoneSaveError: 'Zonanı yadda saxlamaq olmadı',
    deliveryZoneDeleteConfirm: '{name} zonası silinsin?',
    deliveryZoneDeleteError: 'Zonanı silmək olmadı',
    deliveryZoneToggleError: 'Zona statusunu yeniləmək olmadı',
    deliverySettingsTitle: 'Çatdırılma ayarları',
    deliverySettingsDescription: 'Mətbəx əlçatanlığını, hazırlıq vaxtını və yola salma rejimini idarə edin.',
    deliverySettingsKitchenOpen: 'Mətbəx açıqdır',
    deliverySettingsKitchenOpenHint: 'Bağlı olduqda, onlayn sifariş müştərilər üçün deaktiv edilir.',
    deliverySettingsDeliveryEnabled: 'Çatdırılma aktivdir',
    deliverySettingsTakeawayEnabled: 'Götürmə aktivdir',
    deliverySettingsGlobalMinOrder: 'Qlobal minimum sifariş',
    deliverySettingsDefaultPrep: 'Standart hazırlıq vaxtı (dəqiqə)',
    deliverySettingsDefaultPrepHint: 'Sifarişə xüsusi hazırlıq vaxtı olmadıqda istifadə olunur.',
    deliverySettingsGlobalFreeThreshold: 'Qlobal pulsuz çatdırılma həddi',
    deliverySettingsDispatchMode: 'Yola salma rejimi',
    deliverySettingsDispatchAuto: 'Avto (provayder ilə)',
    deliverySettingsDispatchManual: 'Əl ilə (personal yola salır)',
    deliverySettingsHours: 'İş saatları',
    deliverySettingsHoursHint: 'Həftənin hər günü üçün açılış və bağlanış saatlarını təyin edin.',
    deliverySettingsClosed: 'Bağlı',
    deliverySettingsOpenAt: 'Açılır',
    deliverySettingsCloseAt: 'Bağlanır',
    deliverySettingsSave: 'Ayarları yadda saxla',
    deliverySettingsSaving: 'Yadda saxlanır...',
    deliverySettingsSaved: 'Ayarlar yadda saxlanıldı',
    deliverySettingsSaveError: 'Ayarları yadda saxlamaq olmadı',
    deliverySettingsClosingSoonLabel: 'Bağlanışdan əvvəl “son çağırış” pəncərəsi (dəqiqə)',
    deliverySettingsClosingSoonHint:
      '0 söndürür. Bu müddətdə müştərilər sifarişi təsdiqləyir, amma xəbərdarlıq görür.',
    deliverySettingsPauseActive: 'Vaxtı dayanma aktivdir: {time} (Bakı).',
    deliverySettingsCancelPause: 'Dayanmanı ləğv et və indi aç',
    deliverySettingsHoursInvalid: 'Açıq günlərdə etibarlı açılış və bağlanış saatları (SS:DD) lazımdır.',
    deliverySettingsDayMon: 'B.e',
    deliverySettingsDayTue: 'Ç.a',
    deliverySettingsDayWed: 'Ç',
    deliverySettingsDayThu: 'C.a',
    deliverySettingsDayFri: 'C',
    deliverySettingsDaySat: 'Ş',
    deliverySettingsDaySun: 'B',
    deliverySettingsStatusOpenNow: 'İndi açıqdır — sifariş qəbul olunur',
    deliverySettingsStatusClosedNow: 'İndi bağlıdır — iş saatları xaricində',
    deliverySettingsStatusPaused: 'Fasilə — onlayn sifarişlər əl ilə dayandırılıb',
    deliverySettingsTodayHours: 'Bu günün saatları: {hours}',
    deliverySettingsTodayClosed: 'Bu gün bütün gün bağlıdır',
    deliverySettingsSpecialDayBadge: 'Bu gün xüsusi cədvəl',
    deliverySettingsAcceptingOrders: 'Onlayn sifarişlər qəbul olunur',
    deliverySettingsStoppedOrders: 'Bütün onlayn sifarişlər dayandırılıb',
    deliverySettingsAcceptingOrdersHint: 'Aşağıdakı saatlarda müştərilər sifariş verə bilər.',
    deliverySettingsStoppedOrdersHint: 'Bunu yenidən açana qədər yeni onlayn sifariş yoxdur (saatları ləğv edir).',
    deliverySettingsDayOpen: 'Açıq',
    deliverySettingsWeeklyHours: 'Həftəlik cədvəl',
    deliverySettingsSpecialDaysTitle: 'Xüsusi günlər və bayramlar',
    deliverySettingsSpecialDaysHint:
      'Həftəlik cədvəli ləğv edən tək günlük tarixlər. Sifariş saytında popup göstərmək üçün müştəri qeydi əlavə edin.',
    deliverySettingsSpecialDayAdd: 'Xüsusi gün əlavə et',
    deliverySettingsSpecialDayRemove: 'Sil',
    deliverySettingsSpecialDayDate: 'Tarix',
    deliverySettingsSpecialDayClosedAllDay: 'Bütün gün bağlı',
    deliverySettingsSpecialDayCustomHours: 'Xüsusi saatlar',
    deliverySettingsSpecialDayNote: 'Müştəri bildirişi (istəyə bağlı)',
    deliverySettingsSpecialDayNoteHint: 'Bu tarix aktiv olduqda order.mings.az-da popup kimi göstərilir.',
    deliverySettingsSpecialDayNoteEn: 'İngilis',
    deliverySettingsSpecialDayNoteAz: 'Azərbaycan',
    deliverySettingsSpecialDayNoteRu: 'Rus',
    deliverySettingsSpecialDayDuplicateDate: 'Hər xüsusi günün unikal tarixi olmalıdır.',
    deliverySettingsSpecialDaysInvalid: 'Xüsusi günlər üçün tarix və bağlı deyilsə etibarlı saatlar lazımdır.',
    orderSpecialDayNoticeTitle: 'Bildiriş',
    orderSpecialDayNoticeDismiss: 'Başa düşdüm',
    deliveryDispatchTitle: 'Yola salma mərkəzi',
    deliveryDispatchDescription: 'Aktiv çatdırılmaları və yola salma əməliyyatlarını idarə edin.',
    deliveryDispatchEmpty: 'Bu aralıq üçün yola salınacaq sifariş yoxdur.',
    deliveryDispatchColOrder: 'Sifariş',
    deliveryDispatchColCustomer: 'Müştəri',
    deliveryDispatchColAddress: 'Ünvan',
    deliveryDispatchColStatus: 'Status',
    deliveryDispatchColActions: 'Əməliyyatlar',
    deliveryDispatchNoWolt: 'Wolt tapşırığı yoxdur',
    deliveryDispatchManuallyDispatched: 'Əl ilə işarələnib',
    deliveryDispatchTrackOpen: 'İzləməni aç',
    deliveryDispatchTrackCopy: 'İzləmə URL-ni kopyala',
    deliveryDispatchTrackCopied: 'Kopyalandı',
    deliveryDispatchActionDispatch: 'Yola sal',
    deliveryDispatchActionMarkManual: 'Əl ilə işarələ',
    deliveryDispatchActionCancel: 'Tapşırığı ləğv et',
    deliveryDispatchInvokeError: 'Yola salma əməliyyatı uğursuz oldu',
    deliveryDispatchInvokeOk: 'Yola salma əməliyyatı tamamlandı',
    deliveryDispatchTrackingUrlPrompt: 'Kuryer izləmə URL-ni daxil edin (https://…)',
    deliveryDispatchTrackingUrlInvalid: 'Etibarlı http və ya https izləmə URL-i daxil edin',
    deliverySettingsKitchenLocationTitle: 'Mətbəx məkanı',
    deliverySettingsKitchenLocationHint:
      'Məsafə, ETA və öz kuryer tövsiyəsi üçün istifadə olunur. Boş saxlasanız standart məkan istifadə ediləcək.',
    deliverySettingsKitchenLatitude: 'Mətbəx enliyi',
    deliverySettingsKitchenLongitude: 'Mətbəx uzunluğu',
    deliverySettingsKitchenLocationInvalid:
      'Düzgün mətbəx koordinatları daxil edin (enlik: -90..90, uzunluq: -180..180).',
  },

  ru: {
    home: 'Главная',
    sales: 'Продажи',
    money: 'Деньги',
    reports: 'Отчёты',
    more: 'Ещё',
    commandCenter: 'Командный Центр',
    signedIn: 'Выполнен вход',
    navOverview: 'Обзор',
    navOrders: 'Заказы',
    navCatalog: 'Каталог',
    navFinance: 'Финансы',
    navHubIncome: 'Доходы',
    navHubSpending: 'Расходы',
    navHubCashAccounts: 'Касса и счета',
    navHubPayroll: 'Зарплата',
    navHubInsights: 'Аналитика',
    navSystem: 'Система',
    cockpitLoadingContent: 'Загрузка…',
    cockpitResetFilters: 'Сбросить фильтры',
    cockpitEmptyFilteredHint: 'Расширьте диапазон дат или сбросьте фильтры.',
    cockpitTestRecordLabel: 'Тестовая запись',
    cockpitNeedsReview: 'Требует проверки',
    cockpitReviewHighCommission: 'Комиссия необычно высокая — проверьте настройки канала.',
    cockpitReviewUnusualAmount: 'Сумма необычно большая — подтвердите перед использованием в отчётах.',
    settingsAppearance: 'Оформление',
    collapseSidebar: 'Свернуть панель',
    expandSidebar: 'Развернуть панель',
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
    halal: 'Халяль',
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
    kpiNetProfitHint: 'После банковских комиссий (₼{fees})',
    comparePreviousPeriod: 'Сравнить с прошлым периодом',
    netProfitLabel: 'Чистая прибыль',
    sourceFilter: 'Источник',
    orderSourceMix: 'Источники заказов',
    avgPrepTime: 'Среднее время готовки',
    kitchenSla: 'SLA кухни',
    paymentHealth: 'Статус оплат',
    payoutCommission: 'Комиссия платформ',
    topProducts: 'Топ продукты',
    peakHours: 'Пиковые часы',
    operationalInsights: 'Операционная аналитика',
    paidOrders: 'оплачено',
    unpaidOrders: 'не оплачено',
    cardPayments: 'карта',
    codPayments: 'наличные',
    matchedPayouts: 'Совпало',
    mismatchedPayouts: 'Расхождение',
    pendingPayouts: 'Ожидает',
    expandDetails: 'Показать расходы и выплаты',
    collapseDetails: 'Скрыть расходы и выплаты',
    viewFullReport: 'Полный отчёт',
    viewPayouts: 'Выплаты',
    revenueShare: 'доля',
    dashboardOrdersHint: 'Уникальные заказы за период',
    dashboardAovHint: 'Чистая выручка на заказ',
    dataConsistencyWarning: 'Обнаружено {count} несоответствий в агрегированных KPI.',
    pos: 'POS',

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
    deleteChannelConfirmTitle: 'Удалить канал продаж?',
    deleteChannelConfirmMessage: 'Убрать «{name}» из активных каналов? Прошлые продажи и выплаты останутся в отчётах.',
    deleteChannelError: 'Не удалось удалить канал. Попробуйте снова или обратитесь к администратору.',
    channelRemovedSuccess: 'Канал удалён.',
    systemSalesChannel: 'Системный',
    salesChannelProtectedError: 'Этот канал обязателен для приложения — его нельзя удалить или отключить.',
    dismiss: 'Закрыть',
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
    changeRole: 'Изменить роль',
    resetPassword: 'Сбросить пароль',
    newPassword: 'Новый пароль',
    confirmNewPassword: 'Подтвердите новый пароль',
    passwordResetSuccess: 'Пароль успешно обновлён',
    roleUpdated: 'Роль обновлена',
    cannotChangeOwnRole: 'Нельзя изменить собственную роль',
    passwordMinLength: 'Пароль должен содержать минимум 8 символов',

    auditLog: 'Журнал аудита',
    auditLogTitle: 'Журнал аудита',
    auditLogSubtitle: 'Действия админа, изменения в БД и входы сотрудников',
    auditLogTabActions: 'Действия админа',
    auditLogTabChanges: 'Изменения строк',
    auditLogTabSignIns: 'Входы',
    auditLogEmpty: 'Записей пока нет',
    auditLogColWhen: 'Когда',
    auditLogColWho: 'Кто',
    auditLogColAction: 'Действие',
    auditLogColResource: 'Ресурс',
    auditLogColDetails: 'Детали',
    auditLogColSurface: 'Поверхность',
    auditLogColDevice: 'Устройство',
    auditLogSurfaceCockpit: 'Командный центр',
    auditLogSurfacePos: 'Касса',
    auditLogSurfaceKds: 'Кухонный экран',
    auditLogSurfaceKiosk: 'Киоск',
    auditLogSurfaceOrderManager: 'Менеджер заказов',

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
      'Командный центр предназначен для администраторов. Ваш аккаунт работает с приложениями зала — откройте Кассу, Кухонный экран или Киоск ниже.',
    adminAccessGoToOrderManager: 'Перейти в Менеджер заказов',
    adminAccessGoToPos: 'Открыть Кассу',
    adminAccessGoToKds: 'Открыть Кухонный экран',
    adminAccessGoToKiosk: 'Открыть Киоск',
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
    updatedSuccessfully: 'Успешно обновлено!',
    deletedSuccessfully: 'Успешно удалено!',
    errorOccurred: 'Произошла ошибка',
    amountMustBePositive: 'Сумма должна быть больше нуля',
    expenseItemRequired: 'Выберите статью расхода',
    paymentMethodRequired: 'Выберите способ оплаты',
    descriptionRequired: 'Введите описание',
    expenseDateRequired: 'Выберите дату',
    quantityMustBePositive: 'Количество должно быть больше нуля',
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
    createNamed: 'Создать «{name}»',
    newItem: 'Новый элемент',
    assignToCategory: 'Назначить категорию',
    newCategory: 'Новая категория',
    newSupplierName: 'Название поставщика',
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
    kioskWelcomeTitle: 'Где вы будете есть сегодня?',
    kioskEatIn: 'В зале',
    kioskTakeOut: 'С собой',
    kioskExploreMenu: 'Изучите наше меню',
    kioskRestartMenu: 'Начать заново',
    kioskOrderNow: 'Заказать',
    kioskOrderMore: 'Ещё заказ',
    kioskDoneCountdown: 'Готово ({seconds}с)',
    kioskNoCategories: 'Нет категорий меню',
    kioskNoProducts: 'Нет доступных блюд',
    addToCart: 'В корзину',
    viewCart: 'Корзина',
    placeOrder: 'Оформить заказ',
    confirmOrder: 'Подтвердить заказ',
    kioskOrderCreateFailed: 'Не удалось оформить заказ. Попробуйте ещё раз.',
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

    kitchenDisplay: 'Экран кухни',
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
    payMethodBadgeCashPickup: 'НАЛИЧНЫЕ — оплата при получении',
    payMethodBadgeCashDelivery: 'НАЛИЧНЫЕ — оплата при доставке',
    payMethodBadgeCardAuthorizing: 'КАРТА — ждём банк (не готовить)',
    kdsPrepTimeLabel: 'Время приготовления (мин)',
    kdsBusyKitchenHint: 'Загруженная кухня? Рекомендуем 20 мин.',
    kdsCourierNoteLabel: 'Курьер',
    kdsStatusUpdating: 'Обновление…',
    kdsChannelDelivery: 'Доставка',
    kdsChannelTakeaway: 'Самовывоз',
    kdsChannelKiosk: 'Киоск',
    kdsChannelPosEatIn: 'POS · В зале',
    kdsChannelPosTakeaway: 'POS · С собой',
    kdsChannelPosDelivery: 'POS · Доставка',
    kdsFilterAll: 'Все',
    kdsSearchPlaceholder: 'Поиск #…',
    kdsHistoryTitle: 'История',
    kdsHistoryEmpty: 'Сегодня нет завершённых заказов',
    kdsUndoComplete: 'Заказ {number} завершён',
    kdsUndoSeconds: 'Отменить',
    kdsUndoButton: 'Отменить',
    kdsAllItemsPrepared: 'Все позиции готовы',
    kdsMarkItemPrepared: 'Отметить позицию готовой',
    kdsMarkItemUnprepared: 'Снять отметку готовности',
    kdsEmptyQueueTitle: 'Нет активных заказов',
    kdsEmptyQueueHint: 'Заказы с киоска и сайта появятся здесь автоматически.',
    kdsEmptyColumn: 'Пока пусто',
    kdsEmptyFiltered: 'Нет заказов по фильтру',
    kdsEmptyFilteredHint: 'Смените канал или очистите поиск.',
    kdsHistorySubtitle: 'Завершённые сегодня',

    orderManagerTitle: 'Менеджер заказов',
    orderManagerDescription: 'Отслеживайте и обрабатывайте киоск и онлайн-заказы в единой очереди',
    openOnlineOrder: 'Открыть онлайн-заказ',
    refreshOrders: 'Обновить заказы',
    totalOrders: 'Всего заказов',
    ordersInQueue: 'Заказы в очереди',
    todayRevenue: 'Выручка за сегодня',
    searchOrderManagerPlaceholder: 'Поиск по заказу #, телефону или ID',
    allSources: 'Все источники',
    allPayments: 'Все оплаты',
    unpaidOnly: 'Только неоплаченные',
    paidOnly: 'Только оплаченные',
    kioskOrders: 'Заказы с Киоска',
    cockpitQuickLinks: 'Быстрые ссылки',
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

    staff: 'Персонал и зарплаты',
    staffScreenTitle: 'Персонал и зарплаты',
    staffScreenDescription: 'Список сотрудников и журнал выплат с датами.',
    staffAddEmployee: 'Добавить сотрудника',
    staffEditEmployee: 'Редактировать сотрудника',
    staffRecordPayment: 'Записать выплату',
    staffEditPayment: 'Редактировать выплату',
    staffFullName: 'ФИО',
    staffDesignation: 'Должность',
    staffTotalSalary: 'Месячная зарплата',
    staffActiveLabel: 'Активный сотрудник',
    staffActiveEmployees: 'Активные сотрудники',
    staffMonthlyPayrollTarget: 'Целевой месячный фонд',
    staffPaidInPeriod: 'Выплачено за период',
    staffEmployee: 'Сотрудник',
    staffSelectEmployee: 'Выберите сотрудника',
    staffPaymentType: 'Тип выплаты',
    staffPaymentTypeSalary: 'Зарплата',
    staffPaymentTypeAdvance: 'Аванс',
    staffPaymentTypeBonus: 'Бонус',
    staffPaymentTypePartial: 'Частичная',
    staffNameRequired: 'Укажите имя сотрудника',
    staffInvalidSalary: 'Введите корректные суммы зарплаты',
    staffInvalidPaymentAmount: 'Введите корректную сумму выплаты',
    staffEmployeeAdded: 'Сотрудник добавлен',
    staffEmployeeUpdated: 'Сотрудник обновлён',
    staffEmployeeDeleted: 'Сотрудник удалён',
    staffPaymentAdded: 'Выплата записана',
    staffPaymentUpdated: 'Выплата обновлена',
    staffPaymentDeleted: 'Выплата удалена',
    staffDeleteEmployeeConfirm: 'Удалить сотрудника и всю историю выплат?',
    staffDeletePaymentConfirm: 'Удалить эту выплату?',
    staffNoEmployees: 'Сотрудников пока нет. Добавьте первого.',
    staffNoPaymentsInPeriod: 'Нет выплат за этот период.',
    staffInactive: 'Неактивен',
    staffNoDesignation: 'Без должности',
    staffDoubleEntryWarning: 'Записывайте зарплаты здесь, а не в категории «Зарплаты» в расходах, чтобы избежать двойного учёта.',
    staffSalariesLabel: 'Выплаченные зарплаты',
    staffSalariesHint: 'Выплаты, записанные в модуле «Персонал»',
    kpiNetProfitHintExtended: 'После банковских комиссий ₼{fees}, комиссий платформ ₼{commissions} и зарплат ₼{payroll}',

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
    payoutReceivedInto: 'Зачислено на',
    payoutReceivedIntoHint: 'На какой счёт поступила эта выплата? Баланс обновится автоматически.',
    payoutNoAccountWarning: 'Счёт не выбран — эта выплата не обновит баланс.',
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
    kitchenPausedTitle: 'Кухня на паузе',
    kitchenPausedMessage:
      'Сейчас мы не принимаем срочные заказы. Вы можете выбрать время в часы работы.',
    orderClosedPausedUntil: 'Снова онлайн примерно в {time} (время Баку).',
    orderClosedUntilNextOpen: 'Следующее открытие: {when}',
    orderClosedSchedulePromptTitle: 'Запланировать заказ',
    orderClosedSchedulePromptHint: 'Выберите слот в часы работы.',
    orderClosedScheduleAction: 'Запланировать на потом',
    closingSoonBanner:
      'Кухня скоро закроется. Заказы, оформленные сейчас, могут потребовать подтверждения кухней.',
    closingSoonCheckoutNote:
      'Мы приближаемся ко времени закрытия ({time}, Баку). Мы постараемся выполнить ваш заказ.',
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
    orderPayCashUnifiedTakeaway: 'Оплата наличными при самовывозе',
    orderPayCashUnifiedDelivery: 'Оплата наличными при доставке',
    orderPayEpoint: 'Карта онлайн',
    orderPayCardWithWallet: 'Использовать Apple Pay / Google Pay при наличии',
    orderSaveCardForFuture: 'Сохранить карту для следующих заказов',
    orderSavedCardsAvailable: 'В аккаунте сохранено карт: {count}.',
    orderPlacedTitle: 'Заказ оформлен',
    orderPlacedSubtitle: 'Мы получили ваш заказ и скоро начнём его готовить.',
    orderTrackHint: 'Статус заказа',
    orderOpenTracking: 'Открыть отслеживание',
    orderCopyTrackingLink: 'Скопировать ссылку отслеживания',
    orderCopyTrackingDone: 'Ссылка скопирована.',
    orderConfirmationOrderNumber: 'Номер заказа',
    orderConfirmationSummaryTitle: 'Состав заказа',
    orderConfirmationEtaLabel: 'Ориентировочное время',
    orderConfirmationEtaFallback: 'Скоро начнем готовить',
    orderCheckout: 'Оформить',
    orderStepFulfillment: 'Формат заказа',
    orderStepAddress: 'Адрес',
    orderStepTiming: 'Время',
    orderStepContact: 'Контакты',
    orderStepPayment: 'Оплата',
    orderStepReview: 'Проверка',
    orderFulfillmentTakeawayDisabled: 'Самовывоз отключён — только доставка.',
    orderFulfillmentTakeawayHint: 'Заберу из кухни Ming’s',
    orderFulfillmentDeliveryHint: 'Доставим по вашему адресу',
    orderOnlineDisabled: 'Онлайн-заказ отключён.',
    orderTakeawayOnlyNotice: 'Закажите заранее на самовывоз из Ming’s.',
    orderViewCart: 'К корзине',
    orderSummaryTitle: 'Сводка',
    orderAddressLabel: 'Метка',
    orderAddressStreet: 'Улица, дом, кв.',
    orderLanguage: 'Язык',
    orderSelectSavedAddress: 'Сохранённый адрес',
    orderAddressClearSelection: 'Очистить',
    orderSaveAddressForNext: 'Сохранить этот адрес',
    orderLoadingMenu: 'Загрузка меню…',
    orderYourCart: 'Ваша корзина',
    orderAuthRequired: 'Войдите в аккаунт, чтобы продолжить к оформлению.',
    orderAuthInlineHint:
      'Короткая проверка по SMS перед отправкой заказа на кухню.',
    orderAuthEmail: 'Email',
    orderAuthSms: 'SMS',
    orderAuthGoogle: 'Продолжить через Google',
    orderSignInGoogle: 'Войти через Google',
    orderSignInGoogleRedirecting: 'Переход в Google…',
    orderForgotPassword: 'Забыли пароль?',
    orderForgotPasswordSent: 'Если такой email существует, инструкция по сбросу отправлена.',
    orderSignUpInlinePrompt: 'Еще нет аккаунта?',
    orderSignUpInlineAction: 'Зарегистрироваться',
    orderEmailConfirmAfterSignup: 'Подтвердите email перед первым входом в аккаунт.',
    orderResetPasswordTitle: 'Задайте новый пароль',
    orderResetPasswordHint: 'Создайте новый пароль, чтобы завершить восстановление.',
    orderResetPasswordNew: 'Новый пароль',
    orderResetPasswordConfirm: 'Подтвердите новый пароль',
    orderResetPasswordSubmit: 'Обновить пароль',
    orderResetPasswordSuccess: 'Пароль обновлен. Вы можете продолжить пользоваться аккаунтом.',
    orderResetPasswordMismatch: 'Пароли не совпадают.',
    orderSendSmsCode: 'Отправить код',
    orderSmsCode: 'Код из SMS',
    orderVerifySms: 'Подтвердить и войти',
    orderSmsSentHint: 'Код отправлен на {phone}. Введите его ниже.',
    orderSmsResend: 'Отправить код снова',
    orderSmsResendWait: 'Повтор через {seconds}с',
    orderSmsCodeExpiredHint: 'Код истек или неверный. Запросите новый SMS-код.',
    orderSmsEnterCodeHint: 'Введите полный код из SMS (обычно 6 цифр).',
    orderSmsSendFailedHint:
      'Не удалось отправить SMS. Проверьте номер и попробуйте снова или войдите через email или Google.',
    orderSmsCodeSentConfirmation: 'Код отправлен!',
    orderChangePhone: 'Другой номер',
    orderInvalidPhone: 'Укажите номер с кодом страны (например +994…).',
    orderAccountPhone: 'Телефон',
    orderMapSearchPlaceholder: 'Поиск улицы или места…',
    orderMapNoResults: 'По Баку ничего не найдено.',
    orderMapSearchFailed: 'Не удалось выполнить поиск адреса. Повторите попытку.',
    orderMapSelectFailed: 'Не удалось определить этот адрес. Выберите другой вариант.',
    orderMapLoadFailed: 'Поиск по карте сейчас недоступен.',
    orderZonePillIn: 'Доставляем в {zone} · ₼{fee}',
    orderMapPinHint: 'Двигайте карту так, чтобы метка указывала на вход в здание.',
    orderMapLoading: 'Загрузка карты…',
    orderMapUnavailable: 'Карта недоступна. Введите адрес или используйте геолокацию.',
    orderItemNotes: 'Комментарий к позиции',
    orderItemNotesPlaceholder: 'Аллергия, без лука, поострее…',
    orderReorder: 'Повторить заказ',
    orderAddressesSection: 'Сохранённые адреса',
    orderOrdersSection: 'Заказы',
    orderAddressApartment: 'Квартира / блок',
    orderAddressFloor: 'Этаж',
    orderAddressEdit: 'Изменить',
    orderAddressDelete: 'Удалить',
    orderAddressSetDefault: 'Сделать основным',
    orderAddressCancelEdit: 'Отмена',
    orderAddressSaveChanges: 'Сохранить изменения',
    orderAddressDeleteConfirm: 'Удалить этот адрес?',
    orderOrderDate: 'Дата',
    orderFulfillmentLabel: 'Формат',
    orderTrackOrder: 'Отследить заказ',
    orderViewDetails: 'Показать детали',
    orderHideDetails: 'Скрыть детали',
    orderRemoveLine: 'Удалить позицию',
    orderDecreaseQty: 'Уменьшить количество',
    orderIncreaseQty: 'Увеличить количество',
    orderChooseFulfillmentTitle: 'Самовывоз или доставка?',
    orderScheduleNow: 'Как можно скорее',
    orderScheduleLater: 'Запланировать',
    orderScheduleFor: 'Выберите время',
    orderScheduleDay: 'День',
    orderScheduleTime: 'Время',
    orderScheduleNoSlots: 'Сейчас нет доступных слотов.',
    orderPromoCode: 'Промокод',
    orderPromoPlaceholder: 'Введите промокод',
    orderTip: 'Чаевые',
    orderOrderNotes: 'Комментарий к заказу',
    orderPaymentCodHint: 'Оплата наличными при получении',
    orderPaymentCashHint: 'Оплата наличными на кассе',
    orderPaymentCashUnifiedHintTakeaway: 'Оплатите наличными при получении в Ming’s',
    orderPaymentCashUnifiedHintDelivery: 'Оплатите наличными курьеру при доставке',
    orderPaymentEpointHint: 'Безопасная онлайн-оплата картой',
    orderPaymentExtras: 'Промокод, чаевые и комментарий',
    orderPaymentExtrasShow: 'Показать дополнительные опции',
    orderPaymentExtrasHide: 'Скрыть дополнительные опции',
    orderReviewHint: 'Проверьте детали перед подтверждением заказа.',
    orderReviewFulfillment: 'Формат заказа',
    orderReviewTiming: 'Время',
    orderReviewContact: 'Контакты',
    orderReviewPayment: 'Оплата',
    orderReviewAddress: 'Адрес',
    orderReviewAsap: 'Как можно скорее',
    orderReviewMissing: 'Не указано',
    orderContactSignedIn: 'Вы вошли в аккаунт. Заказ можно оформить.',
    orderContactGuestHint: 'Подтвердите телефон, чтобы оформить заказ.',
    orderContactVerifyHint: 'Введите SMS-код, отправленный на телефон.',
    orderAuthErrorFallback: 'Не удалось подтвердить сейчас. Попробуйте снова.',
    orderConsentLabel: 'Я принимаю',
    orderTerms: 'Условия',
    orderPrivacy: 'Конфиденциальность',
    orderRefundPolicy: 'Политику возврата',
    orderConsentRequired: 'Примите условия перед оформлением заказа.',
    orderErrInvalidEmail: 'Введите корректный email.',
    retry: 'Повторить',
    cookieConsentCopy: 'Мы используем cookies для улучшения заказа и аналитики.',
    cookieConsentAccept: 'Принять cookies',
    orderSearchMenu: 'Поиск в меню…',
    orderVenueInfoTitle: 'Ресторан',
    orderVenueHours: 'Часы',
    orderVenueAddress: 'Адрес',
    orderVenuePhone: 'Телефон',
    orderAddToCart: 'В корзину',
    orderProductNoPhotoCaption: 'Готовим свежим на заказ',
    orderFavoriteAdd: 'Добавить в избранное',
    orderFavoriteRemove: 'Убрать из избранного',
    orderSearchNoResults: 'Ничего не найдено.',
    orderCategoryEmpty: 'В этой категории пока нет блюд.',
    orderChooseOptions: 'Выбрать опции',
    orderDishSingle: 'блюдо',
    orderDishPlural: 'блюда',
    orderDeliveryDisabledInSettings:
      'Доставка отключена в базе. Включите online_settings.delivery_enabled = true в Supabase или выберите самовывоз.',
    orderCombosSection: 'Комбо',
    orderComboCustomize: 'Настроить',
    orderComboBadge: 'Комбо',
    orderPhoneFormatHint: 'Формат Азербайджана: +994 и 9 цифр.',
    orderDeliveryNotesLabel: 'Заметки для курьера',
    orderDeliveryNotesPlaceholder: 'Всё, что поможет быстрее вас найти',
    orderAddressTypeTitle: 'Куда доставить?',
    orderAddressTypeApartment: 'Квартира',
    orderAddressTypeHouse: 'Дом',
    orderAddressTypeOffice: 'Офис',
    orderAddressTypeHotel: 'Отель',
    orderAddressTypeOther: 'Другое',
    orderAddressBuildingName: 'Название здания',
    orderAddressEntrance: 'Подъезд / вход',
    orderAddressDoorNameOrNumber: 'Имя/номер на двери',
    orderAddressCompanyName: 'Название компании',
    orderAddressLeaveAt: 'Где оставить доставку?',
    orderAddressLeaveAtOffice: 'В офис',
    orderAddressLeaveAtReception: 'На ресепшен',
    orderAddressAccessMethod: 'Как попасть внутрь?',
    orderAccessIntercom: 'Домофон / звонок',
    orderAccessDoorCode: 'Код двери',
    orderAccessDoorOpen: 'Дверь открыта',
    orderAddressIntercomNameOrNumber: 'Имя/номер на домофоне',
    orderAddressDoorCode: 'Код двери',
    orderAddressAccessOtherInstructions: 'Другие инструкции для входа',
    orderSignInPromptTitle: 'Войдите для быстрого оформления',
    orderSignInPromptSubtitle: 'Google или OTP по телефону. Просмотр меню доступен без входа.',
    orderOr: 'или',
    orderLegalPassivePrefix: 'Оформляя заказ, вы соглашаетесь с',
    orderProfileCompletionTitle: 'Заполните профиль',
    orderProfileCompletionSubtitle: 'Подтвердите имя и примите политики для продолжения.',
    orderProfileFirstName: 'Имя',
    orderProfileLastName: 'Фамилия',
    orderProfilePhoneOptional: 'Телефон (необязательно)',
    orderProfilePhoneOptionalHint: 'Если пропустить, подтверждение телефона потребуется на checkout.',
    orderProfileCompletionSave: 'Сохранить и продолжить',
    orderProfileCompletionNameRequired: 'Имя и фамилия обязательны.',
    orderProfileCompletionConsentRequired: 'Примите Условия, Политику конфиденциальности и возврата.',
    orderProfileCompletionPending: 'Перед заказом завершите заполнение профиля.',
    orderPhoneVerificationRequired: 'Перед заказом подтвердите телефон.',
    orderCheckoutAuthTitle: 'Войдите, чтобы оформить заказ',
    orderCheckoutAuthHelper: 'Отслеживайте заказ и получайте обновления по доставке.',
    orderCheckoutAuthGooglePhoneNext: 'Телефон вы подтвердите следующим шагом.',
    orderCheckoutAuthSmsCta: 'Продолжить через SMS-код',
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
    comboBuilderEmptyGroup: 'Этот шаг комбо сейчас недоступен.',
    comboBuilderEmptyCombo: 'Для этого комбо не настроены шаги.',

    orderErrGeneric: 'Не удалось оформить заказ. Попробуйте снова.',
    orderErrAuthRequired: 'Войдите в аккаунт, чтобы оформить заказ.',
    orderErrCartEmpty: 'Корзина пуста.',
    orderErrPhoneRequired: 'Требуется номер телефона.',
    orderErrPhoneInvalid: 'Укажите корректный номер с кодом страны.',
    orderErrOnlineUnavailable: 'Онлайн-заказы сейчас недоступны.',
    orderErrTakeawayDisabled: 'Самовывоз сейчас недоступен.',
    orderErrDeliveryDisabled: 'Доставка сейчас недоступна.',
    orderErrLocationRequired: 'Укажите точку доставки на карте.',
    orderErrAddressRequired: 'Введите адрес доставки.',
    orderErrOutsideZone: 'Ваш адрес вне зоны доставки.',
    orderErrMinimumOrder: 'Сумма заказа ниже минимальной.',
    orderErrZoneMinimumOrder: 'Сумма заказа ниже минимума для этой зоны.',
    orderErrPaymentInitFailed: 'Не удалось начать оплату. Попробуйте снова.',
    orderErrScheduleRequired: 'Выберите время для запланированного заказа.',
    orderErrScheduleInvalid: 'Выбранное время недействительно.',
    orderErrScheduleTooSoon: 'Выберите более поздний слот.',
    orderErrInvalidQuantity: 'У одной или нескольких позиций в корзине неверное количество.',
    orderErrKitchenClosed: 'Кухня сейчас не принимает онлайн-заказы.',
    orderErrKitchenPaused: 'Кухня временно на паузе. Попробуйте запланировать время или зайдите позже.',
    orderErrScheduleWhilePaused: 'Это время ещё внутри паузы кухни. Выберите более поздний слот.',
    orderErrScheduleOutsideHours: 'Это время вне часов работы. Выберите другой слот.',
    orderPayCodDescription: 'Оплата при получении или курьеру.',
    orderPayCashDescription: 'Наличные в ресторане.',
    orderPayEpointDescription: 'Безопасная оплата картой на платежной странице.',
    orderCheckoutSummary: 'Итого',
    orderCheckoutBrand: "Ming's",
    orderProfileSection: 'Профиль',
    orderAddressDefaultBadge: 'По умолчанию',
    orderAddressHomeLabel: 'Дом',
    orderPromoCodePlaceholder: 'MINGS10',
    orderZonePillChecking: 'Проверяем зону доставки…',

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
    trackScheduledForLabel: 'Запланировано на:',
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
    omMenuEditorUpdateFailed: 'Не удалось обновить позицию меню. Попробуйте войти снова.',
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
    omAll: 'Все',
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
    omSourcePos: 'POS',
    omTitle: 'Менеджер заказов',
    posTitle: 'Касса',
    posTabActive: 'Активные',
    posTabHistory: 'История',
    posTabNewOrder: 'Новый заказ',
    posTabSettings: 'Настройки',
    posSettingsTitle: 'Печать',
    posPrintAgentUrl: 'URL агента печати',
    posPrinterProfile: 'Профиль принтера',
    posProfileEscpos80: 'ESC/POS · 80mm',
    posProfileZpl58: 'ZPL · 58mm',
    posProfileZpl40x30: 'ZPL · 40×30mm',
    posTestConnection: 'Проверить связь',
    posTestPrint: 'Тестовая печать',
    posAgentConnected: 'Агент печати доступен',
    posAgentUnreachable: 'Агент печати недоступен',
    posTestPrintSent: 'Тестовая этикетка отправлена',
    posTestPrintFailed: 'Тестовая печать не удалась',
    posFulfillmentEatIn: 'В зале',
    posFulfillmentTakeaway: 'С собой',
    posFulfillmentDelivery: 'Доставка',
    posSourceEatIn: 'POS · В зале',
    posSourceTakeaway: 'POS · С собой',
    posSourceDelivery: 'POS · Доставка',
    posCustomerPanelTitle: 'Клиент',
    posCustomerName: 'Имя (необяз.)',
    posCustomerPhone: 'Телефон (необяз.)',
    posOrderNotes: 'Заметки к заказу',
    posDeliveryPanelTitle: 'Адрес доставки',
    posCartTitle: 'Корзина',
    posCartEmpty: 'Корзина пуста',
    posSubmitOrder: 'Создать заказ',
    posSubmitFailed: 'Не удалось создать заказ',
    posOrderCreated: 'Заказ создан',
    posViewActiveOrders: 'К активным заказам',
    posNewOrderTitle: 'Новый заказ',
    posOutsideZone: 'Адрес вне зоны доставки',
    posDeliveryRequired: 'Укажите адрес и метку на карте',
    posReprintLabels: 'Перепечатать этикетки',
    posPrintSent: 'Этикетки отправлены на печать',
    posPrintPending: 'В очереди — агент offline',
    posPrintFailed: 'Печать не удалась',
    posPrintPendingCount: '{count} заданий ждут агента печати',
    posMapSearch: 'Поиск адреса в Баку',
    posMapPinHint: 'Перетащите метку или нажмите на карту',
    posMapsUnavailable: 'Карта недоступна',
    omKitchenStatusTitle: 'Онлайн-кухня',
    omKitchenStatusOnline: 'Принимаем заказы',
    omKitchenStatusPausedUntil: 'Пауза до {time}',
    omKitchenStatusOffline: 'Офлайн (без новых заказов)',
    omKitchenStatusClosed: 'Закрыто по часам',
    omKitchenPause30: 'Пауза 30 мин',
    omKitchenPause60: 'Пауза 1 час',
    omKitchenPauseUntilNextOpen: 'До следующего открытия',
    omKitchenPauseIndefinite: 'Офлайн до ручного включения',
    omKitchenResume: 'Открыть сейчас',
    omKitchenStatusHint: 'После паузы клиенты могут планировать, если есть слоты.',
    omKitchenNoNextOpen: 'Следующее открытие не найдено — проверьте часы в настройках доставки.',
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
    orderSupport: 'Поддержка заказов',
    orderSupportDescription: 'Отслеживайте и поддерживайте операции заказов в реальном времени',
    orderSupportOpenOrderPage: 'Открыть страницу заказа',
    orderSupportFilter_all: 'Все',
    orderSupportFilter_active: 'Активные',
    orderSupportFilter_dispatched: 'Отправлено',
    orderSupportFilter_completed: 'Завершено',
    orderSupportFilter_cancelled: 'Отменено',
    orderSupportOrdersFound: 'заказов найдено',
    orderSupportSourceAll: 'Все источники',
    orderSupportSearch: 'Поиск по заказу #, клиенту, телефону',
    orderSupportNoOrders: 'Для этого фильтра заказы не найдены',
    orderSupportColTime: 'Время',
    orderSupportColCustomer: 'Клиент',
    orderSupportColItems: 'Позиции',
    orderSupportColTotal: 'Сумма',
    orderSupportColStatus: 'Статус',
    orderSupportOrderActions: 'Действия по заказу',
    orderSupportPrepareQuick: 'Начать готовку (15 мин)',
    orderSupportScheduledHint:
      'Заказ по расписанию. Настройку напоминаний лучше делать в менеджере заказов; здесь можно просмотреть детали.',
    payments: 'Платежи',
    paymentsScreenTitle: 'Платежи',
    paymentsScreenDescription: 'Просмотр онлайн-платежей, несоответствий и повторная проверка статуса у провайдера',
    paymentsFilterAll: 'Все',
    paymentsFilterPending: 'Ожидание',
    paymentsFilterSuccess: 'Оплачено',
    paymentsFilterFailed: 'Ошибка',
    paymentsProviderAll: 'Все провайдеры',
    paymentsSearch: 'Поиск по заказу #, клиенту, телефону, id транзакции',
    paymentsFound: 'платежей найдено',
    paymentsNoRows: 'Для этого фильтра платежи не найдены',
    paymentsColTime: 'Время',
    paymentsColOrder: 'Заказ',
    paymentsColCustomer: 'Клиент',
    paymentsColAmount: 'Сумма',
    paymentsColProvider: 'Провайдер',
    paymentsColPaymentStatus: 'Платёж',
    paymentsColSaleStatus: 'Продажа',
    paymentsColMismatch: 'Расхождение',
    paymentsMismatchYes: 'Расхождение',
    paymentsDetailProvider: 'Провайдер',
    paymentsDetailClientOrderId: 'Client order id',
    paymentsDetailTransactionId: 'Id транзакции',
    paymentsDetailProviderStatus: 'Статус провайдера',
    paymentsDetailPaidAt: 'Оплачено в',
    paymentsDetailError: 'Ошибка',
    paymentsDetailRawPayload: 'Сырой payload',
    paymentsRecheckButton: 'Повторно проверить статус у провайдера',
    paymentsRechecking: 'Проверка…',
    paymentsRecheckSuccess: 'Статус провайдера обновлён. Список обновлён.',
    paymentsRecheckFailed: 'Повторная проверка не удалась',
    paymentsRecheckForbidden: 'Только менеджеры и админы могут повторно проверять статус платежа',
    paymentsStatusPending: 'Ожидание',
    paymentsStatusSuccess: 'Оплачено',
    paymentsStatusFailed: 'Ошибка',
    paymentsProviderEpoint: 'Epoint',
    paymentsProviderUnited: 'United Payment',
    paymentsProviderOther: 'Другое',
    cashDebt: 'Касса и счета',
    cashDebtScreenTitle: 'Касса и долги',
    cashDebtScreenDescription: 'Кредиты, прочие обязательства и комиссии за снятие с банка.',
    cashDebtTabLoans: 'Кредиты и прочее',
    cashDebtTabWithdrawals: 'Снятия с банка',
    outstandingDebtLabel: 'Непогашенный долг',
    outstandingDebtHint: 'Счета поставщиков + кредиты (баланс)',
    supplierOutstanding: 'Долг',
    supplierPayButton: 'Оплатить поставщику',
    supplierOpeningBalance: 'Начальный остаток',
    supplierOpeningBalanceDate: 'Остаток на дату',
    supplierAddDebt: 'Добавить долг',
    supplierDebtHistory: 'История долга',
    supplierDebtCleared: 'Погашено',
    supplierCreditBalance: 'Кредитный баланс',
    supplierDebtFromPurchase: 'Закупка (в долг)',
    supplierManualDebt: 'Ручной долг',
    supplierClearDebt: 'Погасить долг',
    supplierAccountView: 'Счёт',
    supplierRecentPayments: 'Недавние платежи',
    supplierAccountExplainer:
      'Баланс поставщика — это текущий счёт: закупки в долг увеличивают его, платежи уменьшают. Гасите через «Погасить долг».',
    supplierYouOwe: 'Долг',
    supplierPrepaid: 'Переплата',
    supplierSettled: 'Оплачено',
    supplierStatement: 'Выписка по счёту',
    supplierBalanceColumn: 'Баланс',
    supplierPaymentLabel: 'Платёж',
    supplierAddDebtHint: 'Только для сумм не из учтённой закупки (например, начальный долг, который уже был).',
    supplierNoActivity: 'Пока нет закупок или платежей.',
    supplierSearchPlaceholder: 'Поиск поставщиков…',
    supplierNoMatches: 'Нет поставщиков по вашему запросу.',
    supplierTotalSpend: 'Всего потрачено',
    purchaseOnAccountHint: 'Добавляет эту закупку к балансу поставщика, пока вы её не оплатите.',
    purchasePaidNowHint: 'Списывает эту закупку с выбранного счёта сразу.',
    purchaseOnAccount: 'В долг',
    purchasePaidNow: 'Оплачено сразу',
    purchasePaymentMode: 'Оплата',
    purchaseDiscountPercent: 'Скидка поставщика %',
    purchaseDiscountCustom: 'Своя',
    purchaseListTotal: 'Сумма по прайсу',
    purchaseDiscountAmount: 'Скидка',
    purchaseNetTotal: 'Итого с учётом скидки',
    purchaseSetDefaultDiscount: 'Сохранить как скидку по умолчанию',
    liabilityAdd: 'Добавить обязательство',
    liabilityEdit: 'Изменить обязательство',
    liabilityRecordPayment: 'Записать платёж',
    liabilityEditPayment: 'Изменить платёж',
    liabilityDeleteConfirm: 'Удалить это обязательство и все платежи?',
    liabilityDeletePaymentConfirm: 'Удалить этот платёж?',
    liabilityPaymentHistory: 'История платежей',
    liabilityDueDate: 'Срок погашения',
    liabilityTypeLoan: 'Кредит',
    liabilityTypeOther: 'Прочее',
    liabilityCounterparty: 'Контрагент',
    liabilityLenderOwedTo: 'Кредитор / кому должны',
    liabilityLenderHelp: 'Кому вы должны — банк, друг и т.д. Долг поставщикам — на экране Поставщики.',
    cashDebtLoansHelp: 'Для банковских кредитов и личных долгов. Долг поставщикам — на экране Поставщики.',
    liabilityEmpty: 'Кредитов и прочих обязательств пока нет.',
    liabilityStatusOpen: 'Открыто',
    liabilityStatusPartial: 'Частично оплачено',
    liabilityStatusSettled: 'Закрыто',
    withdrawalLog: 'Записать снятие',
    withdrawalMethodCashier: 'Касса (0.5%)',
    withdrawalMethodAbbAtm: 'ABB ATM (1%, мин. ₼1)',
    withdrawalFeePreview: 'Банковская комиссия',
    withdrawalFeesPeriodTotal: 'Комиссии в списке',
    withdrawalEmpty: 'Снятий пока не записано.',
    withdrawalAvailableInAccount: 'Доступно на счёте {account}: {available}',
    withdrawalInsufficientFunds: 'Недостаточно средств на счёте {account}. Доступно: {available}.',
    withdrawalMethod: 'Способ',
    withdrawalFee: 'Комиссия',
    posPaymentMethod: 'Способ оплаты',
    posPayCash: 'Наличные',
    posPayCard: 'Карта',
    cashDrawerTab: 'Касса',
    cashOnHand: 'Наличные в кассе',
    cashOnHandHint: 'Сколько наличных должно быть сейчас',
    accountCash: 'Наличные в кассе',
    accountBank: 'Основной (банковский) счёт',
    accountCard: 'Карточный счёт',
    accountBalancesTitle: 'Остатки по счетам',
    accountBankHint: 'Сюда поступают выплаты; чековые снятия отсюда',
    accountCardHint: 'Пополняется переводами; для снятий в банкомате',
    accountManage: 'Управление счетами',
    accountSetupTitle: 'Настройка счетов',
    accountCurrentBalance: 'Текущий',
    accountTransferAction: 'Перевести',
    accountActivityTitle: 'Движение по счетам',
    accountActivityEmpty: 'Пока нет движений по банку или карте.',
    accountActivityFilterAll: 'Все счета',
    accountLedgerOpening: 'Начальный остаток',
    accountLedgerTransferIn: 'Перевод (приход)',
    accountLedgerTransferOut: 'Перевод (расход)',
    accountLedgerWithdrawal: 'Снятие',
    accountLedgerExpense: 'Расход',
    accountLedgerPurchase: 'Закупка',
    accountLedgerPayout: 'Полученная выплата',
    accountLedgerManagedElsewhere: 'Управляется на экране «Расходы»',
    accountLedgerManagedPayouts: 'Управляется на экране «Выплаты»',
    accountTransferDeleted: 'Перевод удалён',
    accountOpeningBalance: 'Начальный остаток',
    accountOpeningDate: 'На дату',
    accountOpeningBalanceSaved: 'Начальный остаток сохранён',
    accountTransferBankToCard: 'Перевод основной → карта',
    accountTransferSaved: 'Перевод записан',
    paymentCash: 'Наличные',
    paymentCard: 'Карта',
    paymentBankTransfer: 'Банковский перевод',
    selectPaymentMethod: 'Выберите способ оплаты',
    withdrawalMethodCardAccount: 'Карточный счёт (ABB ATM, 1%, мин. ₼1)',
    cashDrawerTitle: 'Касса',
    cashDrawerSubtitle: 'Учитывайте наличные, чтобы сверять кассу в конце месяца.',
    cashOpeningBalance: 'Начальный остаток',
    cashClosingBalance: 'Конечный остаток',
    cashInTotal: 'Приход наличных',
    cashOutTotal: 'Расход наличных',
    cashFromOrders: 'Собранные наличные заказы',
    cashFromWithdrawals: 'Снятия из банка (за вычетом комиссий)',
    cashFromPayouts: 'Полученные наличные выплаты',
    cashAdjustmentsIn: 'Начальная касса и корректировки',
    cashToExpenses: 'Наличные расходы',
    cashToPurchases: 'Наличные закупки',
    cashToSuppliers: 'Наличные поставщикам',
    cashToLiabilities: 'Наличные по кредитам',
    cashBankDeposits: 'Внесения в банк и корректировки',
    cashMovementLog: 'Движения наличных',
    cashMovementEmpty: 'Пока нет ручных движений наличных.',
    cashAddMovement: 'Добавить движение',
    cashMovementCategory: 'Категория',
    cashCategoryOpeningFloat: 'Начальная касса',
    cashCategoryBankDeposit: 'Внесение в банк',
    cashCategoryAdjustment: 'Корректировка',
    cashCategoryOther: 'Другое',
    cashMovementDirection: 'Направление',
    cashDirectionIn: 'Приход',
    cashDirectionOut: 'Расход',
    cashMovementAdded: 'Движение наличных добавлено',
    cashMovementDeleted: 'Движение наличных удалено',
    deliveryScreenTitle: 'Доставка',
    orderLocations: 'Карта заказов',
    orderLocationsTitle: 'Карта заказов доставки',
    orderLocationsSubtitle: 'Смотрите, откуда приходят заказы на доставку в Баку — одна точка на заказ.',
    orderLocationsEmpty: 'За этот период нет адресов доставки. Расширьте диапазон дат или смените фильтр источника.',
    orderLocationsLoading: 'Загрузка карты…',
    orderLocationsUnavailable: 'Добавьте VITE_GOOGLE_MAPS_API_KEY для карты заказов.',
    orderLocationsMapHint: 'Нажмите на точку для деталей заказа. Карта ограничена Баку.',
    orderLocationsTotalOrders: 'Заказы с адресом',
    orderLocationsSourceAll: 'Вся доставка',
    orderLocationsSourceOnline: 'Доставка с сайта',
    orderLocationsSourcePos: 'Доставка POS',
    orderLocationsOrderLabel: 'Заказ',
    deliveryScreenDescription: 'Управляйте зонами, правилами кухни и ручной отправкой',
    deliveryRefresh: 'Обновить данные доставки',
    deliveryTabZones: 'Зоны',
    deliveryTabSettings: 'Настройки',
    deliveryTabDispatch: 'Отправка',
    deliveryZonesTitle: 'Зоны доставки',
    deliveryZonesDescription: 'Настройте активные полигоны покрытия и правила тарификации.',
    deliveryZonesNew: 'Новая зона',
    deliveryZonesEmptyTitle: 'Пока нет зон доставки',
    deliveryZonesEmptyHint: 'Создайте первую зону для расчета доставки по адресу.',
    deliveryZonesColName: 'Название',
    deliveryZonesColVertices: 'Вершины',
    deliveryZonesColFee: 'Стоимость',
    deliveryZonesColMinOrder: 'Мин. заказ',
    deliveryZonesColActive: 'Активно',
    deliveryZonesColActions: 'Действия',
    deliveryZoneNewTitle: 'Создать зону доставки',
    deliveryZoneEditTitle: 'Редактировать зону доставки',
    deliveryZoneFieldName: 'Название зоны',
    deliveryZoneFieldFee: 'Стоимость доставки',
    deliveryZoneFieldMinOrder: 'Минимальный заказ',
    deliveryZoneFieldFreeThreshold: 'Порог бесплатной доставки',
    deliveryZoneFieldSortOrder: 'Порядок сортировки',
    deliveryZoneFieldActive: 'Активно',
    deliveryZoneFieldPolygon: 'Полигон зоны',
    deliveryZonePolygonHint: 'Кликайте по карте, чтобы добавить точки (мин. 3). Дважды кликните или нажмите первую точку, чтобы завершить.',
    deliveryZoneClearShape: 'Очистить форму',
    deliveryZonePolygonRequired: 'Полигон обязателен',
    deliveryZonePreview: 'Предпросмотр зоны',
    deliveryZonePreviewLoading: 'Загрузка карты...',
    deliveryZonePreviewUnavailable: 'Карта недоступна',
    deliveryZonePreviewEmpty: 'Полигона пока нет',
    deliveryZoneVertices: 'вершин',
    deliveryZoneSave: 'Сохранить зону',
    deliveryZoneSaving: 'Сохранение...',
    deliveryZoneSaveError: 'Не удалось сохранить зону',
    deliveryZoneDeleteConfirm: 'Удалить зону {name}?',
    deliveryZoneDeleteError: 'Не удалось удалить зону',
    deliveryZoneToggleError: 'Не удалось обновить статус зоны',
    deliverySettingsTitle: 'Настройки доставки',
    deliverySettingsDescription: 'Управляйте доступностью кухни, временем готовки и режимом отправки.',
    deliverySettingsKitchenOpen: 'Кухня открыта',
    deliverySettingsKitchenOpenHint: 'Когда кухня закрыта, онлайн-заказы отключены для клиентов.',
    deliverySettingsDeliveryEnabled: 'Доставка включена',
    deliverySettingsTakeawayEnabled: 'Самовывоз включен',
    deliverySettingsGlobalMinOrder: 'Глобальный минимальный заказ',
    deliverySettingsDefaultPrep: 'Время готовки по умолчанию (мин)',
    deliverySettingsDefaultPrepHint: 'Используется, если для заказа не задано отдельное время.',
    deliverySettingsGlobalFreeThreshold: 'Глобальный порог бесплатной доставки',
    deliverySettingsDispatchMode: 'Режим отправки',
    deliverySettingsDispatchAuto: 'Авто (через провайдера)',
    deliverySettingsDispatchManual: 'Вручную (персонал отправляет)',
    deliverySettingsHours: 'Часы работы',
    deliverySettingsHoursHint: 'Укажите время открытия и закрытия для каждого дня недели.',
    deliverySettingsClosed: 'Закрыто',
    deliverySettingsOpenAt: 'Открытие',
    deliverySettingsCloseAt: 'Закрытие',
    deliverySettingsSave: 'Сохранить настройки',
    deliverySettingsSaving: 'Сохранение...',
    deliverySettingsSaved: 'Настройки сохранены',
    deliverySettingsSaveError: 'Не удалось сохранить настройки',
    deliverySettingsClosingSoonLabel: 'Окно «последний заказ» (минут до закрытия)',
    deliverySettingsClosingSoonHint:
      '0 — выкл. В этом окне заказы принимаются, но показывается предупреждение о скором закрытии.',
    deliverySettingsPauseActive: 'Активна пауза до {time} (Баку).',
    deliverySettingsCancelPause: 'Снять паузу и открыть сейчас',
    deliverySettingsHoursInvalid: 'Для открытых дней укажите корректное время открытия и закрытия (ЧЧ:ММ).',
    deliverySettingsDayMon: 'Пн',
    deliverySettingsDayTue: 'Вт',
    deliverySettingsDayWed: 'Ср',
    deliverySettingsDayThu: 'Чт',
    deliverySettingsDayFri: 'Пт',
    deliverySettingsDaySat: 'Сб',
    deliverySettingsDaySun: 'Вс',
    deliverySettingsStatusOpenNow: 'Сейчас открыто — принимаем заказы',
    deliverySettingsStatusClosedNow: 'Сейчас закрыто — вне рабочих часов',
    deliverySettingsStatusPaused: 'Пауза — онлайн-заказы остановлены вручную',
    deliverySettingsTodayHours: 'Часы сегодня: {hours}',
    deliverySettingsTodayClosed: 'Сегодня закрыто весь день',
    deliverySettingsSpecialDayBadge: 'Сегодня особый график',
    deliverySettingsAcceptingOrders: 'Принимаем онлайн-заказы',
    deliverySettingsStoppedOrders: 'Все онлайн-заказы остановлены',
    deliverySettingsAcceptingOrdersHint: 'Клиенты могут заказывать в указанные ниже часы.',
    deliverySettingsStoppedOrdersHint: 'Новых онлайн-заказов нет, пока вы не включите снова (отменяет часы).',
    deliverySettingsDayOpen: 'Открыто',
    deliverySettingsWeeklyHours: 'Еженедельный график',
    deliverySettingsSpecialDaysTitle: 'Особые дни и праздники',
    deliverySettingsSpecialDaysHint:
      'Разовые даты, которые заменяют недельный график. Добавьте заметку для клиентов — она покажется на сайте заказов.',
    deliverySettingsSpecialDayAdd: 'Добавить особый день',
    deliverySettingsSpecialDayRemove: 'Удалить',
    deliverySettingsSpecialDayDate: 'Дата',
    deliverySettingsSpecialDayClosedAllDay: 'Закрыто весь день',
    deliverySettingsSpecialDayCustomHours: 'Особые часы',
    deliverySettingsSpecialDayNote: 'Сообщение для клиентов (необязательно)',
    deliverySettingsSpecialDayNoteHint: 'Показывается на order.mings.az, когда эта дата активна.',
    deliverySettingsSpecialDayNoteEn: 'Английский',
    deliverySettingsSpecialDayNoteAz: 'Азербайджанский',
    deliverySettingsSpecialDayNoteRu: 'Русский',
    deliverySettingsSpecialDayDuplicateDate: 'У каждого особого дня должна быть уникальная дата.',
    deliverySettingsSpecialDaysInvalid: 'Для особых дней нужна дата и корректные часы, если не закрыто весь день.',
    orderSpecialDayNoticeTitle: 'Уведомление',
    orderSpecialDayNoticeDismiss: 'Понятно',
    deliveryDispatchTitle: 'Центр отправки',
    deliveryDispatchDescription: 'Управляйте активными доставками и действиями отправки.',
    deliveryDispatchEmpty: 'Нет заказов для отправки в этом диапазоне.',
    deliveryDispatchColOrder: 'Заказ',
    deliveryDispatchColCustomer: 'Клиент',
    deliveryDispatchColAddress: 'Адрес',
    deliveryDispatchColStatus: 'Статус',
    deliveryDispatchColActions: 'Действия',
    deliveryDispatchNoWolt: 'Нет задачи Wolt',
    deliveryDispatchManuallyDispatched: 'Отмечено вручную',
    deliveryDispatchTrackOpen: 'Открыть трекинг',
    deliveryDispatchTrackCopy: 'Скопировать URL трекинга',
    deliveryDispatchTrackCopied: 'Скопировано',
    deliveryDispatchActionDispatch: 'Отправить',
    deliveryDispatchActionMarkManual: 'Отметить вручную',
    deliveryDispatchActionCancel: 'Отменить задачу',
    deliveryDispatchInvokeError: 'Ошибка действия отправки',
    deliveryDispatchInvokeOk: 'Действие отправки выполнено',
    deliveryDispatchTrackingUrlPrompt: 'Введите URL отслеживания курьера (https://…)',
    deliveryDispatchTrackingUrlInvalid: 'Введите корректный URL отслеживания (http или https)',
    deliverySettingsKitchenLocationTitle: 'Локация кухни',
    deliverySettingsKitchenLocationHint:
      'Используется для расстояния, ETA и рекомендаций по собственной доставке. Если пусто — используется локация по умолчанию.',
    deliverySettingsKitchenLatitude: 'Широта кухни',
    deliverySettingsKitchenLongitude: 'Долгота кухни',
    deliverySettingsKitchenLocationInvalid:
      'Введите корректные координаты кухни (широта: -90..90, долгота: -180..180).',
  },
};
