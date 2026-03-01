import React from 'react';
import { Trash2, Calendar, Tag, Clock } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onDonate: (product: Product) => void;
}

export default function ProductCard({ product, onDelete, onDonate }: ProductCardProps) {
  // Calculate days left
  const diffTime = product.expiryDate.getTime() - new Date().getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine styles based on urgency
  const getStyles = () => {
    if (daysLeft <= 2) return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Urgent" };
    if (daysLeft <= 4) return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", label: "Warning" };
    return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", label: "Fresh" };
  };

  const styles = getStyles();

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
          <Calendar size={16} /> <span>Expiry: {product.expiryDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-800 font-bold">
          <Clock size={16} /> <span>{daysLeft} days left</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
          <Tag size={16} /> <span>₹{product.originalPrice}</span>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {daysLeft <= 2 && (
             <button onClick={() => onDonate(product)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm">
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