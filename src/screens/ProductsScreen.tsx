import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, AlertCircle, Truck, ShoppingCart, History, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, Product, Supplier } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { DangerConfirmRow } from '../components/ui/DangerConfirmRow';
import { IconActionButton } from '../components/ui/IconActionButton';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { isOnCreditFromPurchase, purchaseCreditFields } from '../services/finance/purchaseCredit';
import { computePurchaseTotalCost, getCogsDefaultDiscountPercent } from '../lib/cogsDiscount';
import { formatFinanceMoney, roundFinanceMoney, FINANCE_AMOUNT_STEP } from '../lib/money';

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
  discount_percent?: number;
  purchase_date: string;
  payment_status: 'pending' | 'partial' | 'paid';
  is_on_credit?: boolean;
  notes: string;
  suppliers?: { name: string };
  categories?: {
    name: string;
  };
}

interface PurchaseFormData {
  product_id: string;
  category_id: string;
  supplier_id: string;
  quantity: string;
  unit_cost: string;
  discount_percent: number;
  purchase_date: string;
  is_on_credit: boolean;
  notes: string;
}

export function ProductsScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [savingInline, setSavingInline] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    selling_price: '',
    barcode: '',
    quantity: '',
    min_stock_level: '10',
    category_id: '',
    supplier_id: '',
    unit: 'pcs',
    kiosk_visible: true,
    online_visible: true,
    image_url: '',
  });

  const [purchaseFormData, setPurchaseFormData] = useState<PurchaseFormData>({
    product_id: '',
    category_id: '',
    supplier_id: '',
    quantity: '',
    unit_cost: '',
    discount_percent: getCogsDefaultDiscountPercent(),
    purchase_date: new Date().toISOString().split('T')[0],
    is_on_credit: true,
    notes: ''
  });

  const [inlineProductData, setInlineProductData] = useState({
    name: '',
    description: '',
    cost_price: '',
    unit: 'pcs',
    supplier_id: ''
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
      .from('master_categories')
      .select('id, name')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

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
      setPurchases(data as Purchase[]);
    }
  };

  const reconcileProductStock = async (productId: string | null | undefined, deltaQuantity: number) => {
    if (!productId || !deltaQuantity) return;

    const { data: product, error } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single();

    if (error || !product) return;

    await adminUpdate('products', productId, {
      quantity: Number(product.quantity || 0) + deltaQuantity,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;

    const productData = {
      name: formData.name,
      description: formData.description,
      selling_price: Number(formData.selling_price) || 0,
      cost_price: Number(formData.cost_price) || 0,
      barcode: formData.barcode || null,
      quantity: Number(formData.quantity) || 0,
      min_stock_level: Number(formData.min_stock_level) || 10,
      master_category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit,
      kiosk_visible: formData.kiosk_visible,
      online_visible: formData.online_visible,
      image_url: formData.image_url || null,
    };

    setSavingProduct(true);
    const result = editingProduct
      ? await adminUpdate('products', editingProduct.id, productData)
      : await adminInsert('products', productData);
    setSavingProduct(false);

    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }

    toast.success(editingProduct ? t.updatedSuccessfully : t.savedSuccessfully);
    resetForm();
    loadProducts();
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPurchase) return;

    const quantity = roundFinanceMoney(Number(purchaseFormData.quantity) || 0);
    const unitCost = roundFinanceMoney(Number(purchaseFormData.unit_cost) || 0);
    const discountPercent = Number(purchaseFormData.discount_percent) || 0;

    const purchaseData = {
      product_id: purchaseFormData.product_id || (viewingProduct?.id || null),
      supplier_id: purchaseFormData.supplier_id || null,
      quantity,
      unit_cost: unitCost,
      discount_percent: roundFinanceMoney(discountPercent),
      total_cost: computePurchaseTotalCost(quantity, unitCost, discountPercent),
      purchase_date: purchaseFormData.purchase_date,
      notes: purchaseFormData.notes,
      ...purchaseCreditFields(purchaseFormData.is_on_credit),
    };

    setSavingPurchase(true);
    let result;
    if (editingPurchase) {
      const oldProductId = editingPurchase.product_id || null;
      const oldQuantity = Number(editingPurchase.quantity) || 0;
      const newProductId = purchaseData.product_id || null;
      const newQuantity = quantity;

      result = await adminUpdate('purchases', editingPurchase.id, purchaseData);

      if (result.ok) {
        if (oldProductId && newProductId && oldProductId === newProductId) {
          await reconcileProductStock(newProductId, newQuantity - oldQuantity);
        } else {
          await reconcileProductStock(oldProductId, -oldQuantity);
          await reconcileProductStock(newProductId, newQuantity);
        }
      }
    } else {
      result = await adminInsert('purchases', purchaseData);
      if (result.ok) {
        await reconcileProductStock(purchaseData.product_id, quantity);
      }
    }
    setSavingPurchase(false);

    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }

    toast.success(editingPurchase ? t.updatedSuccessfully : t.savedSuccessfully);
    if (viewingProduct) {
      loadPurchases(viewingProduct.id);
    }
    resetPurchaseForm();
    loadProducts();
  };

  const handleCreateInlineProduct = async () => {
    if (!inlineProductData.name) {
      toast.error(t.errorOccurred);
      return;
    }
    if (savingInline) return;

    setSavingInline(true);
    const result = await adminInsert<{ id: string }>('products', {
      name: inlineProductData.name,
      description: inlineProductData.description,
      cost_price: Number(inlineProductData.cost_price) || 0,
      unit: inlineProductData.unit,
      supplier_id: inlineProductData.supplier_id || null,
      selling_price: 0,
      quantity: 0,
      min_stock_level: 10,
    });
    setSavingInline(false);

    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }

    const data = result.data;

    if (data) {
      toast.success(t.savedSuccessfully);
      await loadProducts();
      setPurchaseFormData({ ...purchaseFormData, product_id: data.id });
      setInlineProductData({ name: '', description: '', cost_price: '', unit: 'pcs', supplier_id: '' });
      setShowInlineProductForm(false);
    }
  };

  const handleCreateInlineSupplier = async () => {
    if (!inlineSupplierData.name || savingInline) return;

    setSavingInline(true);
    const result = await adminInsert<{ id: string }>('suppliers', {
      name: inlineSupplierData.name,
      contact_person: inlineSupplierData.contact_person,
      phone: inlineSupplierData.phone,
      email: inlineSupplierData.email,
      is_active: true,
    });
    setSavingInline(false);

    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }

    const data = result.data;

    if (data) {
      toast.success(t.savedSuccessfully);
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
      selling_price: '',
      barcode: '',
      quantity: '',
      min_stock_level: '10',
      category_id: '',
      supplier_id: '',
      unit: 'pcs',
      kiosk_visible: true,
      online_visible: true,
      image_url: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      product_id: '',
      category_id: '',
      supplier_id: '',
      quantity: '',
      unit_cost: '',
      discount_percent: getCogsDefaultDiscountPercent(),
      purchase_date: new Date().toISOString().split('T')[0],
      is_on_credit: true,
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
      selling_price: product.selling_price?.toString() || '',
      barcode: product.barcode || '',
      quantity: product.quantity?.toString() || '',
      min_stock_level: product.min_stock_level?.toString() || '10',
      category_id: product.master_category_id || product.category_id || '',
      supplier_id: product.supplier_id || '',
      unit: (product as Product & { unit?: string }).unit || 'pcs',
      kiosk_visible: product.kiosk_visible !== false,
      online_visible: product.online_visible !== false,
      image_url: product.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const result = await adminDelete('products', id);
    setDeletingId(null);
    setDeleteConfirm(null);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.deletedSuccessfully);
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
      discount_percent: purchase.discount_percent ?? getCogsDefaultDiscountPercent(),
      purchase_date: purchase.purchase_date.split('T')[0],
      is_on_credit: isOnCreditFromPurchase(purchase),
      notes: purchase.notes
    });
    setShowPurchaseForm(true);
  };

  const handleDeletePurchase = async (id: string) => {
    if (deletingId) return;
    const purchase = purchases.find(p => p.id === id);
    setDeletingId(id);
    const result = await adminDelete('purchases', id);
    if (!result.ok) {
      setDeletingId(null);
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    await reconcileProductStock(purchase?.product_id, -(Number(purchase?.quantity) || 0));
    setDeletingId(null);
    toast.success(t.deletedSuccessfully);
    if (viewingProduct) {
      loadPurchases(viewingProduct.id);
    }
    loadProducts();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.quantity <= (p.min_stock_level || 0));

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={t.products}
        description={t.manageInventory}
        eyebrow={t.inventory}
        icon={Package}
        actions={
          <>
            <button onClick={() => setShowQuickPurchase(true)} className="neon-btn-secondary px-4 sm:px-5">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t.addPurchase}</span>
            </button>
            <button onClick={() => setShowForm(true)} className="neon-btn-primary px-4 sm:px-5">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t.addProduct}</span>
            </button>
          </>
        }
      />

      {lowStockProducts.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <h3 className="mb-1 font-semibold text-amber-800 dark:text-amber-200">{t.lowStockAlert}</h3>
              <p className="text-sm text-amber-700 dark:text-amber-100/90">
                {lowStockProducts.length} product(s) are running low on stock
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="cockpit-panel-solid mb-6 p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchProducts}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cockpit-input w-full pl-12 pr-4 py-3"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.productName} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.barcode}</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.costPrice} *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.sellingPriceLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.unitOfMeasurement} *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="cockpit-select"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.lowStockAlert}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.category}</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="cockpit-select"
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
                    className="cockpit-select"
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
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t.productImage}</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-cockpit-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kiosk_visible}
                    onChange={(e) => setFormData({ ...formData, kiosk_visible: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cockpit-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cockpit-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.kioskVisible}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={formData.online_visible}
                    onChange={(e) => setFormData({ ...formData, online_visible: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.onlineVisible}</span>
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
                  disabled={savingProduct}
                  className="flex flex-1 items-center justify-center gap-2 px-4 py-3 bg-cockpit-600 hover:bg-cockpit-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
                {editingPurchase ? t.editPurchase : t.addPurchase}
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
                          className="cockpit-select"
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
                        disabled={savingInline}
                        className="flex w-full items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingInline ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
                        className="cockpit-select flex-1 disabled:opacity-50"
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
                        disabled={savingInline}
                        className="flex w-full items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingInline ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
                      className="cockpit-select"
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
                    step={FINANCE_AMOUNT_STEP}
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
                    step={FINANCE_AMOUNT_STEP}
                    min="0"
                    value={purchaseFormData.unit_cost}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, unit_cost: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t.purchaseDiscountPercent}
                  </label>
                  <input
                    type="number"
                    step={FINANCE_AMOUNT_STEP}
                    min="0"
                    max="100"
                    value={purchaseFormData.discount_percent}
                    onChange={(e) =>
                      setPurchaseFormData({
                        ...purchaseFormData,
                        discount_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Date *
                  </label>
                  <SingleDatePicker
                    value={purchaseFormData.purchase_date}
                    onChange={(date) => setPurchaseFormData({ ...purchaseFormData, purchase_date: date })}
                    placeholder={t.date}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t.purchasePaymentMode}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseFormData({ ...purchaseFormData, is_on_credit: true })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        purchaseFormData.is_on_credit
                          ? 'border-cockpit-500 bg-cockpit-500/20 text-white'
                          : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t.purchaseOnAccount}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseFormData({ ...purchaseFormData, is_on_credit: false })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        !purchaseFormData.is_on_credit
                          ? 'border-cockpit-500 bg-cockpit-500/20 text-white'
                          : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t.purchasePaidNow}
                    </button>
                  </div>
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
                      ₼
                      {formatFinanceMoney(
                        computePurchaseTotalCost(
                          Number(purchaseFormData.quantity) || 0,
                          Number(purchaseFormData.unit_cost) || 0,
                          purchaseFormData.discount_percent,
                        ),
                      )}
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
                  disabled={savingPurchase}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPurchase ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
                {t.addPurchase}
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
                            <IconActionButton
                              onClick={() => handleEditPurchase(purchase)}
                              icon={<Edit2 className="h-4 w-4" />}
                              tone="edit"
                              label="Edit purchase"
                              className="h-8 w-8"
                            />
                            <IconActionButton
                              onClick={() => handleDeletePurchase(purchase.id)}
                              icon={<Trash2 className="h-4 w-4" />}
                              tone="danger"
                              label="Delete purchase"
                              className="h-8 w-8"
                            />
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
          <div key={product.id} className={`cockpit-panel-solid p-5 transition-all ${isDeleting ? 'ring-2 ring-red-500' : ''}`}>
            {isDeleting ? (
              <div className="space-y-4">
                <DangerConfirmRow
                  message={`Are you sure you want to delete "${product.name}"?`}
                  onConfirm={() => handleDelete(product.id)}
                  onCancel={() => setDeleteConfirm(null)}
                />
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
                    <IconActionButton
                      onClick={() => handleEdit(product)}
                      icon={<Edit2 className="h-4 w-4" />}
                      tone="edit"
                      label={t.edit}
                    />
                    <IconActionButton
                      onClick={() => setDeleteConfirm(product.id)}
                      icon={<Trash2 className="h-4 w-4" />}
                      tone="danger"
                      label={t.delete}
                    />
                  </div>
                </div>

            {product.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800/60">
                <p className="mb-1 text-xs text-slate-500">{t.costPrice}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₼{(product.cost_price || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800/60">
                <p className="mb-1 text-xs text-slate-500">{t.stock}</p>
                <p className={`text-lg font-bold ${(product.quantity || 0) <= (product.min_stock_level || 0) ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                  {product.quantity || 0} {(product as Product & { unit?: string }).unit || 'pcs'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {product.master_category_id && (() => {
                const category = categories.find(c => c.id === product.master_category_id);
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
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ShoppingCart className="w-4 h-4" />
                {t.purchases}
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
