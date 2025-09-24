import React, { useState } from 'react';
import { ArrowLeft, Package, Truck, MapPin, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RastrearPedido: React.FC = () => {
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [pedidoEncontrado, setPedidoEncontrado] = useState(false);

  // Dados fictícios do pedido
  const pedidoFicticio = {
    numero: 'ORD-2024-001',
    status: 'Em trânsito',
    dataPedido: '20/01/2024',
    previsaoEntrega: '22/01/2024',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    etapas: [
      { status: 'Pedido confirmado', data: '20/01/2024 14:30', concluido: true },
      { status: 'Preparando pedido', data: '20/01/2024 16:45', concluido: true },
      { status: 'Pedido despachado', data: '21/01/2024 09:15', concluido: true },
      { status: 'Em trânsito', data: '21/01/2024 11:30', concluido: true },
      { status: 'Saiu para entrega', data: '22/01/2024 08:00', concluido: false },
      { status: 'Entregue', data: '', concluido: false },
    ]
  };

  const handleRastrear = () => {
    if (codigoRastreio.trim()) {
      setPedidoEncontrado(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-black text-white p-4">
        <div className="container mx-auto flex items-center">
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Rastrear Pedido</h1>

        {/* Busca de Rastreamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Digite o código de rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do pedido..."
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleRastrear} disabled={!codigoRastreio.trim()}>
                Rastrear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do Rastreamento */}
        {pedidoEncontrado && (
          <div className="space-y-6">
            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pedido #{pedidoFicticio.numero}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {pedidoFicticio.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Pedido</p>
                      <p className="font-medium">{pedidoFicticio.dataPedido}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                      <p className="font-medium">{pedidoFicticio.previsaoEntrega}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium text-sm">{pedidoFicticio.endereco}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Acompanhe seu pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pedidoFicticio.etapas.map((etapa, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        etapa.concluido 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {etapa.concluido ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${etapa.concluido ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {etapa.status}
                        </p>
                        {etapa.data && (
                          <p className="text-sm text-muted-foreground">{etapa.data}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instruções */}
        {!pedidoEncontrado && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digite o código de rastreamento para acompanhar seu pedido</p>
                <p className="text-sm mt-2">O código foi enviado por email após a confirmação do pedido</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RastrearPedido;
