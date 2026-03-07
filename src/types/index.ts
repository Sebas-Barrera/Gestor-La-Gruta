export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  supplier: string;
  stock: number;
  maxStock: number;
  unit: string;
  price: number;
  lastPurchase: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  image?: string;
  location?: string;
  barId?: string;
}

export interface Bar {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  image?: string;
  manager?: string;
  phone?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  timestamp: string;
  barId: string;
  barName?: string;
  sellerName?: string;
}

export interface Activity {
  id: string;
  type: 'sale' | 'stock_in' | 'stock_out' | 'alert' | 'login' | 'inventory';
  message: string;
  timestamp: string;
  user?: string;
  barId?: string;
  barName?: string;
  productId?: string;
  productName?: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock';
  currentStock: number;
  threshold: number;
  timestamp: string;
  barId?: string;
  barName?: string;
}

export interface DashboardStats {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  todaySales: number;
  totalProductsChange: number;
  inventoryValueChange: number;
  todaySalesChange: number;
}

export interface BarStats {
  id: string;
  name: string;
  location: string;
  productCount: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todaySales: number;
  salesTrend: number;
}
