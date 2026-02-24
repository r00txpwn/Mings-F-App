#!/usr/bin/env python3
import re

# Define all translation mappings
translations = {
    # Products Screen
    'Products & Services': 't.products',
    'Manage your inventory and pricing': 't.manageInventory',
    'Add Product': 't.addProduct',
    'Low Stock Alert': 't.lowStockAlert',
    'Search products...': 't.searchProducts',
    'Edit Product': 't.editProduct',
    'Add New Product': 't.addNewProduct',
    'Product Name': 't.productName',
    'Barcode': 't.barcode',
    'Cost Price': 't.costPrice',
    'Unit of Measurement': 't.unitOfMeasurement',
    'Stock Quantity': 't.stockQuantity',
    'Supplier': 't.supplier',
    'No Supplier': 't.noSupplier',
    'No Category': 't.noCategory',
    'No products found': 't.noProductsFound',
    'Category': 't.category',
    'Description': 't.description',
    'Cancel': 't.cancel',
    'Update': 't.update',
    'Product': 't.product',
    'Stock': 't.stock',
    'Pieces (pcs)': 't.pieces',
    'Kilogram (kg)': 't.kilogram',
    'Gram (g)': 't.gram',
    'Liter (l)': 't.liter',
    'Milliliter (ml)': 't.milliliter',
    'Box': 't.box',
    'Pack': 't.pack',
    'Unit': 't.unitSingle',

    # Purchases Screen
    'Purchases': 't.purchases',
    'Track product purchases from suppliers': 't.trackPurchases',
    'New Purchase': 't.newPurchase',
    'Edit Purchase': 't.editPurchase',
    'Select product': 't.selectProduct',
    'Select supplier': 't.selectSupplier',
    'Cost (₼)': 't.cost',
    'Purchase Date': 't.purchaseDate',
    'Payment Status': 't.paymentStatus',
    'Pending': 't.pending',
    'Partial': 't.partial',
    'Paid': 't.paid',
    'Additional notes about this purchase...': 't.additionalNotes',
    'Update Purchase': 't.updatePurchase',
    'Create Purchase': 't.createPurchase',
    'No purchases yet': 't.noPurchasesYet',
    'Start tracking product purchases from suppliers': 't.startTracking',
    'Create First Purchase': 't.createFirstPurchase',
    'Delete this purchase?': 't.deletePurchaseConfirm',
    'Total Cost': 't.totalCost',
    'New': 't.new',
    'Date': 't.date',
    'Status': 't.status',
    'Notes': 't.notes',
    'Actions': 't.actions',

    # Suppliers Screen
    'Suppliers': 't.suppliers',
    'Manage your suppliers': 't.manageSuppliers',
    'Add Supplier': 't.addSupplier',
    'Edit Supplier': 't.editSupplier',
    'Add New Supplier': 't.addNewSupplier',
    'Supplier Name': 't.supplierName',
    'Contact Person': 't.contactPerson',
    'Email': 't.email',
    'Phone': 't.phone',
    'Address': 't.address',
    'Enter supplier name': 't.enterSupplierName',
    'Enter contact person': 't.enterContactPerson',
    'Enter email': 't.enterEmail',
    'Enter phone number': 't.enterPhone',
    'Enter address': 't.enterAddress',
    'Enter notes': 't.enterNotes',
    'Contact:': 't.contact',
    'Email:': 't.email + ":"',
    'Phone:': 't.phone + ":"',
    'Address:': 't.address + ":"',
    'No suppliers yet. Add your first supplier to get started.': 't.noSuppliersYet',
    'Active': 't.active',
    'Inactive': 't.inactive',
    'Save': 't.save',
    'Delete': 't.delete',

    # Users Screen
    'Users': 't.users',
    'Manage user accounts': 't.manageUsers',
    'Add New User': 't.addNewUser',
    'Create New User': 't.createNewUser',
    'Email Address': 't.emailAddress',
    'Password': 't.password',
    'Confirm Password': 't.confirmPassword',
    'user@example.com': 't.emailPlaceholder',
    'Minimum 6 characters': 't.passwordPlaceholder',
    'Re-enter password': 't.confirmPasswordPlaceholder',
    'Creating...': 't.creating',
    'Create User': 't.createUser',
    'Please fill in all fields': 't.fillAllFields',
    'Passwords do not match': 't.passwordsDontMatch',
    'Password must be at least 6 characters': 't.passwordTooShort',
    'Not authenticated': 't.notAuthenticated',
    'User created successfully': 't.userCreated',
    'User deleted successfully': 't.userDeleted',
    'Are you sure you want to delete this user?': 't.deleteUserConfirm',
    'No users found': 't.noUsersFound',
    'Last Sign In': 't.lastSignIn',
    'Never': 't.never',
    'User': 't.user',
    'Created': 't.createdAt',

    # Money/Home Screen
    'Overview and insights': 't.overview',
    'Period': 't.period',
    'Today': 't.today',
    'Week': 't.week',
    'Month': 't.month',
    'Custom': 't.custom',
    'Start Date': 't.startDate',
    'End Date': 't.endDate',
    'Orders': 't.orders',
    'AOV': 't.aov',
    'Sales by Channel': 't.salesByChannel',
    'Food Cost %': 't.foodCost',
    'COGS': 't.cogs',
    'Sales': 't.sales',
    '% share': 't.share',

    # Sales Screen
    'Record a new sale': 't.recordSale',
    'Sales Channel': 't.salesChannels',
    'Number of Orders': 't.numberOfOrders',
    'Transaction Date': 't.transactionDate',
    'Recent Sales': 't.recentSales',
    'No sales recorded yet': 't.noSalesYet',
    'Are you sure you want to delete this sale?': 't.deleteSaleConfirm',

    # Money Screen
    'Track sales, expenses, and purchases': 't.trackMoney',
    'Total Sales': 't.totalSales',
    'Operational Expenses': 't.operationalExpenses',
    'Net Profit': 't.netProfit',
    'Sales Income': 't.salesIncome',
    'Product Purchases': 't.productPurchases',
    'Amount': 't.amount',
    'Payment Method': 't.paymentMethod',
    'Cash, Card, Bank Transfer...': 't.paymentPlaceholder',
    'Saved successfully': 't.savedSuccessfully',
    'No expenses recorded yet': 't.noExpensesYet',
    'Quantity': 't.quantity',

    # Reports Screen
    'Financial insights and analytics': 't.financialInsights',
    'Category Breakdown': 't.categoryBreakdown',
    'Master Category Breakdown': 't.masterCategoryBreakdown',
    'Transaction History': 't.transactionHistory',
    'of sales': 't.ofSales',
    'of total expenses': 't.ofExpenses',
    'transactions': 't.transactions',
    'Type': 't.type',

    # Login Screen
    'Welcome Back': 't.welcomeBack',
    'Sign in to your account': 't.signInToAccount',
    'Sign In': 't.signIn',
    'Please wait...': 't.pleaseWait',
    'Business Management System': 't.businessManagement',
}

