import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, AlertCircle, Truck, ShoppingCart, History, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, Supplier } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface Purchase {
  id: string;
  product_id: string;
  supplier_id: string | null;
  category_id: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string;
  suppliers?: { name: string };
  categories?: {
    name: string;
  };
}

export function ProductsScreen() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [showInlineProductForm, setShowInlineProductForm] = useState(false);
  const [showInlineSupplierForm, setShowInlineSupplierForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost_price: '',
    barcode: '',
    quantity: '',
    min_stock_level: '10',
    category_id: '',
    supplier_id: '',
    unit: 'pcs',
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: '',
    unit_cost: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending' as const,
    notes: ''
  });

  const [inlineProductData, setInlineProductData] = useState({
    name: '',
    description: '',
    cost_price: '',
    unit: 'pcs',
    supplier_id: ''
  });

  const [inlineCategoryData, setInlineCategoryData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const [inlineSupplierData, setInlineSupplierData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, suppliers(*)')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data);
    }
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setSuppliers(data);
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'purchase')
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const loadPurchases = async (productId: string) => {
    const { data } = await supabase
      .from('purchases')
      .select('*, suppliers(name)')
      .eq('product_id', productId)
      .order('purchase_date', { ascending: false });

    if (data) {
      setPurchases(data as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description,
      selling_price: 0,
      cost_price: Number(formData.cost_price) || 0,
      barcode: formData.barcode || null,
      quantity: Number(formData.quantity) || 0,
      min_stock_level: Number(formData.min_stock_level) || 10,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit,
    };

    if (editingProduct) {
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert([productData]);
    }

    resetForm();
    loadProducts();
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = Number(purchaseFormData.quantity) || 0;
    const unitCost = Number(purchaseFormData.unit_cost) || 0;

    const purchaseData = {
      product_id: purchaseFormData.product_id || (viewingProduct?.id || null),
      supplier_id: purchaseFormData.supplier_id || null,
      quantity,
      unit_cost: unitCost,
      total_cost: quantity * unitCost,
      purchase_date: purchaseFormData.purchase_date,
      payment_status: purchaseFormData.payment_status,
      notes: purchaseFormData.notes
    };

    if (editingPurchase) {
      await supabase
        .from('purchases')
        .update(purchaseData)
        .eq('id', editingPurchase.id);
    } else {
      await supabase
        .from('purchases')
        .insert(purchaseData);

      if (purchaseData.product_id) {
        const product = products.find(p => p.id === purchaseData.product_id);
        if (product) {
          await supabase
            .from('products')
            .update({ quantity: (product.quantity || 0) + quantity })
            .eq('id', purchaseData.product_id);
        }
      }
    }

    if (viewingProduct) {
      loadPurchases(viewingProduct.id);
    }
    resetPurchaseForm();
    loadProducts();
  };

  const handleCreateInlineProduct = async () => {
    if (!inlineProductData.name) {
      alert('Please enter product name');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: inlineProductData.name,
        description: inlineProductData.description,
        cost_price: Number(inlineProductData.cost_price) || 0,
        unit: inlineProductData.unit,
        supplier_id: inlineProductData.supplier_id || null,
        selling_price: 0,
        quantity: 0,
        min_stock_level: 10,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      alert(`Error creating product: ${error.message}`);
      return;
    }

    if (data) {
      await loadProducts();
      setPurchaseFormData({ ...purchaseFormData, product_id: data.id });
      setInlineProductData({ name: '', description: '', cost_price: '', unit: 'pcs', supplier_id: '' });
      setShowInlineProductForm(false);
    }
  };

  const handleCreateInlineCategory = async () => {
    if (!inlineCategoryData.name) return;

    const { data } = await supabase
      .from('categories')
      .insert({
        name: inlineCategoryData.name,
        description: inlineCategoryData.description,
        type: 'purchase',
        color: inlineCategoryData.color,
        icon: 'circle'
      })
      .select()
      .single();

    if (data) {
      await loadCategories();
      setPurchaseFormData({ ...purchaseFormData, category_id: data.id });
      setInlineCategoryData({ name: '', description: '', color: '#3B82F6' });
      setShowInlineCategoryForm(false);
    }
  };

  const handleCreateInlineSupplier = async () => {
    if (!inlineSupplierData.name) return;

    const { data } = await supabase
      .from('suppliers')
      .insert({
        name: inlineSupplierData.name,
        contact_person: inlineSupplierData.contact_person,
        phone: inlineSupplierData.phone,
        email: inlineSupplierData.email,
        is_active: true
      })
      .select()
      .single();

    if (data) {
      await loadSuppliers();
      setPurchaseFormData({ ...purchaseFormData, supplier_id: data.id });
      setInlineSupplierData({ name: '', contact_person: '', phone: '', email: '' });
      setShowInlineSupplierForm(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cost_price: '',
      barcode: '',
      quantity: '',
      min_stock_level: '10',
      category_id: '',
      supplier_id: '',
      unit: 'pcs',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      product_id: '',
      supplier_id: '',
      quantity: '',
      unit_cost: '',
      purchase_date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      notes: ''
    });
    setEditingPurchase(null);
    setShowPurchaseForm(false);
    setShowQuickPurchase(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      cost_price: product.cost_price?.toString() || '',
      barcode: product.barcode || '',
      quantity: product.quantity?.toString() || '',
      min_stock_level: product.min_stock_level?.toString() || '10',
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
      unit: (product as any).unit || 'pcs',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setDeleteConfirm(null);
    loadProducts();
  };

  const handleViewPurchases = (product: Product) => {
    setViewingProduct(product);
    setPurchaseFormData({ ...purchaseFormData, product_id: product.id });
    loadPurchases(product.id);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setPurchaseFormData({
      product_id: purchase.product_id,
      category_id: purchase.category_id || '',
      supplier_id: purchase.supplier_id || '',
      quantity: purchase.quantity.toString(),
      unit_cost: purchase.unit_cost.toString(),
      purchase_date: purchase.purchase_date.split('T')[0],
      payment_status: purchase.payment_status,
      notes: purchase.notes
    });
    setShowPurchaseForm(true);
  };

  const handleDeletePurchase = async (id: string) => {
    await supabase.from('purchases').delete().eq('id', id);
    if (viewingProduct) {
      loadPurchases(viewingProduct.id);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.quantity <= (p.min_stock_level || 0));

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-teal-100 dark:bg-teal-900 p-2 sm:p-3 rounded-xl">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-teal-700 dark:text-teal-300" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t.products}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQuickPurchase(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Purchase</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{t.addProduct}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg">{t.manageInventory}</p>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-orange-900 mb-1">{t.lowStockAlert}</h3>
              <p className="text-sm text-orange-800">
                {lowStockProducts.length} product(s) are running low on stock
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder={t.searchProducts}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingProduct ? t.editProduct : t.addNewProduct}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.barcode}</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cost Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Unit of Measurement *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pcs">{t.pieces}</option>
                    <option value="kg">{t.kilogram}</option>
                    <option value="g">{t.gram}</option>
                    <option value="l">{t.liter}</option>
                    <option value="ml">{t.milliliter}</option>
                    <option value="box">{t.box}</option>
                    <option value="pack">{t.pack}</option>
                    <option value="unit">{t.unitSingle}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.stockQuantity}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.lowStockAlert}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.category}</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t.selectCategory}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.supplier}</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t.noSupplier}</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.description}</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
                >
                  {editingProduct ? t.update : t.add} {t.product}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showQuickPurchase || (showPurchaseForm && viewingProduct)) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingPurchase ? 'Edit Purchase' : 'Add Purchase Entry'}
              </h2>
              <button
                onClick={resetPurchaseForm}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Product *
                  </label>
                  {showInlineProductForm ? (
                    <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Create New Product</span>
                        <button
                          type="button"
                          onClick={() => setShowInlineProductForm(false)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Product Name *"
                        value={inlineProductData.name}
                        onChange={(e) => setInlineProductData({ ...inlineProductData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost Price"
                          value={inlineProductData.cost_price}
                          onChange={(e) => setInlineProductData({ ...inlineProductData, cost_price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <select
                          value={inlineProductData.unit}
                          onChange={(e) => setInlineProductData({ ...inlineProductData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pcs">{t.pieces}</option>
                          <option value="kg">{t.kilogram}</option>
                          <option value="g">{t.gram}</option>
                          <option value="l">{t.liter}</option>
                          <option value="ml">{t.milliliter}</option>
                          <option value="box">{t.box}</option>
                          <option value="pack">{t.pack}</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateInlineProduct}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Create & Select
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={purchaseFormData.product_id}
                        onChange={(e) => {
                          if (e.target.value === '_new_') {
                            setShowInlineProductForm(true);
                          } else {
                            setPurchaseFormData({ ...purchaseFormData, product_id: e.target.value });
                          }
                        }}
                        disabled={!!viewingProduct}
                        required
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      >
                        <option value="">Select Product</option>
                        <option value="_new_" className="font-medium text-blue-600">+ Create New Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>


                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Supplier (Optional)
                  </label>
                  {showInlineSupplierForm ? (
                    <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Create New Supplier</span>
                        <button
                          type="button"
                          onClick={() => setShowInlineSupplierForm(false)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Supplier Name *"
                        value={inlineSupplierData.name}
                        onChange={(e) => setInlineSupplierData({ ...inlineSupplierData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Contact Person"
                          value={inlineSupplierData.contact_person}
                          onChange={(e) => setInlineSupplierData({ ...inlineSupplierData, contact_person: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={inlineSupplierData.phone}
                          onChange={(e) => setInlineSupplierData({ ...inlineSupplierData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateInlineSupplier}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Create & Select
                      </button>
                    </div>
                  ) : (
                    <select
                      value={purchaseFormData.supplier_id}
                      onChange={(e) => {
                        if (e.target.value === '_new_') {
                          setShowInlineSupplierForm(true);
                        } else {
                          setPurchaseFormData({ ...purchaseFormData, supplier_id: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">No Supplier</option>
                      <option value="_new_" className="font-medium text-blue-600">+ Create New Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseFormData.quantity}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, quantity: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Unit Cost (₼) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseFormData.unit_cost}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, unit_cost: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={purchaseFormData.purchase_date}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchase_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Payment Status *
                  </label>
                  <select
                    value={purchaseFormData.payment_status}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, payment_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={purchaseFormData.notes}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Cost:</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ₼{((Number(purchaseFormData.quantity) || 0) * (Number(purchaseFormData.unit_cost) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetPurchaseForm}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingPurchase ? 'Update' : 'Add'} Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingProduct && !showPurchaseForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingProduct.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Purchase History</p>
              </div>
              <button
                onClick={() => {
                  setViewingProduct(null);
                  setPurchases([]);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => setShowPurchaseForm(true)}
                className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Add Purchase
              </button>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No purchases yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Unit Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {purchases.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {new Date(purchase.purchase_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {purchase.categories?.name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {purchase.suppliers?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {purchase.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          ₼{purchase.unit_cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          ₼{purchase.total_cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            purchase.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : purchase.payment_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {purchase.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditPurchase(purchase)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((product) => {
          const isDeleting = deleteConfirm === product.id;

          return (
          <div key={product.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all ${isDeleting ? 'ring-2 ring-red-500' : ''}`}>
            {isDeleting ? (
              <div className="space-y-4">
                <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                  Are you sure you want to delete "{product.name}"?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{product.name}</h3>
                    {product.barcode && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Barcode: {product.barcode}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

            {product.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">{t.costPrice}</p>
                <p className="text-lg font-bold text-orange-600">₼{(product.cost_price || 0).toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">{t.stock}</p>
                <p className={`text-lg font-bold ${(product.quantity || 0) <= (product.min_stock_level || 0) ? 'text-red-600' : 'text-blue-600'}`}>
                  {product.quantity || 0} {(product as any).unit || 'pcs'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {product.category_id && (() => {
                const category = categories.find(c => c.id === product.category_id);
                return category ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <Package className="w-3.5 h-3.5" />
                    <span>{category.name}</span>
                  </div>
                ) : null;
              })()}
              {product.suppliers && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{product.suppliers.name}</span>
                </div>
              )}
              <button
                onClick={() => handleViewPurchases(product)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                View Purchases
              </button>
            </div>
            </>
            )}
          </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t.noProductsFound}</p>
        </div>
      )}
    </div>
  );
}
