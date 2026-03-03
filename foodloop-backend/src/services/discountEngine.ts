export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: string;
  expiryDate: Date;
  originalPrice: number;
  currentPrice: number;
  isDiscounted: boolean;
  quantity: number;
  lastUpdated: Date;
}

export interface DiscountResult {
  discountPercent: number;
  finalPrice: number;
  priority: string;
  reason: string;
}

export class DiscountEngine {
  private static readonly DISCOUNT_RULES = [
    { daysToExpiry: 2, discountPercent: 75, priority: 'URGENT' },
    { daysToExpiry: 4, discountPercent: 50, priority: 'WARNING' },
    { daysToExpiry: 6, discountPercent: 25, priority: 'CAUTION' },
  ];

  private static readonly CATEGORY_MULTIPLIERS: { [key: string]: number } = {
    'Bakery': 1.2,
    'Dairy': 1.1,
    'Fresh Produce': 1.15,
    'Frozen': 0.8,
    'Canned': 0.5,
  };

  static calculateDaysToExpiry(expiryDate: any): number {
    try {
      const now = new Date();
      // Force the input into a Date object, even if it's a Firebase Timestamp or String
      const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate?.toDate?.() || expiryDate);

      if (isNaN(expiry.getTime())) return 999; // Fallback for bad data

      const diffTime = expiry.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 999;
    }
  }

  static calculateDiscount(product: Product): DiscountResult {
    const daysLeft = this.calculateDaysToExpiry(product.expiryDate);

    let discountPercent = 0;
    if (daysLeft <= 0) {
      discountPercent = 75;
    } else if (daysLeft >= 1 && daysLeft <= 2) {
      discountPercent = 50;
    } else if (daysLeft >= 3 && daysLeft <= 5) {
      discountPercent = 25;
    } else {
      discountPercent = 0;
    }

    if (discountPercent === 0) {
      return {
        discountPercent: 0,
        finalPrice: product.originalPrice,
        priority: 'NORMAL',
        reason: 'Item is fresh',
      };
    }

    let finalPrice = product.originalPrice * (1 - discountPercent / 100);

    let priority = 'NORMAL';
    if (daysLeft <= 0) priority = 'URGENT';
    else if (daysLeft <= 2) priority = 'WARNING';
    else if (daysLeft <= 5) priority = 'CAUTION';

    return {
      discountPercent,
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      priority,
      reason: `Expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    };
  }

  static batchCalculateDiscounts(products: Product[]): (Product & { discount: DiscountResult })[] {
    return products.map(product => ({
      ...product,
      discount: this.calculateDiscount(product),
    }));
  }

  static sortByPriority(products: (Product & { discount: DiscountResult })[]): typeof products {
    const priorityOrder = { 'URGENT': 0, 'WARNING': 1, 'CAUTION': 2, 'NORMAL': 3 };

    return products.sort((a, b) => {
      const priorityA = priorityOrder[a.discount.priority as keyof typeof priorityOrder] || 999;
      const priorityB = priorityOrder[b.discount.priority as keyof typeof priorityOrder] || 999;

      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    });
  }

  static estimateRevenueRecovery(products: (Product & { discount: DiscountResult })[]): number {
    return products.reduce((sum, p) => {
      if (p.discount.discountPercent > 0) {
        return sum + (p.discount.finalPrice * p.quantity);
      }
      return sum;
    }, 0);
  }

  static estimateWaste(products: Product[]): number {
    const urgentProducts = products.filter(p =>
      this.calculateDaysToExpiry(p.expiryDate) <= 2
    );
    return urgentProducts.reduce((sum, p) => sum + p.originalPrice * p.quantity, 0);
  }
}