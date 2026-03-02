import React from 'react';
import { Trash2, Calendar, Tag, Clock, Package } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onDonate: (product: Product) => void;
}

export default function ProductCard({ product, onDelete, onDonate }: ProductCardProps) {
  const diffTime = new Date(product.expiryDate).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const getStyles = () => {
    if (daysLeft <= 2) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Urgent' };
    if (daysLeft <= 4) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Warning' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Fresh' };
  };

  const styles = getStyles();
  const origPrice = Number(product.originalPrice) || 0;
  const curPrice = Number(product.currentPrice) || origPrice;
  const qty = Number(product.quantity) || 1;
  const hasDiscount = product.isDiscounted && curPrice < origPrice;

  return (
    <div className={`${styles.bg} ${styles.border} border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800 capitalize">{product.name}</h3>
        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg bg-white/60 ${styles.text}`}>
          {styles.label}
        </span>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar size={16} /> <span>Expiry: {new Date(product.expiryDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-800 font-bold">
          <Clock size={16} /> <span>{daysLeft} days left</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
          <Package size={16} /> <span>{qty} unit{qty !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
          <Tag size={16} />
          {hasDiscount ? (
            <span>
              <span className="line-through text-gray-400 mr-1">₹{origPrice.toFixed(2)}</span>
              <span className="text-green-700 font-bold">₹{curPrice.toFixed(2)}</span>
              {product.discountPercent && (
                <span className="ml-2 text-xs font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  -{product.discountPercent}%
                </span>
              )}
            </span>
          ) : (
            <span>₹{origPrice.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {daysLeft <= 4 && (
          <button
            onClick={() => onDonate(product)}
            className="flex-1 bg-white border-2 border-gray-100 text-gray-800 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
          >
            Donate
          </button>
        )}
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}