def update_file(filepath, mappings):
    """Update a file with translation mappings"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        for english, translation_key in mappings.items():
            # Replace in different contexts: between quotes, in JSX text, etc.
            patterns = [
                (f'"{english}"', f'{{{translation_key}}}'),
                (f"'{english}'", f'{{{translation_key}}}'),
                (f'>{english}<', f'>{{{translation_key}}}<'),
                (f'placeholder="{english}"', f'placeholder={{{translation_key}}}'),
            ]

            for pattern, replacement in patterns:
                if pattern in content:
                    content = content.replace(pattern, replacement)
                    print(f'  Replaced: {english} -> {translation_key}')

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'✓ Updated {filepath}')
            return True
        else:
            print(f'- No changes needed for {filepath}')
            return False

    except Exception as e:
        print(f'✗ Error updating {filepath}: {e}')
        return False

# Update all screen files
files = [
    'src/screens/ProductsScreen.tsx',
    'src/screens/PurchasesScreen.tsx',
    'src/screens/SuppliersScreen.tsx',
    'src/screens/UsersScreen.tsx',
    'src/screens/MoneyScreen.tsx',
    'src/screens/HomeScreen.tsx',
    'src/screens/SalesScreen.tsx',
    'src/screens/ReportsScreen.tsx',
    'src/screens/LoginScreen.tsx',
]

print('Starting translation updates...\n')

for filepath in files:
    print(f'Processing {filepath}...')
    update_file(filepath, translations)
    print()

print('Translation updates complete!')
