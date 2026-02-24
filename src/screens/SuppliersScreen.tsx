import { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Save, X, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Supplier } from '../lib/supabase';

export function SuppliersScreen() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSuppliers();
    loadProductCounts();
  }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (data) {
      setSuppliers(data);
    }
  };

  const loadProductCounts = async () => {
    const { data } = await supabase
      .from('products')
      .select('supplier_id');

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((product) => {
        if (product.supplier_id) {
          counts[product.supplier_id] = (counts[product.supplier_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setIsAdding(false);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (isAdding) {
      await supabase.from('suppliers').insert({
        name: formData.name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
      });
    } else if (editingId) {
      await supabase
        .from('suppliers')
        .update({
          name: formData.name,
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
        })
        .eq('id', editingId);
    }

    handleCancel();
    loadSuppliers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('suppliers').delete().eq('id', id);
    setDeleteConfirm(null);
    loadSuppliers();
    loadProductCounts();
  };

  const handleToggleActive = async (supplier: Supplier) => {
    await supabase
      .from('suppliers')
      .update({ is_active: !supplier.is_active })
      .eq('id', supplier.id);
    loadSuppliers();
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-6 h-6 text-gray-900 dark:text-white" />
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t.suppliers}</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.manageSuppliers}</p>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {isAdding ? t.addNewSupplier : t.editSupplier}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
                placeholder={t.enterSupplierName}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t.contactPerson}</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
                placeholder={t.enterContactPerson}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t.email}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
                placeholder={t.enterEmail}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t.phone}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
                placeholder={t.enterPhone}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t.address}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
                placeholder={t.enterAddress}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t.notes}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white resize-none"
                placeholder={t.enterNotes}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => {
          const isDeleting = deleteConfirm === supplier.id;

          return (
          <div
            key={supplier.id}
            className={`bg-white dark:bg-gray-800 border rounded-lg p-5 transition-all ${
              isDeleting ? 'ring-2 ring-red-500' : supplier.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 opacity-60'
            }`}
          >
            {isDeleting ? (
              <div className="space-y-4">
                <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                  Delete "{supplier.name}"? Associated products will be unlinked.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(supplier.id)}
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">{supplier.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(supplier.id)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

            <div className="space-y-2 mb-3">
              {supplier.contact_person && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t.contact}</span> {supplier.contact_person}
                </p>
              )}
              {supplier.email && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t.email + ":"}</span> {supplier.email}
                </p>
              )}
              {supplier.phone && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t.phone + ":"}</span> {supplier.phone}
                </p>
              )}
              {supplier.address && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t.address + ":"}</span> {supplier.address}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Package className="w-3.5 h-3.5" />
                <span>{productCounts[supplier.id] || 0} products</span>
              </div>
              <button
                onClick={() => handleToggleActive(supplier)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  supplier.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {supplier.is_active ? t.active : t.inactive}
              </button>
            </div>
            </>
            )}
          </div>
          );
        })}
      </div>

      {suppliers.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noSuppliersYet}</p>
        </div>
      )}
    </div>
  );
}
