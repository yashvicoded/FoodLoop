export interface Product {
  id: string;
  name: string;
  category: string;
  expiryDate: Date;
  originalPrice: number;
  currentPrice: number;
  isDiscounted: boolean;
  discountPercent?: number;
  quantity: number;
  createdAt?: Date;
  lastUpdated?: Date;
}

export interface DiscountSummary {
  totalProducts: number;
  urgentItems: number;
  warningItems: number;
  cautionItems: number;
  normalItems: number;
  totalDiscountValue: number;
  estimatedRevenue: number;
  estimatedWaste: number;
  percentageDiscounted: number;
}

export interface Donation {
  id: string;
  productId: string;
  productName: string;
  foodBankId: string;
  quantity: number;
  donatedValue: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  donatedAt?: Date;
  updatedAt?: Date;
}

export interface FoodBank {
  id: string;
  name: string;
  distance: number;
  capacity: string;
  contact: string;
  location?: string;
}

export interface Dashboard {
  inventory: {
    total: number;
    discounted: number;
    urgent: number;
    warning: number;
    caution: number;
  };
  donations: {
    donatedThisWeek: number;
    wastePreventedKg: number;
    co2SavedKg: number;
    revenueRecovered: number;
    total: number;
  };
  revenue: {
    recovered: number;
    potential: number;
  };
  freshness: {
    fresh: number;
    warning: number;
    urgent: number;
  };
}

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

