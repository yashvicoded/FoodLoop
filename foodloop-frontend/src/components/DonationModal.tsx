import { useState, useEffect } from 'react';
import { X, Truck, MapPin, Package, Loader } from 'lucide-react';
import { Product, FoodBank } from '../types';
import { donationAPI } from '../lib/api';

interface DonationModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

// Sample food banks - Replace with API call in production
const SAMPLE_FOOD_BANKS: FoodBank[] = [
  {
    id: '1',
    name: 'Food Bank India',
    distance: 3,
    capacity: '50 kg/day',
    contact: '+91-9876543210',
    location: 'Anand, GUJ',
  },
  {
    id: '2',
    name: 'Hope Society',
    distance: 5,
    capacity: '100 kg/day',
    contact: '+91-9876543211',
    location: 'Nadiad, GUJ',
  },
  {
    id: '3',
    name: 'Food for All NGO',
    distance: 8,
    capacity: '75 kg/day',
    contact: '+91-9876543212',
    location: 'Vadodara, GUJ',
  },
];

export default function DonationModal({ product, onClose, onSuccess }: DonationModalProps) {
  const initialQuantity = product?.quantity || 1;
  const unitPrice = product?.originalPrice || 0;
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>(SAMPLE_FOOD_BANKS);
  const [quantity, setQuantity] = useState(product.quantity);
  const [selectedFoodBank, setSelectedFoodBank] = useState<FoodBank | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleDonate = async () => {
    if (!selectedFoodBank) {
      setError('Please select a food bank');
      return;
    }

    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await donationAPI.record({
        productId: product.id,
        foodBankId: selectedFoodBank.id,
        quantity,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error recording donation:', err);
      setError(err.response?.data?.error || 'Failed to record donation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="bg-purple-100 p-2 rounded-xl text-xl">🎁</span> Donate Product
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl font-bold">{error}</div>}

          <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
            <h3 className="font-black text-blue-800 uppercase text-xs tracking-widest mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="text-gray-400">Name: <span className="text-gray-800">{product.name}</span></div>
              <div className="text-gray-400">Total Value: <span className="text-green-600">₹{(unitPrice * quantity).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Package size={16} /> Quantity (Available: {initialQuantity})
            </label>
            <input
              type="number"
              min="1"
              max={initialQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, initialQuantity))}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none font-bold text-lg"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Select Nearest Food Bank</h3>
            <div className="grid gap-3">
              {foodBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedFoodBank(bank)}
                  className={`p-5 rounded-3xl border-2 text-left transition-all flex justify-between items-center ${
                    selectedFoodBank?.id === bank.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <div>
                    <p className="font-black text-gray-800">{bank.name}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase">{bank.distance} km • {bank.location}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-4 ${selectedFoodBank?.id === bank.id ? 'border-purple-500 bg-white' : 'border-gray-100'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
            <button
              onClick={handleDonate}
              disabled={isProcessing || !selectedFoodBank}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:bg-gray-200"
            >
              {isProcessing ? <Loader className="animate-spin" size={20} /> : <><Truck size={20} /> Confirm Donation</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

