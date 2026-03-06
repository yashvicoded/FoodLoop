import React, { useState } from 'react';
import { Trash2, Calendar, Tag, Clock, Package, BrainCircuit, Edit2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onDonate: (product: Product) => void;
  onApplyDiscount?: (id: string, pct: number) => void;
}

export default function ProductCard({ product, onDelete, onDonate, onApplyDiscount }: ProductCardProps) {
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(product.discountPercent || product.aiInsight?.suggestedDiscount || 0);
  // THE FIX: We must handle three cases: Firebase Timestamp, String, or Date Object
  const getSafeDate = (dateVal: any) => {
    if (!dateVal) return new Date();
    // Case 1: Firebase Timestamp object
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    // Case 2: String or Number
    return new Date(dateVal);
  };

  const expiryDateObj = getSafeDate(product.expiryDate);
  const diffTime = expiryDateObj.getTime() - new Date().getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Use AI Insight if available, otherwise fallback
  const riskLevel = product.aiInsight?.riskLevel || (daysLeft <= 2 ? 'Urgent' : daysLeft <= 4 ? 'Warning' : 'Fresh');
  
  const getStyles = () => {
    if (riskLevel === 'Urgent') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Urgent' };
    if (riskLevel === 'Warning') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Warning' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Fresh' };
  };

  const styles = getStyles();
  const origPrice = Number(product.originalPrice) || 0;
  const curPrice = Number(product.currentPrice) || origPrice;
  const qty = Number(product.quantity) || 1;
  const hasDiscount = product.isDiscounted && curPrice < origPrice;

  return (
    <div className={`${styles.bg} ${styles.border} border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800 capitalize">{product.name}</h3>
        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg bg-white/60 ${styles.text}`}>
          {styles.label}
        </span>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
  <Calendar size={16} /> 
  <span>Expiry: {expiryDateObj.toLocaleDateString()}</span>
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
            <span className="flex items-center gap-2">
              <span className="line-through text-gray-400">₹{origPrice.toFixed(2)}</span>
              <span className="text-green-700 font-black text-lg">₹{curPrice.toFixed(2)}</span>
            </span>
          ) : (
            <span>₹{origPrice.toFixed(2)}</span>
          )}
        </div>
      </div>

      {product.aiInsight && (
        <div className="my-4 bg-white/60 p-4 rounded-xl border border-white/80 shadow-sm relative">
          <div className="flex justify-between items-center mb-2">
             <h4 className="flex items-center gap-1.5 text-xs font-black uppercase text-blue-600 tracking-widest"><BrainCircuit size={14} /> AI Insight</h4>
             {product.aiInsight.suggestedDiscount > 0 && !hasDiscount && (
               <div className="flex gap-2 items-center">
                 <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Suggest -{product.aiInsight.suggestedDiscount}%</span>
               </div>
             )}
             {hasDiscount && (
               <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Applied -{product.discountPercent}%</span>
             )}
          </div>
          
          <div className="text-sm font-bold text-gray-700 mb-1">
            Prediction: <span className="text-gray-900">{product.aiInsight.predictedLeftover} units likely unsold</span>
          </div>
          <p className="text-[10px] font-bold text-gray-500">{product.aiInsight.reason}</p>

          {!isEditingDiscount && !hasDiscount && product.aiInsight.suggestedDiscount > 0 && (
             <div className="mt-3 flex justify-end">
               <button onClick={() => setIsEditingDiscount(true)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 transition-all"><Edit2 size={12}/> Edit Discount</button>
             </div>
          )}

          {isEditingDiscount && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-blue-100 shadow-sm animate-in zoom-in-95">
               <div className="flex justify-between text-xs font-black text-gray-600 mb-2">
                 <span>Custom Discount</span>
                 <span className="text-blue-600">{discountValue}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="75" step="5"
                 value={discountValue}
                 onChange={(e) => setDiscountValue(Number(e.target.value))}
                 className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-3"
               />
               <div className="flex gap-2">
                 <button onClick={() => setIsEditingDiscount(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-bold transition-all">Cancel</button>
                 <button 
                   onClick={() => {
                     setIsEditingDiscount(false);
                     if(onApplyDiscount) onApplyDiscount(product.id, discountValue);
                   }} 
                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                 >
                   <CheckCircle2 size={12}/> Apply
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex gap-2">
        {!hasDiscount && product.aiInsight && product.aiInsight.suggestedDiscount > 0 && onApplyDiscount && (
           <button
             onClick={() => onApplyDiscount(product.id, product.aiInsight!.suggestedDiscount)}
             className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-xs"
           >
             Apply -{product.aiInsight.suggestedDiscount}%
           </button>
        )}
        {(riskLevel === 'Urgent' || riskLevel === 'Warning') && (
          <button
            onClick={() => onDonate(product)}
            className="flex-1 bg-white border-2 border-gray-100 text-gray-800 py-2 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs"
          >
            Donate
          </button>
        )}
        <button
          onClick={() => onDelete(product.id)}
          className="flex-none bg-red-50 text-red-500 py-2 px-3 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

