import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, MapPin, User, Mail, Phone, CreditCard, Check } from 'lucide-react';
import { useCart, useCartActions } from '@/contexts/CartContext';
import { useState, useEffect, useMemo } from 'react';
import PaymentModal from './PaymentModal';
import { api } from '@/lib/api';
import { toCents, formatBRL } from '@/lib/money';
import { validateFormLite, CheckoutForm } from '@/lib/validate';
import { fetchViaCEP } from '@/lib/viacep';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
  
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    document: "",
    phone: "",
    address: { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  // Validação "lite"
  const { ok: formOk, errors: lastErrors } = useMemo(() => validateFormLite(form), [form]);
  useEffect(() => setErrors(lastErrors), [lastErrors]);

  function markTouched(path: string) {
    setTouched((p) => ({ ...p, [path]: true }));
  }

  function onChange(k: string, v: any) {
    setForm((prev) => {
      const clone = structuredClone(prev);
      const keys = k.split(".");
      let obj: any = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = v;
      return clone;
    });
  }

  // CEP → ViaCEP (preenche endereço no front; não envia pro back)
  async function onBlurCEP() {
    try {
      const d = (form.address.cep || "").replace(/\D/g, "");
      if (d.length !== 8) return; // ignora — não trava
      setCepLoading(true);
      const a = await fetchViaCEP(form.address.cep);
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          street: a.street || prev.address.street,
          neighborhood: a.neighborhood || prev.address.neighborhood,
          city: a.city || prev.address.city,
          state: a.state || prev.address.state,
        },
      }));
    } catch {}
    finally { setCepLoading(false); }
  }


  async function onFinalizarClick() {
    const v = validateFormLite(form);
    setErrors(v.errors);
    const touchedAll: Record<string, boolean> = {};
    Object.keys(v.errors).forEach((k) => (touchedAll[k] = true));
    setTouched((t) => ({ ...t, ...touchedAll }));

    if (!v.ok) {
      const first = Object.keys(v.errors)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus?.();
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      const items = state.items.map(i => ({
        id: String(i.product?.id || 'produto'),
        name: String(i.product?.name || 'Produto'),
        price: toCents(i.product?.price || 0),
        quantity: Number(i.quantity || 1),
      }));
      
      const payload = {
        items,
        customer: {
          name: form.name,
          email: form.email,
          document: form.document, // qualquer coisa serve; o back saneia
          phone: form.phone,
        },
        // shipping opcional; o back já impõe endereço "safe"
        // metadata opcional
      };

      const resp = await api.createCheckout(payload) as any;
      const url = resp.checkout_url || resp.payment_url;
      if (url) {
        window.location.href = url; // (se houver)
        return;
      }
      const tx = resp.tx_hash || resp.session?.id;
      const pix = resp.pix || resp.raw?.pix || {};
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
      setBusy(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };


  // Mostrar a taxa (só visual) quando < 3 itens
  function calcResumo() {
    const subtotalCents = state.items.reduce((acc, it) => acc + toCents(it.product?.price || 0) * (it.quantity || 1), 0);
    const totalQty = state.items.reduce((a, it) => a + (it.quantity || 1), 0);
    const surchargeCents = totalQty < 3 ? 1500 : 0; // +R$15 se <3 itens
    const totalCents = subtotalCents + surchargeCents;
    
    return { qty: totalQty, subtotal: subtotalCents, taxa: surchargeCents, total: totalCents };
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
                <div className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Dados Pessoais
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm font-medium">Nome Completo *</Label>
                    <Input
                      data-field="name"
                      id="nome"
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      onBlur={() => markTouched("name")}
                      required
                      className="h-9"
                      placeholder="Digite seu nome completo"
                    />
                    {touched["name"] && errors["name"] && (
                      <p className="text-red-600 text-xs mt-1">{errors["name"]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                      <Input
                        data-field="email"
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        onBlur={() => markTouched("email")}
                        required
                        className="h-9"
                        placeholder="seu@email.com"
                      />
                      {touched["email"] && errors["email"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["email"]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        data-field="phone"
                        id="telefone"
                        value={form.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        onBlur={() => markTouched("phone")}
                        placeholder="(11) 99999-9999"
                        required
                        className="h-9"
                      />
                      {touched["phone"] && errors["phone"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["phone"]}</p>
                      )}
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
                        data-field="address.cep"
                        id="cep"
                        value={form.address.cep}
                        onChange={(e) => onChange("address.cep", e.target.value.replace(/\D/g, ''))}
                        onBlur={() => { markTouched("address.cep"); onBlurCEP(); }}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                        className="h-9"
                      />
                      {touched["address.cep"] && errors["address.cep"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["address.cep"]}</p>
                      )}
                      {cepLoading && (
                        <p className="text-xs text-blue-600">🔍 Buscando CEP...</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logradouro" className="text-sm font-medium">Logradouro *</Label>
                      <Input
                        data-field="address.street"
                        id="logradouro"
                        value={form.address.street}
                        onChange={(e) => onChange("address.street", e.target.value)}
                        onBlur={() => markTouched("address.street")}
                        required
                        className="h-9"
                        placeholder="Rua, Avenida, etc."
                      />
                      {touched["address.street"] && errors["address.street"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["address.street"]}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="numero" className="text-sm font-medium">Número *</Label>
                      <Input
                        data-field="address.number"
                        id="numero"
                        value={form.address.number}
                        onChange={(e) => onChange("address.number", e.target.value)}
                        onBlur={() => markTouched("address.number")}
                        required
                        className="h-9"
                        placeholder="123"
                      />
                      {touched["address.number"] && errors["address.number"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["address.number"]}</p>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
                      <Input
                        id="complemento"
                        value={form.address.complement}
                        onChange={(e) => onChange("address.complement", e.target.value)}
                        placeholder="Apto, casa"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-sm font-medium">Bairro *</Label>
                    <Input
                      data-field="address.neighborhood"
                      id="bairro"
                      value={form.address.neighborhood}
                      onChange={(e) => onChange("address.neighborhood", e.target.value)}
                      onBlur={() => markTouched("address.neighborhood")}
                      required
                      className="h-9"
                      placeholder="Nome do bairro"
                    />
                    {touched["address.neighborhood"] && errors["address.neighborhood"] && (
                      <p className="text-red-600 text-xs mt-1">{errors["address.neighborhood"]}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="cidade" className="text-sm font-medium">Cidade *</Label>
                      <Input
                        data-field="address.city"
                        id="cidade"
                        value={form.address.city}
                        onChange={(e) => onChange("address.city", e.target.value)}
                        onBlur={() => markTouched("address.city")}
                        required
                        className="h-9"
                        placeholder="Sua cidade"
                      />
                      {touched["address.city"] && errors["address.city"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["address.city"]}</p>
                      )}
                    </div>
                    <div className="space-y-2 w-20">
                      <Label htmlFor="estado" className="text-sm font-medium">Estado *</Label>
                      <Input
                        data-field="address.state"
                        id="estado"
                        value={form.address.state}
                        onChange={(e) => onChange("address.state", e.target.value)}
                        onBlur={() => markTouched("address.state")}
                        maxLength={2}
                        required
                        className="h-9"
                        placeholder="SP"
                      />
                      {touched["address.state"] && errors["address.state"] && (
                        <p className="text-red-600 text-xs mt-1">{errors["address.state"]}</p>
                      )}
                    </div>
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
                            <span className="font-medium">{formatBRL(subtotal)}</span>
                          </div>
                          
                          {qty < 3 && (
                            <div className="flex justify-between text-sm">
                              <span>Taxa pedido mínimo:</span>
                              <span className="font-medium">{formatBRL(taxa)}</span>
                            </div>
                          )}

                          <Separator className="bg-gray-300" />

                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-purple-600">{formatBRL(total)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
          </div>
          
                <Button
                  onClick={onFinalizarClick}
                  disabled={busy || !formOk}
                  className={`h-12 w-full rounded-lg font-bold text-white ${
                    busy || !formOk ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {busy ? "Processando…" : "Finalizar compra"}
                </Button>
                </div>
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