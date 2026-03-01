import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface ProductFormProps {
  onAdd: (product: any) => void;
}

export default function ProductForm({ onAdd }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    expiryDate: '',
    originalPrice: '',
    quantity: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expiryDate || !formData.originalPrice) return;
    
    onAdd({
      ...formData,
      originalPrice: parseFloat(formData.originalPrice),
    });
    
    // Reset form
    setFormData({ name: '', category: 'General', expiryDate: '', originalPrice: '', quantity: 1 });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      {/* Name Input */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Product Name</label>
        <input
          type="text"
          placeholder="e.g. Fresh Milk"
          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Expiry Date */}
      <div className="w-48">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Expiry Date</label>
        <input
          type="date"
          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          required
        />
      </div>

      {/* Price */}
      <div className="w-32">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Price (₹)</label>
        <input
          type="number"
          placeholder="0.00"
          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
          value={formData.originalPrice}
          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
          required
        />
      </div>

      {/* Add Button */}
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 h-[46px]"
      >
        <Plus size={20} />
        Add Product
      </button>
    </form>
  );
}