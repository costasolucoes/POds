import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, MapPin, User, Mail, Phone, CreditCard, Check } from 'lucide-react';
import { useCart, useCartActions } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import { api } from '@/lib/api';
import { normalizeCart, formatBRLFromCents } from '@/payments/normalize';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface DeliveryForm {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { state } = useCart();
  const { removeFromCart, updateQuantity, clearCart, addToCart, addToCartWithOptions } = useCartActions();

  // Função para fechar o carrinho e limpar dados PIX
  const handleCloseCart = () => {
    setPixModalOpen(false);
    setPixData(null);
    setOrderInfo(null);
    onClose();
  };

  // Estados para as duas etapas
  const [currentStep, setCurrentStep] = useState<'cart' | 'payment'>('cart');
  
  // Debug: log para verificar se o componente está sendo renderizado
  console.log('CartSidebar renderizado, currentStep:', currentStep);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{ brcode?: string; qr_code_base64?: string } | null>(null);
  const [orderInfo, setOrderInfo] = useState<{ txId: string; txHash: string; orderId: string } | null>(null);
  


  // Limpar dados PIX quando o modal for fechado
  const handleClosePixModal = () => {
    setPixModalOpen(false);
    setPixData(null);
    setOrderInfo(null);
    console.log('Modal PIX fechado e dados limpos');
    // Limpar o carrinho após fechar o modal PIX
    clearCart();
    // Fechar o carrinho após fechar o modal PIX
    onClose();
  };
  
  const [form, setForm] = useState<DeliveryForm>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });

  // CEP → ViaCEP (preenche endereço no front; não envia pro back)
  const fetchCepData = async (cepInput: string) => {
    const cep = cepInput.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) return;

      setForm(prev => ({
        ...prev,
        logradouro: d.logradouro || prev.logradouro,
        bairro: d.bairro || prev.bairro,
        cidade: d.localidade || prev.cidade,
        estado: (d.uf || prev.estado || "").toUpperCase(),
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  // Atualizar CEP quando digitado
  useEffect(() => {
    if (form.cep.length === 8) {
      fetchCepData(form.cep);
    } else {
      setAddressData(null);
    }
  }, [form.cep]);

  const handleInputChange = (field: keyof DeliveryForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();              // ❗️ bloqueia qualquer tracking que tente submeter o <form>

    if (loading) return;
    setLoading(true);

    try {
      const items = normalizeCart(state.items.map(i => ({ 
        id: i.product?.id || 'produto', 
        name: i.product?.name || 'Produto', 
        price: i.product?.price || 0, 
        quantity: i.quantity 
      })));
      
      const payload = {
        items, // back confere e recalcula taxa lá também
        customer: {
          name: form.nome,
          email: form.email,
          document: form.cpf,
          phone: form.telefone,
        },
        shipping: { price: 0 }, // ignorado no back
        metadata: { origem: "site" },
      };

      const d = await api.postCheckout(payload);

      // ⚠️ NÃO redireciona para d.checkout_url
      const tx = d.tx_hash || d.session?.id;
      const pix = d.pix || d.raw?.pix || {};
      const copia = pix.pix_qr_code || pix.brcode || pix.copia_e_cola || pix.payload || null;
      const base64 = pix.qr_code_base64 || null;

      setPixData(pix);
      setOrderInfo({
        txId: tx || "",
        txHash: tx || "",
        orderId: tx || `ord_${Date.now()}`
      });
      setPixModalOpen(true); // ✅ abre modal
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      alert("Falha ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  // Validação de formulário
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const isCPF = (s: string) => onlyDigits(s).length === 11; // (coloque validação real se quiser)
  const isPhone = (s: string) => onlyDigits(s).length >= 10; // DDD+numero
  const isCEP = (s: string) => onlyDigits(s).length === 8;

  function isFormValid(f: DeliveryForm) {
    return (
      f.nome.trim().length > 2 &&
      isEmail(f.email) &&
      isCPF(f.cpf) &&
      isPhone(f.telefone) &&
      isCEP(f.cep) &&
      f.logradouro.trim().length > 2 &&
      f.numero.trim().length > 0 &&
      f.bairro.trim().length > 1 &&
      f.cidade.trim().length > 1 &&
      /^[A-Z]{2}$/.test(f.estado.toUpperCase())
    );
  }

  // Mostrar a taxa (só visual) quando < 3 itens
  function calcResumo() {
    const itemsCents = normalizeCart(state.items.map(i => ({ 
      id: i.product?.id || 'produto', 
      name: i.product?.name || 'Produto', 
      price: i.product?.price || 0, 
      quantity: i.quantity 
    })));

    const qty = itemsCents.reduce((a, i) => a + i.quantity, 0);
    const subtotal = itemsCents.reduce((a, i) => a + i.price * i.quantity, 0);
    const taxa = qty < 3 ? 1500 : 0;
    const total = subtotal + taxa;
    return { qty, subtotal, taxa, total };
  }

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

  // Resetar etapa quando fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('cart');
    }
  }, [isOpen]);

  if (state.items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={handleCloseCart}>
        <SheetContent className="w-full sm:w-96 bg-gradient-card border-border/50 shadow-glow-primary/10">
          <SheetHeader>
            <SheetTitle className="text-foreground">Seu carrinho</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Carrinho vazio</h3>
              <p className="text-muted-foreground">Adicione produtos para continuar</p>
            </div>
            <Button onClick={handleCloseCart} variant="outline" className="border-border/50">
              Continuar Comprando
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleCloseCart}>
        <SheetContent className={`w-full sm:w-96 bg-gradient-card border-border/50 shadow-glow-primary/10 flex flex-col h-full ${currentStep === 'payment' ? '[&>button]:hidden' : ''}`}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground text-lg font-bold">
              {currentStep === 'cart' ? '🛒 Meu Carrinho' : '📦 Informações de Entrega'}
            </SheetTitle>
            {currentStep === 'payment' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Clicou em voltar, mudando para cart');
                  setCurrentStep('cart');
                }}
                className="text-foreground hover:bg-white/10 bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
          
          {/* Indicador de etapas */}
          <div className="flex items-center justify-center space-x-2 mt-2 p-2 bg-gray-100 rounded-lg">
            <div className={`flex items-center space-x-1 ${currentStep === 'cart' ? 'text-purple-600' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'cart' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Carrinho</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-1 ${currentStep === 'payment' ? 'text-purple-600' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'payment' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Entrega</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          {currentStep === 'cart' ? (
            // ETAPA 1: CARRINHO - TODO SCROLLÁVEL
            <div className="py-4 space-y-4">
              {/* Lista de produtos */}
              <div className="space-y-2">
          {state.items.map((item) => (
                  <div key={item.product.id} className="bg-secondary/30 rounded-lg p-2 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate">{item.product.name}</h4>
                        <p className="text-xs text-gray-500 truncate">
                          {item.selectedOptions && item.selectedOptions.length > 0 
                            ? item.selectedOptions.map(option => option.name).join(', ')
                            : item.product.flavor
                          }
                        </p>
                        <span className="font-semibold text-primary text-sm">
                          R$ {formatCurrency(item.product.price)}
                        </span>
                  </div>
                  
                      <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-border/50"
                          onClick={() => {
                            const itemKey = `${item.product.id}-${item.selectedOptions.map(opt => opt.id).join('-')}`;
                            updateQuantity(itemKey, item.quantity - 1);
                          }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                        <span className="text-xs font-medium min-w-[1.25rem] text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-border/50"
                          onClick={() => {
                            const itemKey = `${item.product.id}-${item.selectedOptions.map(opt => opt.id).join('-')}`;
                            updateQuantity(itemKey, item.quantity + 1);
                          }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => {
                            const itemKey = `${item.product.id}-${item.selectedOptions.map(opt => opt.id).join('-')}`;
                            removeFromCart(itemKey);
                          }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                    <div className="text-right mt-0.5">
                      <span className="text-xs font-medium text-foreground">
                        Subtotal: R$ {formatCurrency(item.product.price * item.quantity)}
                    </span>
              </div>
            </div>
          ))}
        </div>

          {/* Barra de Progresso para Frete Grátis */}
              <div className="space-y-1">
                <div className="text-center">
                  {totalItems < 3 ? (
                    <p className="text-sm font-medium text-foreground">
                      Compre 3 itens e garanta frete grátis
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-green-600">
                      Parabéns!! Você já garantiu seu Frete Grátis
                    </p>
                  )}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(totalItems, 3) / 3 * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    {Math.min(totalItems, 3)}/3 itens
                  </span>
                </div>
                
                {/* Informação sobre frete - só aparece se não tiver frete grátis */}
                {totalItems < 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    Trabalhamos com uma taxa fixa de 15 reais de frete
                  </p>
                )}
              </div>

          <Separator className="bg-border/50" />
          
          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-foreground">Total:</span>
              <span className="text-primary">
                    R$ {formatCurrency(state.total)}
              </span>
            </div>
            
                <div className="flex justify-end">
                  {totalItems < 3 ? (
                    <p className="text-xs text-gray-500">
                      Preço final com frete inserido
                    </p>
                  ) : (
                    <p className="text-xs text-green-600">
                      Preço final com Frete Grátis
                    </p>
                  )}
                </div>
              </div>
              
              {/* Botão para próxima etapa */}
              <Button
                onClick={() => {
                  console.log('Clicou no botão, mudando para payment');
                  setCurrentStep('payment');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
              >
                📦 Continuar para Entrega
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          ) : (
            // ETAPA 2: INFORMAÇÕES DE ENTREGA
            <div className="flex-1 overflow-auto py-4 px-4">
                <form onSubmit={handleSubmit} action="#" noValidate className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Dados Pessoais
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm font-medium">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      required
                      className="h-9"
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="h-9"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={form.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Endereço de Entrega
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cep" className="text-sm font-medium">CEP *</Label>
                      <Input
                        id="cep"
                        value={form.cep}
                        onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, ''))}
                        onBlur={(e) => fetchCepData(e.target.value)}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                        className="h-9"
                      />
                      {cepLoading && (
                        <p className="text-xs text-blue-600">🔍 Buscando CEP...</p>
                      )}
                      {addressData && (
                        <p className="text-xs text-green-600">✅ CEP encontrado!</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logradouro" className="text-sm font-medium">Logradouro *</Label>
                      <Input
                        id="logradouro"
                        value={form.logradouro}
                        onChange={(e) => handleInputChange('logradouro', e.target.value)}
                        required
                        className="h-9"
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="numero" className="text-sm font-medium">Número *</Label>
                      <Input
                        id="numero"
                        value={form.numero}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        required
                        className="h-9"
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
                      <Input
                        id="complemento"
                        value={form.complemento}
                        onChange={(e) => handleInputChange('complemento', e.target.value)}
                        placeholder="Apto, casa"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-sm font-medium">Bairro *</Label>
                    <Input
                      id="bairro"
                      value={form.bairro}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                      required
                      className="h-9"
                      placeholder="Nome do bairro"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="cidade" className="text-sm font-medium">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={form.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        required
                        className="h-9"
                        placeholder="Sua cidade"
                      />
                    </div>
                    <div className="space-y-2 w-20">
                      <Label htmlFor="estado" className="text-sm font-medium">Estado *</Label>
                      <Input
                        id="estado"
                        value={form.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        maxLength={2}
                        required
                        className="h-9"
                        placeholder="SP"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes" className="text-sm font-medium">Observações</Label>
                    <Input
                      id="observacoes"
                      value={form.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      placeholder="Instruções especiais para entrega"
                      className="h-9"
                    />
                  </div>
                </div>

                  <Separator />

                {/* Resumo do Pedido */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Resumo do Pedido
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {(() => {
                      const { qty, subtotal, taxa, total } = calcResumo();
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Subtotal ({qty} itens):</span>
                            <span className="font-medium">{formatBRLFromCents(subtotal)}</span>
                          </div>
                          
                          {qty < 3 && (
                            <div className="flex justify-between text-sm">
                              <span>Taxa pedido mínimo:</span>
                              <span className="font-medium">{formatBRLFromCents(taxa)}</span>
                            </div>
                          )}

                          <Separator className="bg-gray-300" />

                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-purple-600">{formatBRLFromCents(total)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
          </div>
          
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !isFormValid(form)}
                >
                  {loading ? '⏳ Processando...' : '✅ Finalizar Pedido'}
                </Button>
                </form>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

      {/* Modal PIX - Fora do Sheet */}
      {pixData && orderInfo && (
        <>
          {console.log('Renderizando PaymentModal:', { 
            open: pixModalOpen, 
            txId: orderInfo.txId, 
            initialBrcode: pixData?.brcode, 
            initialQrBase64: pixData?.qr_code_base64 
          })}
          <PaymentModal
            open={pixModalOpen}
            onClose={handleClosePixModal}
            txId={orderInfo.txId}
            initialBrcode={pixData?.brcode}
            initialQrBase64={pixData?.qr_code_base64}
          />
        </>
      )}

    </>
  );
};

export default CartSidebar;