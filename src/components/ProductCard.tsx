import { Trash2, Gift } from 'lucide-react';
import { Product } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onDonate: (product: Product) => void;
}

export default function ProductCard({ product, onDelete, onDonate }: ProductCardProps) {
  const calculateDaysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(product.expiry_date);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (days: number) => {
    if (days <= 2) return 'bg-red-100 border-red-300';
    if (days <= 5) return 'bg-orange-100 border-orange-300';
    return 'bg-green-100 border-green-300';
  };

  const getStatusText = (days: number) => {
    if (days <= 2) return { text: 'Urgent', color: 'text-red-700' };
    if (days <= 5) return { text: 'Warning', color: 'text-orange-700' };
    return { text: 'Fresh', color: 'text-green-700' };
  };

  const daysLeft = calculateDaysUntilExpiry();
  const status = getStatusText(daysLeft);
  const bgColor = getStatusColor(daysLeft);

  return (
    <div className={`${bgColor} border-2 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
        <span className={`${status.color} text-xs font-semibold px-3 py-1 rounded-full bg-white`}>
          {status.text}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expiry Date:</span>
          <span className="font-semibold text-gray-800">
            {new Date(product.expiry_date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Days Left:</span>
          <span className={`font-bold ${daysLeft <= 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Original Price:</span>
          <span className={product.is_discounted ? 'line-through text-gray-500' : 'font-semibold text-gray-800'}>
            ₹{product.original_price.toFixed(2)}
          </span>
        </div>

        {product.is_discounted && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discounted Price:</span>
            <span className="font-bold text-green-700">
              ₹{product.current_price.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
     {(daysLeft <= 2 && daysLeft > 0) || daysLeft <= 0 ? (
  <button
    onClick={() => onDonate(product)}
    className="flex-1 bg-green-600 hover:bg-green-700..."
  >
    <Gift size={16} />
    Donate
  </button>
) : null}
        <button
          onClick={() => onDelete(product.id)}
          className={`${daysLeft <= 0 ? 'flex-1' : 'w-full'} bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors`}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
