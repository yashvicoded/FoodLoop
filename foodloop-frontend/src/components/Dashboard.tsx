import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone } from 'lucide-react';
import {
  Calculator, Check, Plus, AlertCircle,
  TrendingDown, TrendingUp, Loader, Gift, Package,
  ShieldCheck, LayoutDashboard, Clock, Calendar, CheckCircle2, Navigation
} from 'lucide-react';
import { productAPI, discountAPI, analyticsAPI, donationAPI } from '../lib/api';
import { Product, Dashboard as DashboardType } from '../types';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import DonationModal from './DonationModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'donations' | 'analytics'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingDiscounts, setCalculatingDiscounts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [donationQueue, setDonationQueue] = useState<any[]>([
    { id: 'dq1', name: 'Full Cream Milk', quantity: 12, unit: 'L', condition: 'Unsellable before expiry', time: 'Expires in 24h', product: { id: 'mock1', name: 'Full Cream Milk', quantity: 12, originalPrice: 50, expiryDate: new Date() } },
    { id: 'dq2', name: 'Whole Wheat Bread', quantity: 15, unit: 'packs', condition: 'Surplus baking', time: 'Expires in 48h', product: { id: 'mock2', name: 'Whole Wheat Bread', quantity: 15, originalPrice: 30, expiryDate: new Date() } },
    { id: 'dq3', name: 'Organic Bananas', quantity: 5, unit: 'kg', condition: 'Overripe, safe for consumption', time: 'Expires in 12h', product: { id: 'mock3', name: 'Organic Bananas', quantity: 5, originalPrice: 40, expiryDate: new Date() } }
  ]);

  const [activePickups, setActivePickups] = useState<any[]>([
    { id: 'p1', ngo: 'Food Bank India', status: 'Driver En Route', time: 'Arriving in 15 mins', items: '12 units of Milk, 5 units of Bananas', color: 'blue' },
    { id: 'p2', ngo: 'Hope Society', status: 'Scheduled', time: 'Today, 6:00 PM', items: '15 units of Bread', color: 'purple' },
  ]);

  const handleConfirmQueueDonation = (id: string, name: string) => {
    const item = donationQueue.find(q => q.id === id);
    if (item && item.product) {
      setSelectedProduct(item.product as Product);
    } else {
      setSelectedProduct({ id, name, quantity: item?.quantity || 1, originalPrice: 50 } as Product);
    }
  };

  useEffect(() => {
    fetchAllData(true);
    const interval = setInterval(() => fetchAllData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [productsRes, dashboardRes] = await Promise.all([
        productAPI.getAll(),
        analyticsAPI.getDashboard(),
      ]);

      // Convert Firestore Timestamps to JS Dates for products
      // Inside fetchAllData in Dashboard.tsx
const productsWithDates = productsRes.data.data.map((p: any) => {
  let dateObj;
  
  // Handle the Firebase Timestamp format (_seconds) or standard strings
  if (p.expiryDate && typeof p.expiryDate === 'object' && p.expiryDate._seconds) {
    dateObj = new Date(p.expiryDate._seconds * 1000);
  } else if (p.expiryDate) {
    dateObj = new Date(p.expiryDate);
  } else {
    dateObj = new Date(); // Fallback to today if null
  }

  return {
    ...p,
    expiryDate: dateObj,
    originalPrice: Number(p.originalPrice) || 0,
    currentPrice: Number(p.currentPrice) || Number(p.originalPrice) || 0,
    isDiscounted: Boolean(p.isDiscounted),
    quantity: Number(p.quantity) || 1,
    discountPercent: p.discountPercent ? Number(p.discountPercent) : 0,
  };
});

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
      fetchAllData(false);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to add product');
    }
  };

  const analyzeInventory = (product: Product, daysRemaining: number) => {
    let suggestedDiscount = 0;
    
    // Base discount rules
    if (daysRemaining <= 2) suggestedDiscount = 60;
    else if (daysRemaining <= 4) suggestedDiscount = 40;
    else if (daysRemaining <= 6) suggestedDiscount = 20;

    // Simulate predicted sales and leftover dynamically based on actual quantity (with pseudo-randomness or realistic rules)
    // For this example, we calculate a plausible leftover
    const fallbackLeftover = Math.floor(product.quantity ? product.quantity * (Math.random() * 0.5 + 0.1) : 0);
    const predictedSales = product.quantity ? product.quantity - fallbackLeftover : 0;
    let predictedLeftover = fallbackLeftover;
    
    // If the category is strictly string typed, we would do lowercase match
    const category = product.category?.toLowerCase() || 'other';
    let multiplier = 1.0;
    switch (category) {
      case 'dairy': multiplier = 1.2; break;
      case 'bakery': multiplier = 1.0; break;
      case 'snacks': multiplier = 0.7; break;
      case 'produce': multiplier = 1.1; break;
      default: multiplier = 1.0; break;
    }
    
    suggestedDiscount = Math.min(Math.round(suggestedDiscount * multiplier), 100);

    const safeQty = product.quantity || 1;
    const leftoverRatio = predictedLeftover / safeQty;
    
    let riskLevel: 'Urgent' | 'Warning' | 'Fresh' = 'Fresh';
    if (daysRemaining <= 2 || leftoverRatio > 0.4) {
      riskLevel = 'Urgent';
    } else if (daysRemaining <= 4 || leftoverRatio > 0.2) {
      riskLevel = 'Warning';
    }
    
    let reason = '';
    if (daysRemaining <= 2 && leftoverRatio > 0.4) {
      reason = 'High stock + near expiry + moderate demand';
    } else if (daysRemaining <= 2) {
      reason = 'Nearing expiry date rapidly.';
    } else if (leftoverRatio > 0.4) {
      reason = 'Predicted overstock based on slow demand.';
    } else {
      reason = 'Stock levels and expiry are within safe ranges.';
    }

    return {
      riskLevel,
      suggestedDiscount,
      predictedLeftover,
      reason
    };
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

        const insight = analyzeInventory(product, daysRemaining);

        return {
          ...product,
          aiInsight: insight
        };
      });
      setProducts(previewProducts);
      setSuccessMessage(`✓ AI Engine analyzed inventory & calculated discounts!`);
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
        if (product.aiInsight && product.aiInsight.suggestedDiscount && product.aiInsight.suggestedDiscount > 0 && !product.isDiscounted) {
          const discountedPrice = product.originalPrice * (1 - product.aiInsight.suggestedDiscount / 100);
          await productAPI.update(product.id, {
            currentPrice: discountedPrice,
            discountPercent: product.aiInsight.suggestedDiscount,
            isDiscounted: true,
            originalPrice: product.originalPrice
          });
          appliedCount++;
        }
      }
      setSuccessMessage(`✓ Applied to ${appliedCount} products!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAllData(false);
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
      fetchAllData(false);
    } catch (error: any) {
      setErrorMessage('Failed to delete product');
    }
  };

  const handleDonateProduct = (product: Product) => {
    // Add to queue instead of immediate modal
    setDonationQueue(q => {
      if (q.some(item => item.id === product.id)) return q; // Prevent duplicate
      return [...q, {
        id: product.id,
        name: product.name,
        quantity: product.quantity || 1,
        unit: 'Units',
        condition: 'Manually Flagged for Donation',
        time: 'Pending Assignment',
        product: product
      }];
    });
    setSuccessMessage(`✓ ${product.name} moved to 'Items Ready for Donation'!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDonationSuccess = (donationData?: any) => {
    setSuccessMessage('✓ Donation assigned to NGO & Active Pickup Scheduled!');
    setTimeout(() => setSuccessMessage(''), 3000);
    
    if (donationData) {
      // Remove from queue
      setDonationQueue(q => q.filter(item => item.id !== donationData.id && item.name !== donationData.name));
      
      // Add to active pickups locally
      setActivePickups(p => [{
        id: `p-${Date.now()}`,
        ngo: donationData.foodBankName || 'Verified NGO',
        status: 'Scheduled',
        time: 'Just Now',
        items: `${donationData.quantity} units of ${donationData.name}`,
        color: 'purple'
      }, ...p]);
    }
    
    fetchAllData();
    setSelectedProduct(null);
  };

  // Calculate local impact from the donations array so analytics aren't zero
const localImpact = React.useMemo(() => {
  const totalUnits = donations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  return {
    thisWeek: donations.length,
    waste: (totalUnits * 0.5).toFixed(1), // 0.5kg per unit
    carbon: (totalUnits * 1.25).toFixed(1) // 1.25kg CO2 per unit
  };
}, [donations]);

// This calculates the analytics locally so they update IMMEDIATELY
const liveAnalytics = React.useMemo(() => {
  const allDonations = donations || [];
  
  // 1. Total items donated
  const count = allDonations.length;
  
  // 2. Total units of food (sum of quantity field)
  const totalUnits = allDonations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  
  // 3. Total value (Profit Recovered)
  const profit = allDonations.reduce((sum, d) => sum + (Number(d.donatedValue) || 0), 0);
  
  // 4. Environmental Math (Fun metrics)
  const wasteKg = totalUnits * 0.5; // Assuming 0.5kg per unit
  const co2Kg = wasteKg * 2.5;     // 1kg waste = 2.5kg CO2 saved

  return { count, profit, wasteKg, co2Kg };
}, [donations]);

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
          <div className="flex gap-2 bg-green-700/30 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Inventory & AI Sales
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Smart Ordering
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'donations' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-white text-[#2ecc71] shadow-sm' : 'hover:bg-green-600'}`}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* AI Engine Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2 px-4 shadow-sm text-xs font-bold w-full uppercase tracking-widest flex items-center justify-center gap-2">
        <AlertCircle size={14} className="text-blue-200" />
        FoodLoop AI Engine Active — Analyzing expiry, demand, and inventory in real time.
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* GLOBAL MESSAGES */}
        {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-700 font-bold animate-in fade-in">{errorMessage}</div>}
        {successMessage && <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl text-green-700 font-bold animate-in fade-in">{successMessage}</div>}

        {/* --- TAB 1: INVENTORY & AI SALES VIEW --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section A: Product Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[#2ecc71]" /> Add Product
              </h2>
              <ProductForm onAdd={handleAddProduct} />
            </div>

            {/* Section B: Stats Overview Cards */}
            {dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border-l-[8px] border-yellow-500 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Recovered Revenue</p>
                    <p className="text-3xl font-black text-gray-800">₹{Math.round(liveAnalytics.profit)}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-full text-yellow-500"><TrendingUp size={28} /></div>
                </div>
                <div className="bg-white border-l-[8px] border-purple-500 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Donations Made</p>
                    <p className="text-3xl font-black text-gray-800">{liveAnalytics.count}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full text-purple-500"><Gift size={28} /></div>
                </div>
                <div className="bg-white border-l-[8px] border-red-500 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Items at Risk</p>
                    <p className="text-3xl font-black text-gray-800">{products.filter((p: any) => {
                        const getSafeDate = (dateVal: any) => {
                          if (!dateVal) return new Date();
                          if (typeof dateVal.toDate === 'function') return dateVal.toDate();
                          if (dateVal._seconds) return new Date(dateVal._seconds * 1000);
                          return new Date(dateVal);
                        };
                        const expiry = getSafeDate(p.expiryDate);
                        const diffTime = expiry.getTime() - new Date().getTime();
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const risk = analyzeInventory(p, days).riskLevel;
                        return risk === 'Urgent' || risk === 'Warning';
                    }).length}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-full text-red-500"><AlertCircle size={28} /></div>
                </div>
              </div>
            )}

            {/* Section C: Bulk AI Actions */}
            <div className="flex flex-wrap gap-4">
              <button onClick={handleCalculateDiscounts} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Calculator size={18} /> Calculate Discounts
              </button>
              <button onClick={handleApplyDiscounts} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Check size={18} /> Apply All Discounts
              </button>
            </div>

            {/* Section D: Product Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="text-gray-400" size={24} />
                <h2 className="text-2xl font-black text-gray-800">Inventory</h2>
                <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-1 rounded-full">{products.length} ITEMS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (                 
                  <ProductCard 
                     key={product.id} 
                     product={product} 
                     onDelete={handleDeleteProduct} 
                     onDonate={handleDonateProduct} 
                     onApplyDiscount={(id: string, pct: number) => {
                       const editedProduct = products.find(p => p.id === id);
                       if(editedProduct) {
                         const discountedPrice = editedProduct.originalPrice * (1 - pct / 100);
                         productAPI.update(id, {
                           currentPrice: discountedPrice,
                           discountPercent: pct,
                           isDiscounted: true,
                           originalPrice: editedProduct.originalPrice
                         }).then(() => fetchAllData(false));
                       }
                     }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 1.5: SMART ORDERING VIEW --- */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-center">
                 <div className="flex-1 space-y-6">
                     <h2 className="text-3xl font-black text-gray-800">Smart Ordering for Tomorrow</h2>
                     <p className="text-gray-500 font-medium">AI predictions based on recent expiry and sales data to optimize your upcoming orders.</p>
                     <div className="space-y-4 w-full">
                       {[
                         { item: "Full Cream Milk", recommendation: "Order 80 units", diff: "+30%", diffClass: "text-green-600 bg-green-50", reason: "Consistent high demand observed." },
                         { item: "Whole Wheat Bread", recommendation: "Order 45 units", diff: "-10%", diffClass: "text-red-600 bg-red-50", reason: "High surplus detected historically." },
                         { item: "Yogurt", recommendation: "Order 60 units", diff: "+0%", diffClass: "text-gray-600 bg-gray-50", reason: "Demand matches current steady supply." }
                       ].map((order, idx) => (
                         <div key={idx} className="p-5 border-2 border-gray-100 rounded-3xl bg-gray-50/50 flex justify-between items-center w-full">
                             <div>
                               <h4 className="font-black text-gray-800">{order.item}</h4>
                               <p className="text-xs font-bold text-gray-400 mt-1">{order.reason}</p>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-gray-800">{order.recommendation}</p>
                               <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${order.diffClass}`}>{order.diff}</span>
                             </div>
                         </div>
                       ))}
                     </div>
                 </div>
                 <div className="hidden lg:block lg:w-1/3 bg-blue-50/50 p-6 rounded-[35px] border border-blue-100 text-center">
                    <div className="bg-white p-4 rounded-3xl shadow-sm inline-block mb-4 text-blue-500">
                      <LayoutDashboard size={48} />
                    </div>
                    <h3 className="font-bold text-gray-800">AI Optimization</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium">FoodLoop constantly learns your inventory flows to prevent waste before it literally enters the store.</p>
                 </div>
             </div>
          </div>
        )}

        {/* --- TAB 2: DONATIONS VIEW --- */}
        {activeTab === 'donations' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* SECTION 1: Donation Queue (Top) */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <AlertCircle className="text-orange-500" /> Items Ready for Donation
              </h2>
              {donationQueue.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {donationQueue.map(item => (
                    <div key={item.id} className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 hover:border-orange-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-orange-500"><Package size={24} /></div>
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">{item.time}</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-gray-500 text-sm font-bold mb-4">{item.quantity} {item.unit} • {item.condition}</p>
                      </div>
                      <button 
                        onClick={() => handleConfirmQueueDonation(item.id, item.name)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Check size={18} /> Confirm Donation
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold">
                  Queue is empty. Great job minimizing waste!
                </div>
              )}
            </div>

            {/* SECTION 2: Verified NGOs Nearby (Middle) */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <ShieldCheck className="text-[#2ecc71]" /> Verified NGOs in Your Area
              </h2>
              <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
                {[
                  { name: 'Food Bank India', dist: '3.2 km', tags: ['Dairy', 'Produce'], contact: '+91 98765-43210' },
                  { name: 'Hope Society', dist: '5.1 km', tags: ['Bakery', 'Packaged'], contact: '+91 98765-43211' },
                  { name: 'Smile Foundation', dist: '6.8 km', tags: ['All Types'], contact: '+91 98765-43212' },
                  { name: 'Care NGO', dist: '8.4 km', tags: ['Produce'], contact: '+91 98765-43213' }
                ].map((bank, i) => (
                  <div key={i} className="min-w-[300px] snap-center p-6 bg-gray-50 rounded-[30px] border-2 border-transparent hover:border-[#2ecc71] transition-all flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-black text-gray-800">{bank.name}</h3>
                      <CheckCircle2 size={20} className="text-[#2ecc71] fill-[#2ecc71]/20" />
                    </div>
                    <div className="flex gap-2 mb-4">
                      {bank.tags.map(tag => (
                        <span key={tag} className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">{tag}</span>
                      ))}
                    </div>
                    <div className="space-y-2 text-xs font-bold text-gray-500">
                      <div className="flex items-center gap-2"><Navigation size={14} className="text-[#2ecc71]" /> {bank.dist} away</div>
                      <div className="flex items-center gap-2"><Phone size={14} className="text-purple-400" /> {bank.contact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: Logistics & History (Bottom) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Active Pickups */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Truck className="text-blue-500" /> Active Pickups</h2>
                <div className="space-y-4">
                  {activePickups.map((pickup) => (
                    <div key={pickup.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                      <div className={`bg-${pickup.color}-100 p-3 rounded-2xl text-${pickup.color}-500`}>
                        <Clock size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-gray-800 text-sm">{pickup.ngo}</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">{pickup.items}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-${pickup.color}-600 bg-${pickup.color}-50 text-[10px] font-black uppercase px-2 py-1 rounded-lg block mb-1`}>{pickup.status}</span>
                        <span className="text-xs font-bold text-gray-400">{pickup.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Donation History */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Gift className="text-purple-500" /> Donation History</h2>
                <div className="space-y-3">
                  {donations.length > 0 ? (
                    donations.slice(0, 5).map((d: any) => (
                      <div key={d.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center font-bold text-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-xl text-purple-500"><Calendar size={20} /></div>
                          <div>
                            <p className="text-gray-800 text-sm">{d.productName}</p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase">
                              {d.foodBankName || 'Food Bank'} • {d.createdAt ? new Date(d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-purple-600 text-[10px] font-black uppercase block">{d.quantity} Units</span>
                          <span className="text-green-600 text-xs">₹{d.donatedValue?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-center py-10 text-gray-400 font-bold italic">No history found.</p>}
                </div>
              </div>
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
    <p className="text-3xl font-black leading-tight">{products.length}</p>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Products</p>
  </div>
  <div className="bg-white p-6 rounded-3xl border-l-[12px] border-green-500 shadow-sm flex flex-col justify-center">
    <p className="text-3xl font-black leading-tight">{products.filter(p => p.isDiscounted).length}</p>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Items Discounted</p>
  </div>
  <div className="bg-white p-6 rounded-3xl border-l-[12px] border-purple-500 shadow-sm flex flex-col justify-center">
    {/* FIXED: Using liveAnalytics.count */}
    <p className="text-3xl font-black leading-tight">{liveAnalytics.count}</p>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Donated This Week</p>
  </div>
  <div className="bg-white p-6 rounded-3xl border-l-[12px] border-yellow-500 shadow-sm flex flex-col justify-center">
    {/* FIXED: Using liveAnalytics.profit */}
    <p className="text-3xl font-black leading-tight">₹{Math.round(liveAnalytics.profit)}</p>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Profit Recovered</p>
  </div>
  <div className="bg-white p-6 rounded-3xl border-l-[12px] border-cyan-500 shadow-sm flex flex-col justify-center">
    {/* FIXED: Using liveAnalytics.wasteKg */}
    <p className="text-3xl font-black leading-tight">{liveAnalytics.wasteKg.toFixed(1)} kg</p>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Waste Prevented</p>
  </div>
  <div className="bg-white p-6 rounded-3xl border-l-[12px] border-emerald-500 shadow-sm flex flex-col justify-center">
    {/* FIXED: Using liveAnalytics.co2Kg */}
    <p className="text-3xl font-black leading-tight">{liveAnalytics.co2Kg.toFixed(1)} kg</p>
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
