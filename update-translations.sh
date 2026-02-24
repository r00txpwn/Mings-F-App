#!/bin/bash

# This script updates hardcoded strings with translation keys across all screen files

# ProductsScreen.tsx updates
sed -i "s/Products & Services/{t.products}/g" src/screens/ProductsScreen.tsx
sed -i "s/Manage your inventory and pricing/{t.manageInventory}/g" src/screens/ProductsScreen.tsx
sed -i "s/>Add Product</{t.addProduct}</g" src/screens/ProductsScreen.tsx
sed -i "s/Low Stock Alert/{t.lowStockAlert}/g" src/screens/ProductsScreen.tsx
sed -i "s/Search products.../{t.searchProducts}/g" src/screens/ProductsScreen.tsx
sed -i "s/'Edit Product'/{t.editProduct}/g" src/screens/ProductsScreen.tsx
sed -i "s/'Add New Product'/{t.addNewProduct}/g" src/screens/ProductsScreen.tsx
sed -i "s/Product Name/{t.productName}/g" src/screens/ProductsScreen.tsx
sed -i "s/>Barcode</{t.barcode}</g" src/screens/ProductsScreen.tsx
sed -i "s/Cost Price/{t.costPrice}/g" src/screens/ProductsScreen.tsx
sed -i "s/Unit of Measurement/{t.unitOfMeasurement}/g" src/screens/ProductsScreen.tsx
sed -i "s/Stock Quantity/{t.stockQuantity}/g" src/screens/ProductsScreen.tsx
sed -i "s/>Supplier</{t.supplier}</g" src/screens/ProductsScreen.tsx
sed -i "s/No Supplier/{t.noSupplier}/g" src/screens/ProductsScreen.tsx
sed -i "s/Description/{t.description}/g" src/screens/ProductsScreen.tsx
sed -i "s/>Cancel</{t.cancel}</g" src/screens/ProductsScreen.tsx
sed -i "s/>Update</{t.update}</g" src/screens/ProductsScreen.tsx
sed -i "s/>Product</{t.product}</g" src/screens/ProductsScreen.tsx
sed -i "s/>Stock</{t.stock}</g" src/screens/ProductsScreen.tsx
sed -i "s/No Category/{t.noCategory}/g" src/screens/ProductsScreen.tsx
sed -i "s/No products found/{t.noProductsFound}/g" src/screens/ProductsScreen.tsx

echo "Translation updates complete!"
