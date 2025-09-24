import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductOption } from '@/types/product';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedOptions: ProductOption[], quantity: number, notes: string) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  if (!product || !isOpen) return null;

  const handleOptionToggle = (option: ProductOption) => {
    const isSelected = selectedOptions.some(opt => opt.id === option.id);
    const maxSelections = product.maxSelections || 1;
    
    if (maxSelections === 1) {
      // Para seleção única, sempre substitui a seleção atual
      setSelectedOptions(isSelected ? [] : [option]);
    } else {
      // Para seleção múltipla, adiciona/remove da lista
      if (isSelected) {
        setSelectedOptions(prev => prev.filter(opt => opt.id !== option.id));
      } else {
        if (selectedOptions.length < maxSelections) {
          setSelectedOptions(prev => [...prev, option]);
        }
      }
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      // Reset form
      setSelectedOptions([]);
      setQuantity(1);
      setNotes('');
    }, 300);
  };

  const handleAddToCart = () => {
    const minSelections = product.minSelections || 1;
    if (selectedOptions.length < minSelections) {
      return; // Não permite adicionar se não atender o mínimo
    }
    
    onAddToCart(product, selectedOptions, quantity, notes);
    handleClose();
  };

  const canAddToCart = selectedOptions.length >= (product.minSelections || 1);

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-end sm:items-center justify-center"
      style={{
        animation: isClosing ? 'fadeIn 0.3s ease-out reverse' : 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-lg flex flex-col"
        style={{
          animation: isClosing ? 'slideDownToBottom 0.3s ease-in' : 'slideUpFromBottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'translateY(0)'
        }}
      >
        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Product Image */}
          <div className="relative h-64 sm:h-80 overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover object-top bg-white"
            />
            {/* Overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">{product.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{product.description}</p>
            </div>

            {/* Options */}
            {product.options && product.options.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-black mb-2">
                  SABORES {product.name.includes('V400') ? 'V400' : 
                           product.name.includes('V300') ? 'V300' : 
                           product.name.includes('V250') ? 'V250' :
                           product.name.includes('V150') ? 'V150' :
                           product.name.includes('V80') ? 'V80' :
                           product.name.includes('V50') ? 'V50' :
                           product.name.includes('P100') ? 'P100' : 'V300'}:
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Escolha pelo menos {product.minSelections || 1} e no máximo {product.maxSelections || 1} opção.
                </p>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {product.options.map((option, index) => {
                    const isSelected = selectedOptions.some(opt => opt.id === option.id);
                    return (
                      <div key={option.id}>
                        <button
                          onClick={() => handleOptionToggle(option)}
                          className={`w-full flex items-center justify-between p-4 transition-colors ${
                            isSelected 
                              ? 'bg-purple-50' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-left text-sm font-medium text-gray-700">
                            {option.name}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
                        </button>
                        {index < product.options!.length - 1 && (
                          <div className="border-b border-gray-200"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">OBSERVAÇÕES DO ITEM</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o item..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                rows={3}
                maxLength={250}
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {notes.length}/250
              </div>
            </div>
              </div>
            </div>

        {/* Fixed Bottom Bar */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-medium text-black min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`px-6 py-3 rounded-lg font-bold text-white ${
                canAddToCart 
                  ? 'bg-black hover:bg-gray-800' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              ADICIONAR • R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;