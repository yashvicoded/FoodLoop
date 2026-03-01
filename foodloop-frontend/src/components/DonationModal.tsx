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
    location: 'Mumbai, MH',
  },
  {
    id: '2',
    name: 'Hope Society',
    distance: 5,
    capacity: '100 kg/day',
    contact: '+91-9876543211',
    location: 'Mumbai, MH',
  },
  {
    id: '3',
    name: 'Food for All NGO',
    distance: 8,
    capacity: '75 kg/day',
    contact: '+91-9876543212',
    location: 'Mumbai, MH',
  },
];

export default function DonationModal({ product, onClose, onSuccess }: DonationModalProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-800">🎁 Donate Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              {error}
            </div>
          )}

          {/* Product Details */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">📦 Product Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-800">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-semibold text-gray-800">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry Date:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(product.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Value:</span>
                <span className="font-semibold text-gray-800">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-green-600">
                  ₹{(product.originalPrice * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <label className="block font-semibold text-gray-800 mb-3">
              <Package size={16} className="inline mr-2" />
              Quantity to Donate (Available: {product.quantity})
            </label>
            <input
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, product.quantity))}
              className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Food Bank Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Food Bank</h3>
            <div className="space-y-3">
              {foodBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedFoodBank(bank)}
                  className={`w-full border-2 rounded-lg p-4 text-left transition-all ${
                    selectedFoodBank?.id === bank.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{bank.name}</h4>
                      <div className="space-y-1 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{bank.distance} km away</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span>Capacity: {bank.capacity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-gray-400" />
                          <span>{bank.contact}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 ${
                      selectedFoodBank?.id === bank.id
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDonate}
              disabled={isProcessing || !selectedFoodBank}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Truck size={20} />
                  Confirm Donation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}