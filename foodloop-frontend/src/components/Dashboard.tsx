import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone } from 'lucide-react';
import {
  Calculator, Check, Plus, AlertCircle,
  TrendingDown, Loader, Gift, Package,
  ShieldCheck, LayoutDashboard
} from 'lucide-react';
import { productAPI, discountAPI, analyticsAPI, donationAPI } from '../lib/api';
import { Product, Dashboard as DashboardType } from '../types';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import DonationModal from './DonationModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'donations' | 'analytics'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingDiscounts, setCalculatingDiscounts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [productsRes, dashboardRes] = await Promise.all([
        productAPI.getAll(),
        analyticsAPI.getDashboard(),
      ]);

      // Convert Firestore Timestamps to JS Dates for products
      const productsWithDates = productsRes.data.data.map((p: any) => {
        // THE FIX: Logic belongs inside { } with a 'return'
        let dateObj;

        // Handle Firebase Timestamps (_seconds) or standard date strings
        if (p.expiryDate && typeof p.expiryDate === 'object' && p.expiryDate._seconds) {
          dateObj = new Date(p.expiryDate._seconds * 1000);
        } else {
          dateObj = new Date(p.expiryDate);
        }

        // Explicit return of the object
        return {
          ...p,
          expiryDate: dateObj,
          originalPrice: Number(p.originalPrice) || 0,
          currentPrice: Number(p.currentPrice) || Number(p.originalPrice) || 0,
          isDiscounted: Boolean(p.isDiscounted),
          quantity: Number(p.quantity) || 1,
          discountPercent: p.discountPercent ? Number(p.discountPercent) : undefined,
        };
      }); // Closing the map correctly now

      setProducts(productsWithDates);
      setDashboard(dashboardRes.data.data);

      // Fetch donation history separately so it doesn't block main data
      try {
        const donationsRes = await donationAPI.getHistory();
        setDonations(donationsRes.data.data || []);
      } catch (e) {
        console.error('Error fetching donation history:', e);
      }
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      await productAPI.add(productData);
      setSuccessMessage('✓ Product added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAllData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to add product');
    }
  };

  const handleCalculateDiscounts = async () => {
    setCalculatingDiscounts(true);
    try {
      // Calculate preview in component state only
      const previewProducts = products.map(product => {
        const getSafeDate = (dateVal: any) => {
          if (!dateVal) return new Date();
          if (typeof dateVal.toDate === 'function') return dateVal.toDate();
          if (dateVal._seconds) return new Date(dateVal._seconds * 1000);
          return new Date(dateVal);
        };
        const expiry = getSafeDate(product.expiryDate);
        const today = new Date();
        expiry.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let discountPercent = 0;
        if (daysRemaining <= 0) discountPercent = 75;
        else if (daysRemaining >= 1 && daysRemaining <= 2) discountPercent = 50;
        else if (daysRemaining >= 3 && daysRemaining <= 5) discountPercent = 25;

        if (discountPercent > 0) {
          const discountedPrice = product.originalPrice * (1 - discountPercent / 100);
          return {
            ...product,
            discountPercent,
            currentPrice: discountedPrice,
            isDiscounted: true
          };
        }
        return {
          ...product,
          discountPercent: 0,
          currentPrice: product.originalPrice,
          isDiscounted: false
        };
      });
      setProducts(previewProducts);
      setSuccessMessage(`✓ Calculated discounts! (Preview applied)`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage('Failed to calculate discounts');
    } finally {
      setCalculatingDiscounts(false);
    }
  };

  const handleApplyDiscounts = async () => {
    try {
      let appliedCount = 0;
      for (const product of products) {
        if (product.isDiscounted && product.discountPercent && product.discountPercent > 0) {
          await productAPI.update(product.id, {
            currentPrice: product.currentPrice,
            discountPercent: product.discountPercent,
            isDiscounted: true,
            originalPrice: product.originalPrice
          });
          appliedCount++;
        }
      }
      setSuccessMessage(`✓ Applied to ${appliedCount} products!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAllData();
    } catch (error: any) {
      setErrorMessage('Failed to apply discounts');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(productId);
      setSuccessMessage('✓ Product deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAllData();
    } catch (error: any) {
      setErrorMessage('Failed to delete product');
    }
  };

  const handleDonateProduct = (product: Product) => setSelectedProduct(product);

  const handleDonationSuccess = () => {
    setSuccessMessage('✓ Donation recorded!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchAllData();
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 mx-auto mb-4 text-[#2ecc71]" />
          <p className="text-gray-500 font-medium">Refreshing FoodLoop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 1. BRANDED NAVBAR */}
      <nav className="bg-[#2ecc71] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Package className="text-[#2ecc71] h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">FoodLoop</h1>
              <p className="text-[10px] opacity-90 uppercase font-bold tracking-widest mt-1">Waste Less, Save More</p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex gap-2 bg-green-700/30 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'donations' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* GLOBAL MESSAGES */}
        {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-700 font-bold animate-in fade-in">{errorMessage}</div>}
        {successMessage && <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl text-green-700 font-bold animate-in fade-in">{successMessage}</div>}

        {/* --- TAB 1: PRODUCTS VIEW --- */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Horizontal Product Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[#2ecc71]" /> Add New Entry
              </h2>
              <ProductForm onAdd={handleAddProduct} />
            </div>

            {/* Quick Summary Cards */}
            {dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                  <p className="text-3xl font-black text-blue-600">{dashboard.inventory.total}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm text-red-600">
                  <p className="text-xs font-bold uppercase">Urgent</p>
                  <p className="text-3xl font-black">{dashboard.inventory.urgent}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm text-orange-600">
                  <p className="text-xs font-bold uppercase">Warning</p>
                  <p className="text-3xl font-black">{dashboard.inventory.warning}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm text-green-600">
                  <p className="text-xs font-bold uppercase">Recovered</p>
                  <p className="text-3xl font-black">₹{Math.round(dashboard.revenue.recovered)}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm text-purple-600">
                  <p className="text-xs font-bold uppercase">Donations</p>
                  <p className="text-3xl font-black">{dashboard.donations.total}</p>
                </div>
              </div>
            )}

            {/* Discount Actions */}
            <div className="flex flex-wrap gap-4">
              <button onClick={handleCalculateDiscounts} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Calculator size={18} /> Calculate Discounts
              </button>
              <button onClick={handleApplyDiscounts} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Check size={18} /> Apply Discounts
              </button>
            </div>

            {/* Product Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="text-gray-400" size={24} />
                <h2 className="text-2xl font-black text-gray-800">Inventory</h2>
                <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-1 rounded-full">{products.length} ITEMS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} onDonate={handleDonateProduct} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: DONATIONS VIEW --- */}
        {activeTab === 'donations' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Truck className="text-[#2ecc71]" /> Available Food Banks</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Food Bank India', dist: '3.2 km', cap: '50 kg/day', contact: '+91 98765-43210' },
                  { name: 'Hope Society', dist: '5.1 km', cap: '120 kg/day', contact: '+91 98765-43211' },
                  { name: 'Food for All NGO', dist: '8.4 km', cap: '80 kg/day', contact: '+91 98765-43212' }
                ].map((bank, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-[35px] border-2 border-transparent hover:border-[#2ecc71] transition-all">
                    <h3 className="text-lg font-black text-gray-800 mb-4">{bank.name}</h3>
                    <div className="space-y-2 text-xs font-bold text-gray-500 uppercase">
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-[#2ecc71]" /> {bank.dist}</div>
                      <div className="flex items-center gap-2"><Package size={14} className="text-blue-400" /> {bank.cap}</div>
                      <div className="flex items-center gap-2"><Phone size={14} className="text-purple-400" /> {bank.contact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Gift className="text-purple-500" /> Donation History</h2>
              {donations.length > 0 ? (
                donations.map((d: any) => (
                  <div key={d.id} className="p-4 bg-gray-50 rounded-2xl mb-3 flex justify-between items-center font-bold text-gray-700">
                    <div>
                      <p className="text-gray-800">{d.productName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {d.foodBankName || 'Food Bank'} • {d.createdAt ? new Date(d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-purple-600 text-[10px] uppercase block">Donated {d.quantity} Units</span>
                      <span className="text-green-600 text-xs">₹{d.donatedValue?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))
              ) : <p className="text-center py-10 text-gray-400 font-bold italic">No history found.</p>}
            </div>
          </div>
        )}

        {/* --- TAB 3: ANALYTICS VIEW (Manager Dashboard) --- */}
        {activeTab === 'analytics' && dashboard && (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <header>
              <h2 className="text-3xl font-black text-gray-800">Analytics Dashboard</h2>
              <p className="text-gray-500 font-medium">Track your food waste reduction impact</p>
            </header>

            {/* High-Impact Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-blue-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">{dashboard.inventory.total || 0}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Products</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-green-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">{dashboard.inventory.discounted || 0}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Items Discounted</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-purple-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">{dashboard.donations.donatedThisWeek || 0}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Donated This Week</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-yellow-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">₹{Math.round(dashboard.donations.revenueRecovered || 0)}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Profit Recovered</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-cyan-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">{dashboard.donations.wastePreventedKg || 0} kg</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Waste Prevented</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-[12px] border-emerald-500 shadow-sm flex flex-col justify-center">
                <p className="text-3xl font-black leading-tight">{dashboard.donations.co2SavedKg || 0} kg</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Carbon Footprint Saved</p>
              </div>
            </div>

            {/* Graphical Insights (Manager Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100">
                <h3 className="text-gray-800 font-black text-center mb-8">Product Freshness Distribution</h3>
                <div className="flex items-end justify-center gap-8 h-48 px-4">
                  <div className="group relative flex flex-col items-center">
                    <div className="w-16 bg-[#2ecc71] rounded-t-2xl transition-all hover:brightness-110" style={{ height: '140px' }}></div>
                    <span className="mt-4 text-[10px] font-black text-gray-400 uppercase">Fresh</span>
                  </div>
                  <div className="group relative flex flex-col items-center">
                    <div className="w-16 bg-[#f1c40f] rounded-t-2xl transition-all hover:brightness-110" style={{ height: '80px' }}></div>
                    <span className="mt-4 text-[10px] font-black text-gray-400 uppercase">Warning</span>
                  </div>
                  <div className="group relative flex flex-col items-center">
                    <div className="w-16 bg-[#e74c3c] rounded-t-2xl transition-all hover:brightness-110" style={{ height: '40px' }}></div>
                    <span className="mt-4 text-[10px] font-black text-gray-400 uppercase">Urgent</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100 flex flex-col items-center">
                <h3 className="text-gray-800 font-black text-center mb-6">Inventory Status</h3>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[25px] border-blue-500/10"></div>
                  <div className="absolute inset-0 rounded-full border-[25px] border-blue-500 border-t-transparent border-r-transparent -rotate-45"></div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-gray-800">{dashboard.inventory.total}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">In Stock</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedProduct && (
        <DonationModal
          product={selectedProduct}
          onClose={() => {
            console.log("Closing Modal");
            setSelectedProduct(null);
          }}
          onSuccess={handleDonationSuccess}
        />
      )}

    </div>
  );
} 
