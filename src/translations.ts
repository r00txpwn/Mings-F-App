export type Language = 'en' | 'az' | 'ru';

export interface Translations {
  // Navigation
  home: string;
  sales: string;
  money: string;
  reports: string;
  more: string;

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
  week: string;
  month: string;
  custom: string;
  startDate: string;
  endDate: string;
  orders: string;
  aov: string;

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

  // Income/Expense
  addIncome: string;
  addExpense: string;
  amount: string;
  description: string;
  category: string;
  date: string;
  income: string;
  expense: string;
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
  completed: string;
  cancelled: string;
  unpaid: string;
  allStatuses: string;
  filterByStatus: string;
  noKioskOrders: string;
  viewKiosk: string;

  // Product extensions
  kioskVisible: string;
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
}

export const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    sales: 'Sales',
    money: 'Money',
    reports: 'Reports',
    more: 'More',

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
    week: 'Week',
    month: 'Month',
    custom: 'Custom',
    startDate: 'Start Date',
    endDate: 'End Date',
    orders: 'Orders',
    aov: 'AOV',

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

    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    income: 'Income',
    expense: 'Expense',
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
    completed: 'Completed',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    allStatuses: 'All Statuses',
    filterByStatus: 'Filter by Status',
    noKioskOrders: 'No kiosk orders yet',
    viewKiosk: 'View Kiosk',

    kioskVisible: 'Show on Kiosk',
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
  },

  az: {
    home: 'Əsas',
    sales: 'Satışlar',
    money: 'Pul',
    reports: 'Hesabatlar',
    more: 'Daha çox',

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
    week: 'Həftə',
    month: 'Ay',
    custom: 'Xüsusi',
    startDate: 'Başlama Tarixi',
    endDate: 'Bitmə Tarixi',
    orders: 'Sifarişlər',
    aov: 'Orta Sifariş',

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

    addIncome: 'Gəlir əlavə et',
    addExpense: 'Xərc əlavə et',
    amount: 'Məbləğ',
    description: 'Təsvir',
    category: 'Kateqoriya',
    date: 'Tarix',
    income: 'Gəlir',
    expense: 'Xərc',
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
    completed: 'Tamamlandı',
    cancelled: 'Ləğv edildi',
    unpaid: 'Ödənilməyib',
    allStatuses: 'Bütün Statuslar',
    filterByStatus: 'Statusa görə filtr',
    noKioskOrders: 'Hələ kiosk sifarişi yoxdur',
    viewKiosk: 'Kiosku Aç',

    kioskVisible: 'Kioskda göstər',
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
  },

  ru: {
    home: 'Главная',
    sales: 'Продажи',
    money: 'Деньги',
    reports: 'Отчёты',
    more: 'Ещё',

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
    week: 'Неделя',
    month: 'Месяц',
    custom: 'Настраиваемый',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    orders: 'Заказы',
    aov: 'Ср. чек',

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

    addIncome: 'Добавить доход',
    addExpense: 'Добавить расход',
    amount: 'Сумма',
    description: 'Описание',
    category: 'Категория',
    date: 'Дата',
    income: 'Доход',
    expense: 'Расход',
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
    completed: 'Завершён',
    cancelled: 'Отменён',
    unpaid: 'Не оплачен',
    allStatuses: 'Все Статусы',
    filterByStatus: 'Фильтр по статусу',
    noKioskOrders: 'Заказов с киоска пока нет',
    viewKiosk: 'Открыть Киоск',

    kioskVisible: 'Показать на киоске',
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
  },
};
