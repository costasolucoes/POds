import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/Header';
import { products } from '@/data/products';
import { useCart, useCartActions } from '@/contexts/CartContext';
import { ShoppingCart, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CartSidebar from '@/components/CartSidebar';
import ProductModal from '@/components/ProductModal';
import { Product, ProductOption } from '@/types/product';

const Index: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [activeSection, setActiveSection] = useState('destaque');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { state } = useCart();
  const { addToCart, addToCartWithOptions } = useCartActions();
  
  // Calcular total de itens (quantidade total, não produtos únicos)
  const totalItems = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);
  
  // Usar subtotal do contexto
  const subtotal = state.subtotal;
  
  // Refs para as seções
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Controlar quando mostrar o seletor de seções e detectar seção ativa
  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = 80; // Altura aproximada do header
      setShowSectionSelector(window.scrollY > headerHeight);
      
      // Detectar qual seção está visível
      const scrollPosition = window.scrollY + 100; // Offset para considerar o seletor
      
      // Verificar cada seção para ver qual está mais próxima do topo
      const sectionEntries = Object.entries(sectionRefs.current);
      let closestSection = 'destaque';
      let closestDistance = Infinity;
      
      sectionEntries.forEach(([sectionId, element]) => {
        if (element) {
          const elementTop = element.offsetTop;
          const distance = Math.abs(elementTop - scrollPosition);
          
          if (distance < closestDistance && elementTop <= scrollPosition + 200) {
            closestDistance = distance;
            closestSection = sectionId;
          }
        }
      });
      
      setActiveSection(closestSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Verificar estado inicial do scroll horizontal
  useEffect(() => {
    checkScrollState();
  }, [showSectionSelector]);

  // Filtrar produtos baseado na busca
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.flavor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para filtrar produtos por busca
  const filterProducts = (productList: typeof products) => {
    if (!searchQuery.trim()) return productList;
    return productList.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.flavor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Produtos em destaque
  const featuredProducts = filterProducts(products.filter(product => product.featured));
  
  // Produtos IGNITE
  const igniteProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('ignite')
  ));
  
  // Produtos ELFBAR
  const elfbarProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('elfbar') || 
    product.name.toLowerCase().includes('refil ew') ||
    product.name.toLowerCase().includes('kit ew') ||
    product.name.toLowerCase().includes('bateria ew')
  ));
  
  // Produtos NIKBAR
  const nikbarProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('nikbar')
  ));
  
  // Produtos LOST MARY
  const lostmaryProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('lost mary')
  ));
  
  // Produtos OXBAR
  const oxbarProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('oxbar')
  ));
  
  // Produtos SEX ADDICT
  const sexaddictProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('sex addict')
  ));
  
  // Produtos AIRMEZ
  const airmezProducts = filterProducts(products.filter(product => 
    product.name.toLowerCase().includes('airmez')
  ));

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCartWithOptions = (product: Product, selectedOptions: ProductOption[], quantity: number, notes: string) => {
    // Criar um item do carrinho com as opções selecionadas
    const cartItem = {
      product,
      quantity,
      selectedOptions,
      notes
    };
    
    // Adicionar ao carrinho
    addToCartWithOptions(cartItem);
  };

  // Função para verificar estado do scroll horizontal
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Função para navegar para uma seção específica
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      // Calcular a posição considerando a altura do seletor de seções
      const selectorHeight = 60; // Altura aproximada do seletor
      const elementTop = element.offsetTop;
      const scrollPosition = elementTop - selectorHeight - 20; // 20px de margem extra
      
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Lista de seções disponíveis
  const sections = [
    { id: 'destaque', name: 'DESTAQUE', hasProducts: featuredProducts.length > 0 },
    { id: 'ignite', name: 'IGNITE', hasProducts: igniteProducts.length > 0 },
    { id: 'elfbar', name: 'ELFBAR', hasProducts: elfbarProducts.length > 0 },
    { id: 'nikbar', name: 'NIKBAR', hasProducts: nikbarProducts.length > 0 },
    { id: 'lostmary', name: 'LOST MARY', hasProducts: lostmaryProducts.length > 0 },
    { id: 'oxbar', name: 'OXBAR', hasProducts: oxbarProducts.length > 0 },
    { id: 'sexaddict', name: 'SEX ADDICT', hasProducts: sexaddictProducts.length > 0 },
    { id: 'airmez', name: 'AIRMEZ', hasProducts: airmezProducts.length > 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Seletor de Seções */}
      <div className={`fixed top-0 left-0 right-0 z-30 bg-white transition-all duration-300 ease-out ${
        showSectionSelector 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}>
        <div className="px-4 py-3">
          <div className="relative">
            {/* Seções com gradientes nas extremidades */}
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex items-center space-x-8 overflow-x-auto scrollbar-hide px-8"
                onScroll={checkScrollState}
              >
                {sections.filter(section => section.hasProducts).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-sm font-medium whitespace-nowrap transition-colors ${
                      activeSection === section.id
                        ? 'text-black font-bold'
                        : 'text-gray-500'
                    }`}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
              
              {/* Gradiente esquerdo - fade para branco */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
              
              {/* Gradiente direito - fade para branco */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
              
              {/* Seta esquerda - indica área de deslize */}
              {canScrollLeft && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronLeft className="h-5 w-5 text-black" />
                </div>
              )}
              
              {/* Seta direita - indica área de deslize */}
              {canScrollRight && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="h-5 w-5 text-black" />
                </div>
              )}
            </div>
          </div>
          
          {/* Linha de destaque para seção ativa */}
          {activeSection && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-0.5 bg-black"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-24">
        {/* Seção DESTAQUES */}
        {featuredProducts.length > 0 && (
          <div ref={(el) => sectionRefs.current['destaque'] = el} className="bg-gray-100">
            <div className="px-4 py-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">DESTAQUES</h2>
              
              {/* Produto em destaque */}
              {featuredProducts.slice(0, 1).map((product) => (
                <div key={product.id} className="bg-white border-l-4 border-orange-500 p-4 rounded-lg shadow-sm">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-500 text-white px-3 py-1 text-sm font-bold rounded">
                          MAIS PEDIDO
                        </span>
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner IGNITE */}
        <div 
          ref={(el) => sectionRefs.current['ignite'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/hGT1M7tB/ignite.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos IGNITE */}
        {igniteProducts.length > 0 && (
          <div className="bg-white">
            {igniteProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Tag NOVO se aplicável */}
                      {product.name.includes('ICE') && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 transform rotate-12">
                          NOVO
                        </div>
                      )}
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < igniteProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner ELFBAR */}
        <div 
          ref={(el) => sectionRefs.current['elfbar'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/CxZNB2yd/elfbar.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos ELFBAR */}
        {elfbarProducts.length > 0 && (
          <div className="bg-white">
            {elfbarProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-blue-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < elfbarProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner NIKBAR */}
        <div 
          ref={(el) => sectionRefs.current['nikbar'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/W3V6ybdJ/nikbar.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>
              
        {/* Produtos NIKBAR */}
        {nikbarProducts.length > 0 && (
          <div className="bg-white">
            {nikbarProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < nikbarProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner LOST MARY */}
        <div 
          ref={(el) => sectionRefs.current['lostmary'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/wjSkhkH2/lost-mary.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos LOST MARY */}
        {lostmaryProducts.length > 0 && (
          <div className="bg-white">
            {lostmaryProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < lostmaryProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner OXBAR */}
        <div 
          ref={(el) => sectionRefs.current['oxbar'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/85bBgQvX/oxbar.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos OXBAR */}
        {oxbarProducts.length > 0 && (
          <div className="bg-white">
            {oxbarProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < oxbarProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner SEX ADDICT */}
        <div 
          ref={(el) => sectionRefs.current['sexaddict'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/jdGpnJgb/sex-addict.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos SEX ADDICT */}
        {sexaddictProducts.length > 0 && (
          <div className="bg-white">
            {sexaddictProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < sexaddictProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
          </div>
          ))}
          </div>
        )}

        {/* Banner AIRMEZ */}
        <div 
          ref={(el) => sectionRefs.current['airmez'] = el} 
          className="relative px-4 py-3 min-h-[60px]"
          style={{ 
            backgroundImage: 'url(https://i.postimg.cc/FsCpK4B2/airmez.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Produtos AIRMEZ */}
        {airmezProducts.length > 0 && (
          <div className="bg-white">
            {airmezProducts.map((product, index) => (
              <div key={product.id}>
                <div className="px-4 py-4">
                  <button
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* Informações do produto */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.puffs > 0 ? `${product.puffs.toLocaleString()} puffs` : 'Bateria recarregável'}
                      </p>
                      <p className="text-sm text-purple-600 font-medium mb-3">
                        Clique para ver os sabores
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.originalPrice && product.originalPrice > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagem do produto */}
                    <div className="relative ml-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover object-top bg-white"
                        />
                      </div>
                      
                      {/* Ícone de seta para indicar que é clicável */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </div>
                {index < airmezProducts.length - 1 && (
                  <div className="border-b border-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Carrinho Fixo na Parte Inferior */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-black text-white p-5 z-40 transition-all duration-700 ease-out transform ${
          totalItems > 0 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between max-w-md mx-auto gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <ShoppingCart className="h-6 w-6 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">
                {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
              <span className="text-sm opacity-80">
                R$ {(subtotal || 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            Finalizar compra
          </button>
        </div>
      </div>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCartWithOptions}
      />
    </div>
  );
};

export default Index;