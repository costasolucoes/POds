import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, User, Mail, Phone, CreditCard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getCep } from '@/lib/api';

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
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useCart();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  
  const [form, setForm] = useState<DeliveryForm>({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });

  // NÃO chamar nada de CEP — endereço é sempre FIXO
  const shouldLookupCep = false;
  
  const fetchCepData = async (cep: string) => {
    if (shouldLookupCep) {
      // nunca entra aqui
      if (cep.length !== 8) return;
      
      setCepLoading(true);
      try {
        const data = await getCep(cep);
        setAddressData(data);
        setForm(prev => ({
          ...prev,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          cidade: data.city || '',
          estado: data.state || ''
        }));
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setAddressData(null);
      } finally {
        setCepLoading(false);
      }
    }
    // Endereço fixo - não faz nada
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
    setLoading(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui você pode adicionar a lógica para processar o pedido
    console.log('Dados do pedido:', { form, items: state.items });
    
    setLoading(false);
    alert('Pedido processado com sucesso! (Simulação)');
    navigate('/');
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Carrinho vazio</h2>
            <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar às compras
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">Finalizar Pedido</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Entrega */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Dados de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Pessoais
                  </h3>
                  
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={form.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={form.cep}
                        onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, ''))}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                        className="mt-1"
                      />
                      {cepLoading && (
                        <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>
                      )}
                      {addressData && (
                        <p className="text-xs text-green-600 mt-1">✓ CEP encontrado</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="logradouro">Logradouro *</Label>
                      <Input
                        id="logradouro"
                        value={form.logradouro}
                        onChange={(e) => handleInputChange('logradouro', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="numero">Número *</Label>
                      <Input
                        id="numero"
                        value={form.numero}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={form.complemento}
                        onChange={(e) => handleInputChange('complemento', e.target.value)}
                        placeholder="Apartamento, casa, etc."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        value={form.bairro}
                        onChange={(e) => handleInputChange('bairro', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={form.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado *</Label>
                      <Input
                        id="estado"
                        value={form.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        maxLength={2}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={form.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      placeholder="Instruções especiais para entrega"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumo do Pedido */}
          <Card className="bg-white/95 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Itens */}
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">
                          {item.selectedOptions && item.selectedOptions.length > 0 
                            ? item.selectedOptions.map(option => option.name).join(', ')
                            : item.product.flavor
                          }
                        </p>
                        <p className="text-xs text-gray-600">
                          Qtd: {item.quantity} x R$ {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        R$ {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} itens):</span>
                    <span>R$ {formatCurrency(state.total)}</span>
                  </div>
                  
                  {totalItems < 3 ? (
                    <div className="flex justify-between text-sm">
                      <span>Frete:</span>
                      <span>R$ 15,00</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Frete:</span>
                      <span>GRÁTIS</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {formatCurrency(totalItems < 3 ? state.total + 15 : state.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
