export interface ProductOption {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  flavor: string;
  nicotine: string;
  puffs: number;
  inStock: boolean;
  featured?: boolean;
  description?: string;
  ingredients?: string[];
  options?: ProductOption[];
  maxSelections?: number;
  minSelections?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: ProductOption[];
  notes: string;
}