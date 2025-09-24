import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, CartItem } from '@/types/product';

// Updated to fix calculateTotal reference error

interface CartState {
  items: CartItem[];
  subtotal: number;
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'ADD_ITEM_WITH_OPTIONS'; cartItem: CartItem }
  | { type: 'REMOVE_ITEM'; itemKey: string }
  | { type: 'UPDATE_QUANTITY'; itemKey: string; quantity: number }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.id === action.product.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          subtotal: calculateTotals(updatedItems).subtotal,
          total: calculateTotals(updatedItems).total
        };
      } else {
        const updatedItems = [...state.items, { 
          product: action.product, 
          quantity: 1, 
          selectedOptions: [], 
          notes: '' 
        }];
        return {
          ...state,
          items: updatedItems,
          subtotal: calculateTotals(updatedItems).subtotal,
          total: calculateTotals(updatedItems).total
        };
      }
    }
    
    case 'ADD_ITEM_WITH_OPTIONS': {
      const updatedItems = [...state.items, action.cartItem];
      const totals = calculateTotals(updatedItems);
      return {
        ...state,
        items: updatedItems,
        subtotal: totals.subtotal,
        total: totals.total
      };
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => {
        const itemKey = `${item.product.id}-${item.selectedOptions.map(opt => opt.id).join('-')}`;
        return itemKey !== action.itemKey;
      });
      const totals = calculateTotals(updatedItems);
      return {
        ...state,
        items: updatedItems,
        subtotal: totals.subtotal,
        total: totals.total
      };
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', itemKey: action.itemKey });
      }
      
      const updatedItems = state.items.map(item => {
        const itemKey = `${item.product.id}-${item.selectedOptions.map(opt => opt.id).join('-')}`;
        return itemKey === action.itemKey
          ? { ...item, quantity: action.quantity }
          : item;
      });
      const totals = calculateTotals(updatedItems);
      return {
        ...state,
        items: updatedItems,
        subtotal: totals.subtotal,
        total: totals.total
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0
      };
      
    default:
      return state;
  }
};

const calculateTotals = (items: CartItem[]): { subtotal: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Calcular total de itens para verificar frete grátis
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  // Adicionar taxa de frete se não tiver frete grátis (menos de 3 itens)
  const shippingFee = totalItems < 3 ? 15 : 0;
  
  return {
    subtotal,
    total: subtotal + shippingFee
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    subtotal: 0,
    total: 0
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const useCartActions = () => {
  const { dispatch } = useCart();

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', product });
  };

  const addToCartWithOptions = (cartItem: CartItem) => {
    dispatch({ type: 'ADD_ITEM_WITH_OPTIONS', cartItem });
  };

  const removeFromCart = (itemKey: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemKey });
  };

  const updateQuantity = (itemKey: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', itemKey, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return { addToCart, addToCartWithOptions, removeFromCart, updateQuantity, clearCart };
};