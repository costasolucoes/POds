import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Zap, CheckCircle } from 'lucide-react';
import { useCartActions } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { addToCart } = useCartActions();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Card 
      className="group cursor-pointer bg-gradient-card border-border/50 shadow-card hover:shadow-product hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative"
      onClick={() => onProductClick(product)}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      
      <div className="relative overflow-hidden">
        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 relative">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <Badge className="bg-gradient-primary text-primary-foreground shadow-glow-primary">
              <Zap className="h-3 w-3 mr-1" />
              Destaque
            </Badge>
          )}
          {product.originalPrice && (
            <Badge variant="destructive">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </Badge>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute top-3 right-3">
          {product.inStock ? (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Em Estoque
            </Badge>
          ) : (
            <Badge variant="destructive">
              Esgotado
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3 relative z-10">
        {/* Product Name and Flavor */}
        <div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-accent font-medium">{product.flavor}</p>
        </div>

        {/* Product Details */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{product.puffs.toLocaleString()} puffs</span>
          <span>{product.nicotine}</span>
        </div>

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;